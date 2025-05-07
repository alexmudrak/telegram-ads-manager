use serde::Deserialize;

#[derive(Deserialize)]
pub struct ChannelQuery {
    pub category: Option<String>,
    pub geo: Option<String>,
}

#[derive(Deserialize)]
pub struct SimilarChannelRequest {
    pub hash: String,
    pub stel_ssid: String,
    pub stel_token: String,
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
