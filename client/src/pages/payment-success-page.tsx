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

  // Refresh user data to get updated credits
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
          </div>
          <CardTitle className="text-2xl text-green-600" data-testid="text-success-title">
            Payment Successful! 🎉
          </CardTitle>
          <CardDescription>
            Your credits have been added to your account successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">
              Transaction completed successfully
            </p>
            <p className="text-xs text-green-600 mt-1">
              You should see your new credits in your account within a few seconds.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <Badge variant="secondary" className="text-sm">
                {user?.credits || 0} Credits
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              You can start using your credits immediately for AI API calls.
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/app">
              <Button className="w-full" data-testid="button-go-to-dashboard">
                <span className="material-symbols-outlined mr-2">dashboard</span>
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/buy-credits">
              <Button variant="outline" className="w-full" data-testid="button-buy-more-credits">
                <span className="material-symbols-outlined mr-2">add</span>
                Buy More Credits
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
            Auto-redirecting to dashboard in {countdown} seconds...
            <br />
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setLocation("/app")}
              className="text-xs p-0 h-auto"
              data-testid="button-redirect-now"
            >
              Go now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}