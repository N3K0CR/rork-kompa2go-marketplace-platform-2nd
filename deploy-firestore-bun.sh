#!/bin/bash

echo "🚀 Deploying Firestore Rules using Bun..."
echo ""

# Check if service account file exists
if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ firebase-service-account.json not found!"
    exit 1
fi

# Check if firestore.rules exists
if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules not found!"
    exit 1
fi

# Install firebase-admin if not already installed
echo "📦 Installing firebase-admin..."
bun add firebase-admin

# Create deployment script
cat > deploy-rules.js << 'EOF'
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const rules = fs.readFileSync('./firestore.rules', 'utf8');

console.log('📤 Deploying Firestore rules...');
console.log('');

// Note: The Firebase Admin SDK doesn't directly support deploying rules
// We need to use the Firebase Management API
const https = require('https');

async function getAccessToken() {
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function deployRules() {
  try {
    const token = await getAccessToken();
    const projectId = serviceAccount.project_id;
    
    const data = JSON.stringify({
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rules
          }
        ]
      }
    });

    const options = {
      hostname: 'firebaserules.googleapis.com',
      port: 443,
      path: `/v1/projects/${projectId}/rulesets`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const result = JSON.parse(body);
            console.log('✅ Ruleset created:', result.name);
            
            // Now release the ruleset
            const releaseData = JSON.stringify({
              name: `projects/${projectId}/releases/cloud.firestore`,
              rulesetName: result.name
            });

            const releaseOptions = {
              hostname: 'firebaserules.googleapis.com',
              port: 443,
              path: `/v1/projects/${projectId}/releases/cloud.firestore`,
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': releaseData.length
              }
            };

            const releaseReq = https.request(releaseOptions, (releaseRes) => {
              let releaseBody = '';
              releaseRes.on('data', (chunk) => releaseBody += chunk);
              releaseRes.on('end', () => {
                if (releaseRes.statusCode === 200) {
                  console.log('✅ Rules deployed successfully!');
                  console.log('');
                  console.log('🎉 Your Firestore security rules are now active!');
                  resolve();
                } else {
                  console.error('❌ Failed to release ruleset:', releaseBody);
                  reject(new Error(releaseBody));
                }
              });
            });

            releaseReq.on('error', reject);
            releaseReq.write(releaseData);
            releaseReq.end();
          } else {
            console.error('❌ Failed to create ruleset:', body);
            reject(new Error(body));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployRules();
EOF

# Run the deployment script
echo "🔧 Running deployment..."
bun run deploy-rules.js

# Clean up
rm deploy-rules.js

echo ""
echo "✅ Done!"
