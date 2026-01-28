import { useState } from "react";
import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { Terminal } from "lucide-react";
import { useServers, useServerLogs } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ConsolePage() {
  const { data: servers } = useServers();
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const { data: logs } = useServerLogs(selectedServerId || 0);

  const runningServers = servers?.filter((s: any) => s.status === 'online') || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body">
      <Sidebar />
      <MobileHeader />

      <main className="flex-1 p-4 md:p-8 md:ml-64 flex flex-col h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Global Console</h1>
          <p className="text-muted-foreground mt-1">Direct access to your server instances</p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {runningServers.length > 0 ? (
            runningServers.map((server: any) => (
              <Button
                key={server.id}
                variant={selectedServerId === server.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedServerId(server.id)}
                className={cn(
                  "border-white/10",
                  selectedServerId === server.id && "bg-primary text-primary-foreground"
                )}
              >
                {server.name}
              </Button>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No running servers. Start a server to view its console.</span>
          )}
        </div>

        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col border border-white/5">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {selectedServerId 
                ? `Console - ${runningServers.find((s: any) => s.id === selectedServerId)?.name || 'Server'}`
                : 'System Log'
              }
            </span>
            {selectedServerId && (
              <span className="ml-auto text-xs text-green-500">Live</span>
            )}
          </div>
          <div className="flex-1 bg-black/50 p-6 font-mono text-sm space-y-1 overflow-y-auto">
            {selectedServerId && logs && logs.length > 0 ? (
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
            ) : selectedServerId ? (
              <div className="text-muted-foreground">Waiting for logs...</div>
            ) : (
              <>
                <div className="text-muted-foreground">Select a running server to view its console...</div>
                <div className="text-green-500">[System]: Panel is active and ready</div>
                <div className="text-blue-400">[System]: {servers?.length || 0} servers configured</div>
                <div className="text-blue-400">[System]: {runningServers.length} servers running</div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
