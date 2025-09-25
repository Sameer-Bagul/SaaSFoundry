import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  children,
}: {
  path: string;
  component?: () => React.JSX.Element;
  children?: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute check', { path, isLoading, hasUser: !!user, userId: user?.id });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: Redirecting to /auth', { path });
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log('ProtectedRoute: Allowing access', { path, userId: user.id });

  if (children) {
    return <Route path={path}>{children}</Route>;
  }

  if (Component) {
    return <Component />;
  }

  return null;
}
