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
import { IUserSettingsType } from "@shared/schema";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  tokenAlerts: z.boolean(),
  dataAnalytics: z.boolean(),
  marketingCommunications: z.boolean(),
  rateLimit: z.number(),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<IUserSettingsType>({
    queryKey: ["/api/settings"],
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      tokenAlerts: true,
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account preferences and configurations</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="space-y-8 mt-8">
          {/* Appearance Settings */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <span className="material-symbols-outlined mr-2 text-blue-500">palette</span>
                Appearance
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div>
                  <Label htmlFor="theme-select" className="text-base font-semibold text-slate-800 dark:text-white">Theme</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Choose your preferred theme</p>
                </div>
                <Select
                  value={theme}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-lg" id="theme-select" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                    <SelectItem value="system" className="hover:bg-slate-100 dark:hover:bg-slate-800">System</SelectItem>
                    <SelectItem value="light" className="hover:bg-slate-100 dark:hover:bg-slate-800">Light</SelectItem>
                    <SelectItem value="dark" className="hover:bg-slate-100 dark:hover:bg-slate-800">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div>
                  <Label htmlFor="language-select" className="text-base font-semibold text-slate-800 dark:text-white">Language</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Select your preferred language</p>
                </div>
                <Select
                  value={settings?.language || "en"}
                  onValueChange={(value) => handleSettingChange("language", value)}
                >
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-lg" id="language-select" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                    <SelectItem value="en" className="hover:bg-slate-100 dark:hover:bg-slate-800">English</SelectItem>
                    <SelectItem value="es" className="hover:bg-slate-100 dark:hover:bg-slate-800">Español</SelectItem>
                    <SelectItem value="fr" className="hover:bg-slate-100 dark:hover:bg-slate-800">Français</SelectItem>
                    <SelectItem value="de" className="hover:bg-slate-100 dark:hover:bg-slate-800">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <span className="material-symbols-outlined mr-2 text-green-500">notifications</span>
                Notifications
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-semibold text-blue-900 dark:text-blue-100">Email Notifications</Label>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings?.emailNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  className="data-[state=checked]:bg-blue-500"
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
                <div>
                  <Label htmlFor="push-notifications" className="text-base font-semibold text-purple-900 dark:text-purple-100">Push Notifications</Label>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Receive push notifications in your browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings?.pushNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                  className="data-[state=checked]:bg-purple-500"
                  data-testid="switch-push-notifications"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
                <div>
                  <Label htmlFor="token-alerts" className="text-base font-semibold text-orange-900 dark:text-orange-100">Token Alerts</Label>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Get notified when tokens are running low</p>
                </div>
                <Switch
                  id="token-alerts"
                  checked={settings?.tokenAlerts || true}
                  onCheckedChange={(checked) => handleSettingChange("tokenAlerts", checked)}
                  className="data-[state=checked]:bg-orange-500"
                  data-testid="switch-token-alerts"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <span className="material-symbols-outlined mr-2 text-indigo-500">code</span>
                API Settings
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Manage your API access and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
                <Label htmlFor="api-key" className="text-base font-semibold text-indigo-900 dark:text-indigo-100 mb-3 block">API Key</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="api-key"
                    type="password"
                    value={user?.apiKey || ""}
                    readOnly
                    className="font-mono text-sm bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-lg flex-1"
                    data-testid="input-api-key"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyApiKey}
                    className="border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    data-testid="button-copy-api-key"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => regenerateApiKeyMutation.mutate()}
                    disabled={regenerateApiKeyMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                    data-testid="button-regenerate-api-key"
                  >
                    {regenerateApiKeyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center">
                  <span className="material-symbols-outlined mr-1 text-sm">security</span>
                  Keep your API key secure and never share it publicly
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <Label htmlFor="rate-limit" className="text-base font-semibold text-slate-800 dark:text-white mb-2 block">Rate Limit</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Maximum requests per minute</p>
                <Select
                  value={settings?.rateLimit?.toString() || "100"}
                  onValueChange={(value) => handleSettingChange("rateLimit", parseInt(value))}
                >
                  <SelectTrigger id="rate-limit" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-lg" data-testid="select-rate-limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                    <SelectItem value="100" className="hover:bg-slate-100 dark:hover:bg-slate-800">100 requests per minute</SelectItem>
                    <SelectItem value="500" className="hover:bg-slate-100 dark:hover:bg-slate-800">500 requests per minute</SelectItem>
                    <SelectItem value="1000" className="hover:bg-slate-100 dark:hover:bg-slate-800">1000 requests per minute</SelectItem>
                    <SelectItem value="-1" className="hover:bg-slate-100 dark:hover:bg-slate-800">Unlimited (Enterprise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <span className="material-symbols-outlined mr-2 text-teal-500">security</span>
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Control your data and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800/50">
                <div>
                  <Label htmlFor="data-analytics" className="text-base font-semibold text-teal-900 dark:text-teal-100">Data Analytics</Label>
                  <p className="text-sm text-teal-700 dark:text-teal-300">Help us improve by sharing anonymous usage data</p>
                </div>
                <Switch
                  id="data-analytics"
                  checked={settings?.dataAnalytics || true}
                  onCheckedChange={(checked) => handleSettingChange("dataAnalytics", checked)}
                  className="data-[state=checked]:bg-teal-500"
                  data-testid="switch-data-analytics"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-800/50">
                <div>
                  <Label htmlFor="marketing-communications" className="text-base font-semibold text-pink-900 dark:text-pink-100">Marketing Communications</Label>
                  <p className="text-sm text-pink-700 dark:text-pink-300">Receive updates about new features and offers</p>
                </div>
                <Switch
                  id="marketing-communications"
                  checked={settings?.marketingCommunications || false}
                  onCheckedChange={(checked) => handleSettingChange("marketingCommunications", checked)}
                  className="data-[state=checked]:bg-pink-500"
                  data-testid="switch-marketing-communications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => toast({ title: "Settings saved", description: "All changes have been saved automatically." })}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl px-8 py-2"
              data-testid="button-save-settings"
            >
              <span className="material-symbols-outlined mr-2 text-sm">save</span>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
