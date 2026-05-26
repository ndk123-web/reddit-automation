import os
import requests
import praw
from datetime import datetime
from automation.utils.logger import add_log


def get_praw_client():
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    username = os.getenv("REDDIT_USERNAME")
    password = os.getenv("REDDIT_PASSWORD")
    user_agent = os.getenv("REDDIT_USER_AGENT", "PulsePilot Reddit Automator v1.0")

    if client_id and client_secret and username and password:
        try:
            return praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                username=username,
                password=password,
                user_agent=user_agent
            )
        except Exception as e:
            print(f"[Reddit Client] PRAW initialization failed: {e}")
    return None


def fetch_latest_posts(subreddit_name="startups", limit=5):
    """
    Fetches the latest posts from a subreddit using PRAW if configured, otherwise falls back to JSON scraping.
    """
    reddit = get_praw_client()
    cleaned_posts = []

    if reddit:
        try:
            add_log("REDDIT_FETCH_START", f"Fetching r/{subreddit_name} using PRAW", "info")
            print(f"[Reddit Monitor] Fetching r/{subreddit_name} via PRAW")
            subreddit = reddit.subreddit(subreddit_name)
            for post in subreddit.new(limit=limit):
                cleaned_posts.append({
                    "reddit_post_id": post.id,
                    "subreddit_name": subreddit_name,
                    "author_username": post.author.name if post.author else "[deleted]",
                    "title": post.title,
                    "content": post.selftext,
                    "post_url": f"https://reddit.com{post.permalink}",
                    "created_utc": datetime.utcfromtimestamp(post.created_utc),
                })
            return cleaned_posts
        except Exception as e:
            add_log("REDDIT_FETCH_ERROR", f"PRAW fetch failed for r/{subreddit_name}: {str(e)}. Falling back to JSON scraping.", "error")
            print(f"[Reddit Monitor] PRAW fetch failed for r/{subreddit_name}: {e}. Falling back to JSON...")

    # Fallback to public JSON endpoint (no auth needed, highly reliable for general reads)
    try:
        add_log("REDDIT_FETCH_START", f"Fetching r/{subreddit_name} via JSON scraping", "info")
        print(f"[Reddit Monitor] Fetching r/{subreddit_name} via JSON scraping")
        url = f"https://www.reddit.com/r/{subreddit_name}/new.json?limit={limit}"
        headers = {"User-Agent": os.getenv("REDDIT_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 404:
            print(f"[Reddit Monitor] Subreddit r/{subreddit_name} not found.")
            return []
            
        data = response.json()
        posts = data.get("data", {}).get("children", [])

        for post in posts:
            post_data = post.get("data", {})
            created_utc_ts = post_data.get("created_utc", datetime.utcnow().timestamp())
            cleaned_posts.append({
                "reddit_post_id": post_data.get("id"),
                "subreddit_name": post_data.get("subreddit"),
                "author_username": post_data.get("author", "[deleted]"),
                "title": post_data.get("title", ""),
                "content": post_data.get("selftext", ""),
                "post_url": f"https://reddit.com{post_data.get('permalink', '')}",
                "created_utc": datetime.utcfromtimestamp(created_utc_ts),
            })
        return cleaned_posts
    except Exception as e:
        add_log("REDDIT_FETCH_ERROR", f"JSON fetch failed for r/{subreddit_name}: {str(e)}", "error")
        print(f"[Reddit Monitor] JSON fetch failed for r/{subreddit_name}: {e}")
        return []


def check_shadowban(username):
    """
    Checks if a Reddit account is shadowbanned or suspended.
    If the about.json returns 404, or has suspensions, it is shadowbanned.
    """
    url = f"https://www.reddit.com/user/{username}/about.json"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 404:
            add_log("REDDIT_SHADOWBAN_CHECK", f"User u/{username} not found (404) - likely shadowbanned or deleted", "warning")
            return True  # 404 User Not Found usually indicates a shadowban or deletion
        if response.status_code == 200:
            data = response.json()
            if "error" in data or data.get("data", {}).get("is_suspended"):
                add_log("REDDIT_SHADOWBAN_CHECK", f"User u/{username} is suspended or has an error in about.json - likely shadowbanned", "warning")
                return True
            
            add_log("REDDIT_SHADOWBAN_CHECK", f"User u/{username} is active and not shadowbanned", "success")
            return False
        return False
    except Exception as e:
        print(f"[Reddit Safety] Error checking shadowban for u/{username}: {e}")
        return False


def send_reddit_dm(recipient, subject, body):
    """
    Sends a direct message on Reddit to a recipient using PRAW.
    """
    reddit = get_praw_client()
    if not reddit:
        add_log("REDDIT_DM_ERROR", "Reddit PRAW API credentials not configured, cannot send DM", "error")
        raise ValueError("Reddit PRAW API credentials must be configured to send DMs.")
    
    try:
        reddit.redditor(recipient).message(subject=subject, message=body)
        print(f"[Reddit Outreach] Successfully sent DM to u/{recipient}")
        add_log("REDDIT_DM_SUCCESS", f"Sent DM to u/{recipient} with subject '{subject}'", "success")
        return True
    except Exception as e:
        add_log("REDDIT_DM_ERROR", f"Failed to send DM to u/{recipient}: {str(e)}", "error")
        print(f"[Reddit Outreach] Failed to send DM to u/{recipient}: {e}")
        raise e


def send_reddit_comment(reddit_post_id, body):
    """
    Replies to a specific Reddit post/comment with PRAW.
    """
    reddit = get_praw_client()
    if not reddit:
        add_log("REDDIT_COMMENT_ERROR", "Reddit PRAW API credentials not configured, cannot send comment", "error")
        raise ValueError("Reddit PRAW API credentials must be configured to send comments.")
        
    try:
        submission = reddit.submission(id=reddit_post_id)
        reply = submission.reply(body)
        print(f"[Reddit Outreach] Successfully posted public comment reply to post {reddit_post_id}")
        add_log("REDDIT_COMMENT_SUCCESS", f"Posted comment reply to post {reddit_post_id}", "success")
        return reply.id
    except Exception as e:
        add_log("REDDIT_COMMENT_ERROR", f"Failed to post comment to post {reddit_post_id}: {str(e)}", "error")
        print(f"[Reddit Outreach] Failed to post comment to post {reddit_post_id}: {e}")
        raise e