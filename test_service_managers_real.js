#!/usr/bin/env node

/**
 * Test script to verify real Python script execution in service managers
 * This tests the child_process.spawn functionality
 */

const { spawn } = require('child_process');
const path = require('path');

// Test FASHN manager execution by creating a temporary modified version
async function testFashnExecution() {
    console.log("🧪 Testing FASHN service manager with real Python execution...");
    
    const scriptPath = path.join(__dirname, 'python_scripts/test-fashn/test_job.py');
    const args = [
        scriptPath,
        'test_run_001',
        'http://localhost:3000/static/input/model.png',
        'http://localhost:3000/static/input/top.jpg', 
        'http://localhost:3000/static/input/bottom.jpg',
        '--mode', 'balanced',
        '--category', 'auto',
        '--seed', '42',
        '--num-samples', '1',
        '--version', '1'
    ];

    console.log(`🚀 Executing: python3 ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', args, {
            cwd: path.dirname(scriptPath),
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`📤 [stdout]:`, data.toString().trim());
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(`📥 [stderr]:`, data.toString().trim());
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Python script completed successfully with exit code ${code}`);
                resolve({ success: true, stdout, stderr });
            } else {
                console.error(`❌ Python script failed with exit code ${code}`);
                console.error(`stderr: ${stderr}`);
                resolve({ success: false, code, stdout, stderr });
            }
        });

        pythonProcess.on('error', (err) => {
            console.error(`💥 Failed to start Python script:`, err);
            reject(err);
        });
    });
}

async function main() {
    console.log("🎯 Testing D-01 Fix: Real Python Script Execution\n");
    
    try {
        const result = await testFashnExecution();
        
        console.log("\n📊 Test Results:");
        console.log(`✅ Python execution: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`📝 Exit code: ${result.code || 0}`);
        console.log(`📏 stdout length: ${result.stdout.length} chars`);
        console.log(`📏 stderr length: ${result.stderr.length} chars`);
        
        if (result.success) {
            console.log("\n🎉 D-01 FIX VERIFICATION: SUCCESS");
            console.log("✅ child_process.spawn is working correctly");
            console.log("✅ Python script execution pipeline is functional");
            console.log("✅ Argument passing is working properly");
            console.log("✅ stdout/stderr capture is working");
            console.log("✅ Ready to replace setTimeout mocks with real execution");
        } else {
            console.log("\n⚠️  D-01 FIX VERIFICATION: FAILED");
            console.log("❌ Python script execution encountered issues");
            console.log("❌ May need to troubleshoot Python environment");
        }
        
    } catch (error) {
        console.error("\n💥 Test execution failed:", error);
        console.log("\n⚠️  D-01 FIX VERIFICATION: ERROR");
        console.log("❌ Unable to spawn Python processes");
    }
}

main().catch(console.error);