import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { ServerCard } from "@/components/ServerCard";
import { CreateServerDialog } from "@/components/CreateServerDialog";
import { useServers } from "@/hooks/use-servers";
import { Server, Users, Activity, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: servers, isLoading } = useServers();

  const totalServers = servers?.length || 0;
  const onlineServers = servers?.filter(s => s.status === "online").length || 0;
  const totalPlayers = servers?.reduce((acc, s) => acc + (s.playersOnline || 0), 0) || 0;
  const avgCpu = servers?.length 
    ? Math.round(servers.reduce((acc, s) => acc + (s.cpuUsage || 0), 0) / servers.length) 
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body">
      <Sidebar />
      <MobileHeader />

      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of your server infrastructure</p>
            </div>
            <CreateServerDialog />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Servers" 
              value={totalServers} 
              icon={Server} 
              color="primary"
            />
            <StatCard 
              title="Online Servers" 
              value={onlineServers} 
              icon={Activity} 
              color="blue"
              trend={`${onlineServers}/${totalServers} Active`}
              trendUp={onlineServers > 0}
            />
            <StatCard 
              title="Total Players" 
              value={totalPlayers} 
              icon={Users} 
              color="orange"
            />
            <StatCard 
              title="Avg CPU Load" 
              value={`${avgCpu}%`} 
              icon={Cpu} 
              color="purple"
              trend={avgCpu > 80 ? "High Load" : "Healthy"}
              trendUp={avgCpu < 80}
            />
          </div>

          {/* Servers Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Your Servers</h2>
              <span className="text-sm text-muted-foreground">{onlineServers} running</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl bg-card/50" />
                ))}
              </div>
            ) : servers && servers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2 border-border">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No Servers Yet</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto mb-6">
                  Create your first Minecraft server to start playing with friends.
                </p>
                <CreateServerDialog />
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
