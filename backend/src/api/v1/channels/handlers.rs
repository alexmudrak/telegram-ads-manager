use crate::database::JsonDatabase;

use super::models::ChannelQuery;
use actix_web::{HttpResponse, web};
use serde_json::json;

pub async fn get_channels(
    query: web::Query<ChannelQuery>,
    db: web::Data<JsonDatabase>,
) -> HttpResponse {
    let category = &query.category;
    let geo = &query.geo;
    let channels = db
        .filter_channels(category.as_ref(), geo.as_ref())
        .await;

    HttpResponse::Ok().json(json!({
        "category": category,
        "geo": geo,
        "channels": channels,
    }))
}
