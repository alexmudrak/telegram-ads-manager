use actix_web::web;
pub mod v1;

pub fn api_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/api").configure(v1::routers_v1));
}
