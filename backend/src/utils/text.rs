#[derive(Debug)]
pub struct TextUtils;

impl TextUtils {
    pub fn normalize_name(raw_name: &str) -> String {
        raw_name
            .replace("https://t.me/", "")
            .replace('@', "")
            .replace('/', "")
            .trim()
            .to_string()
    }

    pub fn normalize_names(raw_names: &[String]) -> Vec<String> {
        raw_names
            .iter()
            .map(|name| Self::normalize_name(name))
            .collect()
    }

    pub fn parse_validation_error(error: &str) -> Option<(String, String)> {
        if error.starts_with("Validation error in field '") {
            if let Some(start) = error.find('\'') {
                if let Some(end) = error[start + 1..].find('\'') {
                    let field = &error[start + 1..start + 1 + end];
                    let msg_start = error.find(": ").unwrap_or(0) + 2;
                    let msg = &error[msg_start..];
                    return Some((field.to_string(), msg.to_string()));
                }
            }
        }
        None
    }
}
