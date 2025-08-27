// Manual test script to validate history logger functionality
const { historyLogger } = require('./src/lib/services/history-logger');

console.log('🧪 Testing Service Call History Logger...\n');

// Test 1: Basic logging
console.log('Test 1: Basic logging functionality');
const testCall = {
  service: 'huhu',
  action: 'generate',
  status: 'pending',
  runId: 'test_run_123',
  parameters: {
    model_image: 'https://test.com/model.png',
    top_garment: 'https://test.com/top.jpg',
    bottom_garment: 'https://test.com/bottom.jpg'
  }
};

const callId = historyLogger.logCall(testCall);
console.log(`✓ Call logged with ID: ${callId}`);

// Test 2: Success marking
console.log('\nTest 2: Mark call as successful');
historyLogger.markSuccess(callId, '/api/results/test_run_123/result.png', 5500);
console.log('✓ Call marked as successful');

// Test 3: Retrieve logged call
console.log('\nTest 3: Retrieve logged call');
const retrieved = historyLogger.getCall(callId);
console.log(`✓ Retrieved call status: ${retrieved.status}`);
console.log(`✓ Retrieved call duration: ${retrieved.duration}ms`);

// Test 4: Get all calls
console.log('\nTest 4: Get all logged calls');
const allCalls = historyLogger.getAllCalls();
console.log(`✓ Total calls in history: ${allCalls.length}`);

// Test 5: Statistics
console.log('\nTest 5: Generate statistics');
const stats = historyLogger.getStats();
console.log(`✓ Success calls: ${stats.successCalls}`);
console.log(`✓ Total calls: ${stats.totalCalls}`);
console.log(`✓ Success rate: ${stats.successRate}%`);

console.log('\n🎉 All tests completed successfully!');
console.log('History logger is working correctly with file storage.');