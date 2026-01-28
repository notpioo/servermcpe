import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { SERVER_STATUS } from "@shared/schema";
import { bedrockManager } from "./bedrock/manager";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.servers.list.path, async (req, res) => {
    const servers = await storage.getServers();
    const serversWithStatus = servers.map(server => ({
      ...server,
      status: bedrockManager.isServerRunning(server.id) ? SERVER_STATUS.ONLINE : SERVER_STATUS.OFFLINE,
      installed: bedrockManager.isServerInstalled(server.id)
    }));
    res.json(serversWithStatus);
  });

  app.get(api.servers.get.path, async (req, res) => {
    const server = await storage.getServer(Number(req.params.id));
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    res.json({
      ...server,
      status: bedrockManager.isServerRunning(server.id) ? SERVER_STATUS.ONLINE : SERVER_STATUS.OFFLINE,
      installed: bedrockManager.isServerInstalled(server.id)
    });
  });

  app.post(api.servers.create.path, async (req, res) => {
    try {
      const input = api.servers.create.input.parse(req.body);
      const server = await storage.createServer(input);
      res.status(201).json(server);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post('/api/server/create', async (req, res) => {
    try {
      const { name, port, maxPlayers, gameMode, difficulty } = req.body;
      
      if (!name || !port) {
        return res.status(400).json({ success: false, message: 'Name and port are required' });
      }

      const existingServers = await storage.getServers();
      const portInUse = existingServers.some(s => s.port === port);
      if (portInUse) {
        return res.status(400).json({ success: false, message: 'Port is already in use by another server' });
      }

      const server = await storage.createServer({
        name,
        port: port || 19132,
        maxPlayers: maxPlayers || 20,
        gameMode: gameMode || 'survival',
        difficulty: difficulty || 'normal'
      });

      res.status(201).json({
        success: true,
        server,
        message: 'Server created successfully. Use /api/server/install to download Bedrock server.'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create server' });
    }
  });

  app.post('/api/server/install/:id', async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getServer(id);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const result = await bedrockManager.downloadBedrockServer(id);
    
    if (result.success) {
      bedrockManager.updateServerProperties(id, {
        serverName: server.name,
        port: server.port,
        maxPlayers: server.maxPlayers,
        gameMode: server.gameMode,
        difficulty: server.difficulty
      });
    }

    res.json(result);
  });

  app.get('/api/server/status', async (req, res) => {
    const servers = await storage.getServers();
    const runningServers = bedrockManager.getRunningServers();
    
    const statusList = servers.map(server => ({
      id: server.id,
      name: server.name,
      port: server.port,
      status: runningServers.includes(server.id) ? 'online' : 'offline',
      installed: bedrockManager.isServerInstalled(server.id),
      maxPlayers: server.maxPlayers,
      gameMode: server.gameMode,
      difficulty: server.difficulty,
      autoRestart: bedrockManager.isAutoRestartEnabled(server.id)
    }));

    res.json({
      success: true,
      servers: statusList,
      runningCount: runningServers.length,
      totalCount: servers.length
    });
  });

  app.get('/api/server/status/:id', async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getServer(id);
    
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const isRunning = bedrockManager.isServerRunning(id);
    const isInstalled = bedrockManager.isServerInstalled(id);
    const logs = bedrockManager.getServerLogs(id);

    res.json({
      success: true,
      server: {
        ...server,
        status: isRunning ? 'online' : 'offline',
        installed: isInstalled,
        autoRestart: bedrockManager.isAutoRestartEnabled(id)
      },
      logs: logs.slice(-100)
    });
  });

  app.get('/api/server/:id/logs', async (req, res) => {
    const id = Number(req.params.id);
    const logs = bedrockManager.getServerLogs(id);
    res.json({ success: true, logs });
  });

  app.post('/api/server/:id/command', async (req, res) => {
    const id = Number(req.params.id);
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, message: 'Command is required' });
    }

    const result = bedrockManager.sendCommand(id, command);
    res.json(result);
  });

  app.post('/api/server/start', async (req, res) => {
    const { id, autoRestart } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Server ID is required' });
    }

    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    if (!bedrockManager.isServerInstalled(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bedrock server not installed. Use /api/server/install/:id first.' 
      });
    }

    bedrockManager.updateServerProperties(id, {
      serverName: server.name,
      port: server.port,
      maxPlayers: server.maxPlayers,
      gameMode: server.gameMode,
      difficulty: server.difficulty
    });

    const result = await bedrockManager.startServer(id, server.port, autoRestart !== false);
    
    if (result.success) {
      await storage.updateServerStatus(id, SERVER_STATUS.ONLINE);
    }

    res.json(result);
  });

  app.post('/api/server/start/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { autoRestart } = req.body || {};
    
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    if (!bedrockManager.isServerInstalled(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bedrock server not installed. Use /api/server/install/:id first.' 
      });
    }

    bedrockManager.updateServerProperties(id, {
      serverName: server.name,
      port: server.port,
      maxPlayers: server.maxPlayers,
      gameMode: server.gameMode,
      difficulty: server.difficulty
    });

    const result = await bedrockManager.startServer(id, server.port, autoRestart !== false);
    
    if (result.success) {
      await storage.updateServerStatus(id, SERVER_STATUS.ONLINE);
    }

    res.json(result);
  });

  app.post('/api/server/stop', async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Server ID is required' });
    }

    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const result = await bedrockManager.stopServer(id);
    
    if (result.success) {
      await storage.updateServerStatus(id, SERVER_STATUS.OFFLINE);
    }

    res.json(result);
  });

  app.post('/api/server/stop/:id', async (req, res) => {
    const id = Number(req.params.id);
    
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found' });
    }

    const result = await bedrockManager.stopServer(id);
    
    if (result.success) {
      await storage.updateServerStatus(id, SERVER_STATUS.OFFLINE);
    }

    res.json(result);
  });

  app.get('/api/server/:id/properties', async (req, res) => {
    const id = Number(req.params.id);
    const content = bedrockManager.getServerProperties(id);
    
    if (content === null) {
      return res.status(404).json({ success: false, message: 'server.properties not found' });
    }

    res.json({ success: true, content });
  });

  app.post('/api/server/:id/properties', async (req, res) => {
    const id = Number(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const result = bedrockManager.saveServerProperties(id, content);
    res.json(result);
  });

  app.get('/api/server/:id/whitelist', async (req, res) => {
    const id = Number(req.params.id);
    const whitelist = bedrockManager.getWhitelist(id);
    res.json({ success: true, whitelist });
  });

  app.post('/api/server/:id/whitelist', async (req, res) => {
    const id = Number(req.params.id);
    const { playerName } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ success: false, message: 'Player name is required' });
    }

    const result = bedrockManager.addToWhitelist(id, playerName);
    res.json(result);
  });

  app.delete('/api/server/:id/whitelist/:playerName', async (req, res) => {
    const id = Number(req.params.id);
    const { playerName } = req.params;
    
    const result = bedrockManager.removeFromWhitelist(id, playerName);
    res.json(result);
  });

  app.get('/api/server/:id/operators', async (req, res) => {
    const id = Number(req.params.id);
    const operators = bedrockManager.getOperators(id);
    res.json({ success: true, operators });
  });

  app.post('/api/server/:id/operators', async (req, res) => {
    const id = Number(req.params.id);
    const { playerName } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ success: false, message: 'Player name is required' });
    }

    const result = bedrockManager.addOperator(id, playerName);
    res.json(result);
  });

  app.delete('/api/server/:id/operators/:playerName', async (req, res) => {
    const id = Number(req.params.id);
    const { playerName } = req.params;
    
    const result = bedrockManager.removeOperator(id, playerName);
    res.json(result);
  });

  app.get('/api/server/:id/backups', async (req, res) => {
    const id = Number(req.params.id);
    const backups = bedrockManager.listBackups(id);
    res.json({ success: true, backups });
  });

  app.post('/api/server/:id/backup', async (req, res) => {
    const id = Number(req.params.id);
    const result = await bedrockManager.createBackup(id);
    res.json(result);
  });

  app.post('/api/server/:id/restore', async (req, res) => {
    const id = Number(req.params.id);
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({ success: false, message: 'Backup name is required' });
    }

    const result = await bedrockManager.restoreBackup(id, backupName);
    res.json(result);
  });

  app.delete('/api/server/:id/backup/:backupName', async (req, res) => {
    const { backupName } = req.params;
    const result = bedrockManager.deleteBackup(backupName);
    res.json(result);
  });

  app.post('/api/server/:id/auto-restart', async (req, res) => {
    const id = Number(req.params.id);
    const { enabled } = req.body;
    
    bedrockManager.setAutoRestart(id, enabled === true);
    res.json({ success: true, message: `Auto-restart ${enabled ? 'enabled' : 'disabled'}` });
  });

  app.post(api.servers.action.path, async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const { action } = req.body;

    if (action === 'start') {
      if (!bedrockManager.isServerInstalled(id)) {
        return res.status(400).json({ 
          message: 'Bedrock server not installed. Install it first.' 
        });
      }

      bedrockManager.updateServerProperties(id, {
        serverName: server.name,
        port: server.port,
        maxPlayers: server.maxPlayers,
        gameMode: server.gameMode,
        difficulty: server.difficulty
      });

      const result = await bedrockManager.startServer(id, server.port);
      if (result.success) {
        await storage.updateServerStatus(id, SERVER_STATUS.ONLINE);
      }
      return res.json({ ...server, status: result.success ? SERVER_STATUS.ONLINE : SERVER_STATUS.OFFLINE });
    } 
    
    if (action === 'stop') {
      const result = await bedrockManager.stopServer(id);
      if (result.success) {
        await storage.updateServerStatus(id, SERVER_STATUS.OFFLINE);
      }
      return res.json({ ...server, status: SERVER_STATUS.OFFLINE });
    } 
    
    if (action === 'restart') {
      await bedrockManager.stopServer(id);
      await storage.updateServerStatus(id, SERVER_STATUS.STARTING);
      
      setTimeout(async () => {
        const result = await bedrockManager.startServer(id, server.port);
        await storage.updateServerStatus(id, result.success ? SERVER_STATUS.ONLINE : SERVER_STATUS.OFFLINE);
      }, 2000);
      
      return res.json({ ...server, status: SERVER_STATUS.STARTING });
    }

    res.status(400).json({ message: 'Invalid action' });
  });

  app.delete(api.servers.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    if (bedrockManager.isServerRunning(id)) {
      await bedrockManager.stopServer(id);
    }
    
    await storage.deleteServer(id);
    res.status(204).send();
  });

  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getServers();
  if (existing.length === 0) {
    await storage.createServer({
      name: "Survival World 1",
      port: 19132,
      maxPlayers: 20,
      gameMode: "survival",
      difficulty: "normal",
    });
    await storage.createServer({
      name: "Creative Plot",
      port: 19133,
      maxPlayers: 50,
      gameMode: "creative",
      difficulty: "peaceful",
    });
  }
}
