use serde::Deserialize;



#[derive(Deserialize)]
pub struct GenerateAdMessageRequest {
    pub description: String,
    pub channels_names: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateAdRequest {
    pub text: String,
    pub promote_url: String,
    pub cpm: f32,
    pub views_per_user: i32,
    pub budget: f32,
    pub daily_budget: f32,
    pub active: bool,
    pub target_type: AdTargetType,
    pub channels: Vec<String>,
    pub method: AdMethodType,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AdTargetType {
    Channel,
}

impl AdTargetType {
    pub fn as_str(&self) -> &'static str {
        match self {
            AdTargetType::Channel => "channel",
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AdMethodType {
    Save,
    Draft,
}

impl AdMethodType {
    pub fn as_str(&self) -> &'static str {
        match self {
            AdMethodType::Save => "createAd",
            AdMethodType::Draft => "saveAdDraft",
        }
    }
}
