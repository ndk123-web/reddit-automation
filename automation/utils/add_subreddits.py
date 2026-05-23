import sys
import os

# resolve root direcotory for imports, since this script is in a subfolder
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from automation.database import SessionLocal
except ModuleNotFoundError:
    from automation.config.database import SessionLocal

from automation.models.subreddit import Subreddit

db = SessionLocal()

subreddits = [
    Subreddit(
        name="startups",
        active=True,
        dm_allowed=True,
        rules="No spammy outreach. Keep interactions contextual."
    ),

    Subreddit(
        name="Entrepreneur",
        active=True,
        dm_allowed=False,
        rules="Monitoring only. Avoid unsolicited DMs."
    ),

    Subreddit(
        name="smallbusiness",
        active=True,
        dm_allowed=True,
        rules="Low-volume outreach only."
    ),

    Subreddit(
        name="SaaS",
        active=True,
        dm_allowed=True,
        rules="Focus on automation/business workflow discussions."
    ),

    Subreddit(
        name="marketing",
        active=False,
        dm_allowed=False,
        rules="Currently disabled."
    )
]

db.add_all(subreddits)

db.commit()

db.close()

print("Subreddits added successfully.")