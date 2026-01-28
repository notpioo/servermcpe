import { Link, useLocation } from "wouter";
import { LayoutDashboard, Server, Settings, Box, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/servers", label: "My Servers", icon: Server },
    { href: "/console", label: "Console", icon: Terminal },
    { href: "/plugins", label: "Plugins", icon: Box },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen flex flex-col fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-display shadow-lg shadow-primary/20">
          M
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight">MinePanel</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-sidebar-accent text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              <link.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-card/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">System Healthy</span>
          </div>
          <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary w-[32%] h-full rounded-full" />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">CPU</span>
            <span className="text-[10px] font-mono text-foreground">32%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="md:hidden h-16 border-b border-border bg-background flex items-center px-4 justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
          M
        </div>
        <h1 className="font-display font-bold text-lg">MinePanel</h1>
      </div>
      {/* Mobile menu trigger would go here */}
    </header>
  );
}
