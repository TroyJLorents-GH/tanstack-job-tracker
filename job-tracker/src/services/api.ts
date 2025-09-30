// src/services/api.ts
import type { JobApplication, JobApplicationFormData } from '../types/job';

function getApiBase(): string {
  const raw = (import.meta as any).env?.VITE_PARSE_API_URL as string | undefined;
  if (!raw) {
    // Avoid throwing at module-load time to prevent Vite import errors.
    throw new Error('VITE_PARSE_API_URL not configured');
  }
  return raw.replace(/\/$/, '');
}

export const api = {
  async getJobApplications(): Promise<JobApplication[]> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications`);
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },

  async getJobApplication(id: string): Promise<JobApplication> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications/${id}`);
    if (!res.ok) throw new Error('Failed to fetch application');
    return res.json();
  },

  async createJobApplication(data: JobApplicationFormData): Promise<JobApplication> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create application');
    return res.json();
  },

  async updateJobApplication(id: string, data: Partial<JobApplicationFormData>): Promise<JobApplication> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
  },

  async deleteJobApplication(id: string): Promise<void> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete application');
  },

  async addInterviewPrep(jobId: string, title: string, content: string): Promise<JobApplication> {
    const base = getApiBase();
    const res = await fetch(`${base}/applications/${jobId}/interview-prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to add interview prep');
    return res.json();
  },
};
