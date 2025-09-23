import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { JobApplicationFormData } from '../types/job';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: string) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

// Get all job applications
export const useJobApplications = () => {
  return useQuery({
    queryKey: jobKeys.lists(),
    queryFn: api.getJobApplications,
  });
};

// Get a single job application
export const useJobApplication = (id: string) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.getJobApplication(id),
    enabled: !!id,
  });
};

// Create job application mutation
export const useCreateJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: JobApplicationFormData) => api.createJobApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
};

// Update job application mutation
export const useUpdateJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobApplicationFormData> }) =>
      api.updateJobApplication(id, data),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(updatedJob.id) });
    },
  });
};

// Delete job application mutation
export const useDeleteJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteJobApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
};

// Add interview prep mutation
export const useAddInterviewPrep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, title, content }: { jobId: string; title: string; content: string }) =>
      api.addInterviewPrep(jobId, title, content),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(updatedJob.id) });
    },
  });
};
