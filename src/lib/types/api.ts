// API response types for Kozan AI Dashboard

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API request types
export interface GenerateRequest {
  runId: string;
  service: 'huhu' | 'fashn' | 'fitroom';
  parameters: Record<string, unknown>;
  inputImages: {
    model: string;
    clothing: string;
    person: string;
  };
}

export interface RegenerateRequest extends GenerateRequest {
  version?: number;
}

// API response types
export interface GenerateResponse {
  callId: string;
  runId: string;
  service: string;
  status: 'started' | 'completed' | 'error';
  resultPath?: string;
  version?: number;
  parameters?: Record<string, unknown>;
  processingTime?: string;
  workflow?: string;
  error?: string;
}

export interface RunListResponse {
  runs: Array<{
    id: string;
    name: string;
    timestamp: string;
    status: 'active' | 'completed' | 'archived';
    totalResults: number;
    lastActivity: string;
  }>;
}

export interface ImageListResponse {
  images: Array<{
    filename: string;
    path: string;
    type: 'model' | 'clothing' | 'person' | 'top' | 'bottom';
    size: number;
    lastModified: string;
  }>;
}