// Run data types for Kozan AI Dashboard

export interface Run {
  id: string;
  name: string;
  timestamp: Date;
  status: 'draft' | 'locked' | 'completed' | 'archived';
  inputImages: {
    model?: { type: 'model', path: string, filename: string };
    clothing?: { type: 'clothing', path: string, filename: string };  
    person?: { type: 'person', path: string, filename: string };
  };
  aiSettings?: {
    huhu?: Record<string, unknown>;
    fashn?: Record<string, unknown>;
    fitroom?: Record<string, unknown>;
  };
  lockedAt?: Date;
  results?: RunResult[];
  metadata?: Record<string, unknown>;
}

export interface RunResult {
  id: string;
  service: 'huhu' | 'fashn' | 'fitroom';
  version: number;
  imagePath: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  error?: string;
  duration?: number;
}

export interface RunSummary {
  id: string;
  name: string;
  timestamp: Date;
  status: 'draft' | 'locked' | 'completed' | 'archived';
  totalResults: number;
  lastActivity: Date;
  hasInputImages: boolean;
  isLocked: boolean;
}

export interface CreateRunRequest {
  name?: string;
  inputImages?: {
    model?: { type: 'model', path: string, filename: string };
    clothing?: { type: 'clothing', path: string, filename: string };
    person?: { type: 'person', path: string, filename: string };
  };
}

export interface UpdateRunRequest {
  name?: string;
  status?: 'draft' | 'locked' | 'completed' | 'archived';
  inputImages?: {
    model?: { type: 'model', path: string, filename: string };
    clothing?: { type: 'clothing', path: string, filename: string };
    person?: { type: 'person', path: string, filename: string };
  };
  aiSettings?: {
    huhu?: Record<string, unknown>;
    fashn?: Record<string, unknown>;
    fitroom?: Record<string, unknown>;
  };
  lockedAt?: Date;
}

// Mock data interfaces for development
export interface MockRun extends Run {
  _isMock: true;
}

export interface MockRunResult extends RunResult {
  _isMock: true;
}