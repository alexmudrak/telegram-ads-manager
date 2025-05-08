use serde::Deserialize;

#[derive(Deserialize)]
pub struct ChannelQuery {
    pub category: Option<String>,
    pub geo: Option<String>,
}

#[derive(Deserialize)]
pub struct SimilarChannelRequest {
    pub channels_names: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateChannelCategoryRequest {
    pub category: String,
}

#[derive(Deserialize)]
pub struct UpdateChannelGeoRequest {
    pub geo: String,
}
