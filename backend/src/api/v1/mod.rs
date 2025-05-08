use actix_web::web;

mod channels;
mod geos;
mod categories;
pub mod ads;

pub fn routers_v1(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1")
            .configure(channels::routers)
            .configure(geos::routers)
            .configure(categories::routers)
            .configure(ads::routers)
    );
}
