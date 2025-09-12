import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/app", icon: "dashboard" },
  { name: "Buy Credits", href: "/buy-credits", icon: "account_balance_wallet" },
  { name: "Credits", href: "/credits", icon: "toll" },
  { name: "Profile", href: "/profile", icon: "person" },
  { name: "Payment History", href: "/payments", icon: "receipt_long" },
  { name: "Settings", href: "/settings", icon: "settings" },
  { name: "Help & Support", href: "/support", icon: "help" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 px-6 border-b border-border">
        <div className="font-heading font-bold text-xl">
          <span className="text-primary">AI</span>SAAS
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/app" && location === "/");
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
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </nav>
    </div>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r border-border">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full bg-card">
            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
              <div className="font-heading font-bold text-xl">
                <span className="text-primary">AI</span>SAAS
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                data-testid="button-close-sidebar"
              >
                <span className="material-symbols-outlined">close</span>
              </Button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
