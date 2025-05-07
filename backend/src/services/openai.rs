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

#[derive(Clone, Debug)]
pub struct OpenAiClient {
    client: Client,
    api_key: String,
    model: String,
}

impl OpenAiClient {
    pub fn new(model: &str, api_key: &str) -> Self {
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
    ) -> Result<String, String> {
        let max_tokens = max_tokens.unwrap_or(50);
        let body = serde_json::json!({
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
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
        let response_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response from OpenAi: {}", e))?;

        if !status.is_success() {
            return Err(format!("OpenAI API error: {}\n{}", status, response_text));
        }

        let json: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("OpenAI response JSON error: {}", e))?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No content found in response")?
            .to_string();

        Ok(content)
    }

    pub async fn fetch_chat_category(
        &self,
        channel_data: String,
        categories: Vec<String>,
    ) -> Result<String, String> {
        let categories_lower: Vec<String>= categories
            .iter()
            .map(|c| c.to_lowercase())
            .collect();
        let categories_str = categories_lower.join(",");
        let messages = vec![
OpenAiMessage {
        role: "system".to_string(),
        content: "Ты — классификатор телеграм-каналов. Твоя задача — выбрать ОДНУ категорию из списка, основываясь на предоставленных данных. Возвращай только саму категорию, без пояснений.".to_string(),
    },
            OpenAiMessage {
            role: "user".to_string(),
            content: format!(
                "Возможные категории: [{}]\n\nОписание канала:\n\"{}\"\n\nВыбери наиболее подходящую категорию. Верни только точное название одной категории из списка.",
                categories_str,
                channel_data.trim(), 
            ),
        }];

        let result = self.send_chat_completion(messages, None).await?;
        let category = result.trim().to_lowercase();
        if categories_lower.contains(&category) {
            Ok(category)
        } else {
            Err(format!("OpenAi cant find category"))
        }

    }
}
