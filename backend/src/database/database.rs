use std::sync::Arc;

use super::models::{ChannelData, Database};
use crate::config::DatabaseConfig;
use log::info;
use tokio::{fs, sync::Mutex};

#[derive(Clone, Debug)]
pub struct JsonDatabase {
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
            db: Arc::new(Mutex::new(data)),
        })
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
}
