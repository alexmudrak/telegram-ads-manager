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
}
