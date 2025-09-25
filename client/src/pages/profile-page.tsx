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
import { IUserType } from "@shared/schema";

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

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<IUserType>({
    queryKey: ["/api/profile"],
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

  // Update form when profile data loads
  if (profile && !profileForm.formState.isDirty) {
    profileForm.reset({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      company: profile.company || "",
    });
  }

  if (isLoading) {
    return (
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
    );
  }

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Profile Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account information and preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
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
      </div>
    </>
  );
}
