import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              The Future of <span className="text-primary">AI-Powered</span><br />
              Business Solutions
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
              Transform your business with our comprehensive AI platform. Get powerful tools, seamless integrations, and intelligent automation all in one place.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => setLocation("/auth")} 
                data-testid="button-start-trial"
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                data-testid="button-watch-demo"
              >
                Watch Demo
              </Button>
            </div>
            <div className="mt-16">
              <div className="relative max-w-4xl mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800" 
                  alt="AI Dashboard Preview" 
                  className="w-full rounded-xl shadow-2xl border border-border" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold">Powerful Features</h2>
            <p className="mt-4 text-muted-foreground">Everything you need to scale your business with AI</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "psychology",
                title: "AI Analytics",
                description: "Advanced AI-powered analytics to understand your data and make informed decisions."
              },
              {
                icon: "auto_fix_high",
                title: "Smart Automation",
                description: "Automate repetitive tasks and workflows with intelligent AI assistance."
              },
              {
                icon: "security",
                title: "Enterprise Security",
                description: "Bank-grade security with end-to-end encryption and compliance standards."
              },
              {
                icon: "integration_instructions",
                title: "Easy Integration",
                description: "Connect with your existing tools through our comprehensive API platform."
              },
              {
                icon: "speed",
                title: "Real-time Processing",
                description: "Process data in real-time with our high-performance AI infrastructure."
              },
              {
                icon: "support_agent",
                title: "24/7 Support",
                description: "Get help whenever you need it with our dedicated support team."
              }
            ].map((feature, index) => (
              <Card key={index} className="border border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary-foreground">{feature.icon}</span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold">Simple Pricing</h2>
            <p className="mt-4 text-muted-foreground">Choose the plan that works best for you</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                features: ["10,000 AI Credits", "Basic Analytics", "Email Support"]
              },
              {
                name: "Professional",
                price: "$99",
                popular: true,
                features: ["50,000 AI Credits", "Advanced Analytics", "Priority Support", "API Access"]
              },
              {
                name: "Enterprise",
                price: "$299",
                features: ["Unlimited Credits", "Custom Analytics", "24/7 Phone Support", "Custom Integrations"]
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`${plan.popular ? 'border-2 border-primary relative' : 'border border-border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="font-heading text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="material-symbols-outlined text-primary mr-2">check_circle</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className="w-full"
                    onClick={() => setLocation("/auth")}
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold">What Our Customers Say</h2>
            <p className="mt-4 text-muted-foreground">Trusted by thousands of businesses worldwide</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "John Smith",
                role: "CEO, TechCorp",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
                content: "This AI platform has transformed our business operations. The automation features alone have saved us hundreds of hours per month."
              },
              {
                name: "Sarah Johnson",
                role: "CTO, DataFlow",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b6b2ad2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
                content: "The analytics insights are incredible. We've been able to make data-driven decisions faster than ever before."
              },
              {
                name: "Mike Chen",
                role: "Founder, StartupXYZ",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
                content: "As a startup, we needed a solution that could scale with us. This platform delivers exactly that and more."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={`${testimonial.name} testimonial`} 
                      className="w-12 h-12 rounded-full mr-4" 
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="font-heading font-bold text-xl mb-4">
                <span className="text-primary">AI</span>SAAS
              </div>
              <p className="text-muted-foreground text-sm">
                The next generation AI platform for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 AISAAS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
