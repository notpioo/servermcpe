import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { log } from '../index';

const SERVERS_DIR = path.join(process.cwd(), 'bedrock-servers');
const BACKUPS_DIR = path.join(process.cwd(), 'bedrock-backups');
const BEDROCK_DOWNLOAD_URL = 'https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.21.51.02.zip';

interface ServerProcess {
  process: ChildProcess;
  serverId: number;
  port: number;
  logs: string[];
  autoRestart: boolean;
  crashCount: number;
  lastCrash: number;
}

class BedrockServerManager {
  private runningServers: Map<number, ServerProcess> = new Map();
  private autoRestartEnabled: Map<number, boolean> = new Map();

  constructor() {
    if (!fs.existsSync(SERVERS_DIR)) {
      fs.mkdirSync(SERVERS_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  getServerDir(serverId: number): string {
    return path.join(SERVERS_DIR, `server-${serverId}`);
  }

  async downloadBedrockServer(serverId: number): Promise<{ success: boolean; message: string }> {
    const serverDir = this.getServerDir(serverId);
    const zipPath = path.join(serverDir, 'bedrock-server.zip');

    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    if (fs.existsSync(path.join(serverDir, 'bedrock_server'))) {
      return { success: true, message: 'Bedrock server already installed' };
    }

    return new Promise((resolve) => {
      log(`Downloading Bedrock server for server ${serverId}...`, 'bedrock');
      
      const file = fs.createWriteStream(zipPath);
      
      const download = (url: string) => {
        const request = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              download(redirectUrl);
              return;
            }
          }
          
          if (response.statusCode !== 200) {
            fs.unlinkSync(zipPath);
            resolve({ success: false, message: `Download failed: Status code ${response.statusCode}` });
            return;
          }

          response.pipe(file);
          file.on('finish', async () => {
            file.close();
            try {
              await this.extractServer(serverId, zipPath);
              resolve({ success: true, message: 'Bedrock server downloaded and extracted' });
            } catch (err: any) {
              resolve({ success: false, message: `Extraction failed: ${err.message}` });
            }
          });
        });

        request.on('error', (err) => {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
          resolve({ success: false, message: `Download failed: ${err.message}` });
        });

        request.setTimeout(120000, () => {
          request.destroy();
          resolve({ success: false, message: 'Download timeout' });
        });
      };

      download(BEDROCK_DOWNLOAD_URL);
    });
  }

  private async extractServer(serverId: number, zipPath: string): Promise<void> {
    const serverDir = this.getServerDir(serverId);
    
    return new Promise((resolve, reject) => {
      const unzip = spawn('unzip', ['-o', zipPath, '-d', serverDir]);
      
        unzip.on('close', (code) => {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
          
          const bedrockExecutable = path.join(serverDir, 'bedrock_server');
          if (fs.existsSync(bedrockExecutable)) {
            fs.chmodSync(bedrockExecutable, '755');
          }

          // Create default server.properties if it doesn't exist
          const propertiesPath = path.join(serverDir, 'server.properties');
          if (!fs.existsSync(propertiesPath)) {
            const defaultProperties = [
              'server-name=Dedicated Server',
              'gamemode=survival',
              'difficulty=easy',
              'allow-cheats=false',
              'max-players=10',
              'online-mode=true',
              'white-list=false',
              'server-port=19132',
              'server-portv6=19133',
              'view-distance=32',
              'tick-distance=4',
              'player-idle-timeout=30',
              'max-threads=8',
              'level-name=Bedrock level',
              'level-seed=',
              'default-player-permission-level=member',
              'texturepack-required=false',
              'content-log-file-enabled=false',
              'compression-threshold=1',
              'server-authoritative-movement=server-auth',
              'player-movement-score-threshold=20',
              'player-movement-distance-threshold=0.3',
              'player-movement-duration-threshold-in-ms=500',
              'correct-player-movement=false',
              'server-authoritative-block-breaking=true'
            ].join('\n');
            fs.writeFileSync(propertiesPath, defaultProperties);
            log(`Created default server.properties for server ${serverId}`, 'bedrock');
          }

          // Ensure resource_packs and behavior_packs exist and are not just empty markers
          const packs = ['resource_packs', 'behavior_packs'];
          packs.forEach(pack => {
            const packPath = path.join(serverDir, pack);
            if (!fs.existsSync(packPath)) {
              fs.mkdirSync(packPath, { recursive: true });
            }
          });
          
          if (code === 0) {
            log(`Bedrock server extracted for server ${serverId}`, 'bedrock');
            resolve();
          } else {
            reject(new Error(`Extraction failed with code ${code}`));
          }
        });

      unzip.on('error', (err) => {
        reject(err);
      });
    });
  }

  updateServerProperties(serverId: number, config: {
    serverName: string;
    port: number;
    maxPlayers: number;
    gameMode: string;
    difficulty: string;
  }): void {
    const serverDir = this.getServerDir(serverId);
    const propertiesPath = path.join(serverDir, 'server.properties');
    
    if (!fs.existsSync(propertiesPath)) {
      log(`server.properties not found for server ${serverId}`, 'bedrock');
      return;
    }

    let properties = fs.readFileSync(propertiesPath, 'utf8');
    
    const gameModeMap: Record<string, string> = {
      'survival': 'survival',
      'creative': 'creative',
      'adventure': 'adventure'
    };

    const difficultyMap: Record<string, string> = {
      'peaceful': 'peaceful',
      'easy': 'easy',
      'normal': 'normal',
      'hard': 'hard'
    };

    properties = properties.replace(/server-name=.*/g, `server-name=${config.serverName}`);
    properties = properties.replace(/server-port=.*/g, `server-port=${config.port}`);
    properties = properties.replace(/max-players=.*/g, `max-players=${config.maxPlayers}`);
    properties = properties.replace(/gamemode=.*/g, `gamemode=${gameModeMap[config.gameMode] || 'survival'}`);
    properties = properties.replace(/difficulty=.*/g, `difficulty=${difficultyMap[config.difficulty] || 'normal'}`);
    
    fs.writeFileSync(propertiesPath, properties);
    log(`Updated server.properties for server ${serverId}`, 'bedrock');
  }

  async startServer(serverId: number, port: number, autoRestart: boolean = true): Promise<{ success: boolean; message: string }> {
    if (this.runningServers.has(serverId)) {
      return { success: false, message: 'Server is already running' };
    }

    const serverDir = this.getServerDir(serverId);
    const executable = path.join(serverDir, 'bedrock_server');

    if (!fs.existsSync(executable)) {
      return { success: false, message: 'Bedrock server not installed. Please install first.' };
    }

    this.autoRestartEnabled.set(serverId, autoRestart);

    // Try to kill any existing process on this port before starting
    try {
      const pkill = spawn('pkill', ['-f', `bedrock_server.*server-${serverId}`]);
      await new Promise(r => pkill.on('close', r));
    } catch (e) {
      // Ignore errors if pkill fails
    }

    return new Promise((resolve) => {
      const serverProcess = spawn(executable, [], {
        cwd: serverDir,
        env: {
          ...process.env,
          LD_LIBRARY_PATH: serverDir
        }
      });

      const logs: string[] = [];

      serverProcess.stdout.on('data', (data) => {
        const message = data.toString();
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        logs.push(`[${timestamp}] ${message}`);
        if (logs.length > 500) logs.shift();
        log(`[Server ${serverId}] ${message.trim()}`, 'bedrock');
      });

      serverProcess.stderr.on('data', (data) => {
        const message = data.toString();
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        logs.push(`[${timestamp}] ERROR: ${message}`);
        if (logs.length > 500) logs.shift();
        log(`[Server ${serverId}] ERROR: ${message.trim()}`, 'bedrock');
      });

      serverProcess.on('close', (code) => {
        log(`Server ${serverId} exited with code ${code}`, 'bedrock');
        const serverInfo = this.runningServers.get(serverId);
        this.runningServers.delete(serverId);
        
        if (code !== 0 && this.autoRestartEnabled.get(serverId)) {
          const now = Date.now();
          const crashCount = (serverInfo?.crashCount || 0) + 1;
          const lastCrash = serverInfo?.lastCrash || 0;
          
          if (now - lastCrash > 60000) {
            log(`Server ${serverId} crashed, attempting auto-restart (attempt ${crashCount})...`, 'bedrock');
            setTimeout(() => {
              this.startServer(serverId, port, true);
            }, 5000);
          } else if (crashCount < 3) {
            log(`Server ${serverId} crashed again, attempting restart ${crashCount}/3...`, 'bedrock');
            setTimeout(() => {
              this.startServer(serverId, port, true);
            }, 10000);
          } else {
            log(`Server ${serverId} crashed too many times, disabling auto-restart`, 'bedrock');
            this.autoRestartEnabled.set(serverId, false);
          }
        }
      });

      serverProcess.on('error', (err) => {
        log(`Server ${serverId} error: ${err.message}`, 'bedrock');
        this.runningServers.delete(serverId);
      });

      this.runningServers.set(serverId, {
        process: serverProcess,
        serverId,
        port,
        logs,
        autoRestart,
        crashCount: 0,
        lastCrash: 0
      });

      setTimeout(() => {
        if (this.runningServers.has(serverId)) {
          resolve({ success: true, message: 'Server started successfully' });
        } else {
          resolve({ success: false, message: 'Server failed to start' });
        }
      }, 2000);
    });
  }

  async stopServer(serverId: number): Promise<{ success: boolean; message: string }> {
    const serverInfo = this.runningServers.get(serverId);
    
    if (!serverInfo) {
      return { success: false, message: 'Server is not running' };
    }

    this.autoRestartEnabled.set(serverId, false);

    return new Promise((resolve) => {
      serverInfo.process.stdin?.write('stop\n');
      
      const timeout = setTimeout(() => {
        serverInfo.process.kill('SIGKILL');
      }, 10000);

      serverInfo.process.on('close', () => {
        clearTimeout(timeout);
        this.runningServers.delete(serverId);
        resolve({ success: true, message: 'Server stopped successfully' });
      });

      setTimeout(() => {
        if (!this.runningServers.has(serverId)) {
          resolve({ success: true, message: 'Server stopped successfully' });
        } else {
          serverInfo.process.kill('SIGTERM');
        }
      }, 5000);
    });
  }

  sendCommand(serverId: number, command: string): { success: boolean; message: string } {
    const serverInfo = this.runningServers.get(serverId);
    
    if (!serverInfo) {
      return { success: false, message: 'Server is not running' };
    }

    serverInfo.process.stdin?.write(`${command}\n`);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    serverInfo.logs.push(`[${timestamp}] > ${command}`);
    
    return { success: true, message: 'Command sent' };
  }

  isServerRunning(serverId: number): boolean {
    return this.runningServers.has(serverId);
  }

  getServerLogs(serverId: number): string[] {
    return this.runningServers.get(serverId)?.logs || [];
  }

  isServerInstalled(serverId: number): boolean {
    const executable = path.join(this.getServerDir(serverId), 'bedrock_server');
    return fs.existsSync(executable);
  }

  getRunningServers(): number[] {
    return Array.from(this.runningServers.keys());
  }

  getServerProperties(serverId: number): string | null {
    const propertiesPath = path.join(this.getServerDir(serverId), 'server.properties');
    if (!fs.existsSync(propertiesPath)) {
      return null;
    }
    return fs.readFileSync(propertiesPath, 'utf8');
  }

  saveServerProperties(serverId: number, content: string): { success: boolean; message: string } {
    const propertiesPath = path.join(this.getServerDir(serverId), 'server.properties');
    try {
      fs.writeFileSync(propertiesPath, content);
      return { success: true, message: 'server.properties saved successfully' };
    } catch (err) {
      return { success: false, message: `Failed to save: ${err}` };
    }
  }

  getWhitelist(serverId: number): string[] {
    const whitelistPath = path.join(this.getServerDir(serverId), 'allowlist.json');
    if (!fs.existsSync(whitelistPath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(whitelistPath, 'utf8');
      const list = JSON.parse(content);
      return list.map((entry: any) => entry.name || entry);
    } catch {
      return [];
    }
  }

  addToWhitelist(serverId: number, playerName: string): { success: boolean; message: string } {
    const whitelistPath = path.join(this.getServerDir(serverId), 'allowlist.json');
    try {
      let list: any[] = [];
      if (fs.existsSync(whitelistPath)) {
        list = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      }
      
      if (list.some((entry: any) => entry.name === playerName)) {
        return { success: false, message: 'Player already in whitelist' };
      }
      
      list.push({ name: playerName, ignoresPlayerLimit: false });
      fs.writeFileSync(whitelistPath, JSON.stringify(list, null, 2));
      
      if (this.isServerRunning(serverId)) {
        this.sendCommand(serverId, `allowlist add "${playerName}"`);
      }
      
      return { success: true, message: `${playerName} added to whitelist` };
    } catch (err) {
      return { success: false, message: `Failed: ${err}` };
    }
  }

  removeFromWhitelist(serverId: number, playerName: string): { success: boolean; message: string } {
    const whitelistPath = path.join(this.getServerDir(serverId), 'allowlist.json');
    try {
      if (!fs.existsSync(whitelistPath)) {
        return { success: false, message: 'Whitelist not found' };
      }
      
      let list = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      list = list.filter((entry: any) => entry.name !== playerName);
      fs.writeFileSync(whitelistPath, JSON.stringify(list, null, 2));
      
      if (this.isServerRunning(serverId)) {
        this.sendCommand(serverId, `allowlist remove "${playerName}"`);
      }
      
      return { success: true, message: `${playerName} removed from whitelist` };
    } catch (err) {
      return { success: false, message: `Failed: ${err}` };
    }
  }

  getOperators(serverId: number): string[] {
    const opsPath = path.join(this.getServerDir(serverId), 'permissions.json');
    if (!fs.existsSync(opsPath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(opsPath, 'utf8');
      const list = JSON.parse(content);
      return list.filter((entry: any) => entry.permission === 'operator').map((entry: any) => entry.xuid || entry.name);
    } catch {
      return [];
    }
  }

  addOperator(serverId: number, playerName: string): { success: boolean; message: string } {
    const opsPath = path.join(this.getServerDir(serverId), 'permissions.json');
    try {
      let list: any[] = [];
      if (fs.existsSync(opsPath)) {
        list = JSON.parse(fs.readFileSync(opsPath, 'utf8'));
      }
      
      if (list.some((entry: any) => entry.name === playerName && entry.permission === 'operator')) {
        return { success: false, message: 'Player is already an operator' };
      }
      
      list.push({ permission: 'operator', name: playerName });
      fs.writeFileSync(opsPath, JSON.stringify(list, null, 2));
      
      if (this.isServerRunning(serverId)) {
        this.sendCommand(serverId, `op "${playerName}"`);
      }
      
      return { success: true, message: `${playerName} is now an operator` };
    } catch (err) {
      return { success: false, message: `Failed: ${err}` };
    }
  }

  removeOperator(serverId: number, playerName: string): { success: boolean; message: string } {
    const opsPath = path.join(this.getServerDir(serverId), 'permissions.json');
    try {
      if (!fs.existsSync(opsPath)) {
        return { success: false, message: 'Permissions file not found' };
      }
      
      let list = JSON.parse(fs.readFileSync(opsPath, 'utf8'));
      list = list.filter((entry: any) => !(entry.name === playerName && entry.permission === 'operator'));
      fs.writeFileSync(opsPath, JSON.stringify(list, null, 2));
      
      if (this.isServerRunning(serverId)) {
        this.sendCommand(serverId, `deop "${playerName}"`);
      }
      
      return { success: true, message: `${playerName} is no longer an operator` };
    } catch (err) {
      return { success: false, message: `Failed: ${err}` };
    }
  }

  async createBackup(serverId: number): Promise<{ success: boolean; message: string; backupName?: string }> {
    const serverDir = this.getServerDir(serverId);
    if (!fs.existsSync(serverDir)) {
      return { success: false, message: 'Server directory not found' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `server-${serverId}-${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUPS_DIR, backupName);

    return new Promise((resolve) => {
      const tar = spawn('tar', ['-czf', backupPath, '-C', SERVERS_DIR, `server-${serverId}`]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          log(`Backup created for server ${serverId}: ${backupName}`, 'bedrock');
          resolve({ success: true, message: 'Backup created successfully', backupName });
        } else {
          resolve({ success: false, message: `Backup failed with code ${code}` });
        }
      });

      tar.on('error', (err) => {
        resolve({ success: false, message: `Backup failed: ${err.message}` });
      });
    });
  }

  listBackups(serverId: number): string[] {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return [];
    }
    
    const files = fs.readdirSync(BACKUPS_DIR);
    return files
      .filter(f => f.startsWith(`server-${serverId}-`) && f.endsWith('.tar.gz'))
      .sort()
      .reverse();
  }

  async restoreBackup(serverId: number, backupName: string): Promise<{ success: boolean; message: string }> {
    const backupPath = path.join(BACKUPS_DIR, backupName);
    if (!fs.existsSync(backupPath)) {
      return { success: false, message: 'Backup not found' };
    }

    if (this.isServerRunning(serverId)) {
      return { success: false, message: 'Stop the server before restoring' };
    }

    const serverDir = this.getServerDir(serverId);
    
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }

    return new Promise((resolve) => {
      const tar = spawn('tar', ['-xzf', backupPath, '-C', SERVERS_DIR]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          log(`Backup restored for server ${serverId}: ${backupName}`, 'bedrock');
          resolve({ success: true, message: 'Backup restored successfully' });
        } else {
          resolve({ success: false, message: `Restore failed with code ${code}` });
        }
      });

      tar.on('error', (err) => {
        resolve({ success: false, message: `Restore failed: ${err.message}` });
      });
    });
  }

  deleteBackup(backupName: string): { success: boolean; message: string } {
    const backupPath = path.join(BACKUPS_DIR, backupName);
    try {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        return { success: true, message: 'Backup deleted' };
      }
      return { success: false, message: 'Backup not found' };
    } catch (err) {
      return { success: false, message: `Failed to delete: ${err}` };
    }
  }

  setAutoRestart(serverId: number, enabled: boolean): void {
    this.autoRestartEnabled.set(serverId, enabled);
  }

  isAutoRestartEnabled(serverId: number): boolean {
    return this.autoRestartEnabled.get(serverId) || false;
  }
}

export const bedrockManager = new BedrockServerManager();
