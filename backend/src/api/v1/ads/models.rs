use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateAdMessageRequest {
    pub description: String,
    pub channels_names: Vec<String>,
}
