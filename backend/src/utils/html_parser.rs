use log::warn;
use select::document::Document;
use select::predicate::{Class, Name, Predicate};

pub fn extract_subscribers(html_string: &str) -> Option<i64> {
    let document = Document::from(html_string);

    let subscriber_node = document
        .find(Name("span").and(Class("pr-similar-channel-desc")))
        .next();

    if let Some(node) = subscriber_node {
        let text = node.text();
        if let Some(number_str) = text.split_whitespace().next() {
            let cleaned = number_str.replace(",", "");
            match cleaned.parse::<i64>() {
                Ok(n) => Some(n),
                Err(e) => {
                    warn!("Failed to parse subscriber count '{}': {}", cleaned, e);
                    None
                }
            }
        } else {
            warn!("No number found in subscriber text: '{}'", text);
            None
        }
    } else {
        warn!("Subscriber element not found in HTML");
        None
    }
}
