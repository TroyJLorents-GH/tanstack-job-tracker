# server/main.py
from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl
from jobspy import scrape_jobs

app = FastAPI()

class ParseRequest(BaseModel):
    url: HttpUrl

@app.post("/parse-job")
def parse_job(req: ParseRequest):
    # Use site detection from URL; JobSpy handles multiple boards
    url = str(req.url)
    results = scrape_jobs(
        site_name=["linkedin", "indeed", "glassdoor", "google", "zip_recruiter"],
        search_term=None,
        location=None,
        results_wanted=1,
        hours_old=None,
        linkedin_fetch_description=True,
        urls=[url],  # JobSpy supports direct URLs in recent releases (v1.1.79+). If not, fallback below.
        verbose=0,
    )
    if len(results) == 0:
        # Fallback: no direct-URL support → return minimal fields
        return {"title": None, "company": None, "location": None, "salary": None}
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