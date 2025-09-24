import { useState } from 'react';
import { Search, MapPin, Building, DollarSign, ExternalLink, Plus, Clock } from 'lucide-react';
import { useCreateJobApplication } from '../hooks/useJobApplications';

interface JobResult {
  title: string;
  company: string;
  location: string;
  salary?: string;
  job_url: string;
  site: string;
  date_posted?: string;
  description?: string;
}

interface SearchResponse {
  jobs: JobResult[];
  total: number;
  error?: string;
}

export function Discover() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingJob, setAddingJob] = useState<string | null>(null);
  
  const createJob = useCreateJobApplication();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const apiBase = (import.meta as any).env?.VITE_PARSE_API_URL as string | undefined;
      if (!apiBase) {
        throw new Error('Search API not configured. Add VITE_PARSE_API_URL to .env');
      }
      
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/search-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_term: searchTerm,
          location: location,
          results_wanted: 40,
          site_name: ['linkedin', 'indeed', 'glassdoor', 'zip_recruiter']
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResults(data.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddJob = async (job: JobResult) => {
    setAddingJob(job.job_url);
    
    try {
      await createJob.mutateAsync({
        company: job.company,
        position: job.title,
        appliedDate: new Date().toISOString().split('T')[0],
        stage: 'applied',
        status: 'active',
        location: job.location,
        salary: job.salary,
        jobUrl: job.job_url,
        notes: `Found on ${job.site} - ${job.description || ''}`,
      });
    } catch (err) {
      console.error('Failed to add job:', err);
    } finally {
      setAddingJob(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Jobs</h1>
          <p className="text-gray-600">Search for jobs across LinkedIn, Indeed, Glassdoor, and ZipRecruiter</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., Software Engineer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search Jobs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Found {results.length} jobs
            </h2>
          </div>
        )}

        <div className="grid gap-6">
          {results.map((job, index) => (
            <div key={`${job.job_url}-${index}`} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {job.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                    )}
                    {job.date_posted && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(job.date_posted)}
                      </div>
                    )}
                  </div>
                  
                  {job.description && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                      {job.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {job.site}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Job
                  </a>
                  
                  <button
                    onClick={() => handleAddJob(job)}
                    disabled={addingJob === job.job_url}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
                  >
                    {addingJob === job.job_url ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to List
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !isSearching && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for jobs</h3>
            <p className="text-gray-600">Enter a job title and location to find opportunities</p>
          </div>
        )}
      </div>
    </div>
  );
}
