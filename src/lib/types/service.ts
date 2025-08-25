// Service-specific types for Kozan AI Dashboard

export type ServiceType = 'huhu' | 'fashn' | 'fitroom';

export type ServiceAction = 'generate' | 'regenerate';

export interface ServiceCall {
  id: string;                         // Unique call identifier
  service: ServiceType;
  action: ServiceAction;
  timestamp: Date;                    // Call initiation time
  parameters: Record<string, unknown>;    // Service-specific parameters
  status: 'pending' | 'success' | 'error';
  duration?: number;                  // Call duration in milliseconds
  error?: string;                     // Error message if failed
  resultPath?: string;                // Path to generated result
  runId: string;                      // Associated run identifier
}

export interface ServiceResult {
  id: string;
  service: ServiceType;
  runId: string;
  version: number;
  imagePath: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  status: 'success' | 'error';
  error?: string;
}

export interface ServiceConfig {
  service: ServiceType;
  enabled: boolean;
  scriptPath: string;
  defaultParameters: Record<string, unknown>;
}

// HuHu-specific types (based on HuHu API v1 documentation)
export interface HuHuParameters {
  model_image: string;        // Original model image URL
  top_garment: string;        // Top garment image URL  
  bottom_garment: string;     // Bottom garment image URL
  model_type?: 'SD_V1' | 'SD_V2' | 'SD_V3' | 'HD';
  repaint_other_garment?: boolean;
  repaint_hands?: boolean;
  repaint_feet?: boolean;
}

// FASHN-specific types (based on FASHN API v1.6 documentation)
export interface FashnParameters {
  model_image: string;        // Original model image URL
  top_garment: string;        // Top garment image URL
  bottom_garment: string;     // Bottom garment image URL
  mode?: 'performance' | 'balanced' | 'quality';
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  seed?: number;
  num_samples?: number;
}

// FitRoom-specific types (based on FitRoom API v2 documentation)
export interface FitRoomParameters {
  model_image: string;        // Original model image file
  top_garment: string;        // Top garment image file (cloth_image)
  bottom_garment: string;     // Bottom garment image file (lower_cloth_image)
  cloth_type?: 'combo';       // Always 'combo' for full outfit
  hd_mode?: boolean;          // High-definition mode
}

export type ServiceParameters = HuHuParameters | FashnParameters | FitRoomParameters;