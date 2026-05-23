import requests


def fetch_latest_posts(subreddit_name="startups"):
    url = f"https://www.reddit.com/r/{subreddit_name}/new.json?limit=5"
    headers = {"User-Agent": "autonova-monitor/1.0"}
    response = requests.get(url, headers=headers)
    data = response.json()
    posts = data["data"]["children"]

    # print("Data: ", data)
    # print("Posts: ", posts)

    return [post["data"] for post in posts]
