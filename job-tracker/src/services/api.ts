// src/services/api.ts
import type { JobApplication, JobApplicationFormData } from '../types/job';
import { applicationsApi, type Application } from './applications.supabase';

// map Supabase Application → UI JobApplication
function fromApp(a: Application): JobApplication {
  return {
    id: a.id,
    company: a.company ?? '',
    position: a.position ?? '',
    appliedDate: a.appliedDate ?? '',
    stage: (a.stage ?? 'applied') as JobApplication['stage'],
    status: (a.status ?? 'active') as JobApplication['status'],
    location: a.location ?? '',
    salary: a.salary,
    jobUrl: a.jobUrl,
    notes: a.notes,
    interviewPrep: a.interviewPrep,   // 👈 already strongly typed
    createdAt: a.createdAt ?? new Date().toISOString(),
    updatedAt: a.updatedAt ?? new Date().toISOString(),
  };
}

// map UI JobApplicationFormData → Supabase Application
function toApp(d: Partial<JobApplicationFormData>): Partial<Application> {
  return {
    company: d.company,
    position: d.position,
    appliedDate: d.appliedDate,
    stage: d.stage,
    status: d.status,
    location: d.location,
    salary: d.salary,
    jobUrl: d.jobUrl,
    notes: d.notes,
    interviewPrep: d.interviewPrep,
  };
}

export const api = {
  async getJobApplications(): Promise<JobApplication[]> {
    const rows = await applicationsApi.list();
    return rows.map(fromApp);
  },

  async getJobApplication(id: string): Promise<JobApplication> {
    const row = await applicationsApi.get(id);
    return fromApp(row);
  },

  async createJobApplication(data: JobApplicationFormData): Promise<JobApplication> {
    const row = await applicationsApi.create(toApp(data) as Omit<Application, 'id'>);
    return fromApp(row);
  },

  async updateJobApplication(id: string, patch: Partial<JobApplicationFormData>): Promise<JobApplication> {
    const row = await applicationsApi.update(id, toApp(patch));
    return fromApp(row);
  },

  async deleteJobApplication(id: string): Promise<void> {
    await applicationsApi.remove(id);
  },

  async addInterviewPrep(id: string, title: string, content: string): Promise<JobApplication> {
    const row = await applicationsApi.addInterviewPrep(id, title, content);
    return fromApp(row);
  },
};
