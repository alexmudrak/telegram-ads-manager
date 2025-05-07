use std::{path::PathBuf, sync::Arc};

use super::models::{ChannelData, Database};
use crate::config::DatabaseConfig;
use log::info;
use tokio::{fs, sync::Mutex};

#[derive(Clone, Debug)]
pub struct JsonDatabase {
    _file_path: PathBuf,
    db: Arc<Mutex<Database>>,
}

impl JsonDatabase {
    pub async fn new(config: DatabaseConfig) -> Result<Self, String> {
        let data = if config.file_path.exists() {
            let contents = fs::read_to_string(&config.file_path)
                .await
                .map_err(|e| format!("Failed to read DB file: {}", e))?;

            serde_json::from_str(&contents)
                .map_err(|e| format!("Invalid JSON in DB file: {}", e))?
        } else {
            info!("Database file not found, creating a new one.");
            Database::default()
        };

        Ok(Self {
            _file_path: config.file_path,
            db: Arc::new(Mutex::new(data)),
        })
    }

    async fn save(&self, data: &Database) -> Result<(), String> {
        let contents = serde_json::to_string_pretty(data)
            .map_err(|e| format!("Failed to serialize database: {}", e))?;
        fs::write(&self._file_path, contents)
            .await
            .map_err(|e| format!("Failed to write to DB file: {}", e))?;
        info!("Database saved to {:?}", &self._file_path);
        Ok(())
    }

    pub async fn filter_channels(
        &self,
        category: Option<&String>,
        geo: Option<&String>,
    ) -> Vec<ChannelData> {
        let data = self.db.lock().await;
        data.channels
            .iter()
            .filter(|channel| {
                let matches_category =
                    category.map_or(true, |cat| channel.category.as_ref() == Some(cat));

                let matches_geo = geo.map_or(true, |g| channel.geo.as_ref() == Some(g));

                matches_category && matches_geo
            })
            .cloned()
            .collect()
    }

    pub async fn get_channel_by_username(
        &self,
        username: &str,
    ) -> Result<Option<ChannelData>, String> {
        let data = self.db.lock().await;
        Ok(data
            .channels
            .iter()
            .find(|c| c.username == username)
            .cloned())
    }

    pub async fn add_channel(&self, channel: ChannelData) -> Result<(), String> {
        let mut data = self.db.lock().await;
        data.channels.push(channel);
        self.save(&data).await?;
        Ok(())
    }

    pub async fn add_or_update_channel(&self, channel: ChannelData) -> Result<(), String> {
        let mut data = self.db.lock().await;

        if let Some(existing_index) = data
            .channels
            .iter()
            .position(|c| c.id == channel.id || c.username == channel.username)
        {
            data.channels[existing_index] = channel;
        } else {
            data.channels.push(channel);
        }

        self.save(&data).await?;
        Ok(())
    }
}
