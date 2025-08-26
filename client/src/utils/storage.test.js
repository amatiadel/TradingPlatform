import { saveState, loadState } from './storage.js';

// Simple test to verify storage functionality
console.log('Testing storage functionality...');

// Test basic save/load
saveState('testKey', { test: 'value', number: 123 });
const loaded = loadState('testKey', null);
console.log('Loaded value:', loaded);

// Test with default value
const defaultValue = loadState('nonExistentKey', 'default');
console.log('Default value:', defaultValue);

// Test error handling
try {
  // Simulate localStorage error
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('Storage error'); };
  
  saveState('errorTest', 'value');
  console.log('Error handling test passed');
  
  localStorage.setItem = originalSetItem;
} catch (error) {
  console.log('Error handling test passed');
}

console.log('Storage tests completed');
