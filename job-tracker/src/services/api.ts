import { JobApplication, JobApplicationFormData } from '../types/job';

// Mock data storage
const jobApplications: JobApplication[] = [
  {
    id: '1',
    company: 'Google',
    position: 'Senior Software Engineer',
    appliedDate: '2024-01-15',
    stage: 'technical_interview',
    status: 'active',
    salary: '$150,000 - $200,000',
    location: 'Mountain View, CA',
    jobUrl: 'https://careers.google.com/jobs/results/123',
    notes: 'Great opportunity, excited about the team',
    interviewPrep: [
      {
        id: '1',
        title: 'System Design Questions',
        content: 'Review distributed systems, scalability patterns',
        createdAt: '2024-01-16'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '2',
    company: 'Microsoft',
    position: 'Full Stack Developer',
    appliedDate: '2024-01-10',
    stage: 'phone_screen',
    status: 'active',
    salary: '$120,000 - $160,000',
    location: 'Seattle, WA',
    jobUrl: 'https://careers.microsoft.com/jobs/456',
    notes: 'Good company culture, interesting tech stack',
    interviewPrep: [],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z'
  },
  {
    id: '3',
    company: 'Apple',
    position: 'iOS Developer',
    appliedDate: '2024-01-05',
    stage: 'rejected',
    status: 'inactive',
    salary: '$130,000 - $180,000',
    location: 'Cupertino, CA',
    jobUrl: 'https://jobs.apple.com/en-us/details/789',
    notes: 'Didn\'t pass the technical interview',
    interviewPrep: [],
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Get all job applications
  async getJobApplications(): Promise<JobApplication[]> {
    await delay(500);
    return [...jobApplications];
  },

  // Get a single job application
  async getJobApplication(id: string): Promise<JobApplication | null> {
    await delay(300);
    return jobApplications.find(job => job.id === id) || null;
  },

  // Create a new job application
  async createJobApplication(data: JobApplicationFormData): Promise<JobApplication> {
    await delay(400);
    const newJob: JobApplication = {
      id: Date.now().toString(),
      ...data,
      interviewPrep: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    jobApplications.push(newJob);
    return newJob;
  },

  // Update a job application
  async updateJobApplication(id: string, data: Partial<JobApplicationFormData>): Promise<JobApplication> {
    await delay(400);
    const index = jobApplications.findIndex(job => job.id === id);
    if (index === -1) {
      throw new Error('Job application not found');
    }
    
    jobApplications[index] = {
      ...jobApplications[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return jobApplications[index];
  },

  // Delete a job application
  async deleteJobApplication(id: string): Promise<void> {
    await delay(300);
    const index = jobApplications.findIndex(job => job.id === id);
    if (index === -1) {
      throw new Error('Job application not found');
    }
    jobApplications.splice(index, 1);
  },

  // Add interview prep note
  async addInterviewPrep(jobId: string, title: string, content: string): Promise<JobApplication> {
    await delay(300);
    const job = jobApplications.find(j => j.id === jobId);
    if (!job) {
      throw new Error('Job application not found');
    }

    const newPrep = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString()
    };

    job.interviewPrep = [...(job.interviewPrep || []), newPrep];
    job.updatedAt = new Date().toISOString();
    
    return job;
  }
};
