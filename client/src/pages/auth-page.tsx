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
    },
  });

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  const handleRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="font-heading font-bold text-2xl mb-2">
              <span className="text-primary">AI</span>SAAS
            </div>
            <h2 className="font-heading text-3xl font-bold">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Get started with your free account"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isLogin ? "Sign In" : "Register"}</CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Enter your credentials to access your account"
                  : "Fill in your information to create an account"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Social Auth Buttons */}
              <div className="space-y-3">
                <CustomButton 
                  variant="outline" 
                  className="w-full" 
                  data-testid="button-google-auth"
                >
                  <span className="material-symbols-outlined mr-2">google</span>
                  Continue with Google
                </CustomButton>
                <CustomButton 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-apple-auth"
                >
                  <span className="material-symbols-outlined mr-2">apple</span>
                  Continue with Apple
                </CustomButton>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Login Form */}
              {isLogin ? (
                <CustomForm onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <CustomInput
                    label="Username"
                    placeholder="Enter your username"
                    data-testid="input-username"
                    error={loginForm.formState.errors.username?.message}
                    {...loginForm.register("username")}
                  />
                  <CustomInput
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    data-testid="input-password"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                  <div className="flex items-center justify-between">
                    <CustomCheckbox 
                      id="remember" 
                      label="Remember me"
                    />
                    <CustomButton variant="ghost" size="sm">
                      Forgot password?
                    </CustomButton>
                  </div>
                  <CustomButton 
                    type="submit" 
                    className="w-full" 
                    loading={loginMutation.isPending}
                    data-testid="button-sign-in"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </CustomButton>
                </CustomForm>
              ) : (
                /* Register Form */
                <CustomForm onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <div className="grid grid-cols-2 gap-4">
                    <CustomInput
                      label="First Name"
                      placeholder="John"
                      data-testid="input-first-name"
                      error={registerForm.formState.errors.firstName?.message}
                      {...registerForm.register("firstName")}
                    />
                    <CustomInput
                      label="Last Name"
                      placeholder="Doe"
                      data-testid="input-last-name"
                      error={registerForm.formState.errors.lastName?.message}
                      {...registerForm.register("lastName")}
                    />
                  </div>
                  <CustomInput
                    label="Username"
                    placeholder="Choose a username"
                    data-testid="input-register-username"
                    error={registerForm.formState.errors.username?.message}
                    {...registerForm.register("username")}
                  />
                  <CustomInput
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    data-testid="input-email"
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register("email")}
                  />
                  <CustomInput
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    data-testid="input-register-password"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register("password")}
                  />
                  <CustomInput
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    data-testid="input-confirm-password"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register("confirmPassword")}
                  />
                  <CustomButton 
                    type="submit" 
                    className="w-full" 
                    loading={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </CustomButton>
                </CustomForm>
              )}

              {/* Mobile Auth Option */}
              <Separator />
              <CustomButton 
                variant="outline" 
                className="w-full"
                data-testid="button-phone-auth"
              >
                <span className="material-symbols-outlined mr-2">phone</span>
                Sign in with Phone Number
              </CustomButton>

              {/* Toggle between login/register */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <CustomButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLogin(!isLogin)}
                    data-testid="button-toggle-auth"
                  >
                    {isLogin ? "Sign up for free" : "Sign in"}
                  </CustomButton>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary-foreground text-3xl">psychology</span>
          </div>
          <h3 className="font-heading text-2xl font-bold mb-4">
            Welcome to the Future of AI
          </h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of businesses that are already using our AI platform to transform their operations and drive growth.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <span className="material-symbols-outlined text-primary mr-2">check_circle</span>
              <span>Advanced AI Analytics</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="material-symbols-outlined text-primary mr-2">check_circle</span>
              <span>Real-time Processing</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="material-symbols-outlined text-primary mr-2">check_circle</span>
              <span>Enterprise-grade Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
