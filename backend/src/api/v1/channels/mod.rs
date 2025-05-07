use actix_web::web;
mod handlers;
mod models;

pub fn routers(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/channels")
            .route("/", web::get().to(handlers::get_channels))
            .route("/similar", web::post().to(handlers::get_similar_channels))
            .route("/{id}/get-new-data", web::get().to(handlers::get_new_data))
            .route("/{id}/category", web::put().to(handlers::update_category))
            .route("/{id}/geo", web::put().to(handlers::update_geo)),
    );
}
