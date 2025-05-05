use actix_web::web;
mod handlers;

pub fn routers(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/geos").route("/", web::get().to(handlers::get_geos)));
}
