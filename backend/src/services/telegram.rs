use crate::database::models::ChannelData;

#[derive(Clone, Debug)]
pub struct TelegramService {
    pub hash: Option<String>,
    pub stel_ssid: Option<String>,
    pub stel_token: Option<String>,
}

impl TelegramService {
    pub fn new(
        hash: Option<String>,
        stel_ssid: Option<String>,
        stel_token: Option<String>,
    ) -> Self {
        TelegramService {
            hash,
            stel_ssid,
            stel_token,
        }
    }

    pub async fn fetch_similar_channels(
        &self,
        channels: Vec<String>,
    ) -> Result<Vec<ChannelData>, String> {
        
        Ok(vec![ChannelData {
            id: 123456,
            title: self.hash.clone(),
            username: self.stel_token.clone().unwrap_or("".to_string()),
            photo_element: self.stel_ssid.clone(),
            category: Some("".to_string()),
            description: Some("".to_string()),
            subscribers: Some("".to_string()),
            geo: Some("".to_string()),
        }])
    }
}
