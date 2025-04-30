use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, web};
use dotenv::dotenv;
use futures::future::join_all;
use log::{error, info};
use reqwest::Client;
use select::document::Document;
use select::predicate::{Class, Name, Predicate};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::sync::{Arc, Mutex};

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
struct ApiSimilarChannelsResponse {
    ok: bool,
    channels: Vec<Channel>,
}

#[derive(Serialize)]
struct ChannelResponse {
    id: i64,
    title: String,
    username: String,
    photo_element: String,
    category: Option<String>,
    description: String,
    subscribers: String,
}

impl Default for ApiSimilarChannelsResponse {
    fn default() -> Self {
        Self {
            ok: false,
            channels: vec![],
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
struct Chat {
    id: i64,
    title: String,
    username: String,
    description: Option<String>,
    category: Option<String>,
}

#[derive(Deserialize)]
struct ApiChatResponse {
    ok: bool,
    result: Option<Chat>,
}

#[derive(Deserialize, Serialize)]
struct ChannelDatabase {
    channels: Vec<Chat>,
}

#[derive(Deserialize)]
struct UpdateCategory {
    category: String,
}

#[derive(Deserialize)]
struct GenerateAdRequest {
    channels: String,
    product_description: String,
}

fn load_available_categories() -> Vec<String> {
    dotenv().ok();
    let categories = env::var("APP_AVAILABLE_CATEGORIES").unwrap_or_default();
    categories
        .split(',')
        .map(|s| s.trim().to_string())
        .collect()
}

fn load_channels_from_file(file_path: &str) -> Result<ChannelDatabase, String> {
    let data = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    let db: ChannelDatabase = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    Ok(db)
}

fn save_channels_to_file(file_path: &str, db: &ChannelDatabase) -> Result<(), String> {
    let data = serde_json::to_string_pretty(db).map_err(|e| e.to_string())?;
    fs::write(file_path, data).map_err(|e| e.to_string())?;
    Ok(())
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

async fn fetch_chat_category(client: &Client, data: &str) -> Result<String, String> {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let api_key = env::var("APP_OPENAI_API_KEY").expect("APP_OPENAI_API_KEY not set");

    let available_categories = load_available_categories();
    let categories_str = available_categories.join(", ");

    let request_body = json!({
        "model": "gpt-4o-mini",
        "messages": [{
            "role": "user",
            "content": format!("На основании данных {}, выдели категорию из возможных. Возвращай только категорию из существующих {}. Не пиши никакого дополнительного текста", data, categories_str),
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
        let response_json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

        if let Some(choice) = response_json["choices"].as_array().and_then(|c| c.get(0)) {
            if let Some(content) = choice["message"]["content"].as_str() {
                let category = content.to_lowercase();
                if available_categories
                    .iter()
                    .any(|cat| cat.to_lowercase() == category)
                {
                    return Ok(category);
                } else {
                    let err_msg = format!(
                        "Received category '{}' is not in available categories.",
                        category
                    );
                    error!("{}", err_msg);
                    return Err(err_msg);
                }
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

async fn fetch_channel_info(
    client: &Client,
    channel_name: &str,
) -> Result<(i64, String, String), String> {
    let bot_token = env::var("APP_TELEGRAM_BOT_TOKEN").expect("APP_TELEGRAM_BOT_TOKEN not set");
    let url = format!(
        "https://api.telegram.org/bot{}/getChat?chat_id=@{}",
        bot_token, channel_name
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let api_response: ApiChatResponse = response.json().await.map_err(|e| e.to_string())?;

        if api_response.ok {
            if let Some(chat) = api_response.result {
                let clean_id = chat
                    .id
                    .to_string()
                    .strip_prefix("-100")
                    .unwrap_or(&chat.id.to_string())
                    .to_string();

                info!("Done Fetching info for channel: {}", channel_name);
                let description = chat
                    .description
                    .unwrap_or_else(|| "No description".to_string());

                return Ok((
                    clean_id.parse().unwrap_or_default(),
                    chat.username,
                    description,
                ));
            } else {
                return Err("Channel not found".to_string());
            }
        } else {
            return Err("API response error".to_string());
        }
    } else {
        return Err(format!("Failed request: {}", response.status()));
    }
}

async fn get_channels_id(client: &Client, channels: &str) -> Result<String, String> {
    let file_path = "channels.json";
    let mut channels_with_ids = vec![];
    let channels_list: Vec<&str> = channels.split(',').collect();
    let mut db =
        load_channels_from_file(file_path).unwrap_or_else(|_| ChannelDatabase { channels: vec![] });

    for channel in channels_list {
        let channel_name = channel
            .replace("https://t.me/", "")
            .replace("@", "")
            .replace("/", "")
            .replace(" ", "");

        if let Some(existing_channel) = db.channels.iter().find(|c| c.username == channel_name) {
            channels_with_ids.push(existing_channel.id.to_string());
        } else {
            match fetch_channel_info(client, &channel_name).await {
                Ok((channel_id, username, description)) => {
                    let new_channel = Chat {
                        id: channel_id,
                        title: "".to_string(),
                        username: username.to_string(),
                        description: Some(description),
                        category: None,
                    };
                    db.channels.push(new_channel);
                    channels_with_ids.push(channel_id.to_string());
                }
                Err(e) => {
                    eprintln!("Error getting channel info for {}: {}", channel_name, e);
                }
            }
        }
    }

    if let Err(e) = save_channels_to_file(file_path, &db) {
        return Err(format!("Error saving channels: {}", e));
    }

    Ok(channels_with_ids.join(";"))
}

async fn fetch_similar_channels(
    client: &Client,
    channels_ids: String,
    req: &ChannelRequest,
) -> Result<Vec<ChannelResponse>, String> {
    let file_path = "channels.json";
    let db =
        load_channels_from_file(file_path).unwrap_or_else(|_| ChannelDatabase { channels: vec![] });
    let db = Arc::new(Mutex::new(db));

    let url = format!("https://ads.telegram.org/api?hash={}", req.hash);
    let mut form = HashMap::new();

    form.insert("channels".to_string(), channels_ids);
    form.insert("for".to_string(), "channels".to_string());
    form.insert("method".to_string(), "getSimilarChannels".to_string());
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
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let body = response.text().await.map_err(|e| e.to_string())?;
        let api_response: ApiSimilarChannelsResponse =
            serde_json::from_str(&body).map_err(|e| e.to_string())?;
        let channels = api_response.channels;

        let mut channel_responses: Vec<ChannelResponse> = vec![];
        let mut fetch_tasks = vec![];

        for channel in channels {
            let db_clone = Arc::clone(&db);
            let subscribers_count = extract_subscribers(&channel.cb_item);
            let existing_channel;

            {
                let mut db_guard = db_clone.lock().unwrap();
                existing_channel = db_guard
                    .channels
                    .iter()
                    .find(|c| c.id == channel.id)
                    .cloned();

                if let Some(existing) = &existing_channel {
                    if existing.title != channel.title
                        || existing.category.is_none()
                        || existing.description.is_none()
                    {
                        db_guard.channels.retain(|c| c.id != existing.id);
                    }
                }
            }

            if let Some(existing) = existing_channel {
                let description = existing
                    .description
                    .clone()
                    .unwrap_or_else(|| "No description".to_string());

                channel_responses.push(ChannelResponse {
                    id: channel.id,
                    title: channel.title.clone(),
                    username: channel.username.clone(),
                    photo_element: channel.photo,
                    category: existing.category.clone(),
                    description,
                    subscribers: subscribers_count,
                });
            } else {
                let client_clone = client.clone();
                let channel_username_clone = channel.username.clone();

                let task = async move {
                    let (channel_id, username, description) =
                        fetch_channel_info(&client_clone, &channel_username_clone)
                            .await
                            .unwrap_or((
                                0,
                                "No username".to_string(),
                                "No description".to_string(),
                            ));

                    let mut category = "".to_string();

                    if channel_id != 0 {
                        let combined_description = format!("{} {}", channel.title, description,);

                        category = fetch_chat_category(&client_clone, &combined_description)
                            .await
                            .unwrap_or("UNKNOWN".to_string());
                        let mut db_guard = db_clone.lock().unwrap();
                        db_guard.channels.push(Chat {
                            id: channel_id,
                            title: channel.title.to_string(),
                            username: username.to_string(),
                            category: Some(category.clone()),
                            description: Some(description.clone()),
                        });
                    }

                    ChannelResponse {
                        id: channel_id,
                        title: channel.title.clone(),
                        username,
                        photo_element: channel.photo,
                        category: Some(category),
                        description,
                        subscribers: subscribers_count,
                    }
                };

                fetch_tasks.push(task);
            }
        }

        let additional_responses: Vec<ChannelResponse> = join_all(fetch_tasks).await;

        channel_responses.extend(additional_responses);

        save_channels_to_file(file_path, &db.lock().unwrap()).map_err(|e| e.to_string())?;

        return Ok(channel_responses);
    } else {
        return Err(format!("Error from Telegram API: {}", response.status()));
    }
}

async fn get_similar_channels(
    client: web::Data<Client>,
    req: web::Json<ChannelRequest>,
) -> HttpResponse {
    match get_channels_id(&client, &req.channels).await {
        Ok(channels_ids) => {
            info!(
                "Sending request to Telegram API for channels: {}",
                channels_ids
            );

            let similars_channels = fetch_similar_channels(&client, channels_ids, &req).await;

            match similars_channels {
                Ok(channel_responses) => {
                    info!("All Done");
                    return HttpResponse::Ok().json(channel_responses);
                }
                Err(err) => {
                    eprintln!("Error while fetching similar channels: {}", err);
                    return HttpResponse::InternalServerError()
                        .body("Failed to fetch similar channels");
                }
            }
        }
        Err(err) => {
            eprintln!("Error while getting channels ID: {}", err);
            return HttpResponse::InternalServerError().body("Failed to get channel IDs");
        }
    }
}

async fn get_categories() -> HttpResponse {
    let available_categories = load_available_categories();
    return HttpResponse::Ok().json(available_categories);
}

async fn update_category(req: web::Json<UpdateCategory>, id: web::Path<String>) -> HttpResponse {
    let channel_id_str = id.into_inner();
    let channel_id: i64 = match channel_id_str.parse() {
        Ok(id) => id,
        Err(_) => {
            return HttpResponse::BadRequest()
                .body("Invalid ID format. Expected a numeric string.");
        }
    };

    let new_category = req.category.clone();
    let file_path = "channels.json";

    let mut db = match load_channels_from_file(file_path) {
        Ok(db) => db,
        Err(err) => return HttpResponse::InternalServerError().body(err),
    };

    for channel in &mut db.channels {
        if channel.id == channel_id {
            channel.category = Some(new_category);
            break;
        }
    }

    if let Err(err) = save_channels_to_file(file_path, &db) {
        return HttpResponse::InternalServerError().body(err);
    }

    HttpResponse::Ok().finish()
}
async fn fetch_ad_message(
    client: &Client,
    channels_descriptions: &str,
    product_desctiption: &str,
) -> Result<String, String> {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let api_key = env::var("APP_OPENAI_API_KEY").expect("APP_OPENAI_API_KEY not set");

    let request_text = format!(
        "создай рекламное сообщение для каналов у которых описание ```{}```. Продукт, который будет рекламироваться {}. Используй небольшое количество эмоджи для привлечения внимания. Сообщение не должно быть больше 160 символов и не должно содержать новых строк!",
        channels_descriptions, product_desctiption,
    );

    let request_body = json!({
        "model": "gpt-4o-mini",
        "messages": [{
            "role": "user",
            "content": &request_text,
        }],
        "max_tokens": 160,
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
        let response_json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

        if let Some(choice) = response_json["choices"].as_array().and_then(|c| c.get(0)) {
            if let Some(content) = choice["message"]["content"].as_str() {
                return Ok(content.to_string());
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
async fn get_ad_message(
    client: web::Data<Client>,
    req: web::Json<GenerateAdRequest>,
) -> HttpResponse {
    let file_path = "channels.json";
    let db = match load_channels_from_file(file_path) {
        Ok(db) => db,
        Err(err) => return HttpResponse::InternalServerError().body(err),
    };

    let mut found_descriptions = Vec::new();

    let product_desc = &req.product_description;
    let channels_names = req
        .channels
        .split(',')
        .map(|s| s.trim().to_string())
        .collect::<Vec<String>>();

    for channel_name in channels_names {
        if let Some(channel) = db.channels.iter().find(|c| c.username == channel_name) {
            if let Some(description) = &channel.description {
                found_descriptions.push(description.clone());
            }
        }
    }

    match fetch_ad_message(&client, &found_descriptions.join(", "), &product_desc).await {
        Ok(data) => HttpResponse::Ok().json(json!({"ad_message": data})),
        Err(e) => HttpResponse::InternalServerError().body(e),
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
            .route("/api/categories", web::get().to(get_categories))
            .route(
                "/api/channels/{id}/category",
                web::put().to(update_category),
            )
            .route("/api/generate-ad", web::post().to(get_ad_message))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
