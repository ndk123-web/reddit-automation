from automation.utils.logger import add_log
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
    posts_json = json.dumps(data, indent=2, default=str)
    prompt = SYSTEM_PROMPT + posts_json

    add_log("AI_SCORE_START", "Sending batch to Gemini for scoring", "info")

    api_key = os.getenv("GEMINI_KEY")
    if not api_key:
        add_log("AI_SCORE_ERROR", "GEMINI_KEY environment variable is not set", "error")
        raise ValueError("GEMINI_KEY environment variable is not set")

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)

        print("\n=== GEMINI RESPONSE ===\n")
        print(response.text)
        print("\n=== END GEMINI RESPONSE ===\n")
        add_log("AI_SCORE_SUCCESS", "Successfully received response from Gemini API", "success")
        return response.text
    except Exception as e:
        add_log("AI_SCORE_ERROR", f"Gemini API request failed: {str(e)}", "error")
        print(f"Gemini Error: {e}")
        return "{}"

def generate_personalized_outreach(post_title, post_content, author_username, outreach_type="private_message", sequence_step="initial"):
    api_key = os.getenv("GEMINI_KEY")
    if not api_key:
        add_log("AI_OUTREACH_ERROR", "GEMINI_KEY missing for personalized outreach", "error")
        raise ValueError("GEMINI_KEY is not set")
        
    client = genai.Client(api_key=api_key)
    
    if outreach_type == "private_message":
        if sequence_step == "initial":
            prompt = f"""You are an outreach specialist for AutoNova, an AI Automation Agency.
Write a personalized Reddit Direct Message (DM) to u/{author_username}.
They posted this:
Title: {post_title}
Content: {post_content}

Guidelines:
1. Reference their specific post/problem directly. Do not sound generic.
2. Be conversational, not overly salesy. 
3. Briefly mention you help with workflows/AI without a hard pitch.
4. Keep it under 5 sentences.
5. Provide ONLY the message content."""
        elif sequence_step == "followup_1":
            prompt = f"Write a quick, polite 2-sentence follow-up DM to u/{author_username} referencing their post about '{post_title}'. Just bumping the thread gracefully in case they missed the first message."
        else:
            prompt = f"Write a final, polite 2-sentence break-up DM to u/{author_username} regarding their post about '{post_title}'. Say you won't bother them again but leave the door open for automation help."
    else:
        prompt = f"""Write a genuinely helpful, non-promotional Reddit comment reply to u/{author_username}'s post.
Title: {post_title}
Content: {post_content}

CRITICAL RULES:
1. Provide actual value or a tip related to their problem.
2. DO NOT include any links.
3. DO NOT pitch AutoNova or any agency services.
4. DO NOT say "DM me" or call to action.
5. Max 4 sentences.
6. Provide ONLY the comment content."""

    try:
        response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)
        text = response.text.strip()
        
        # Safety check for public comments
        if outreach_type == "public_comment":
            forbidden_words = ["http", "www", ".com", "autonova", "agency", "dm me", "message me", "call"]
            for word in forbidden_words:
                if word in text.lower():
                    # Fallback safe comment if LLM disobeys rules
                    return f"This is an interesting problem regarding {post_title[:30]}... usually connecting a basic webhook can save a lot of headaches here!"
        
        return text
    except Exception as e:
        print(f"Gemini Outreach Error: {e}")
        # Very generic fallback in case of API error, but safe
        if outreach_type == "private_message":
            return f"Hi u/{author_username}, I saw your post. I work with automation and would love to share a quick idea if you're open to it."
        return "Interesting point! Thanks for sharing."
