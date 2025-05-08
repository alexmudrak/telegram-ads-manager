use std::env;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::services::{openai::OpenAiConfig, telegram::TelegramConfig};

use super::models::DatabaseConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub log_level: String,
    pub geos: Vec<String>,
    pub categories: Vec<String>,
    pub telegram: TelegramConfig,
    pub openai: OpenAiConfig,
}

impl AppConfig {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            database: DatabaseConfig {
                file_path: Path::new("channels.json").to_path_buf(),
            },
            log_level: "INFO".to_string(),
            geos: env::var("APP_AVAILABLE_GEOS")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            categories: env::var("APP_AVAILABLE_CATEGORIES")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            telegram: TelegramConfig {
                bot_token: env::var("APP_TELEGRAM_BOT_TOKEN")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                ads_hash: env::var("APP_TELEGRAM_ADS_HASH")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                ads_stel_ssid: env::var("APP_TELEGRAM_STEL_SSID")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                ads_stel_token: env::var("APP_TELEGRAM_STEL_TOKEN")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                ads_stel_owner: env::var("APP_TELEGRAM_STEL_OWNER")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
            openai: OpenAiConfig {
                api_key: env::var("APP_OPENAI_API_KEY")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                model: env::var("APP_OPENAI_API_MODEL")
                    .unwrap_or_default()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
        })
    }
}
