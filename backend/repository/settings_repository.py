from automation.models.settings import Settings
from sqlalchemy.orm import Session


def get_settings(db: Session):
    return db.query(Settings).all()


def getSettingsRepo(db: Session):
    return get_settings(db)


def get_setting_by_key_repo(db: Session, key: str):
    return db.query(Settings).filter(Settings.key == key).first()


def upsert_setting_repo(db: Session, key: str, value: str):
    setting = db.query(Settings).filter(Settings.key == key).first()

    if setting:
        setting.value = value
    else:
        setting = Settings(key=key, value=value)
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting


def get_min_ai_score_repo(db: Session):

    setting = (
        db.query(Settings)
        .filter(Settings.key.in_(["min_score", "score_threshold"]))
        .first()
    )

    min_score = int(setting.value) if setting and str(setting.value).isdigit() else None
    return min_score if min_score is not None else 7


def update_min_ai_score_repo(db: Session, new_score: int):
    setting = (
        db.query(Settings)
        .filter(Settings.key.in_(["min_score", "score_threshold"]))
        .first()
    )

    if setting:
        setting.value = str(new_score)
    else:
        setting = Settings(key="score_threshold", value=str(new_score))
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting


def get_outreach_window_repo(db: Session):
    start_setting = (
        db.query(Settings)
        .filter(
            Settings.key.in_(["outreach_window_start_hour", "outreach_window_start"])
        )
        .first()
    )
    end_setting = (
        db.query(Settings)
        .filter(Settings.key.in_(["outreach_window_end_hour", "outreach_window_end"]))
        .first()
    )

    start_hour = (
        int(start_setting.value)
        if start_setting and str(start_setting.value).isdigit()
        else 10
    )
    end_hour = (
        int(end_setting.value)
        if end_setting and str(end_setting.value).isdigit()
        else 18
    )

    return {
        "start_hour": start_hour,
        "end_hour": end_hour,
    }


def update_outreach_window_repo(db: Session, start_hour: int, end_hour: int):
    start_setting = upsert_setting_repo(
        db, "outreach_window_start_hour", str(start_hour)
    )
    end_setting = upsert_setting_repo(db, "outreach_window_end_hour", str(end_hour))
    return start_setting, end_setting
