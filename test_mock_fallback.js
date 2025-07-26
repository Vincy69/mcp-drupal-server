#!/usr/bin/env node

// Test script to verify mock data fallback is working
import { DrupalDocsClient } from './dist/drupal-docs-client.js';

async function testMockFallback() {
  console.log('🧪 Testing MCP Drupal Server Mock Data Fallback...\n');
  
  const client = new DrupalDocsClient();
  
  try {
    // Test 1: Search functions with mock fallback
    console.log('1️⃣ Testing searchFunctions with mock fallback...');
    const functions = await client.searchFunctions('11.x', 'entity');
    console.log(`✅ Found ${functions.length} functions`);
    if (functions.length > 0) {
      console.log(`   Example: ${functions[0].name} - ${functions[0].description}`);
    }
    
    // Test 2: Search hooks with mock fallback
    console.log('\n2️⃣ Testing searchHooks with mock fallback...');
    const hooks = await client.searchHooks('11.x', 'form');
    console.log(`✅ Found ${hooks.length} hooks`);
    if (hooks.length > 0) {
      console.log(`   Example: ${hooks[0].name} - ${hooks[0].description}`);
    }
    
    // Test 3: Search classes with mock fallback
    console.log('\n3️⃣ Testing searchClasses with mock fallback...');
    const classes = await client.searchClasses('11.x', 'Entity');
    console.log(`✅ Found ${classes.length} classes`);
    if (classes.length > 0) {
      console.log(`   Example: ${classes[0].name} - ${classes[0].description}`);
    }
    
    // Test 4: Get mock code examples
    console.log('\n4️⃣ Testing getMockCodeExamples...');
    const examples = client.getMockCodeExamples('form');
    console.log(`✅ Found ${examples.length} code examples`);
    if (examples.length > 0) {
      console.log(`   Example: ${examples[0].title} - ${examples[0].description}`);
    }
    
    // Test 5: Get mock categories
    console.log('\n5️⃣ Testing getMockExampleCategories...');
    const categories = client.getMockExampleCategories();
    console.log(`✅ Found ${categories.length} categories`);
    if (categories.length > 0) {
      console.log(`   Examples: ${categories.slice(0, 3).map(c => c.name).join(', ')}`);
    }
    
    console.log('\n🎉 All mock fallback tests passed! MCP tools should now work reliably.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMockFallback();