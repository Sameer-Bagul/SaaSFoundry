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
import BuyCreditsPage from "@/pages/buy-credits-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import PaymentFailurePage from "@/pages/payment-failure-page";
import DashboardPage from "@/pages/dashboard-page";
import CreditsPage from "@/pages/credits-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import PaymentHistoryPage from "@/pages/payment-history-page";
import SupportPage from "@/pages/support-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/app" component={AppPage} />
      <ProtectedRoute path="/buy-credits" component={BuyCreditsPage} />
      <ProtectedRoute path="/payment/success" component={PaymentSuccessPage} />
      <ProtectedRoute path="/payment/failure" component={PaymentFailurePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/credits" component={CreditsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/payments" component={PaymentHistoryPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
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
