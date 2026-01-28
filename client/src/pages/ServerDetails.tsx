import { useEffect, useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { 
  useServer, useServerAction, useDeleteServer, useInstallServer,
  useServerLogs, useSendCommand, useServerProperties, useSaveProperties,
  useServerWhitelist, useAddToWhitelist, useRemoveFromWhitelist,
  useServerOperators, useAddOperator, useRemoveOperator,
  useServerBackups, useCreateBackup, useRestoreBackup, useDeleteBackup
} from "@/hooks/use-servers";
import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Play, Square, RefreshCw, Trash2, Download,
  Terminal, Cpu, HardDrive, Users, Settings, Activity,
  FileText, Shield, UserPlus, X, Save, Archive, RotateCcw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ServerDetails() {
  const [, params] = useRoute("/servers/:id");
  const id = Number(params?.id);
  
  const { data: server, isLoading } = useServer(id);
  const { data: logs } = useServerLogs(id);
  const { data: properties } = useServerProperties(id);
  const { data: whitelist } = useServerWhitelist(id);
  const { data: operators } = useServerOperators(id);
  const { data: backups } = useServerBackups(id);
  
  const { mutate: doAction, isPending: isActionPending } = useServerAction();
  const { mutate: deleteServer } = useDeleteServer();
  const { mutate: installServer, isPending: isInstalling } = useInstallServer();
  const { mutate: sendCommand, isPending: isSending } = useSendCommand();
  const { mutate: saveProperties, isPending: isSaving } = useSaveProperties();
  const { mutate: addWhitelist } = useAddToWhitelist();
  const { mutate: removeWhitelist } = useRemoveFromWhitelist();
  const { mutate: addOp } = useAddOperator();
  const { mutate: removeOp } = useRemoveOperator();
  const { mutate: createBackup, isPending: isBackingUp } = useCreateBackup();
  const { mutate: restoreBackup, isPending: isRestoring } = useRestoreBackup();
  const { mutate: deleteBackup } = useDeleteBackup();

  const [command, setCommand] = useState("");
  const [editedProperties, setEditedProperties] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [newOp, setNewOp] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [cpuData, setCpuData] = useState<{time: string, value: number}[]>([]);
  const [ramData, setRamData] = useState<{time: string, value: number}[]>([]);

  useEffect(() => {
    if (properties && editedProperties === "") {
      setEditedProperties(properties);
    }
  }, [properties]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (!server) return;
    
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      setCpuData(prev => {
        const newData = [...prev, { time: now, value: server.cpuUsage || Math.random() * 20 }];
        return newData.slice(-20);
      });

      setRamData(prev => {
        const newData = [...prev, { time: now, value: server.ramUsage || Math.random() * 1024 }];
        return newData.slice(-20);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [server]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      sendCommand({ id, command: command.trim() });
      setCommand("");
    }
  };

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayer.trim()) {
      addWhitelist({ id, playerName: newPlayer.trim() });
      setNewPlayer("");
    }
  };

  const handleAddOp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOp.trim()) {
      addOp({ id, playerName: newOp.trim() });
      setNewOp("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 p-8 ml-64">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!server) return <div>Server not found</div>;

  const isOnline = server.status === "online";
  const isInstalled = server.installed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body">
      <Sidebar />
      <MobileHeader />

      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-display font-bold">{server.name}</h1>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                    isOnline 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {server.status}
                  </span>
                  {!isInstalled && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      Not Installed
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm font-mono mt-1">
                  127.0.0.1:{server.port} • {server.gameMode} • {server.difficulty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isInstalled ? (
                <Button 
                  onClick={() => installServer(id)}
                  disabled={isInstalling}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isInstalling ? "Installing..." : "Install Server"}
                </Button>
              ) : isOnline ? (
                <Button 
                  onClick={() => doAction({ id, action: "stop" })}
                  disabled={isActionPending}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" /> Stop
                </Button>
              ) : (
                <Button 
                  onClick={() => doAction({ id, action: "start" })}
                  disabled={isActionPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Start
                </Button>
              )}
              <Button 
                onClick={() => doAction({ id, action: "restart" })}
                disabled={isActionPending || !isInstalled}
                variant="outline" 
                className="border-border bg-card hover:bg-accent"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isActionPending && "animate-spin")} /> Restart
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the server 
                      <strong className="text-foreground"> {server.name}</strong> and remove all data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border hover:bg-white/5">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteServer(id)} className="bg-destructive hover:bg-destructive/90 text-white">
                      Delete Server
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Players</p>
                <p className="text-xl font-bold font-mono">{server.playersOnline}<span className="text-muted-foreground text-sm">/{server.maxPlayers}</span></p>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">CPU Usage</p>
                <p className="text-xl font-bold font-mono">{server.cpuUsage || 0}%</p>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">RAM Usage</p>
                <p className="text-xl font-bold font-mono">{server.ramUsage || 0}MB</p>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                <p className="text-xl font-bold font-mono">{isOnline ? "Running" : "Stopped"}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="console" className="w-full">
            <TabsList className="glass-card border border-white/5">
              <TabsTrigger value="console" className="data-[state=active]:bg-primary/10">
                <Terminal className="w-4 h-4 mr-2" /> Console
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-primary/10">
                <FileText className="w-4 h-4 mr-2" /> Files
              </TabsTrigger>
              <TabsTrigger value="players" className="data-[state=active]:bg-primary/10">
                <Shield className="w-4 h-4 mr-2" /> Players
              </TabsTrigger>
              <TabsTrigger value="backups" className="data-[state=active]:bg-primary/10">
                <Archive className="w-4 h-4 mr-2" /> Backups
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary/10">
                <Activity className="w-4 h-4 mr-2" /> Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="mt-4">
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Server Console</span>
                  {isOnline && <span className="ml-auto text-xs text-green-500">Live</span>}
                </div>
                <div className="flex-1 bg-black/50 p-4 font-mono text-sm overflow-y-auto space-y-1">
                  {logs && logs.length > 0 ? (
                    logs.map((log, i) => (
                      <div key={i} className={cn(
                        "whitespace-pre-wrap break-all",
                        log.includes('ERROR') ? 'text-red-400' : 
                        log.includes('WARN') ? 'text-yellow-400' :
                        log.includes('INFO') ? 'text-blue-400' : 'text-white'
                      )}>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">
                      {isOnline ? "Waiting for logs..." : "Server is offline. Start the server to see logs."}
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>
                <form onSubmit={handleSendCommand} className="p-2 bg-white/5 border-t border-white/5 flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="Type a command..." 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="flex-1 bg-transparent border-white/10"
                    disabled={!isOnline || isSending}
                  />
                  <Button type="submit" size="sm" disabled={!isOnline || isSending}>
                    Send
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" /> server.properties
                  </h3>
                  <Button 
                    onClick={() => saveProperties({ id, content: editedProperties })}
                    disabled={isSaving || !isInstalled}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
                {isInstalled ? (
                  <textarea
                    value={editedProperties}
                    onChange={(e) => setEditedProperties(e.target.value)}
                    className="w-full h-96 bg-black/50 rounded-lg p-4 font-mono text-sm border border-white/10 focus:border-primary/50 focus:outline-none resize-none"
                    placeholder="Loading server.properties..."
                  />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    Install the server first to edit properties.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="players" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5" /> Whitelist
                  </h3>
                  <form onSubmit={handleAddWhitelist} className="flex gap-2 mb-4">
                    <Input
                      placeholder="Player name"
                      value={newPlayer}
                      onChange={(e) => setNewPlayer(e.target.value)}
                      className="flex-1 bg-black/20 border-white/10"
                    />
                    <Button type="submit" size="sm">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {whitelist && whitelist.length > 0 ? (
                      whitelist.map((player) => (
                        <div key={player} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <span className="font-mono text-sm">{player}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWhitelist({ id, playerName: player })}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm text-center py-4">
                        No players in whitelist
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5" /> Operators
                  </h3>
                  <form onSubmit={handleAddOp} className="flex gap-2 mb-4">
                    <Input
                      placeholder="Player name"
                      value={newOp}
                      onChange={(e) => setNewOp(e.target.value)}
                      className="flex-1 bg-black/20 border-white/10"
                    />
                    <Button type="submit" size="sm">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {operators && operators.length > 0 ? (
                      operators.map((op) => (
                        <div key={op} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <span className="font-mono text-sm">{op}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOp({ id, playerName: op })}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm text-center py-4">
                        No operators configured
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="backups" className="mt-4">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Archive className="w-5 h-5" /> Server Backups
                  </h3>
                  <Button 
                    onClick={() => createBackup(id)}
                    disabled={isBackingUp || !isInstalled}
                    size="sm"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    {isBackingUp ? "Creating..." : "Create Backup"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {backups && backups.length > 0 ? (
                    backups.map((backup) => (
                      <div key={backup} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                        <span className="font-mono text-sm">{backup}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreBackup({ id, backupName: backup })}
                            disabled={isRestoring || isOnline}
                            className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" /> Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBackup({ id, backupName: backup })}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-8">
                      No backups available. Create one to protect your server data.
                    </div>
                  )}
                </div>
                {isOnline && (
                  <p className="text-yellow-500 text-sm mt-4">
                    Stop the server before restoring a backup.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">CPU History</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cpuData}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorCpu)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">RAM History</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ramData}>
                        <defs>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 2048]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRam)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
