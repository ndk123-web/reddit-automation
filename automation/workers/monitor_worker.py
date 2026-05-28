import os
import time
from automation.config.settings import MIN_SCORE
from automation.service.reddit_service import fetch_latest_posts
from automation.service.ai_service import score_post
from automation.service.db_tasks import fetch_subreddits, store_lead_posts
from automation.utils.parse_response import parse_gemini_response
from automation.utils.logger import add_log, flush_logs
from concurrent.futures import ThreadPoolExecutor, as_completed
from automation.config.settings import MIN_SCORE
from pprint import pprint
from dotenv import load_dotenv
from datetime import datetime

"""
    Steps:
        1. Fetch All Sub reddits that are (Active = True)
        2. Fetch 5  posts each from all subreddits
        3. Score it using AI and accept json with score
        4. Store All whose threashold > {MIN_SCORE} in posts 
"""


load_dotenv()

LOCK_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "monitor.lock")


def run_monitor_worker():
    if os.path.exists(LOCK_FILE):
        
        # 600 seconds = 10 minutes, agar lock file 10 minutes se purana hai toh assume karo kuch gadbad hai aur delete kar do
        if time.time() - os.path.getmtime(LOCK_FILE) > 600:
            try:
                os.remove(LOCK_FILE)
            except OSError:
                pass
        else:
            print("Monitor worker is already running. Skipping...")
            return False

    with open(LOCK_FILE, "w") as f:
        f.write(str(time.time()))

    add_log("WORKER_START", "Starting Reddit Monitor Worker", "info")
    try:
        ALLOWED_SUB_REDDITS_LIST = fetch_subreddits()
        TOTAL_AGGREGATE_POSTS = {}

        print("Allowed:")
        pprint(ALLOWED_SUB_REDDITS_LIST)
        
        # Parallely Reddit APIs call karne ke liye ThreadPoolExecutor ka use
        with ThreadPoolExecutor(max_workers=5) as executor:
            # Future mapping set karna (Thread assign karna)
            future_to_sub = {
                executor.submit(fetch_latest_posts, subreddit_name=sub): sub 
                for sub in ALLOWED_SUB_REDDITS_LIST
            }
            
            # Jaise jaise API responses aate jayenge waise waise add hote jayenge
            for future in as_completed(future_to_sub):
                sub = future_to_sub[future]
                try:
                    TOTAL_AGGREGATE_POSTS[sub] = future.result()
                except Exception as exc:
                    print(f"Thread failed for {sub}: {exc}")
                    TOTAL_AGGREGATE_POSTS[sub] = []

        print("\n--- Calling Gemini for lead scoring ---\n")
        score_lead_posts_text = score_post(TOTAL_AGGREGATE_POSTS)

        print("\n--- Parsing AI response ---\n")
        # Parse the text response into a dictionary
        try:
            scored_posts_dict = parse_gemini_response(score_lead_posts_text)
        except Exception as e:
            print("Error parsing Gemini response:", e)
            add_log("WORKER_ERROR", f"Error parsing Gemini response: {str(e)}", "error")
            return

        # Create a mapping of raw posts by their reddit_post_id
        raw_posts_map = {}
        for subreddit, posts in TOTAL_AGGREGATE_POSTS.items():
            for post in posts:
                raw_posts_map[post["reddit_post_id"]] = post

        # Flatten AI scored posts by reddit_post_id for quick lookup
        scored_posts_map = {}
        if isinstance(scored_posts_dict, dict):
            for subreddit, scored_posts in scored_posts_dict.items():
                for scored_post in scored_posts:
                    post_id = scored_post.get("reddit_post_id")
                    if post_id:
                        scored_posts_map[post_id] = scored_post

        # Combine AI scored data with raw Reddit data
        final_leads = []

        for post_id, raw_post in raw_posts_map.items():
            scored_post = scored_posts_map.get(post_id, {})

            # Merge data
            ai_score = scored_post.get("ai_score")
            try:
                score_val = int(ai_score) if ai_score is not None else 0
            except ValueError:
                score_val = 0

            lead_status = "qualified" if score_val > MIN_SCORE else "discovered"

            created_utc_ts = raw_post.get("created_utc")
            if isinstance(created_utc_ts, datetime):
                created_utc_dt = created_utc_ts
            elif isinstance(created_utc_ts, (int, float)):
                created_utc_dt = datetime.utcfromtimestamp(created_utc_ts)
            else:
                created_utc_dt = datetime.utcnow() # fallback

            combined = {
                "reddit_post_id": post_id,
                "subreddit_name": raw_post.get("subreddit_name"),
                "author_username": raw_post.get("author_username"),
                "title": raw_post.get("title"),
                "content": raw_post.get("content"),
                "post_url": raw_post.get("post_url"),
                "ai_score": score_val,
                "ai_reason": scored_post.get("ai_reason"),
                "status": lead_status,
                "created_utc": created_utc_dt,
            }
            final_leads.append(combined)

        print("\n--- Combining data and saving to Database ---\n")
        pprint(final_leads)
        discovered_count = len([lead for lead in final_leads if lead["status"] == "discovered"])
        qualified_count = len([lead for lead in final_leads if lead["status"] == "qualified"])
        
        if final_leads:
            store_lead_posts(final_leads)
            print(f"Successfully stored {len(final_leads)} leads: {qualified_count} qualified, {discovered_count} discovered.")
            add_log(
                "WORKER_SUCCESS",
                f"Processed {len(final_leads)} raw posts, stored {qualified_count} qualified and {discovered_count} discovered leads.",
                "success",
            )
        else:
            print("No raw posts were fetched.")
            add_log("WORKER_SUCCESS", "No raw posts were fetched from active subreddits.", "info")

    except Exception as e:
        print(f"Worker crashed: {e}")
        add_log("WORKER_ERROR", f"CRASH: {str(e)}", "error")
    finally:
        add_log("WORKER_END", "Monitor worker cycle finished", "info")
        flush_logs()  # DONT FORGET TO FLUSH!
        if os.path.exists(LOCK_FILE):
            try:
                os.remove(LOCK_FILE)
            except OSError:
                pass
    return True
