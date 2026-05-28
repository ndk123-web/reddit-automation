from backend.repository.settings_repository import (
    get_min_ai_score_repo,
    update_min_ai_score_repo,
    get_settings as get_settings_repo,
    get_setting_by_key_repo,
    upsert_setting_repo,
    get_outreach_window_repo,
    update_outreach_window_repo,
)

def get_min_ai_score_controller(db):
    return get_min_ai_score_repo(db)

def update_min_ai_score_controller(db, new_score: int):
    return update_min_ai_score_repo(db, new_score)


def get_all_settings_controller(db):
    return get_settings_repo(db)


def get_setting_by_key_controller(db, setting_key: str):
    return get_setting_by_key_repo(db, setting_key)


def update_setting_by_key_controller(db, setting_key: str, value: str):
    return upsert_setting_repo(db, setting_key, value)


def get_outreach_window_controller(db):
    return get_outreach_window_repo(db)


def update_outreach_window_controller(db, start_hour: int, end_hour: int):
    return update_outreach_window_repo(db, start_hour, end_hour)