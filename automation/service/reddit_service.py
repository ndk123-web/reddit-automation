import requests
from automation.utils.logger import add_log

def fetch_latest_posts(subreddit_name="startups"):
    add_log("REDDIT_FETCH_START", f"Fetching posts from r/{subreddit_name}", "info")
    
    try:
        url = f"https://www.reddit.com/r/{subreddit_name}/new.json?limit=5"
        headers = {"User-Agent": "autonova-monitor/1.0"}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        posts = data["data"]["children"]
    except Exception as e:
        add_log("REDDIT_FETCH_ERROR", f"Failed to fetch r/{subreddit_name}: {str(e)}", "error")
        return []

    # print("Data: ", data)
    # print("Posts: ", posts)

    cleaned_posts = []

    for post in posts:
        post_data = post["data"]

        cleaned_posts.append(
            {
                "reddit_post_id": post_data["id"],
                "subreddit_name": post_data["subreddit"],
                "author_username": post_data["author"],
                "title": post_data["title"],
                "content": post_data["selftext"],
                "post_url": post_data["url"],
                "created_utc": post_data["created_utc"],
            }
        )

    add_log("REDDIT_FETCH_SUCCESS", f"Successfully cleaned {len(cleaned_posts)} posts from r/{subreddit_name}", "success")
    return cleaned_posts
