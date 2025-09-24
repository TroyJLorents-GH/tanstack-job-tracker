# server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from jobspy import scrape_jobs

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
    site_name: list = ["linkedin", "indeed", "glassdoor", "zip_recruiter"]

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
            hours_old=72,  # Last 3 days
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