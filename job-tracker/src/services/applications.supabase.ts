// src/services/applications.supabase.ts
import { supabase } from './supabase';

export type InterviewNote = {
  id?: string; // optional on input, guaranteed on output
  title: string;
  content: string;
  createdAt: string;
};

export type Application = {
  id: string;
  userId?: string;
  company?: string;
  position?: string;
  appliedDate?: string; // yyyy-mm-dd
  stage?: string;
  status?: string;
  location?: string;
  salary?: string;
  jobUrl?: string;
  notes?: string;
  interviewPrep: InterviewNote[];
  createdAt?: string;
  updatedAt?: string;
};

/* ----------------- helpers ----------------- */

// Throw a clear error if the client isn’t initialized
function assertClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// Require an authenticated user and return their id
async function getUserId(): Promise<string> {
  const client = assertClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Not signed in');
  return user.id;
}

// camelCase → snake_case + timestamps
function toDb(a: Partial<Application>) {
  return {
    company: a.company ?? null,
    position: a.position ?? null,
    applied_date: a.appliedDate ?? null,
    stage: a.stage ?? null,
    status: a.status ?? null,
    location: a.location ?? null,
    salary: a.salary ?? null,
    job_url: a.jobUrl ?? null,
    notes: a.notes ?? null,
    // store as JSON (array); default to [] for safety
    interview_prep: a.interviewPrep ?? [],
    updated_at: new Date().toISOString(),
  };
}

// snake_case → camelCase (and normalize types)
function fromDb(r: any): Application {
  return {
    id: r.id,
    userId: r.user_id ?? undefined,
    company: r.company ?? undefined,
    position: r.position ?? undefined,
    appliedDate: r.applied_date ?? undefined,
    stage: r.stage ?? undefined,
    status: r.status ?? undefined,
    location: r.location ?? undefined,
    salary: r.salary ?? undefined,
    jobUrl: r.job_url ?? undefined,
    notes: r.notes ?? undefined,
    interviewPrep: (r.interview_prep as InterviewNote[]) ?? [],
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

/* ----------------- API ----------------- */

export const applicationsApi = {
  async list(): Promise<Application[]> {
    const client = assertClient();
    const userId = await getUserId();

    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('user_id', userId) // explicit filter in addition to RLS
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(fromDb);
  },

  async get(id: string): Promise<Application> {
    const client = assertClient();
    const userId = await getUserId();

    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async create(a: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const client = assertClient();
    const userId = await getUserId();

    const insert = { ...toDb(a), user_id: userId };

    const { data, error } = await client
      .from('applications')
      .insert(insert)
      .select('*')
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async update(id: string, patch: Partial<Application>): Promise<Application> {
    const client = assertClient();
    const userId = await getUserId();

    const upd = toDb(patch);

    const { data, error } = await client
      .from('applications')
      .update(upd)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async remove(id: string): Promise<void> {
    const client = assertClient();
    const userId = await getUserId();

    const { error } = await client
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async addInterviewPrep(id: string, title: string, content: string): Promise<Application> {
    const client = assertClient();
    const userId = await getUserId();

    // fetch existing notes for this row (and this user)
    const { data: row, error } = await client
      .from('applications')
      .select('interview_prep')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const newNote: InterviewNote = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    const next = ([...(row?.interview_prep ?? [])] as InterviewNote[]).concat(newNote);

    const { data, error: uerr } = await client
      .from('applications')
      .update({ interview_prep: next, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (uerr) throw uerr;
    return fromDb(data);
  },
};
