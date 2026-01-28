import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertServer, type Server } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useServers() {
  return useQuery({
    queryKey: [api.servers.list.path],
    queryFn: async () => {
      const res = await fetch(api.servers.list.path);
      if (!res.ok) throw new Error("Failed to fetch servers");
      return res.json();
    },
    refetchInterval: 3000,
  });
}

export function useServer(id: number) {
  return useQuery({
    queryKey: [api.servers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.servers.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch server");
      return res.json();
    },
    refetchInterval: 3000, 
  });
}

export function useServerLogs(id: number) {
  return useQuery({
    queryKey: ['server-logs', id],
    queryFn: async () => {
      const res = await fetch(`/api/server/${id}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return data.logs as string[];
    },
    refetchInterval: 2000,
  });
}

export function useServerProperties(id: number) {
  return useQuery({
    queryKey: ['server-properties', id],
    queryFn: async () => {
      const res = await fetch(`/api/server/${id}/properties`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.content as string;
    },
  });
}

export function useServerWhitelist(id: number) {
  return useQuery({
    queryKey: ['server-whitelist', id],
    queryFn: async () => {
      const res = await fetch(`/api/server/${id}/whitelist`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.whitelist as string[];
    },
  });
}

export function useServerOperators(id: number) {
  return useQuery({
    queryKey: ['server-operators', id],
    queryFn: async () => {
      const res = await fetch(`/api/server/${id}/operators`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.operators as string[];
    },
  });
}

export function useServerBackups(id: number) {
  return useQuery({
    queryKey: ['server-backups', id],
    queryFn: async () => {
      const res = await fetch(`/api/server/${id}/backups`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.backups as string[];
    },
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertServer) => {
      const res = await fetch(api.servers.create.path, {
        method: api.servers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create server");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.servers.list.path] });
      toast({
        title: "Server Created",
        description: "Your new Minecraft server is ready to configure.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useServerAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "start" | "stop" | "restart" }) => {
      const url = buildUrl(api.servers.action.path, { id });
      const res = await fetch(url, {
        method: api.servers.action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${action} server`);
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.servers.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.servers.list.path] });
      toast({
        title: `Server ${variables.action === 'stop' ? 'Stopped' : variables.action === 'restart' ? 'Restarting' : 'Started'}`,
        description: `Command sent successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useInstallServer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/server/install/${id}`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to install server");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.servers.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.servers.list.path] });
      toast({
        title: "Server Installed",
        description: "Bedrock server has been downloaded and installed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Installation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendCommand() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, command }: { id: number; command: string }) => {
      const res = await fetch(`/api/server/${id}/command`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send command");
      }
      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Command Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSaveProperties() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await fetch(`/api/server/${id}/properties`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save properties");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-properties', id] });
      toast({
        title: "Saved",
        description: "server.properties has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddToWhitelist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, playerName }: { id: number; playerName: string }) => {
      const res = await fetch(`/api/server/${id}/whitelist`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add player");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-whitelist', id] });
      toast({ title: "Player added to whitelist" });
    },
    onError: (error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveFromWhitelist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, playerName }: { id: number; playerName: string }) => {
      const res = await fetch(`/api/server/${id}/whitelist/${encodeURIComponent(playerName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove player");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-whitelist', id] });
      toast({ title: "Player removed from whitelist" });
    },
    onError: (error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddOperator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, playerName }: { id: number; playerName: string }) => {
      const res = await fetch(`/api/server/${id}/operators`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add operator");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-operators', id] });
      toast({ title: "Operator added" });
    },
    onError: (error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveOperator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, playerName }: { id: number; playerName: string }) => {
      const res = await fetch(`/api/server/${id}/operators/${encodeURIComponent(playerName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove operator");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-operators', id] });
      toast({ title: "Operator removed" });
    },
    onError: (error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/server/${id}/backup`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create backup");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', id] });
      toast({ title: "Backup Created", description: "Server backup created successfully." });
    },
    onError: (error) => {
      toast({ title: "Backup Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, backupName }: { id: number; backupName: string }) => {
      const res = await fetch(`/api/server/${id}/restore`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to restore backup");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', id] });
      queryClient.invalidateQueries({ queryKey: [api.servers.get.path, id] });
      toast({ title: "Backup Restored", description: "Server has been restored from backup." });
    },
    onError: (error) => {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, backupName }: { id: number; backupName: string }) => {
      const res = await fetch(`/api/server/${id}/backup/${encodeURIComponent(backupName)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete backup");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['server-backups', id] });
      toast({ title: "Backup Deleted" });
    },
    onError: (error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.servers.delete.path, { id });
      const res = await fetch(url, { method: api.servers.delete.method });
      if (!res.ok) throw new Error("Failed to delete server");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.servers.list.path] });
      toast({
        title: "Server Deleted",
        description: "The server has been permanently removed.",
      });
    },
  });
}
