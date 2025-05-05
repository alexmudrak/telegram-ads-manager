use actix_web::web;
mod handlers;
mod models;

pub fn routers(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/channels")
            .route("/", web::get().to(handlers::get_channels))
            .route(
                "/similar",
                web::post().to(handlers::get_similar_channels),
            ),
    );
}
