#!/usr/bin/env python3
"""
Test FASHN Python script for testing child_process.spawn execution
This script simulates the FASHN service for testing purposes
"""

import sys
import time
import os
import argparse
from datetime import datetime

def main():
    print(f"[FASHN Test] Starting execution at {datetime.now()}")
    print(f"[FASHN Test] Arguments received: {sys.argv}")
    
    if len(sys.argv) < 5:
        print("[FASHN Test] ERROR: Not enough arguments provided")
        print("[FASHN Test] Expected: script_path run_id model_image top_garment bottom_garment [options]")
        sys.exit(1)
    
    # Parse basic arguments
    script_path = sys.argv[0]
    run_id = sys.argv[1]  
    model_image = sys.argv[2]
    top_garment = sys.argv[3]
    bottom_garment = sys.argv[4]
    
    print(f"[FASHN Test] Run ID: {run_id}")
    print(f"[FASHN Test] Model Image: {model_image}")
    print(f"[FASHN Test] Top Garment: {top_garment}")
    print(f"[FASHN Test] Bottom Garment: {bottom_garment}")
    
    # Parse optional arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', default='balanced')
    parser.add_argument('--category', default='auto')
    parser.add_argument('--seed', type=int, default=0)
    parser.add_argument('--num-samples', type=int, default=1)
    parser.add_argument('--version', type=int, default=1)
    
    # Skip the first 5 positional arguments
    optional_args = sys.argv[5:]
    args = parser.parse_args(optional_args)
    
    print(f"[FASHN Test] Mode: {args.mode}")
    print(f"[FASHN Test] Category: {args.category}")
    print(f"[FASHN Test] Seed: {args.seed}")
    print(f"[FASHN Test] Version: {args.version}")
    
    # Simulate processing time
    print("[FASHN Test] Step 1: Processing top garment...")
    time.sleep(1)
    
    print("[FASHN Test] Step 2: Processing bottom garment...")
    time.sleep(1)
    
    print("[FASHN Test] Finalizing output...")
    time.sleep(0.5)
    
    # Simulate creating output directory structure
    output_dir = f"/tmp/results/{run_id}/fashn"
    print(f"[FASHN Test] Would create output directory: {output_dir}")
    print(f"[FASHN Test] Would save result to: {output_dir}/result_v{args.version}.png")
    
    print(f"[FASHN Test] Processing completed successfully at {datetime.now()}")
    print(f"[FASHN Test] Total processing time: ~2.5 seconds")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())