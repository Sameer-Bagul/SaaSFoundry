import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation, useParams } from "wouter";
import Navbar from "@/components/navbar";

// Import account-related pages
import AccountPage from "@/pages/account-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import TokensPage from "@/pages/tokens-page";
import PaymentHistoryPage from "@/pages/payment-history-page";
import SupportPage from "@/pages/support-page";

const accountNavigation = [
  { name: "Overview", href: "/account", key: "", icon: "account_circle" },
  { name: "Profile", href: "/account/profile", key: "profile", icon: "person" },
  { name: "Settings", href: "/account/settings", key: "settings", icon: "settings" },
  { name: "Tokens", href: "/account/tokens", key: "tokens", icon: "key" },
  { name: "Payment History", href: "/account/payment-history", key: "payment-history", icon: "payment" },
  { name: "Support", href: "/account/support", key: "support", icon: "support" },
];

function AccountSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 px-6 border-b border-border">
        <Link href="/dashboard">
          <div className="font-heading font-bold text-xl cursor-pointer">
            <span className="text-primary">AI</span>SAAS
          </div>
        </Link>
      </div>

      <nav className="flex-1 mt-6 px-3">
        <div className="space-y-1">
          {accountNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={onNavigate}
                  data-testid={`account-nav-${item.key || 'overview'}`}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto pb-6">
        <Separator className="my-4" />
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={onNavigate}
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Back to Dashboard
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function AccountLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const params = useParams();
  const page = params.page || "";

  const renderPage = () => {
    switch (page) {
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      case "tokens":
        return <TokensPage />;
      case "payment-history":
        return <PaymentHistoryPage />;
      case "support":
        return <SupportPage />;
      default:
        return <AccountPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background">
          <AccountSidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <AccountSidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-72">
        <Navbar />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AccountLayout;
