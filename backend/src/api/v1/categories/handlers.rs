use actix_web::{HttpResponse, web};
use serde_json::json;

use crate::config::AppConfig;

pub async fn get_categories(config: web::Data<AppConfig>) -> HttpResponse {
    HttpResponse::Ok().json(json!(config.categories))
}
