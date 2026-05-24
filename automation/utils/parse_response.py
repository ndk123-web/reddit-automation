import json


def parse_gemini_response(response_text):

    cleaned = response_text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1)

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    return json.loads(cleaned)
