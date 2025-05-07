use actix_web::{HttpResponse, web};
use serde_json::json;

use crate::config::AppConfig;

pub async fn get_geos(config: web::Data<AppConfig>) -> HttpResponse {
    HttpResponse::Ok().json(json!(
        config
            .geos
            .iter()
            .map(|g| g.to_lowercase())
            .collect::<Vec<_>>()
    ))
}
