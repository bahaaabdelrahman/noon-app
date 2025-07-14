const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Setup Frontend Port Script
 * Updates CORS configuration to allow the specified frontend port
 * Usage: node setup-frontend-port.js [port]
 * Example: node setup-frontend-port.js 4200
 */

const updateEnvFile = port => {
  const envPath = path.join(__dirname, '../.env');

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update FRONTEND_URL
    const frontendUrlRegex = /FRONTEND_URL=.*/;
    const newFrontendUrl = `FRONTEND_URL=http://localhost:${port}`;

    if (frontendUrlRegex.test(envContent)) {
      envContent = envContent.replace(frontendUrlRegex, newFrontendUrl);
    } else {
      // Add FRONTEND_URL if it doesn't exist
      envContent += `\n# Frontend URL (for CORS)\n${newFrontendUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env file: FRONTEND_URL=http://localhost:${port}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    return false;
  }
};

const updateAppJs = port => {
  const appJsPath = path.join(__dirname, '../src/app.js');

  try {
    let appContent = fs.readFileSync(appJsPath, 'utf8');

    // Find the allowedOrigins array and update it
    const allowedOriginsRegex =
      /const allowedOrigins = \[([\s\S]*?)\]\.filter\(Boolean\);/;
    const match = appContent.match(allowedOriginsRegex);

    if (match) {
      // Create new allowed origins array including the new port
      const newAllowedOrigins = `const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://localhost:${port}',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:${port}',
      ].filter(Boolean);`;

      // Remove duplicates by checking if the port already exists
      const portExists = appContent.includes(`'http://localhost:${port}'`);

      if (!portExists) {
        appContent = appContent.replace(allowedOriginsRegex, newAllowedOrigins);
        fs.writeFileSync(appJsPath, appContent);
        console.log(
          `✅ Updated app.js: Added port ${port} to CORS allowed origins`
        );
      } else {
        console.log(`ℹ️  Port ${port} already exists in CORS configuration`);
      }
      return true;
    } else {
      console.error('❌ Could not find allowedOrigins array in app.js');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating app.js file:', error.message);
    return false;
  }
};

const setupFrontendPort = async () => {
  try {
    // Get port from command line arguments
    const port = process.argv[2];

    if (!port) {
      console.log('📝 Usage: node setup-frontend-port.js [port]');
      console.log('📝 Example: node setup-frontend-port.js 4200');
      console.log('📝 Example: node setup-frontend-port.js 3000');
      return;
    }

    // Validate port number
    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      console.error(
        '❌ Invalid port number. Please provide a valid port (1-65535)'
      );
      return;
    }

    console.log(`🚀 Setting up frontend port: ${port}`);
    console.log('='.repeat(50));

    // Update .env file
    const envUpdated = updateEnvFile(port);

    // Update app.js file
    const appUpdated = updateAppJs(port);

    if (envUpdated && appUpdated) {
      console.log('='.repeat(50));
      console.log('✅ Frontend port setup completed successfully!');
      console.log(`📋 Configuration Summary:`);
      console.log(`   - Frontend URL: http://localhost:${port}`);
      console.log(`   - CORS Origins Updated: Yes`);
      console.log(`   - Environment File Updated: Yes`);
      console.log('');
      console.log('🔄 Please restart your backend server to apply the changes');
      console.log('💡 Your frontend can now run on port', port);
    } else {
      console.log(
        '❌ Setup completed with errors. Please check the messages above.'
      );
    }
  } catch (error) {
    console.error('❌ Error during frontend port setup:', error.message);
  }
};

// Add helper function to show current configuration
const showCurrentConfig = () => {
  console.log('📋 Current CORS Configuration:');
  console.log('='.repeat(40));

  try {
    // Read current FRONTEND_URL from .env
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const frontendUrlMatch = envContent.match(/FRONTEND_URL=(.*)/);

    if (frontendUrlMatch) {
      console.log(`🌐 Frontend URL: ${frontendUrlMatch[1]}`);
    }

    // Read current allowed origins from app.js
    const appJsPath = path.join(__dirname, '../src/app.js');
    const appContent = fs.readFileSync(appJsPath, 'utf8');
    const allowedOriginsMatch = appContent.match(
      /const allowedOrigins = \[([\s\S]*?)\]/
    );

    if (allowedOriginsMatch) {
      console.log('🔗 Allowed Origins:');
      const origins = allowedOriginsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith("'http"))
        .map(line => line.replace(/[',]/g, '').trim());

      origins.forEach(origin => {
        console.log(`   - ${origin}`);
      });
    }
  } catch (error) {
    console.error('❌ Error reading current configuration:', error.message);
  }
};

// Handle command line arguments
if (process.argv.includes('--show') || process.argv.includes('-s')) {
  showCurrentConfig();
} else if (require.main === module) {
  setupFrontendPort();
}

module.exports = { setupFrontendPort, showCurrentConfig };
