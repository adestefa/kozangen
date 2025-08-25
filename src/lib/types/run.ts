// Run data types for Kozan AI Dashboard

export interface Run {
  id: string;
  name: string;
  timestamp: Date;
  status: 'active' | 'completed' | 'archived';
  inputImages: {
    model?: string;
    clothing?: string;  
    person?: string;
  };
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
  status: 'active' | 'completed' | 'archived';
  totalResults: number;
  lastActivity: Date;
}

export interface CreateRunRequest {
  name?: string;
  inputImages?: {
    model?: string;
    clothing?: string;
    person?: string;
  };
}

export interface UpdateRunRequest {
  name?: string;
  status?: 'active' | 'completed' | 'archived';
  inputImages?: {
    model?: string;
    clothing?: string;
    person?: string;
  };
}

// Mock data interfaces for development
export interface MockRun extends Run {
  _isMock: true;
}

export interface MockRunResult extends RunResult {
  _isMock: true;
}