#!/usr/bin/env node

/**
 * Script de test de connexion Drupal
 * Usage: node scripts/test-connection.js
 */

import { DrupalClient } from '../dist/drupal-client.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env si disponible
dotenv.config();

async function testConnection() {
  console.log('🔍 Test de connexion Drupal...\n');

  // Vérifier les variables d'environnement
  const baseUrl = process.env.DRUPAL_BASE_URL;
  const username = process.env.DRUPAL_USERNAME;
  const password = process.env.DRUPAL_PASSWORD;
  const token = process.env.DRUPAL_TOKEN;
  const apiKey = process.env.DRUPAL_API_KEY;

  console.log('📋 Configuration détectée:');
  console.log(`   Base URL: ${baseUrl || 'Non définie'}`);
  console.log(`   Username: ${username || 'Non défini'}`);
  console.log(`   Password: ${password ? '***' : 'Non défini'}`);
  console.log(`   Token: ${token ? '***' : 'Non défini'}`);
  console.log(`   API Key: ${apiKey ? '***' : 'Non définie'}\n`);

  if (!baseUrl) {
    console.error('❌ DRUPAL_BASE_URL est requis');
    process.exit(1);
  }

  if (!username && !token && !apiKey) {
    console.error('❌ Au moins un moyen d\'authentification est requis (username/password, token, ou API key)');
    process.exit(1);
  }

  try {
    console.log('🚀 Initialisation du client Drupal...');
    const client = new DrupalClient();

    console.log('🔗 Test de connectivité...');
    const siteInfo = await client.getSiteInfo();

    console.log('✅ Connexion réussie!');
    console.log('📊 Informations du site:');
    console.log(JSON.stringify(siteInfo, null, 2));

  } catch (error) {
    console.error('❌ Échec de la connexion:');
    console.error(`   ${error.message}`);
    
    console.log('\n💡 Suggestions:');
    console.log('   - Vérifiez que l\'URL Drupal est correcte et accessible');
    console.log('   - Vérifiez que l\'API REST est activée sur le site Drupal');
    console.log('   - Vérifiez les credentials d\'authentification');
    console.log('   - Vérifiez les permissions utilisateur');
    
    process.exit(1);
  }
}

testConnection().catch(console.error);