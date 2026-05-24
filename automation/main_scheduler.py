from apscheduler.schedulers.blocking import BlockingScheduler
from automation.workers.monitor_worker import run_monitor_worker
from dotenv import load_dotenv 

load_dotenv() 

scheduler = BlockingScheduler() 

# Har 60 seconds (1 minute) mein worker run hoga
scheduler.add_job(run_monitor_worker, 'interval', minutes=2)

if __name__ == "__main__":
    print("Scheduler is starting... Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("Scheduler stopped.")