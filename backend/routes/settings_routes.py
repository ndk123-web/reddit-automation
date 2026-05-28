from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from pydantic import BaseModel

from backend.controller.settings_controller import (
    get_min_ai_score_controller,
    update_min_ai_score_controller,
    get_all_settings_controller,
    get_setting_by_key_controller,
    update_setting_by_key_controller,
    get_outreach_window_controller,
    update_outreach_window_controller,
)


class SettingValueUpdate(BaseModel):
    value: str


class OutreachWindowUpdate(BaseModel):
    start_hour: int
    end_hour: int


class MinAIScoreUpdate(BaseModel):
    min_ai_score: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.get("/settings/min-ai-score")
def get_min_ai_score(db: Session = Depends(get_db)):
    min_score = get_min_ai_score_controller(db)
    return {"min_ai_score": min_score}


@router.put("/settings/min-ai-score")
def update_min_ai_score(body: MinAIScoreUpdate, db: Session = Depends(get_db)):
    updated_setting = update_min_ai_score_controller(db, body.min_ai_score)
    return {"message": "Min AI score updated successfully", "updated_setting": {"key": updated_setting.key, "value": updated_setting.value}}


@router.get("/settings/outreach-window")
def get_outreach_window(db: Session = Depends(get_db)):
    window = get_outreach_window_controller(db)
    return window


@router.put("/settings/outreach-window")
def update_outreach_window(body: OutreachWindowUpdate, db: Session = Depends(get_db)):
    start_setting, end_setting = update_outreach_window_controller(db, body.start_hour, body.end_hour)
    return {
        "message": "Outreach window updated successfully",
        "updated_setting": [
            {"key": start_setting.key, "value": start_setting.value},
            {"key": end_setting.key, "value": end_setting.value},
        ],
    }

@router.get("/settings")
def get_all_settings(db: Session = Depends(get_db)):
    settings = get_all_settings_controller(db)
    return {"settings": [{"key": setting.key, "value": setting.value} for setting in settings]}


@router.get("/settings/{setting_key}")
def get_setting(setting_key: str, db: Session = Depends(get_db)):
    setting = get_setting_by_key_controller(db, setting_key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


@router.put("/settings/{setting_key}")
def update_setting(setting_key: str, body: SettingValueUpdate, db: Session = Depends(get_db)):
    updated_setting = update_setting_by_key_controller(db, setting_key, body.value)
    return {"message": "Setting updated successfully", "updated_setting": {"key": updated_setting.key, "value": updated_setting.value}}
