from dotenv import load_dotenv
import os 

load_dotenv()

from automation.service.db_tasks import fetch_min_score, fetch_outreach_window

DEFAULT_SCORE = int(os.getenv("DEFAULT_SCORE", "7"))

MIN_SCORE = fetch_min_score() or DEFAULT_SCORE
OUTREACH_WINDOW_START_HOUR, OUTREACH_WINDOW_END_HOUR = fetch_outreach_window()

