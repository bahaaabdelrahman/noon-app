const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Advanced Frontend CORS Setup Script
 * Manages CORS origins for multiple frontend ports
 * Usage: node cors-manager.js [command] [options]
 */

class CORSManager {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.appJsPath = path.join(__dirname, '../src/app.js');
  }

  // Read current allowed origins from app.js
  getCurrentOrigins() {
    try {
      const appContent = fs.readFileSync(this.appJsPath, 'utf8');
      const allowedOriginsMatch = appContent.match(/const allowedOrigins = \[([\s\S]*?)\]\.filter\(Boolean\);/);
      
      if (allowedOriginsMatch) {
        const origins = allowedOriginsMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith("'http") || line.startsWith('process.env'))
          .map(line => {
            if (line.startsWith('process.env')) {
              return line.replace(/[,]/g, '').trim();
            }
            return line.replace(/[',]/g, '').trim();
          });
        return origins;
      }
      return [];
    } catch (error) {
      console.error('❌ Error reading current origins:', error.message);
      return [];
    }
  }

  // Extract ports from origins
  extractPorts() {
    const origins = this.getCurrentOrigins();
    const ports = new Set();
    
    origins.forEach(origin => {
      if (origin.includes('localhost:') || origin.includes('127.0.0.1:')) {
        const portMatch = origin.match(/:(\d+)/);
        if (portMatch) {
          ports.add(parseInt(portMatch[1]));
        }
      }
    });
    
    return Array.from(ports).sort((a, b) => a - b);
  }

  // Update app.js with new origins
  updateAppJs(ports) {
    try {
      let appContent = fs.readFileSync(this.appJsPath, 'utf8');
      
      // Create new allowed origins array
      const localhostOrigins = ports.map(port => `        'http://localhost:${port}',`).join('\n');
      const ipOrigins = ports.map(port => `        'http://127.0.0.1:${port}',`).join('\n');
      
      const newAllowedOrigins = `const allowedOrigins = [
        process.env.FRONTEND_URL,
${localhostOrigins}
${ipOrigins}
      ].filter(Boolean);`;
      
      const allowedOriginsRegex = /const allowedOrigins = \[([\s\S]*?)\]\.filter\(Boolean\);/;
      appContent = appContent.replace(allowedOriginsRegex, newAllowedOrigins);
      
      fs.writeFileSync(this.appJsPath, appContent);
      return true;
    } catch (error) {
      console.error('❌ Error updating app.js:', error.message);
      return false;
    }
  }

  // Update .env file
  updateEnvFile(primaryPort) {
    try {
      let envContent = fs.readFileSync(this.envPath, 'utf8');
      
      const frontendUrlRegex = /FRONTEND_URL=.*/;
      const newFrontendUrl = `FRONTEND_URL=http://localhost:${primaryPort}`;
      
      if (frontendUrlRegex.test(envContent)) {
        envContent = envContent.replace(frontendUrlRegex, newFrontendUrl);
      } else {
        envContent += `\n# Frontend URL (for CORS)\n${newFrontendUrl}\n`;
      }
      
      fs.writeFileSync(this.envPath, envContent);
      return true;
    } catch (error) {
      console.error('❌ Error updating .env file:', error.message);
      return false;
    }
  }

  // Add a new port
  addPort(port) {
    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      console.error('❌ Invalid port number. Please provide a valid port (1-65535)');
      return false;
    }

    const currentPorts = this.extractPorts();
    
    if (currentPorts.includes(portNumber)) {
      console.log(`ℹ️  Port ${portNumber} is already configured in CORS origins`);
      return true;
    }

    const newPorts = [...currentPorts, portNumber].sort((a, b) => a - b);
    
    console.log(`🔧 Adding port ${portNumber} to CORS configuration...`);
    
    const appUpdated = this.updateAppJs(newPorts);
    const envUpdated = this.updateEnvFile(portNumber);
    
    if (appUpdated && envUpdated) {
      console.log(`✅ Port ${portNumber} added successfully!`);
      return true;
    }
    
    return false;
  }

  // Remove a port
  removePort(port) {
    const portNumber = parseInt(port);
    const currentPorts = this.extractPorts();
    
    if (!currentPorts.includes(portNumber)) {
      console.log(`ℹ️  Port ${portNumber} is not in the current CORS configuration`);
      return true;
    }

    const newPorts = currentPorts.filter(p => p !== portNumber);
    
    console.log(`🔧 Removing port ${portNumber} from CORS configuration...`);
    
    const appUpdated = this.updateAppJs(newPorts);
    
    // Update env to use the first available port if removing the current primary
    const currentEnvPort = this.getCurrentEnvPort();
    if (currentEnvPort === portNumber && newPorts.length > 0) {
      this.updateEnvFile(newPorts[0]);
    }
    
    if (appUpdated) {
      console.log(`✅ Port ${portNumber} removed successfully!`);
      return true;
    }
    
    return false;
  }

  // Get current env port
  getCurrentEnvPort() {
    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const frontendUrlMatch = envContent.match(/FRONTEND_URL=.*:(\d+)/);
      return frontendUrlMatch ? parseInt(frontendUrlMatch[1]) : null;
    } catch (error) {
      return null;
    }
  }

  // Set primary port (updates .env)
  setPrimaryPort(port) {
    const portNumber = parseInt(port);
    const currentPorts = this.extractPorts();
    
    if (!currentPorts.includes(portNumber)) {
      console.log(`⚠️  Port ${portNumber} is not in CORS origins. Adding it first...`);
      this.addPort(portNumber);
    }
    
    console.log(`🔧 Setting port ${portNumber} as primary frontend port...`);
    
    if (this.updateEnvFile(portNumber)) {
      console.log(`✅ Primary port set to ${portNumber}`);
      return true;
    }
    
    return false;
  }

  // Show current configuration
  showConfig() {
    console.log('📋 Current CORS Configuration');
    console.log('=' .repeat(50));
    
    const currentPorts = this.extractPorts();
    const primaryPort = this.getCurrentEnvPort();
    
    console.log(`🌐 Primary Frontend Port: ${primaryPort || 'Not set'}`);
    console.log(`🔗 Allowed Ports: ${currentPorts.length > 0 ? currentPorts.join(', ') : 'None'}`);
    console.log('\n📍 Full Origins List:');
    
    const origins = this.getCurrentOrigins();
    origins.forEach(origin => {
      if (origin.startsWith('process.env')) {
        console.log(`   - ${origin} (${primaryPort ? `http://localhost:${primaryPort}` : 'Not set'})`);
      } else {
        console.log(`   - ${origin}`);
      }
    });
  }

  // Reset to default configuration
  reset() {
    console.log('🔄 Resetting CORS configuration to defaults...');
    
    const defaultPorts = [3000, 3001, 4200];
    const appUpdated = this.updateAppJs(defaultPorts);
    const envUpdated = this.updateEnvFile(4200);
    
    if (appUpdated && envUpdated) {
      console.log('✅ CORS configuration reset to defaults');
      console.log('📋 Default ports: 3000, 3001, 4200');
      console.log('🌐 Primary port: 4200');
      return true;
    }
    
    return false;
  }
}

// CLI Interface
const main = () => {
  const corsManager = new CORSManager();
  const command = process.argv[2];
  const port = process.argv[3];

  switch (command) {
    case 'add':
      if (!port) {
        console.log('❌ Please provide a port number');
        console.log('📝 Usage: node cors-manager.js add [port]');
        return;
      }
      corsManager.addPort(port);
      break;

    case 'remove':
      if (!port) {
        console.log('❌ Please provide a port number');
        console.log('📝 Usage: node cors-manager.js remove [port]');
        return;
      }
      corsManager.removePort(port);
      break;

    case 'set-primary':
      if (!port) {
        console.log('❌ Please provide a port number');
        console.log('📝 Usage: node cors-manager.js set-primary [port]');
        return;
      }
      corsManager.setPrimaryPort(port);
      break;

    case 'show':
    case 'status':
    case '--show':
    case '-s':
      corsManager.showConfig();
      break;

    case 'reset':
      corsManager.reset();
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log('🚀 CORS Manager - Frontend Port Configuration Tool');
      console.log('=' .repeat(50));
      console.log('📝 Usage: node cors-manager.js [command] [options]');
      console.log('');
      console.log('Commands:');
      console.log('  add [port]         Add a new port to CORS origins');
      console.log('  remove [port]      Remove a port from CORS origins');
      console.log('  set-primary [port] Set primary frontend port (.env)');
      console.log('  show               Show current configuration');
      console.log('  reset              Reset to default configuration');
      console.log('  help               Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node cors-manager.js add 4200');
      console.log('  node cors-manager.js set-primary 4200');
      console.log('  node cors-manager.js show');
      console.log('  node cors-manager.js remove 3000');
      break;
  }
};

if (require.main === module) {
  main();
}

module.exports = CORSManager;
