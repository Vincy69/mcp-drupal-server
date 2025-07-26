#!/usr/bin/env node

// Test spécifique pour les outils d'exemples de code
import { DrupalDynamicExamples } from './dist/drupal-dynamic-examples.js';
import { DrupalDocsClient } from './dist/drupal-docs-client.js';

async function testExamplesTools() {
  console.log('🧪 Test spécifique des outils d\'exemples de code...\n');
  
  const examplesClient = new DrupalDynamicExamples();
  const docsClient = new DrupalDocsClient();
  
  const tests = [
    {
      name: 'search_code_examples (empty query)',
      test: async () => {
        const examples = await examplesClient.searchExamples('');
        return examples.length > 0 ? `✅ Found ${examples.length} examples` : '❌ No examples found';
      }
    },
    {
      name: 'search_code_examples (form query)',
      test: async () => {
        const examples = await examplesClient.searchExamples('form');
        return examples.length > 0 ? `✅ Found ${examples.length} examples` : '❌ No examples found';
      }
    },
    {
      name: 'list_example_categories',
      test: async () => {
        const categories = await examplesClient.getCategories();
        return categories.length > 0 ? `✅ Found ${categories.length} categories` : '❌ No categories found';
      }
    },
    {
      name: 'get_examples_by_category',
      test: async () => {
        const examples = await examplesClient.getExamplesByCategory('forms');
        return examples.length > 0 ? `✅ Found ${examples.length} form examples` : '❌ No form examples found';
      }
    },
    {
      name: 'get_examples_by_tag',
      test: async () => {
        const examples = await examplesClient.getExamplesByTag('form');
        return examples.length > 0 ? `✅ Found ${examples.length} tagged examples` : '❌ No tagged examples found';
      }
    },
    {
      name: 'mock fallback direct test',
      test: async () => {
        const mockExamples = docsClient.getMockCodeExamples('form');
        return mockExamples.length > 0 ? `✅ Mock data: ${mockExamples.length} examples` : '❌ Mock data failed';
      }
    },
    {
      name: 'mock categories direct test',
      test: async () => {
        const mockCategories = docsClient.getMockExampleCategories();
        return mockCategories.length > 0 ? `✅ Mock categories: ${mockCategories.length} categories` : '❌ Mock categories failed';
      }
    }
  ];

  let success = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🔍 Testing ${test.name}...`);
    try {
      const result = await test.test();
      console.log(`   ${result}`);
      if (result.includes('✅')) success++;
      else failed++;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('📊 RAPPORT SPÉCIFIQUE - OUTILS D\'EXEMPLES');
  console.log('===========================================');
  console.log(`✅ Tests réussis: ${success}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📊 Taux de réussite: ${Math.round((success / tests.length) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 TOUS LES OUTILS D\'EXEMPLES FONCTIONNENT !');
    console.log('Les problèmes signalés sont maintenant corrigés.');
  } else {
    console.log('⚠️  Certains outils ont encore des problèmes.');
  }

  return failed === 0;
}

testExamplesTools()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erreur lors du test:', error);
    process.exit(1);
  });