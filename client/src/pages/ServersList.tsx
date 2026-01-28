import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { CreateServerDialog } from "@/components/CreateServerDialog";
import { ServerCard } from "@/components/ServerCard";
import { useServers } from "@/hooks/use-servers";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ServersList() {
  const { data: servers, isLoading } = useServers();
  const [search, setSearch] = useState("");

  const filteredServers = servers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body">
      <Sidebar />
      <MobileHeader />

      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-display font-bold">My Servers</h1>
            <CreateServerDialog />
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search servers..." 
              className="pl-10 bg-card border-border focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl bg-card/50" />
              ))}
            </div>
          ) : filteredServers && filteredServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-white/10">
              <p className="text-muted-foreground">No servers found matching your search.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
