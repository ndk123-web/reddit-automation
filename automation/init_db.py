import sys
import os

# Add the root project directory to sys.path so 'automation' module can be resolved
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from automation.config.database import engine, Base
from automation.models.subreddit import Subreddit

# create all db
Base.metadata.create_all(bind=engine)

print("Database tables created.")
