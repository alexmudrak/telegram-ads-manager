use crate::{
    config::AppConfig,
    database::JsonDatabase,
    services::{openai::OpenAiClient, telegram::TelegramService},
    utils::text::TextUtils,
};

use super::models::{
    ChannelQuery, SimilarChannelRequest, UpdateChannelCategoryRequest, UpdateChannelGeoRequest,
};
use actix_web::{HttpResponse, web};
use log::error;
use serde_json::json;

pub async fn get_channels(
    query: web::Query<ChannelQuery>,
    db: web::Data<JsonDatabase>,
) -> HttpResponse {
    let category = &query.category;
    let geo = &query.geo;
    let channels = db.filter_channels(category.as_ref(), geo.as_ref()).await;

    HttpResponse::Ok().json(json!({
        "category": category,
        "geo": geo,
        "channels": channels,
    }))
}

pub async fn get_similar_channels(
    db: web::Data<JsonDatabase>,
    req: web::Json<SimilarChannelRequest>,
    config: web::Data<AppConfig>,
) -> HttpResponse {
    let openai_service = OpenAiClient::new(&config.openai.model, &config.openai.api_key);
    let telegram_service = TelegramService::new(
        Some(req.hash.clone()),
        Some(req.stel_ssid.clone()),
        Some(req.stel_token.clone()),
        config.telegram.bot_token.clone(),
        Some(openai_service.clone()),
    );
    let normalized_channels = TextUtils::normalize_names(&req.channels_names);
    match telegram_service
        .check_and_add_channels(db.clone(), &normalized_channels)
        .await
    {
        Ok(channels_data) => {
            match telegram_service
                .fetch_similar_channels(
                    db.clone(),
                    channels_data.clone(),
                    config.categories.clone(),
                    config.geos.clone(),
                )
                .await
            {
                Ok(similar_channels) => HttpResponse::Ok().json(json!(similar_channels)),
                Err(_) => HttpResponse::InternalServerError().body("Failed to get channel IDs"),
            }
        }
        Err(e) => {
            error!("Error checking and adding channels: {}", e);
            HttpResponse::InternalServerError().body("Failed to process channels")
        }
    }
}

pub async fn update_category(
    id: web::Path<i64>,
    db: web::Data<JsonDatabase>,
    req: web::Json<UpdateChannelCategoryRequest>,
) -> HttpResponse {
    let id = id.into_inner();
    let category = req.category.clone();
    let _ = db
        .update_channel_by_id(id, |channel| {
            channel.category = Some(category.clone());
        })
        .await;

    HttpResponse::Ok().json(json!({"status": "ok"}))
}

pub async fn update_geo(
    id: web::Path<i64>,
    db: web::Data<JsonDatabase>,
    req: web::Json<UpdateChannelGeoRequest>,
) -> HttpResponse {
    let id = id.into_inner();
    let geo = req.into_inner().geo;
    let _ = db
        .update_channel_by_id(id, |channel| {
            channel.geo = Some(geo.clone());
        })
        .await;

    HttpResponse::Ok().json(json!({"status": "ok"}))
}

pub async fn get_new_data(
    id: web::Path<i64>,
    db: web::Data<JsonDatabase>,
    config: web::Data<AppConfig>,
) -> HttpResponse {
    let id = id.into_inner();
    let openai_service = OpenAiClient::new(&config.openai.model, &config.openai.api_key);
    let telegram_service = TelegramService::new(
        None,
        None,
        None,
        config.telegram.bot_token.clone(),
        Some(openai_service.clone()),
    );

    match telegram_service
        .fetch_new_data(
            id.clone(),
            db.clone(),
            config.categories.clone(),
            config.geos.clone(),
        )
        .await
    {
        Ok(channel) => HttpResponse::Ok().json(json!(channel)),
        Err(_) => HttpResponse::InternalServerError()
            .body(format!("Failed to update data for channel {}", id)),
    }
}
