import json
import os

from google import genai

SYSTEM_PROMPT = """You are an AI lead qualification system.

You will receive Reddit posts grouped by subreddit.

Analyze every post individually.

Return ONLY valid JSON.

For each post return:
- reddit_post_id
- ai_score (1-10)
- ai_reason
- status
- ai_category

Scoring Rules:
1-3 = irrelevant
4-6 = moderate relevance
7-10 = strong business or operational pain point

Allowed status values:
- qualified
- rejected
- review

Return response grouped by subreddit exactly like the input structure.

Posts Are: \n
"""


def score_post(data):
    posts_json = json.dumps(data, indent=2)
    prompt = SYSTEM_PROMPT + posts_json

    api_key = os.getenv("GEMINI_KEY")
    if not api_key:
        raise ValueError("GEMINI_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)

    print("\n=== GEMINI RESPONSE ===\n")
    print(response.text)
    print("\n=== END GEMINI RESPONSE ===\n")
    return response.text
