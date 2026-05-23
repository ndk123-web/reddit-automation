from automation.service.reddit_service import fetch_latest_posts
from automation.service.ai_service import score_post
from automation.service.db_tasks import fetch_subreddits
from pprint import pprint
from dotenv import load_dotenv

"""
    Steps:
        1. Fetch All Sub reddits that are (Active = True)
        2. Fetch 5  posts each from all subreddits
        3. Score it using AI and accept json with score
        4. Store All whose threashold > 7 in posts 
"""


load_dotenv()


def run():
    ALLOWED_SUB_REDDITS_LIST = fetch_subreddits()
    TOTAL_AGGREGATE_POSTS = {}

    print("Allowed:")
    pprint(ALLOWED_SUB_REDDITS_LIST)
    for subreddit in ALLOWED_SUB_REDDITS_LIST:
        subreddit_posts = fetch_latest_posts(subreddit_name=subreddit)
        TOTAL_AGGREGATE_POSTS[subreddit] = subreddit_posts

    print("\n--- Calling Gemini for lead scoring ---\n")
    score_post(TOTAL_AGGREGATE_POSTS)

    print("\n--- Raw Reddit posts (fetched, not scored) ---\n")
    pprint(TOTAL_AGGREGATE_POSTS)


run()
