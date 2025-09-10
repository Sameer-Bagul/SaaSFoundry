import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  creditAlerts: z.boolean(),
  dataAnalytics: z.boolean(),
  marketingCommunications: z.boolean(),
  rateLimit: z.number(),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      creditAlerts: true,
      dataAnalytics: true,
      marketingCommunications: false,
      rateLimit: 100,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<z.infer<typeof settingsSchema>>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/regenerate-api-key");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "API key regenerated",
        description: "Your new API key has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to regenerate API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form when settings data loads
  if (settings && !settingsForm.formState.isDirty) {
    settingsForm.reset(settings);
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updateSettingsMutation.mutate({ theme: newTheme });
  };

  const handleSettingChange = (key: keyof z.infer<typeof settingsSchema>, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast({
        title: "API key copied",
        description: "The API key has been copied to your clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and configurations</p>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-mobile-menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 max-w-4xl">
          <div className="space-y-6">
            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the appearance of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="theme-select" className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <Select 
                    value={theme} 
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger className="w-32" id="theme-select" data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="language-select" className="text-base font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  </div>
                  <Select 
                    value={settings?.language || "en"} 
                    onValueChange={(value) => handleSettingChange("language", value)}
                  >
                    <SelectTrigger className="w-32" id="language-select" data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.emailNotifications || false}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings?.pushNotifications || false}
                    onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                    data-testid="switch-push-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="credit-alerts" className="text-base font-medium">Credit Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when credits are running low</p>
                  </div>
                  <Switch
                    id="credit-alerts"
                    checked={settings?.creditAlerts || true}
                    onCheckedChange={(checked) => handleSettingChange("creditAlerts", checked)}
                    data-testid="switch-credit-alerts"
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Settings */}
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Manage your API access and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-key" className="text-base font-medium mb-2 block">API Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="api-key"
                      type="password"
                      value={user?.apiKey || ""}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-api-key"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyApiKey}
                      data-testid="button-copy-api-key"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => regenerateApiKeyMutation.mutate()}
                      disabled={regenerateApiKeyMutation.isPending}
                      data-testid="button-regenerate-api-key"
                    >
                      {regenerateApiKeyMutation.isPending ? "Regenerating..." : "Regenerate"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep your API key secure and never share it publicly
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="rate-limit" className="text-base font-medium">Rate Limit</Label>
                  <p className="text-sm text-muted-foreground mb-2">Maximum requests per minute</p>
                  <Select 
                    value={settings?.rateLimit?.toString() || "100"} 
                    onValueChange={(value) => handleSettingChange("rateLimit", parseInt(value))}
                  >
                    <SelectTrigger id="rate-limit" data-testid="select-rate-limit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 requests per minute</SelectItem>
                      <SelectItem value="500">500 requests per minute</SelectItem>
                      <SelectItem value="1000">1000 requests per minute</SelectItem>
                      <SelectItem value="-1">Unlimited (Enterprise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Control your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-analytics" className="text-base font-medium">Data Analytics</Label>
                    <p className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</p>
                  </div>
                  <Switch
                    id="data-analytics"
                    checked={settings?.dataAnalytics || true}
                    onCheckedChange={(checked) => handleSettingChange("dataAnalytics", checked)}
                    data-testid="switch-data-analytics"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-communications" className="text-base font-medium">Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about new features and offers</p>
                  </div>
                  <Switch
                    id="marketing-communications"
                    checked={settings?.marketingCommunications || false}
                    onCheckedChange={(checked) => handleSettingChange("marketingCommunications", checked)}
                    data-testid="switch-marketing-communications"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => toast({ title: "Settings saved", description: "All changes have been saved automatically." })}
                data-testid="button-save-settings"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
