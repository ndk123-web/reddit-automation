import requests


def fetch_latest_posts(subreddit_name="startups"):
    url = f"https://www.reddit.com/r/{subreddit_name}/new.json?limit=5"
    headers = {"User-Agent": "autonova-monitor/1.0"}
    response = requests.get(url, headers=headers)
    data = response.json()
    posts = data["data"]["children"]

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

    return cleaned_posts
