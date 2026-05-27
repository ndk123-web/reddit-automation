from fastapi import APIRouter, Depends, HTTPException
from automation.workers.monitor_worker import run_monitor_worker

router = APIRouter()

@router.post("/outreach/trigger-monitor")
async def manual_monitor_worker():
    # Placeholder for the actual implementation of the manual monitor worker
    # You can replace this with the actual logic to trigger the worker
    
    try:
        success = run_monitor_worker()
        if not success:
            raise HTTPException(status_code=423, detail="Monitor worker is already running via scheduler or another process. Please wait.")
        return {"message": "Manual monitor worker triggered successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering manual monitor worker: {str(e)}")