use actix_web::web;
mod handlers;
mod models;

pub fn routers(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/ads")
            .route("/create", web::post().to(handlers::create_ad_message))
    );
}
