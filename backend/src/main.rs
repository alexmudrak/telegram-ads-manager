use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, web};
use futures::future::join_all;
use log::{error, info};
use reqwest::Client;
use select::document::Document;
use select::predicate::{Class, Name, Predicate};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use dotenv::dotenv;
use std::env;

#[derive(Deserialize)]
struct ChannelRequest {
    hash: String,
    stel_ssid: String,
    stel_token: String,
    channels: String,
}

#[derive(Deserialize, Serialize)]
struct Channel {
    id: i64,
    title: String,
    photo: String,
    username: String,
    cb_item: String,
}

#[derive(Deserialize, Serialize)]
struct ApiResponse {
    ok: bool,
    channels: Vec<Channel>,
}

#[derive(Serialize)]
struct ChannelResponse {
    id: i64,
    name: String,
    link: String,
    photo_element: String,
    subscribers: String,
    category: String,
}

impl Default for ApiResponse {
    fn default() -> Self {
        Self {
            ok: false,
            channels: vec![],
        }
    }
}

#[derive(Deserialize)]
struct Chat {
    id: i64,
    username: String,
}

#[derive(Deserialize)]
struct ApiChatResponse {
    ok: bool,
    result: Option<Chat>,
}

fn extract_subscribers(cb_item: &str) -> String {
    let document = Document::from(cb_item);

    if let Some(subscriber_node) = document
        .find(Name("span").and(Class("pr-similar-channel-desc")))
        .next()
    {
        let text = subscriber_node.text();

        let subscribers_count = text
            .split_whitespace()
            .next()
            .unwrap_or("0")
            .replace(",", "");

        return subscribers_count;
    }

    "0".to_string()
}

async fn get_category(client: &Client, cb_item: &str) -> Result<String, String> {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let api_key = env::var("APP_OPENAI_API_KEY").expect("APP_OPENAI_API_KEY not set");

    let request_body = json!({
        "model": "gpt-4o-mini",
        "messages": [{
            "role": "user",
            "content": format!("На основании данных {}, выдели категорию из возможных. Возвращай только категорию из существующих новости, путешествия, развлекательные, политика, обучение, работа. Не пиши никакого дополнительного текста", cb_item),
        }],
        "max_tokens": 50,
    });

    let response = client
        .post(endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        info!("Received successful response from OpenAI API.");

        let response_json: serde_json::Value = response.json().await.map_err(|e| {
            error!("Failed to parse response JSON: {}", e);
            e.to_string()
        })?;

        if let Some(choice) = response_json["choices"].as_array().and_then(|c| c.get(0)) {
            if let Some(content) = choice["message"]["content"].as_str() {
                info!("Extracted category: {}", content);
                return Ok(content.to_lowercase().to_string());
            }
        }
        let err_msg = "Failed to extract category from response.".to_string();
        error!("{}", err_msg);
        return Err(err_msg);
    } else {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        let err_msg = format!("OpenAI API response error: {:?}", error_text);
        error!("{}", err_msg);
        return Err(err_msg);
    }
}

async fn get_channels_id(client: &Client, channels: &str) -> Result<String, String> {
    let bot_token = env::var("APP_TELEGRAM_BOT_TOKEN").expect("APP_TELEGRAM_BOT_TOKEN not set");
    let mut channels_with_ids = vec![];
    let channels_list: Vec<&str> = channels.split(',').collect();

    for channel in channels_list {
        let channel_name = channel
            .replace("https://t.me/", "")
            .replace("@", "")
            .replace("/", "")
            .replace(" ", "");

        info!("TEST: {:?}", channel_name);

        let url = format!(
            "https://api.telegram.org/bot{}/getChat?chat_id=@{}",
            bot_token, channel_name
        );

        let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let api_response: ApiChatResponse = response.json().await.map_err(|e| e.to_string())?;

            if api_response.ok {
                if let Some(chat) = api_response.result {
                    let id_string = chat.id.to_string();
                    let clean_id = id_string
                        .strip_prefix("-100")
                        .unwrap_or(&id_string)
                        .to_string();

                    channels_with_ids.push(clean_id);
                } else {
                    eprintln!("Channel not found: {}", channel_name);
                }
            } else {
                return Err("API response error".to_string());
            }
        } else {
            return Err(format!("Failed request: {}", response.status()));
        }
    }

    Ok(channels_with_ids.join(";"))
}

async fn get_similar_channels(
    client: web::Data<Client>,
    req: web::Json<ChannelRequest>,
) -> HttpResponse {
    let url = format!("https://ads.telegram.org/api?hash={}", req.hash);
    let mut form = HashMap::new();

    match get_channels_id(&client, &req.channels).await {
        Ok(channels_ids) => {
            info!("TEST 2: {:?}", channels_ids);
            form.insert("channels".to_string(), channels_ids);
        }
        Err(err) => {
            eprintln!("Error while getting channels ID: {}", err);
            return HttpResponse::InternalServerError().body("Failed to get channel IDs");
        }
    }
    form.insert("for".to_string(), "channels".to_string());
    form.insert("method".to_string(), "getSimilarChannels".to_string());

    info!(
        "Sending request to Telegram API for channels: {}",
        req.channels
    );

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
            format!("stel_ssid={}; stel_token={}", req.stel_ssid, req.stel_token),
        )
        .form(&form)
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status();
            let body = resp
                .text()
                .await
                .unwrap_or_else(|_| "Failed to read response".to_string());
            if status.is_success() {
                info!("Successfully received response from Telegram API");
                let api_response: ApiResponse = serde_json::from_str(&body).unwrap_or_default();
                let channels = api_response.channels;

                let tasks: Vec<_> = channels
                    .into_iter()
                    .map(|channel| {
                        let client_clone = client.clone();
                        let cb_item_clone = channel.cb_item.clone();
                        let subscribers_data = extract_subscribers(&channel.cb_item);

                        async move {
                            let category = get_category(&client_clone, &cb_item_clone)
                                .await
                                .unwrap_or("NONE".to_string());

                            ChannelResponse {
                                id: channel.id,
                                name: channel.title.clone(),
                                link: format!("https://t.me/{}", channel.username),
                                photo_element: channel.photo,
                                subscribers: subscribers_data,
                                category,
                            }
                        }
                    })
                    .collect();

                let channel_responses: Vec<ChannelResponse> = join_all(tasks).await;

                HttpResponse::Ok().json(channel_responses)
            } else {
                error!("Error from Telegram API: {}", body);
                HttpResponse::InternalServerError().body(format!("Error: {}", body))
            }
        }
        Err(e) => {
            error!("Request error: {}", e);
            HttpResponse::InternalServerError().body(format!("Request error: {}", e))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    dotenv().ok();

    let client = Client::new();

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header(),
            )
            .route(
                "/api/similar-channels",
                web::post().to(get_similar_channels),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
