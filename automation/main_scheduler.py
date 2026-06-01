from apscheduler.schedulers.blocking import BlockingScheduler
from automation.workers.monitor_worker import run_monitor_worker
from automation.workers.outreach_worker import run_outreach_worker
from automation.workers.reply_worker import run_reply_worker
from dotenv import load_dotenv 
from datetime import datetime

load_dotenv() 

scheduler = BlockingScheduler() 

# Har 60 seconds (1 minute) mein worker run hoga
# next_run_time=datetime.now() taaki script chalu hote hi pehla run turant trigger kare

scheduler.add_job(run_monitor_worker, 'interval', minutes=2, max_instances=1, coalesce=True, next_run_time=datetime.now())
# scheduler.add_job(run_outreach_worker, 'interval', minutes=1, max_instances=1, coalesce=True, next_run_time=datetime.now())
# scheduler.add_job(run_reply_worker, 'interval', minutes=1, max_instances=1, coalesce=True, next_run_time=datetime.now())

if __name__ == "__main__":
    print("Scheduler is starting... Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("Scheduler stopped.")