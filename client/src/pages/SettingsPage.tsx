import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body">
      <Sidebar />
      <MobileHeader />

      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-8">Settings</h1>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <div className="glass-card rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Profile Information</h3>
                  <p className="text-sm text-muted-foreground">Update your account details and email.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input defaultValue="AdminUser" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue="admin@minepanel.com" className="bg-background" />
                  </div>
                </div>
                <Button className="bg-primary text-primary-foreground">Save Changes</Button>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
               <div className="glass-card rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark mode for the dashboard (Default)</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-refresh Stats</Label>
                    <p className="text-sm text-muted-foreground">Update server stats in real-time</p>
                  </div>
                  <Switch defaultChecked />
                </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
