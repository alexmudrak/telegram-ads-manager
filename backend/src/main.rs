mod api;
mod config;
mod database;

use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpServer};
use database::JsonDatabase;
use dotenv::dotenv;
use log::error;

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

    let config = web::Data::new(config);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(config.clone())
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
