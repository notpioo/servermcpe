import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "blue" | "orange" | "purple";
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = "primary", className }: StatCardProps) {
  const colors = {
    primary: "text-primary bg-primary/10 border-primary/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className={cn("glass-card rounded-2xl p-6 hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 group", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl border", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", 
            trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
        <p className="text-3xl font-display font-bold text-foreground mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">
          {value}
        </p>
      </div>
    </div>
  );
}
