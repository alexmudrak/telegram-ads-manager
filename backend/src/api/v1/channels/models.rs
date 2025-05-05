use serde::Deserialize;

#[derive(Deserialize)]
pub struct ChannelQuery {
    pub category: Option<String>,
    pub geo: Option<String>,
}
