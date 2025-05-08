use futures::stream::{self, StreamExt};
use std::collections::HashMap;
use tokio::time::{Duration, sleep};

use actix_web::web;
use reqwest::{
    Client,
    header::{ACCEPT, ACCEPT_LANGUAGE, CONTENT_TYPE, COOKIE, HeaderMap, HeaderValue},
};

use crate::{
    api::v1::ads::models::CreateAdRequest,
    database::{JsonDatabase, models::ChannelData},
    utils::html_parser::extract_subscribers,
};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};

use super::openai::OpenAiClient;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelegramConfig {
    pub bot_token: String,
    pub ads_hash: String,
    pub ads_stel_ssid: String,
    pub ads_stel_token: String,
    pub ads_stel_owner: String,
}
#[derive(Deserialize, Debug)]
struct TelegramSimilarChatResponse {
    ok: bool,
    channels: Option<Vec<TelegramSimilarChat>>,
}

#[derive(Deserialize, Debug, Clone)]
struct TelegramSimilarChat {
    id: i64,
    title: Option<String>,
    photo: Option<String>,
    username: Option<String>,
    cb_item: Option<String>,
}

#[derive(Deserialize, Debug)]
struct TelegramChatResponse {
    ok: bool,
    result: Option<TelegramChat>,
}

#[derive(Deserialize, Debug)]
struct TelegramChat {
    id: i64,
    username: Option<String>,
    title: Option<String>,
    description: Option<String>,
}

#[derive(Clone, Debug)]
pub struct TelegramService {
    pub bot_token: String,
    pub hash: Option<String>,
    pub stel_ssid: Option<String>,
    pub stel_token: Option<String>,
    pub stel_owner: Option<String>,
    openai_service: Option<OpenAiClient>,
}

impl TelegramService {
    pub fn new(
        bot_token: String,
        hash: Option<String>,
        stel_ssid: Option<String>,
        stel_token: Option<String>,
        stel_owner: Option<String>,
        openai_service: Option<OpenAiClient>,
    ) -> Self {
        TelegramService {
            bot_token,
            hash,
            stel_ssid,
            stel_token,
            stel_owner,
            openai_service,
        }
    }

    pub async fn check_and_add_channels(
        &self,
        db: web::Data<JsonDatabase>,
        channels: &[String],
    ) -> Result<Vec<ChannelData>, String> {
        let mut channels_data = vec![];

        for username in channels {
            match db.get_channel_by_username(username).await {
                Ok(Some(channel)) => {
                    info!("Channel {} already in DB!", username);
                    channels_data.push(channel);
                }
                Ok(None) => match self.fetch_channel_data(username).await {
                    Ok(channel_data) => {
                        db.add_channel(channel_data.clone()).await?;
                        channels_data.push(channel_data);
                        warn!("Added channel '{}' to the database.", username);
                    }
                    Err(e) => {
                        error!("Failed to fetch data for '{}': {}", username, e)
                    }
                },
                Err(e) => return Err(format!("DB error: {}", e)),
            }
        }
        Ok(channels_data)
    }

    async fn fetch_channel_data(&self, username: &str) -> Result<ChannelData, String> {
        info!("Fetching channel info for: {}", username);

        let url = format!(
            "https://api.telegram.org/bot{}/getChat?chat_id=@{}",
            self.bot_token, username
        );
        let client = Client::new();

        let response = client.get(&url).send().await.map_err(|e| {
            error!("Error sending request to Telegram API: {}", e);
            e.to_string()
        })?;

        let status = response.status();
        let response_body = response.text().await.unwrap_or_else(|_| String::new());

        if status.is_success() {
            let api_response: TelegramChatResponse =
                serde_json::from_str(&response_body).map_err(|e| {
                    error!(
                        "Error parsing JSON response from Telegram API: {}: {}",
                        e, response_body
                    );
                    e.to_string()
                })?;

            if api_response.ok {
                if let Some(chat) = api_response.result {
                    let channel_data = ChannelData {
                        id: chat
                            .id
                            .to_string()
                            .strip_prefix("-100")
                            .unwrap_or(&chat.id.to_string())
                            .to_string()
                            .parse()
                            .unwrap_or_default(),
                        title: chat.title,
                        username: chat.username.unwrap_or_default(),
                        photo_element: None,
                        category: None,
                        description: Some(chat.description.unwrap_or_default()),
                        subscribers: None,
                        geo: None,
                    };
                    Ok(channel_data)
                } else {
                    Err(format!(
                        "Telegram API error for '{}': {:?}",
                        username, api_response
                    ))
                }
            } else {
                Err(format!(
                    "Telegram API response indicates failure for '{}': {:?}",
                    username, api_response
                ))
            }
        } else {
            error!(
                "Telegram API request failed for '{}' with status: {} - {}",
                username, status, response_body
            );
            Err(format!(
                "Telegram API request failed with status: {}",
                status
            ))
        }
    }

    async fn enrich_channel_data(
        &self,
        mut channel: ChannelData,
        categories: &[String],
        geos: &[String],
    ) -> ChannelData {
        if channel.description.is_none() {
            if let Ok(fetched) = self.fetch_channel_data(&channel.username).await {
                channel.description = fetched.description;
            }
        }

        let combined_description = format!("{:?} {:?}", channel.title, channel.description);

        if channel.category.is_none() {
            if let Some(openai) = &self.openai_service {
                if let Ok(category) = openai
                    .fetch_chat_category(combined_description.clone(), categories.to_vec())
                    .await
                {
                    channel.category = Some(category);
                }
            }
        }

        if channel.geo.is_none() {
            if let Some(openai) = &self.openai_service {
                if let Ok(geo) = openai
                    .fetch_chat_geo(combined_description, geos.to_vec())
                    .await
                {
                    channel.geo = Some(geo);
                }
            }
        }

        channel
    }

    async fn enrich_channels_with_missing_data(
        &self,
        db: web::Data<JsonDatabase>,
        channels: Vec<TelegramSimilarChat>,
        categories: Vec<String>,
        geos: Vec<String>,
    ) -> Result<Vec<ChannelData>, String> {
        let exist_channels = db.filter_channels(None, None).await;

        let mut need_to_update_channels = vec![];
        let mut done_channels = vec![];

        for channel in channels {
            let exist_channel = exist_channels
                .iter()
                .find(|channel_db| channel_db.id == channel.id)
                .cloned();

            let subscribers = channel
                .cb_item
                .as_ref()
                .and_then(|html| extract_subscribers(html));

            if let Some(existing) = &exist_channel {
                let mut updated_channel = existing.clone();
                updated_channel.title = channel.title;
                updated_channel.photo_element = channel.photo;
                updated_channel.subscribers = subscribers;

                if updated_channel.category.is_none()
                    || updated_channel.description.is_none()
                    || updated_channel.geo.is_none()
                {
                    need_to_update_channels.push(updated_channel);
                } else {
                    db.add_or_update_channel(updated_channel.clone()).await.ok();
                    done_channels.push(updated_channel);
                }
            } else {
                need_to_update_channels.push(ChannelData {
                    id: channel.id,
                    title: channel.title,
                    username: channel.username.ok_or("Missing username")?,
                    photo_element: channel.photo,
                    category: None,
                    description: None,
                    subscribers,
                    geo: None,
                });
            }
        }

        let chunk_size = 15;
        let concurrency_limit = 3;
        let chunks: Vec<Vec<ChannelData>> = need_to_update_channels
            .chunks(chunk_size)
            .map(|c| c.to_vec())
            .collect();

        let enrich_chunks: Vec<ChannelData> = stream::iter(chunks)
            .map(|chunk| {
                let db = db.clone();
                let categories_clone = categories.clone();
                let geos_clone = geos.clone();
                async move {
                    let mut updated = Vec::new();
                    for channel in chunk {
                        let enriched = self
                            .enrich_channel_data(channel, &categories_clone, &geos_clone)
                            .await;

                        db.add_or_update_channel(enriched.clone()).await.ok();
                        updated.push(enriched);
                        sleep(Duration::from_secs(1)).await;
                    }
                    updated
                }
            })
            .buffer_unordered(concurrency_limit)
            .collect::<Vec<Vec<_>>>()
            .await
            .into_iter()
            .flatten()
            .collect();

        done_channels.extend(enrich_chunks);
        return Ok(done_channels);
    }

    pub async fn fetch_similar_channels(
        &self,
        db: web::Data<JsonDatabase>,
        channels: Vec<ChannelData>,
        categories: Vec<String>,
        geos: Vec<String>,
    ) -> Result<Vec<ChannelData>, String> {
        info!(
            "Fetching similar channels for: {}",
            channels
                .iter()
                .map(|c| c.username.clone())
                .collect::<Vec<_>>()
                .join(", ")
        );

        let client = Client::new();

        let hash = self.hash.as_ref().ok_or("Missing hash")?;
        let stel_ssid = self.stel_ssid.as_ref().ok_or("Missing stel_ssid")?;
        let stel_token = self.stel_token.as_ref().ok_or("Missing stel_token")?;

        let url = format!("https://ads.telegram.org/api?hash={}", hash);

        let mut form = HashMap::new();
        form.insert(
            "channels",
            channels
                .iter()
                .map(|c| c.id.to_string())
                .collect::<Vec<_>>()
                .join(";"),
        );
        form.insert("for", "channels".to_string());
        form.insert("method", "getSimilarChannels".to_string());

        let response = client
            .post(&url)
            .header("Accept", "application/json, text/javascript, */*; q=0.01")
            .header("Accept-Language", "en-US,en;q=0.9,ru;q=0.8")
            .header(
                "Content-Type",
                "application/x-www-form-urlencoded; charset=UTF-8",
            )
            .header(
                "Cookie",
                format!("stel_ssid={}; stel_token={}", stel_ssid, stel_token),
            )
            .form(&form)
            .send()
            .await
            .map_err(|e| {
                error!(
                    "Error sending request to Telegram ADS API - Similar channels: {}",
                    e
                );
                e.to_string()
            })?;

        let status = response.status();
        let response_body = response.text().await.unwrap_or_else(|_| String::new());

        if status.is_success() {
            let api_response: TelegramSimilarChatResponse =
                serde_json::from_str(&response_body).map_err(|e| {
                    error!(
                        "Error parsing JSON response from Telegram ADS API - Similar channels: {}: {}",
                        e, response_body
                    );
                    e.to_string()
                })?;

            if api_response.ok {
                let similar_channels = api_response.channels.unwrap_or_default();

                info!("Find similar channels: {}", similar_channels.len());

                let result = &self
                    .enrich_channels_with_missing_data(
                        db.clone(),
                        similar_channels,
                        categories,
                        geos,
                    )
                    .await?;

                return Ok(result.to_vec());
            } else {
                Err(format!(
                    "Telegram ADS API - Similar channels response indicates failure: {:?}",
                    api_response
                ))
            }
        } else {
            return Err(format!(
                "Error from Telegram ADS API - Similar channels: {}",
                status
            ));
        }
    }

    pub async fn fetch_new_data(
        &self,
        id: i64,
        db: web::Data<JsonDatabase>,
        categories: Vec<String>,
        geos: Vec<String>,
    ) -> Result<ChannelData, String> {
        let channel = db
            .get_channel_by_id(id)
            .await?
            .ok_or_else(|| format!("Channel with id {} not found", id))?;
        let result = self.enrich_channel_data(channel, &categories, &geos).await;
        db.add_or_update_channel(result.clone()).await.ok();

        Ok(result)
    }

    pub async fn create_ad_draft(&self, ad_data: CreateAdRequest) -> Result<String, String> {
        let hash = self.hash.as_ref().ok_or("Missing hash")?;
        let stel_ssid = self.stel_ssid.as_ref().ok_or("Missing stel_ssid")?;
        let stel_token = self.stel_token.as_ref().ok_or("Missing stel_token")?;
        let stel_owner = self.stel_owner.as_ref().ok_or("Missing stel_owner")?;

        let mut headers = HeaderMap::new();
        headers.insert(
            ACCEPT,
            HeaderValue::from_static("application/json, text/javascript, */*; q=0.01"),
        );
        headers.insert(
            ACCEPT_LANGUAGE,
            HeaderValue::from_static("en-US,en;q=0.9,ru;q=0.8"),
        );
        headers.insert(
            CONTENT_TYPE,
            HeaderValue::from_static("application/x-www-form-urlencoded; charset=UTF-8"),
        );

        let cookie_str = format!("stel_ssid={}; stel_token={}", stel_ssid, stel_token);
        headers.insert(COOKIE, HeaderValue::from_str(&cookie_str).unwrap());

        let title = "test title";
        let text = ad_data.text.to_string();
        let promote_url = ad_data.promote_url.to_string();
        let cpm = ad_data.cpm.to_string();
        let views_per_user = ad_data.views_per_user.to_string();
        let budget = ad_data.budget.to_string();
        let daily_budget = ad_data.daily_budget.to_string();
        let active = if ad_data.active { "1" } else { "0" };
        let target_type = ad_data.target_type.as_str();
        let channels = ad_data
            .channels
            .iter()
            .map(|id| id.to_string())
            .collect::<Vec<String>>()
            .join(";");
        let method = ad_data.method.as_str();

        let mut form_data = HashMap::new();
        form_data.insert("owner_id", stel_owner.as_str());
        form_data.insert("title", title);
        form_data.insert("text", &text);
        form_data.insert("promote_url", &promote_url);
        form_data.insert("website_name", "");
        form_data.insert("website_photo", "");
        form_data.insert("media", "");
        form_data.insert("ad_info", "");
        form_data.insert("cpm", &cpm);
        form_data.insert("views_per_user", &views_per_user);
        form_data.insert("budget", &budget);
        form_data.insert("daily_budget", &daily_budget);
        form_data.insert("active", &active);
        form_data.insert("target_type", target_type);
        form_data.insert("channels", &channels);
        form_data.insert("bots", "");
        form_data.insert("search_queries", "");
        form_data.insert("method", method);

        let url = format!("https://ads.telegram.org/api?hash={}", hash);
        let client = Client::new();

        let response = client
            .post(url)
            .headers(headers)
            .form(&form_data)
            .send()
            .await
            .map_err(|e| {
                error!("Error sending request to Telegram API: {}", e);
                e.to_string()
            })?;
        let response_body = response.text().await.unwrap_or_else(|_| String::new());
        println!("Body: {}", response_body);

        // TODO: Need to handle the response json
        Ok("TEST".to_string())
    }
}
