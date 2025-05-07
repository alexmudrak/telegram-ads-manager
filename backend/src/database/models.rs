use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ChannelData {
    pub id: i64,
    pub title: Option<String>,
    pub username: String,
    pub photo_element: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub subscribers: Option<i64>,
    pub geo: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Database {
    pub channels: Vec<ChannelData>,
}

impl Default for Database {
    fn default() -> Self {
        Self { channels: vec![] }
    }
}
