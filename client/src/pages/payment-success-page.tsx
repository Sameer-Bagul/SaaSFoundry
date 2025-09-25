import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // Redirect to app after countdown
    const redirectTimer = setTimeout(() => {
      setLocation("/app");
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [setLocation]);

  // Refresh user data to get updated tokens
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/20 dark:via-slate-900 dark:to-emerald-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/30 dark:border-slate-700/50 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
          </div>
          <CardTitle className="text-3xl text-green-600 dark:text-green-400 font-bold" data-testid="text-success-title">
            Payment Successful! 🎉
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
            Your tokens have been added to your account successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border border-green-200 dark:border-green-800/50">
            <p className="text-base text-green-800 dark:text-green-200 font-semibold">
              Transaction completed successfully
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              You should see your new tokens in your account within a few seconds.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/30 dark:border-slate-600/50">
              <span className="text-base text-slate-700 dark:text-slate-300 font-medium">Current Balance:</span>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-base px-4 py-2">
                {user?.tokens || 0} Tokens
              </Badge>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              You can start using your tokens immediately for AI API calls.
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/app">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl h-12 text-base font-semibold" data-testid="button-go-to-dashboard">
                <span className="material-symbols-outlined mr-2">dashboard</span>
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/tokens">
              <Button variant="outline" className="w-full border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl h-12 text-base" data-testid="button-buy-more-tokens">
                <span className="material-symbols-outlined mr-2">add</span>
                Buy More Tokens
              </Button>
            </Link>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            Auto-redirecting to dashboard in {countdown} seconds...
            <br />
            <Button
              variant="link"
              size="sm"
              onClick={() => setLocation("/app")}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm p-0 h-auto mt-2"
              data-testid="button-redirect-now"
            >
              Go now →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}