use std::collections::HashMap;

use actix_web::{HttpResponse, web};
use futures::future::try_join_all;
use serde_json::json;

use crate::{
    config::AppConfig,
    database::JsonDatabase,
    services::{openai::OpenAiClient, telegram::TelegramService},
    utils::text::TextUtils,
};

use super::models::{CreateAdRequest, GenerateAdMessageRequest};

pub async fn generate_ad_message(
    db: web::Data<JsonDatabase>,
    req: web::Json<GenerateAdMessageRequest>,
    config: web::Data<AppConfig>,
) -> HttpResponse {
    let openai_service = OpenAiClient::new(&config.openai.model, &config.openai.api_key);
    let product_description = &req.description;
    let username_to_description: HashMap<String, String> = db
        .filter_channels(None, None)
        .await
        .iter()
        .filter_map(|c| c.description.clone().map(|desc| (c.username.clone(), desc)))
        .collect();
    let channels_names = req
        .channels_names
        .iter()
        .map(|n| n.trim().to_string())
        .collect::<Vec<String>>();
    let found_descriptions: Vec<String> = channels_names
        .iter()
        .filter_map(|c| username_to_description.get(c).map(|desc| desc.clone()))
        .collect();

    match openai_service
        .create_ad_message(&found_descriptions.join(", "), &product_description)
        .await
    {
        Ok(result) => HttpResponse::Ok().json(json!({"ad_message": result})),
        Err(e) => HttpResponse::InternalServerError().body(e),
    }
}

pub async fn create_ad(
    db: web::Data<JsonDatabase>,
    req: web::Json<CreateAdRequest>,
    telegram_service: web::Data<TelegramService>,
) -> HttpResponse {
    let channel_id_futures: Vec<_> = req
        .channels
        .iter()
        .map(|username_str| {
            let db_clone = db.clone();
            let username_owned = username_str.clone();
            async move {
                match db_clone.get_channel_by_username(&username_owned).await {
                    Ok(Some(channel_data)) => Ok(channel_data.id),
                    Ok(None) => Err(format!(
                        "Channel with username '{}' not found.",
                        username_owned
                    )),
                    Err(db_error) => Err(format!(
                        "Database error for channel '{}': {}",
                        username_owned, db_error
                    )),
                }
            }
        })
        .collect();

    let channels_ids_result = try_join_all(channel_id_futures).await;

    match channels_ids_result {
        Ok(actual_channel_ids) => {
            match telegram_service
                .create_ad(req.into_inner(), actual_channel_ids)
                .await
            {
                Ok(message) => {
                    HttpResponse::Ok().json(json!({ "status": "success", "message": message }))
                }
                Err(error_message) => {
                    if let Some((field, msg)) = TextUtils::parse_validation_error(&error_message) {
                        HttpResponse::BadRequest().json(json!({
                            "field": field,
                            "error": msg
                        }))
                    } else {
                        HttpResponse::InternalServerError().json(json!({
                            "error": error_message
                        }))
                    }
                }
            }
        }
        Err(error_message) => {
            if error_message.contains("not found") {
                HttpResponse::BadRequest().json(json!({"error": error_message}))
            } else {
                HttpResponse::InternalServerError().json(json!({"error": error_message}))
            }
        }
    }
}
