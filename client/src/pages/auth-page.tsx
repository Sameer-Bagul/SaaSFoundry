import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { CustomInput, CustomButton, CustomCheckbox, CustomForm } from "@/components/custom-form";

type LoginData = {
  username: string;
  password: string;
};

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number").optional(),
  country: z.string().min(1, "Please select your country"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/app");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/app"),
    });
  };

  const handleRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => setLocation("/app"),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md animate-in slide-in-from-left-4 duration-700">
            {/* Logo and Header */}
            <div className="text-center mb-8 animate-in fade-in duration-500 delay-200">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25 animate-in zoom-in duration-500 delay-300">
                  <span className="material-symbols-outlined text-white text-4xl animate-pulse">psychology</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl blur-xl animate-pulse"></div>
              </div>
              <div className="font-heading font-bold text-4xl mb-3">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-in fade-in duration-500 delay-400">
                  SaaS
                </span>
                <span className="text-foreground animate-in fade-in duration-500 delay-500">Hub</span>
              </div>
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-2 animate-in fade-in duration-500 delay-600">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground animate-in fade-in duration-500 delay-700">
                {isLogin ? "Sign in to your account" : "Get started with your free account"}
              </p>
            </div>

            {/* Auth Card with Glassmorphism */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-black/10 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {isLogin ? "Sign In" : "Register"}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isLogin
                      ? "Enter your credentials to access your account"
                      : "Fill in your information to create an account"
                    }
                  </p>
                </div>

                {/* Social Auth Buttons */}
                <div className="space-y-3 mb-6">
                  <button className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all hover:shadow-lg hover:scale-[1.02] animate-in fade-in duration-500 delay-800">
                    <span className="material-symbols-outlined mr-3 text-slate-600 dark:text-slate-400">google</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Continue with Google</span>
                  </button>
                 
                </div>

                {/* Divider */}
                <div className="relative mb-6 animate-in fade-in duration-500 delay-1000">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 dark:bg-slate-900/80 px-3 text-muted-foreground font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Forms */}
                {isLogin ? (
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5 animate-in fade-in duration-500 delay-1100">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-500 animate-in slide-in-from-left-2 duration-300">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500 animate-in slide-in-from-left-2 duration-300">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                      </label>
                      <button type="button" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5 animate-in fade-in duration-500 delay-1100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                        <input
                          type="text"
                          placeholder="John"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                      <input
                        type="text"
                        placeholder="Choose a username"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                          {...registerForm.register("phone")}
                        />
                        {registerForm.formState.errors.phone && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                          {...registerForm.register("country")}
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="IN">India</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="JP">Japan</option>
                          <option value="SG">Singapore</option>
                          <option value="other">Other</option>
                        </select>
                        {registerForm.formState.errors.country && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.country.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input
                        type="password"
                        placeholder="Create a password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </form>
                )}

                {/* Phone Auth */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-500 delay-1200">
                  <button className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                    <span className="material-symbols-outlined mr-3 text-slate-600 dark:text-slate-400">phone</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sign in with Phone Number</span>
                  </button>
                </div>

                {/* Toggle */}
                <div className="text-center mt-6 animate-in fade-in duration-500 delay-1300">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      {isLogin ? "Sign up for free" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative">
          <div className="max-w-lg text-center animate-in slide-in-from-right-4 duration-700 delay-500">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25 animate-pulse">
                <span className="material-symbols-outlined text-white text-5xl">psychology</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl blur-2xl animate-pulse"></div>
            </div>

            <h3 className="font-heading text-3xl font-bold text-foreground mb-6 animate-in fade-in duration-500 delay-700">
              Welcome to the Future of AI
            </h3>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed animate-in fade-in duration-500 delay-800">
              Join thousands of businesses that are already using our AI platform to transform their operations and drive growth.
            </p>

            <div className="space-y-4 animate-in fade-in duration-500 delay-900">
              <div className="flex items-center justify-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">check_circle</span>
                </div>
                <span className="text-foreground font-medium">Advanced AI Analytics</span>
              </div>

              <div className="flex items-center justify-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">speed</span>
                </div>
                <span className="text-foreground font-medium">Real-time Processing</span>
              </div>

              <div className="flex items-center justify-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">security</span>
                </div>
                <span className="text-foreground font-medium">Enterprise-grade Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
