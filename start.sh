#!/bin/bash
cd "/Users/vincenttournaud/DEV/MCP Drupal"
npx tsc --skipLibCheck > /dev/null 2>&1
node dist/index.js