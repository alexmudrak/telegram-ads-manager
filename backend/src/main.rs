mod api;
mod config;
mod database;
mod services;
mod utils;

use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpServer};
use database::JsonDatabase;
use dotenv::dotenv;
use log::error;
use services::openai::OpenAiClient;
use services::telegram::TelegramService;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let config = config::AppConfig::new().unwrap_or_else(|e| {
        error!("Failed to load config: {}", e);
        std::process::exit(1);
    });
    let db = JsonDatabase::new(config.database.clone())
        .await
        .expect("Failed to init DB");
    let openai_service = OpenAiClient::new(&config.openai.model, &config.openai.api_key);
    let telegram_service = TelegramService::new(
        config.telegram.bot_token.clone(),
        Some(config.telegram.ads_hash.clone()),
        Some(config.telegram.ads_stel_ssid.clone()),
        Some(config.telegram.ads_stel_token.clone()),
        Some(config.telegram.ads_stel_owner.clone()),
        Some(openai_service.clone()),
    );


    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(openai_service.clone()))
            .app_data(web::Data::new(telegram_service.clone()))
            .wrap(Logger::default())
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header(),
            )
            .configure(api::api_routes)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
