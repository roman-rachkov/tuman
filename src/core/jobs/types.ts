export type JobType = 'delivery';
export type JobStatus = 'pending' | 'assigned' | 'completed' | 'failed';
export type ResourceType = 'food' | 'water' | 'scrap';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  reward: Record<ResourceType, number>;
  targetLocation: string;
  sourceLocation?: string;
  targetResource?: ResourceType;
  amount?: number;
  assignedAgentId?: string;
  createdAt: number;
}
