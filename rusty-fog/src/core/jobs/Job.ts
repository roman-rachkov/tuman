export type JobType = 'delivery' | 'repair' | 'elimination' | 'scouting' | 'guard' | 'sabotage';
export type JobStatus = 'pending' | 'assigned' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  reward: Map<string, number>;
  targetLocation: string;
  targetResource?: string;
  sourceLocation?: string;
  expiresAt?: number;
  requiredSkills?: Partial<{ repair: number; combat: number; stealth: number }>;
}

export function createJob(
  id: string,
  type: JobType,
  targetLocation: string,
  reward: Map<string, number> = new Map()
): Job {
  return {
    id,
    type,
    status: 'pending',
    reward,
    targetLocation,
  };
}
