import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IUserType, ITransactionType, IUserSettingsType } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const settingsSchema = z.object({
  theme: z.string(),
  language: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  tokenAlerts: z.boolean(),
  dataAnalytics: z.boolean(),
  marketingCommunications: z.boolean(),
  rateLimit: z.number(),
});

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [filter, setFilter] = useState("all");

  const { data: profile, isLoading: profileLoading } = useQuery<IUserType>({
    queryKey: ["/api/profile"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<IUserSettingsType>({
    queryKey: ["/api/settings"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<ITransactionType[]>({
    queryKey: ["/api/payments"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalSpent: string;
    totalTransactions: number;
    totalTokens: number;
  }>({
    queryKey: ["/api/payments/summary"],
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      company: profile?.company || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("PATCH", "/api/profile/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/profile");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });
      // Logout and redirect handled by auth context
    },
    onError: (error: Error) => {
      toast({
        title: "Account deletion failed",
        description: error.message,
        variant: "destructive",
      });
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

  // Update forms when data loads
  if (profile && !profileForm.formState.isDirty) {
    profileForm.reset({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      company: profile.company || "",
    });
  }

  if (settings && !settingsForm.formState.isDirty) {
    settingsForm.reset({
      ...settings,
      tokenAlerts: settings.tokenAlerts || true,
    });
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

  const downloadInvoice = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/invoice/${transactionId}`);
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice downloaded",
        description: "Your invoice has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const filteredTransactions = transactions?.filter((transaction: any) => {
    if (filter === "all") return true;
    return transaction.status.toLowerCase() === filter;
  }) || [];

  const isLoading = profileLoading || settingsLoading || transactionsLoading || summaryLoading;

  if (isLoading) {
    return (
      <>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Account Management</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your profile, settings, and billing information</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-1 rounded-xl shadow-lg">
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-200">Profile</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-200">Settings</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-200">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8 mt-8">
               <div className="grid lg:grid-cols-3 gap-8">
                 {/* Profile Picture */}
                 <div className="lg:col-span-1">
                   <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                     <CardHeader className="pb-4">
                       <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white">Profile Picture</CardTitle>
                     </CardHeader>
                     <CardContent className="text-center space-y-4">
                       <div className="relative">
                         <Avatar className="w-28 h-28 mx-auto ring-4 ring-white/50 dark:ring-slate-600/50 shadow-lg">
                           <AvatarImage src={profile?.avatar} />
                           <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                             {getInitials(profile?.firstName, profile?.lastName, profile?.username)}
                           </AvatarFallback>
                         </Avatar>
                         <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                           <span className="material-symbols-outlined text-white text-sm">edit</span>
                         </div>
                       </div>
                       <div className="space-y-3">
                         <Button variant="default" size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg" data-testid="button-upload-picture">
                           <span className="material-symbols-outlined mr-1 text-sm">upload</span>
                           Upload New Picture
                         </Button>
                         <Button variant="outline" size="sm" className="border-white/50 dark:border-slate-600/50 hover:bg-white/50 dark:hover:bg-slate-700/50" data-testid="button-remove-picture">
                           <span className="material-symbols-outlined mr-1 text-sm">delete</span>
                           Remove Picture
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 </div>

                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white">Personal Information</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">Update your personal details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-first-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-last-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Email Address</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="tel" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Company</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-company" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl px-8 py-2"
                            data-testid="button-update-profile"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined mr-2 text-sm">save</span>
                                Update Profile
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  {/* Change Password */}
                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white">Change Password</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">Update your account password for security</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Current Password</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-current-password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">New Password</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="password" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-new-password" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="password" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 focus:border-blue-500 rounded-xl" data-testid="input-confirm-password" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg rounded-xl px-8 py-2"
                            data-testid="button-change-password"
                          >
                            {changePasswordMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Changing...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined mr-2 text-sm">lock</span>
                                Change Password
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  {/* Account Actions */}
                  <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-slate-800 dark:text-white">Account Actions</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">Manage your account settings and data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:shadow-md transition-all duration-200">
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Two-Factor Authentication</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Add an extra layer of security to your account</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg" data-testid="button-enable-2fa">
                          <span className="material-symbols-outlined mr-1 text-sm">security</span>
                          Enable 2FA
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl hover:shadow-md transition-all duration-200">
                        <div>
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100">Export Data</h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300">Download a copy of your account data</p>
                        </div>
                        <Button variant="outline" className="border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" data-testid="button-export-data">
                          <span className="material-symbols-outlined mr-1 text-sm">download</span>
                          Export Data
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/50 rounded-xl hover:shadow-md transition-all duration-200">
                        <div>
                          <h4 className="font-semibold text-red-900 dark:text-red-100">Delete Account</h4>
                          <p className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all data</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-lg" data-testid="button-delete-account">
                              <span className="material-symbols-outlined mr-1 text-sm">delete_forever</span>
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50 rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-red-600 dark:text-red-400">Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAccountMutation.mutate()}
                                disabled={deleteAccountMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                data-testid="button-confirm-delete"
                              >
                                {deleteAccountMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined mr-1 text-sm">delete_forever</span>
                                    Delete Account
                                  </>
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-8">
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
            </TabsContent>

            <TabsContent value="billing" className="space-y-8 mt-8">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Spent</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1" data-testid="summary-total-spent">
                          ${summary?.totalSpent || "0.00"}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-blue-500/20 dark:bg-blue-500/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">payments</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total Transactions</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1" data-testid="summary-total-transactions">
                          {summary?.totalTransactions || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-green-500/20 dark:bg-green-500/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">receipt_long</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Tokens Purchased</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1" data-testid="summary-total-tokens">
                          {summary?.totalTokens?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-purple-500/20 dark:bg-purple-500/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">account_balance_wallet</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Table */}
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/30 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white">Recent Transactions</h3>
                    <div className="flex items-center space-x-4">
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-48 bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-lg" data-testid="filter-transactions">
                          <SelectValue placeholder="Filter transactions" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                          <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-800">All Transactions</SelectItem>
                          <SelectItem value="completed" className="hover:bg-slate-100 dark:hover:bg-slate-800">Successful</SelectItem>
                          <SelectItem value="failed" className="hover:bg-slate-100 dark:hover:bg-slate-800">Failed</SelectItem>
                          <SelectItem value="pending" className="hover:bg-slate-100 dark:hover:bg-slate-800">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" data-testid="button-export-csv">
                        <span className="material-symbols-outlined mr-2">download</span>
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 text-4xl">receipt_long</span>
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">No transactions found</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        {filter === "all"
                          ? "You haven't made any transactions yet. Start by purchasing some tokens to power your AI operations."
                          : `No ${filter} transactions found.`
                        }
                      </p>
                      {filter === "all" && (
                        <Button onClick={() => window.location.href = "/tokens"} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl px-6 py-2" data-testid="button-buy-tokens">
                          <span className="material-symbols-outlined mr-2">add</span>
                          Buy Your First Tokens
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/30 dark:border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Transaction ID</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Date</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Package</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Amount</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction: any) => (
                          <TableRow key={transaction.id} className="border-b border-white/20 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                            <TableCell>
                              <span className="font-mono text-sm text-slate-800 dark:text-slate-200" data-testid={`transaction-id-${transaction.id}`}>
                                #{transaction.transactionId}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-slate-800 dark:text-slate-200">{transaction.packageName}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-500">
                                  {transaction.tokens.toLocaleString()} Tokens
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {transaction.currency === "INR" ? "₹" : "$"}{transaction.amount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(transaction.status)} border-0 shadow-sm`} data-testid={`status-${transaction.id}`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  data-testid={`button-view-receipt-${transaction.id}`}
                                >
                                  View Receipt
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() => downloadInvoice(transaction.transactionId)}
                                  disabled={!transaction.invoiceFileName}
                                  data-testid={`button-download-${transaction.id}`}
                                >
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {filteredTransactions.length > 0 && (
                  <div className="p-6 border-t border-white/30 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-800/30 dark:to-gray-800/30">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button variant="outline" size="sm" disabled className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" data-testid="button-previous-page">
                          <span className="material-symbols-outlined mr-1 text-sm">chevron_left</span>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" data-testid="button-next-page">
                          Next
                          <span className="material-symbols-outlined ml-1 text-sm">chevron_right</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}