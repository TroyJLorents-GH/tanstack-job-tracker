# server/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from jobspy import scrape_jobs
import sqlite3
import uuid
from typing import Optional, List
from datetime import datetime

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # relax during initial rollout; tighten to exact frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "JobSpy API is running"}

@app.get("/test")
def test():
    return {"status": "ok", "jobspy_available": True}

class ParseRequest(BaseModel):
    url: HttpUrl

class SearchRequest(BaseModel):
    search_term: str
    location: str = ""
    results_wanted: int = 40
    hours_old: int = 72
    site_name: list = ["linkedin", "indeed", "glassdoor", "zip_recruiter"]

# -----------------------------
# Job Applications (CRUD) MVP
# -----------------------------

DB_PATH = "/tmp/applications.db"  # Cloud Run writable tmp; persists per instance


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                company TEXT,
                position TEXT,
                applied_date TEXT,
                stage TEXT,
                status TEXT,
                location TEXT,
                salary TEXT,
                job_url TEXT,
                notes TEXT,
                interview_prep TEXT,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


class ApplicationBase(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    appliedDate: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    jobUrl: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(ApplicationBase):
    pass


class Application(ApplicationBase):
    id: str
    interviewPrep: Optional[List[dict]] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class InterviewPrepRequest(BaseModel):
    title: str
    content: str


def row_to_application(row: sqlite3.Row) -> Application:
    return Application(
        id=row["id"],
        company=row["company"],
        position=row["position"],
        appliedDate=row["applied_date"],
        stage=row["stage"],
        status=row["status"],
        location=row["location"],
        salary=row["salary"],
        jobUrl=row["job_url"],
        notes=row["notes"],
        interviewPrep=[] if (row["interview_prep"] is None or row["interview_prep"] == "") else __import__("json").loads(row["interview_prep"]),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@app.get("/applications")
def list_applications() -> List[Application]:
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM applications ORDER BY datetime(created_at) DESC")
        rows = cur.fetchall()
        return [row_to_application(r) for r in rows]
    finally:
        conn.close()


@app.get("/applications/{app_id}")
def get_application(app_id: str) -> Application:
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Application not found")
        return row_to_application(row)
    finally:
        conn.close()


@app.post("/applications")
def create_application(payload: ApplicationCreate) -> Application:
    app_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO applications (
                id, company, position, applied_date, stage, status, location, salary, job_url, notes, interview_prep, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                app_id,
                payload.company,
                payload.position,
                payload.appliedDate,
                payload.stage,
                payload.status,
                payload.location,
                payload.salary,
                payload.jobUrl,
                payload.notes,
                None,
                now,
                now,
            ),
        )
        conn.commit()
        cur = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        return row_to_application(cur.fetchone())
    finally:
        conn.close()


@app.put("/applications/{app_id}")
def update_application(app_id: str, payload: ApplicationUpdate) -> Application:
    conn = get_db_connection()
    try:
        # Ensure exists
        cur = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Application not found")

        # Build dynamic update
        fields = []
        values = []
        mapping = {
            "company": payload.company,
            "position": payload.position,
            "applied_date": payload.appliedDate,
            "stage": payload.stage,
            "status": payload.status,
            "location": payload.location,
            "salary": payload.salary,
            "job_url": payload.jobUrl,
            "notes": payload.notes,
        }
        for column, value in mapping.items():
            if value is not None:
                fields.append(f"{column} = ?")
                values.append(value)
        fields.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(app_id)
        conn.execute(f"UPDATE applications SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
        cur = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        return row_to_application(cur.fetchone())
    finally:
        conn.close()


@app.delete("/applications/{app_id}")
def delete_application(app_id: str) -> dict:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM applications WHERE id = ?", (app_id,))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@app.post("/applications/{app_id}/interview-prep")
def add_interview_prep(app_id: str, payload: InterviewPrepRequest) -> Application:
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT interview_prep FROM applications WHERE id = ?", (app_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Application not found")
        import json

        existing = []
        if row["interview_prep"]:
            try:
                existing = json.loads(row["interview_prep"]) or []
            except Exception:
                existing = []
        new_note = {
            "title": payload.title,
            "content": payload.content,
            "createdAt": datetime.utcnow().isoformat(),
        }
        existing.append(new_note)
        conn.execute(
            "UPDATE applications SET interview_prep = ?, updated_at = ? WHERE id = ?",
            (json.dumps(existing), datetime.utcnow().isoformat(), app_id),
        )
        conn.commit()
        cur = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        return row_to_application(cur.fetchone())
    finally:
        conn.close()

@app.post("/parse-job")
def parse_job(req: ParseRequest):
    url = str(req.url)
    
    # Detect site from URL
    site_name = None
    if "linkedin.com" in url:
        site_name = "linkedin"
    elif "indeed.com" in url:
        site_name = "indeed"
    elif "glassdoor.com" in url:
        site_name = "glassdoor"
    elif "ziprecruiter.com" in url:
        site_name = "zip_recruiter"
    elif "google.com" in url:
        site_name = "google"
    
    if not site_name:
        return {"title": None, "company": None, "location": None, "salary": None, "error": "Unsupported site"}
    
    try:
        # Try JobSpy with site-specific scraping
        results = scrape_jobs(
            site_name=[site_name],
            search_term="",  # Empty search term
            location="",     # Empty location
            results_wanted=1,
            hours_old=None,
            linkedin_fetch_description=True if site_name == "linkedin" else False,
            verbose=0,
        )
        
        if len(results) == 0:
            return {"title": None, "company": None, "location": None, "salary": None, "error": "No results found"}
            
        row = results.iloc[0].to_dict()
        return {
            "title": row.get("title"),
            "company": row.get("company"),
            "location": row.get("city") or row.get("location"),
            "salary": (
                f"${row.get('min_amount')}-{row.get('max_amount')}" if row.get("min_amount") and row.get("max_amount") else None
            ),
            "compensation": row.get("interval"),
            "job_url": row.get("job_url") or url,
        }
    except Exception as e:
        return {"title": None, "company": None, "location": None, "salary": None, "error": str(e)}

@app.post("/search-jobs")
def search_jobs(req: SearchRequest):
    try:
        print(f"Searching for: {req.search_term} in {req.location}")
        print(f"Sites: {req.site_name}")
        
        # Use all job sites with more results
        results = scrape_jobs(
            site_name=req.site_name,  # Use requested sites
            search_term=req.search_term,
            location=req.location,
            results_wanted=req.results_wanted,  # Use requested number
            hours_old=req.hours_old,  # Use requested time range
            linkedin_fetch_description=True,  # Enable for better data
            verbose=1,  # Reduce logging noise
        )
        
        print(f"Found {len(results)} results")
        print(f"Results columns: {list(results.columns) if len(results) > 0 else 'No results'}")
        
        if len(results) == 0:
            return {"jobs": [], "total": 0, "message": "No jobs found"}
        
        # Convert to list of dicts, cleaning NaN values
        jobs = []
        for _, row in results.iterrows():
            # Helper function to clean NaN values
            def clean_value(value):
                if value is None or (isinstance(value, float) and str(value) == 'nan'):
                    return None
                return value
            
            # Clean salary values
            min_amount = clean_value(row.get("min_amount"))
            max_amount = clean_value(row.get("max_amount"))
            
            job = {
                "title": clean_value(row.get("title")) or "Unknown Title",
                "company": clean_value(row.get("company")) or "Unknown Company",
                "location": clean_value(row.get("city")) or clean_value(row.get("location")) or "Unknown Location",
                "salary": (
                    f"${int(min_amount)}-{int(max_amount)}" 
                    if min_amount and max_amount and not str(min_amount) == 'nan' and not str(max_amount) == 'nan'
                    else None
                ),
                "job_url": clean_value(row.get("job_url")) or "",
                "site": clean_value(row.get("site")) or "indeed",
                "date_posted": clean_value(row.get("date_posted")),
                "description": clean_value(row.get("description"))[:200] + "..." if clean_value(row.get("description")) else None,
            }
            jobs.append(job)
        
        return {"jobs": jobs, "total": len(jobs)}
        
    except Exception as e:
        print(f"Error in search_jobs: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"jobs": [], "total": 0, "error": str(e)}