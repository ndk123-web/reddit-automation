# HELP TO RUN

Follow these simple steps to setup and run the project locally.

### 1. Setup Environment

- Create a virtual environment: `python -m venv venv`
- Activate the virtual environment:
  - Windows: `.\venv\Scripts\activate`
  - Mac/Linux: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### 2. Database Initialization

- Initialize database tables (this creates the `autonova.db` file):
  `python -m automation.init_db`
- Add default subreddits to monitor:
  `python -m automation.utils.add_subreddits`

### 3. Running the Project

*(Note: Use `python -m` to avoid module import errors)*

**To run the Automation Worker:**
`python -m automation.workers.monitor_worker`

**To run the Backend Server:**
`uvicorn backend.main:app --reload`

### 4. Alembic

i. Generate `alembic revision --autogenerate -m "add priority to lead_posts"`

ii. Apply: `alembic upgrade head`
