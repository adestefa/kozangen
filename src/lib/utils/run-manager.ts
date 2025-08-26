// Run Management Utility - Enhanced version of proven 0816_03 architecture
import fs from 'fs';
import path from 'path';
import https from 'https';

export interface RunMetadata {
  runId: string;
  created: string;
  status: 'draft' | 'processing' | 'completed';
  selections: {
    model_number: number;
    top_number: number;  
    bottom_number: number;
    model_file: string;
    top_file: string;
    bottom_file: string;
  };
  urls: {
    model_url: string;
    top_url: string;
    bottom_url: string;
  };
  services: {
    [service: string]: {
      versions: Array<{
        version: number;
        filename: string;
        timestamp: string;
        settings?: any;
      }>;
      current_version: number;
    };
  };
}

export class RunManager {
  private static resultsDir = path.join(process.cwd(), 'data', 'results');

  /**
   * Generate run ID in MMDD_## format
   */
  static generateRunId(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Find next run number for today
    const datePrefix = `${month}${day}_`;
    const existingRuns = this.getExistingRuns().filter(r => r.startsWith(datePrefix));
    const runNumber = existingRuns.length + 1;
    
    return `${datePrefix}${String(runNumber).padStart(2, '0')}`;
  }

  /**
   * Get existing run folders
   */
  static getExistingRuns(): string[] {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
      return [];
    }
    return fs.readdirSync(this.resultsDir);
  }

  /**
   * Create new run folder and metadata
   */
  static createRun(runData: any): string {
    const runId = this.generateRunId();
    const runDir = path.join(this.resultsDir, runId);
    
    // Create run directory
    fs.mkdirSync(runDir, { recursive: true });
    
    // Create metadata file based on proven pattern
    const metadata: RunMetadata = {
      runId,
      created: new Date().toISOString(),
      status: 'draft',
      selections: {
        model_number: parseInt(runData.inputImages.model.filename.match(/MODEL_(\d+)/)?.[1] || '1'),
        top_number: parseInt(runData.inputImages.clothing.filename.match(/top_(\d+)/)?.[1] || '1'),
        bottom_number: parseInt(runData.inputImages.person.filename.match(/bottom_(\d+)/)?.[1] || '1'),
        model_file: runData.inputImages.model.filename,
        top_file: runData.inputImages.clothing.filename,
        bottom_file: runData.inputImages.person.filename,
      },
      urls: {
        model_url: `http://192.155.91.109:3000/api/static${runData.inputImages.model.path}`,
        top_url: `http://192.155.91.109:3000/api/static${runData.inputImages.clothing.path}`,
        bottom_url: `http://192.155.91.109:3000/api/static${runData.inputImages.person.path}`,
      },
      services: {}
    };
    
    this.saveMetadata(runId, metadata);
    return runId;
  }

  /**
   * Download image from URL and save with versioning
   */
  static async downloadImage(
    imageUrl: string, 
    runId: string, 
    service: string, 
    version: number = 1
  ): Promise<string> {
    const runDir = path.join(this.resultsDir, runId);
    const metadata = this.getMetadata(runId);
    
    // Generate filename using proven pattern: outfit_1_model_2_fitroom_v2.png
    const baseFilename = `outfit_${metadata.selections.top_number}_model_${metadata.selections.model_number}_${service}`;
    const filename = version === 1 ? `${baseFilename}.png` : `${baseFilename}_v${version}.png`;
    const filepath = path.join(runDir, filename);
    
    // Create temp file first (chmod 777 as Anthony suggested)
    const tempFile = path.join('/tmp', `temp_${Date.now()}_${filename}`);
    
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFile);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          // Set permissions and move to final location
          fs.chmodSync(tempFile, 0o777);
          fs.renameSync(tempFile, filepath);
          resolve(filepath);
        });
      }).on('error', reject);
    });
    
    return filename;
  }

  /**
   * Add service result with version tracking
   */
  static addServiceResult(
    runId: string, 
    service: string, 
    filename: string, 
    settings?: any
  ): number {
    const metadata = this.getMetadata(runId);
    
    if (!metadata.services[service]) {
      metadata.services[service] = {
        versions: [],
        current_version: 0
      };
    }
    
    const version = metadata.services[service].versions.length + 1;
    metadata.services[service].versions.push({
      version,
      filename,
      timestamp: new Date().toISOString(),
      settings
    });
    metadata.services[service].current_version = version;
    
    this.saveMetadata(runId, metadata);
    return version;
  }

  /**
   * Get run metadata
   */
  static getMetadata(runId: string): RunMetadata {
    const metadataPath = path.join(this.resultsDir, runId, 'run_metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Run metadata not found for ${runId}`);
    }
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }

  /**
   * Save run metadata
   */
  static saveMetadata(runId: string, metadata: RunMetadata): void {
    const metadataPath = path.join(this.resultsDir, runId, 'run_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }
}