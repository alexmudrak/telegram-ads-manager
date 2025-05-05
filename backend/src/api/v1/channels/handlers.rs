use crate::{config::AppConfig, database::JsonDatabase, services::telegram::TelegramService, utils::text::TextUtils};

use super::models::{ChannelQuery, SimilarChannelRequest};
use actix_web::{HttpResponse, web};
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
    config: web::Data<AppConfig>,
    req: web::Json<SimilarChannelRequest>,
) -> HttpResponse {
    let telegram_service = TelegramService::new(
        Some(req.hash.clone()),
        Some(req.stel_ssid.clone()),
        Some(req.stel_token.clone()),
    );
    let channels = TextUtils::normalize_names(&req.channels_names);

    match telegram_service.fetch_similar_channels(channels).await {
        Ok(similar_channels) => HttpResponse::Ok().json(json!(similar_channels)),
        Err(_) => HttpResponse::InternalServerError().body("Failed to get channel IDs"),
    }
}
