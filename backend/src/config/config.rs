use std::env;
use std::path::Path;

use serde::{Deserialize, Serialize};

use super::models::DatabaseConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub log_level: String,
    pub geos: Vec<String>,
    pub categories: Vec<String>,
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
        })
    }
}
