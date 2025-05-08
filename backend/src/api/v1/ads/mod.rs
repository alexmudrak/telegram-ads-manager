use actix_web::web;
mod handlers;
pub mod models;

pub fn routers(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/ads")
            .route("/", web::post().to(handlers::create_ad))
            .route("/generate", web::post().to(handlers::generate_ad_message))
    );
}
