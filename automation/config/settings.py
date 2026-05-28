from dotenv import load_dotenv
import os 

load_dotenv()

from automation.service.db_tasks import fetch_min_score

DEFAULT_SCORE = int(os.getenv("DEFAULT_SCORE", "7"))

MIN_SCORE = fetch_min_score() or DEFAULT_SCORE

