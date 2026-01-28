import { Link } from "wouter";
import { Play, Square, RefreshCw, Cpu, Users, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerAction, useInstallServer } from "@/hooks/use-servers";

interface ServerCardProps {
  server: {
    id: number;
    name: string;
    port: number;
    maxPlayers: number;
    gameMode: string;
    difficulty: string;
    status: string;
    playersOnline?: number;
    cpuUsage?: number;
    ramUsage?: number;
    installed?: boolean;
  };
}

export function ServerCard({ server }: ServerCardProps) {
  const { mutate: doAction, isPending } = useServerAction();
  const { mutate: installServer, isPending: isInstalling } = useInstallServer();

  const isOnline = server.status === "online";
  const isStarting = server.status === "starting";
  const isInstalled = server.installed !== false;
  
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 group relative overflow-hidden transition-all duration-300 hover:border-primary/30">
      <div className={cn(
        "absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-opacity duration-500",
        isOnline ? "opacity-100" : "opacity-0"
      )} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border transition-colors duration-300",
            isOnline ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-white/5 text-muted-foreground"
          )}>
            {server.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link href={`/servers/${server.id}`} className="text-lg font-bold hover:text-primary transition-colors block">
              {server.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                isStarting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {server.status}
              </span>
              {!isInstalled && (
                <span className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Not installed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {!isInstalled ? (
            <button 
              onClick={() => installServer(server.id)}
              disabled={isInstalling}
              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
              title="Install Server"
            >
              <Download className={cn("w-4 h-4", isInstalling && "animate-pulse")} />
            </button>
          ) : isOnline ? (
            <button 
              onClick={() => doAction({ id: server.id, action: "stop" })}
              disabled={isPending}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              title="Stop Server"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button 
              onClick={() => doAction({ id: server.id, action: "start" })}
              disabled={isPending || !isInstalled}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
              title="Start Server"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
          <button 
            onClick={() => doAction({ id: server.id, action: "restart" })}
            disabled={isPending || !isInstalled}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            title="Restart Server"
          >
            <RefreshCw className={cn("w-4 h-4", isPending && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="w-3 h-3" />
            <span>Players</span>
          </div>
          <div className="text-sm font-mono font-medium">
            <span className="text-foreground">{server.playersOnline || 0}</span>
            <span className="text-muted-foreground">/{server.maxPlayers}</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Cpu className="w-3 h-3" />
            <span>CPU</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500" 
              style={{ width: `${server.cpuUsage || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
