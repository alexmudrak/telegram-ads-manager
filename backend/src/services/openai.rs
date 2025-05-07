use log::{debug, error, info, warn};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAiConfig {
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAiMessage {
    role: String,
    content: String,
}
impl OpenAiMessage {
    pub fn system<S: Into<String>>(content: S) -> Self {
        Self {
            role: "system".to_string(),
            content: content.into(),
        }
    }

    pub fn user<S: Into<String>>(content: S) -> Self {
        Self {
            role: "user".to_string(),
            content: content.into(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct OpenAiClient {
    client: Client,
    api_key: String,
    model: String,
}

impl OpenAiClient {
    pub fn new(model: &str, api_key: &str) -> Self {
        if model.is_empty() {
            panic!("OpenAI model must be specified");
        }
        Self {
            client: Client::new(),
            api_key: api_key.to_string(),
            model: model.to_string(),
        }
    }

    async fn send_chat_completion(
        &self,
        messages: Vec<OpenAiMessage>,
        max_tokens: Option<i32>,
        temperature: Option<f64>,
    ) -> Result<String, String> {
        debug!("Sending request to OpenAI with {} messages", messages.len());

        let body = serde_json::json!({
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens.unwrap_or(50),
            "temperature": temperature.unwrap_or(0.0),
        });

        let response = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request to OpenAI failed: {}", e))?;

        let status = response.status();
        let response_text = response.text().await.map_err(|e| {
            error!("OpenAI response read error: {}", e);
            format!("Failed to read response from OpenAi: {}", e)
        })?;

        if !status.is_success() {
            error!("OpenAI API error: {}\n{}", status, response_text);
            return Err(format!("OpenAI API error: {}\n{}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text).map_err(|e| {
            error!("OpenAI JSON parsing error: {}", e);
            format!("OpenAI response JSON error: {}", e)
        })?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| {
                error!("No content in OpenAI response");
                "No content found in OpenAI response".to_string()
            })?
            .to_string();

        debug!("Received content from OpenAI: {}", content);
        Ok(content)
    }

    async fn classify_label(
        &self,
        label_type: &str,
        data: &str,
        candidates: &[String],
    ) -> Result<String, String> {
        let candidates_lower: Vec<String> = candidates.iter().map(|c| c.to_lowercase()).collect();
        let candidates_str = candidates_lower.join(", ");

        debug!("Classifying '{}' for channel data: {}", label_type, data);

        let system_prompt = format!(
            "Ты — классификатор телеграм-каналов. Твоя задача — выбрать одно значение {} из списка. Возвращай только одно значение без пояснений.",
            label_type
        );

        let user_prompt = format!(
            "Возможные значения: [{}]\n\nОписание канала:\n\"{}\"\n\nВыбери наиболее подходящее. Верни только одно точное значение из списка.",
            candidates_str,
            data.trim()
        );

        let messages = vec![
            OpenAiMessage::system(system_prompt),
            OpenAiMessage::user(user_prompt),
        ];

        match self.send_chat_completion(messages, None, None).await {
            Ok(result) => {
                let label = result.trim().to_lowercase();

                if candidates_lower.contains(&label) {
                    info!("Successfully classified '{}' as '{}'", label_type, label);
                    Ok(label)
                } else {
                    warn!("OpenAI returned unknown {}: '{}'", label_type, label);
                    Err(format!(
                        "OpenAI couldn't classify {}. Got: '{}'",
                        label_type, label
                    ))
                }
            }
            Err(e) => {
                error!("Failed to classify {}: {}", label_type, e);
                Err(e)
            }
        }
    }

    pub async fn fetch_chat_category(
        &self,
        channel_data: String,
        categories: Vec<String>,
    ) -> Result<String, String> {
        self.classify_label("категория", &channel_data, &categories)
            .await
    }

    pub async fn fetch_chat_geo(
        &self,
        channel_data: String,
        geos: Vec<String>,
    ) -> Result<String, String> {
        self.classify_label("гео", &channel_data, &geos).await
    }
}
