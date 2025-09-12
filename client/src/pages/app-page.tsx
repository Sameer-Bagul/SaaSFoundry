import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// Sample data for charts
const apiUsageData = [
  { name: "Mon", calls: 120, success: 118 },
  { name: "Tue", calls: 190, success: 185 },
  { name: "Wed", calls: 280, success: 270 },
  { name: "Thu", calls: 220, success: 215 },
  { name: "Fri", calls: 350, success: 340 },
  { name: "Sat", calls: 180, success: 175 },
  { name: "Sun", calls: 290, success: 285 },
];

const creditsUsageData = [
  { name: "Week 1", used: 450, remaining: 550 },
  { name: "Week 2", used: 380, remaining: 620 },
  { name: "Week 3", used: 520, remaining: 480 },
  { name: "Week 4", used: 340, remaining: 660 },
];

export default function AppPage() {
  const { user } = useAuth();

  // Fetch user stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api", "user", "stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-welcome">
                  Welcome back, {user?.firstName || user?.username}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's what's happening with your AI applications today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {user?.credits || 0} Credits
                </Badge>
                <Link href="/buy-credits">
                  <Button data-testid="button-buy-credits">
                    <span className="material-symbols-outlined mr-2">add</span>
                    Buy Credits
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                  <span className="material-symbols-outlined h-4 w-4 text-muted-foreground">trending_up</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-api-calls">1,847</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                  <span className="material-symbols-outlined h-4 w-4 text-muted-foreground">account_balance_wallet</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-credits-used">2,341</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-blue-600">68%</span> of monthly limit
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <span className="material-symbols-outlined h-4 w-4 text-muted-foreground">check_circle</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-success-rate">98.2%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+0.5%</span> from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                  <span className="material-symbols-outlined h-4 w-4 text-muted-foreground">psychology</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-models">5</div>
                  <p className="text-xs text-muted-foreground">
                    GPT-4, Claude, Gemini + 2 more
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* API Usage Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>API Usage Overview</CardTitle>
                  <CardDescription>Your API calls and success rates over the last week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={apiUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="calls" fill="hsl(var(--primary))" />
                        <Bar dataKey="success" fill="hsl(var(--primary) / 0.6)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Credits Usage Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Credits Usage</CardTitle>
                  <CardDescription>Monthly credits consumption pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={creditsUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="used" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Actions */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-new-api-key">
                    <span className="material-symbols-outlined mr-2">key</span>
                    Generate API Key
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-docs">
                    <span className="material-symbols-outlined mr-2">description</span>
                    View Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-test-api">
                    <span className="material-symbols-outlined mr-2">play_arrow</span>
                    Test API Endpoints
                  </Button>
                  <Separator />
                  <Button variant="outline" className="w-full justify-start" data-testid="button-contact-support">
                    <span className="material-symbols-outlined mr-2">support_agent</span>
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest API calls and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "API Call", endpoint: "/ai/generate-text", status: "success", time: "2 minutes ago", credits: 5 },
                      { action: "Credit Purchase", endpoint: "1000 Credits", status: "completed", time: "1 hour ago", credits: 1000 },
                      { action: "API Call", endpoint: "/ai/analyze-sentiment", status: "success", time: "2 hours ago", credits: 3 },
                      { action: "API Key", endpoint: "Generated new key", status: "created", time: "1 day ago", credits: 0 },
                      { action: "API Call", endpoint: "/ai/summarize", status: "failed", time: "2 days ago", credits: 0 },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' || activity.status === 'completed' || activity.status === 'created' 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.endpoint}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={activity.status === 'success' || activity.status === 'completed' || activity.status === 'created' ? "default" : "destructive"}
                            className="mb-1"
                          >
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                          {activity.credits > 0 && (
                            <p className="text-xs text-primary">{activity.credits} credits</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Usage</CardTitle>
                <CardDescription>Your current usage vs. limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>API Calls</span>
                    <span>1,847 / 5,000</span>
                  </div>
                  <Progress value={36.9} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Credits Used</span>
                    <span>2,341 / 3,500</span>
                  </div>
                  <Progress value={66.9} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Storage</span>
                    <span>12.4 GB / 50 GB</span>
                  </div>
                  <Progress value={24.8} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}