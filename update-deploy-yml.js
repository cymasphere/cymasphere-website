#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the current deploy.yml file
function readDeployYml() {
  const ymlPath = path.join(__dirname, '.github', 'workflows', 'deploy.yml');
  if (!fs.existsSync(ymlPath)) {
    console.log('❌ .github/workflows/deploy.yml not found');
    return null;
  }
  
  return fs.readFileSync(ymlPath, 'utf8');
}

// Update the deploy.yml with missing environment variables
function updateDeployYml() {
  const content = readDeployYml();
  if (!content) return;
  
  console.log('🔧 Updating .github/workflows/deploy.yml with missing environment variables\n');
  
  // Find the build step and add missing environment variables
  const buildStepPattern = /- name: Build application\s+env:\s+([\s\S]*?)\s+run: bun run build/;
  const match = content.match(buildStepPattern);
  
  if (!match) {
    console.log('❌ Could not find build step in deploy.yml');
    return;
  }
  
  const currentEnv = match[1];
  const missingVars = [
    'EMAIL_TEST_MODE: ${{ secrets.EMAIL_TEST_MODE }}',
    'LIFETIME_PRICE_ID_2: ${{ secrets.LIFETIME_PRICE_ID_2 }}',
    'NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}'
  ];
  
  // Add missing variables to the env section
  const updatedEnv = currentEnv + missingVars.map(v => `          ${v}`).join('\n') + '\n';
  
  // Replace the env section
  const updatedContent = content.replace(buildStepPattern, 
    `- name: Build application
        env:
${updatedEnv}        run: bun run build`
  );
  
  // Find the environment file creation section and add missing variables
  const envFilePattern = /echo "CRON_SECRET=\${{ secrets\.CRON_SECRET }}" >> \.env\.production\s+([\s\S]*?)\s+# Copy environment file/;
  const envFileMatch = updatedContent.match(envFilePattern);
  
  if (envFileMatch) {
    const currentEnvFile = envFileMatch[1];
    const missingEnvFileVars = [
      'echo "EMAIL_TEST_MODE=${{ secrets.EMAIL_TEST_MODE }}" >> .env.production',
      'echo "LIFETIME_PRICE_ID_2=${{ secrets.LIFETIME_PRICE_ID_2 }}" >> .env.production',
      'echo "NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}" >> .env.production'
    ];
    
    const updatedEnvFile = currentEnvFile + missingEnvFileVars.map(v => `          ${v}`).join('\n') + '\n';
    
    const finalContent = updatedContent.replace(envFilePattern,
      `echo "CRON_SECRET=\${{ secrets.CRON_SECRET }}" >> .env.production
${updatedEnvFile}          # Copy environment file`
    );
    
    // Write the updated content
    const ymlPath = path.join(__dirname, '.github', 'workflows', 'deploy.yml');
    fs.writeFileSync(ymlPath, finalContent);
    
    console.log('✅ Updated .github/workflows/deploy.yml');
    console.log('📝 Added missing environment variables:');
    missingVars.forEach(v => console.log(`   - ${v.split(':')[0]}`));
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Add the missing secrets to GitHub repository settings');
    console.log('2. Commit and push the updated deploy.yml');
    console.log('3. Test the deployment to ensure all variables are properly set');
    
  } else {
    console.log('❌ Could not find environment file creation section');
  }
}

// Run the update
updateDeployYml(); 