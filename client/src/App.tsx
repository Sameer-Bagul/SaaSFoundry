import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import AppPage from "@/pages/app-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import PaymentFailurePage from "@/pages/payment-failure-page";
import DashboardPage from "@/pages/dashboard-page";
import NotFound from "@/pages/not-found";
import AccountLayout from "@/components/account-layout";
import AppLayout from "@/components/app-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/app">
        <AppLayout>
          <AppPage />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/dashboard">
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/account" component={AccountLayout} />
      <ProtectedRoute path="/account/:page*" component={AccountLayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
