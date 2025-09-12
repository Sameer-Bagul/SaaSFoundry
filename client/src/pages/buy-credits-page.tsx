import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const creditPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 1000,
    price: { usd: 9.99, inr: 749 },
    description: "Perfect for getting started with AI",
    popular: false,
    features: ["1,000 API Credits", "Basic Support", "30 Days Validity", "Rate Limit: 100/hour"]
  },
  {
    id: "professional",
    name: "Professional",
    credits: 5000,
    price: { usd: 39.99, inr: 2999 },
    description: "Ideal for growing businesses",
    popular: true,
    features: ["5,000 API Credits", "Priority Support", "90 Days Validity", "Rate Limit: 500/hour", "Advanced Analytics"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 15000,
    price: { usd: 99.99, inr: 7499 },
    description: "For large-scale applications",
    popular: false,
    features: ["15,000 API Credits", "24/7 Premium Support", "365 Days Validity", "Rate Limit: 1000/hour", "Custom Integrations", "Dedicated Account Manager"]
  },
  {
    id: "unlimited",
    name: "Unlimited",
    credits: 50000,
    price: { usd: 299.99, inr: 22499 },
    description: "Ultimate power for enterprises",
    popular: false,
    features: ["50,000 API Credits", "White-glove Support", "365 Days Validity", "Unlimited Rate Limit", "Custom AI Models", "Private Cloud Option"]
  }
];

export default function BuyCreditsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

  // Auto-detect billing country based on location (simplified)
  const [billingCountry, setBillingCountry] = useState<string>('US');
  
  useState(() => {
    // In a real app, you might use a geolocation API or user preferences
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Asia/Kolkata') || timezone.includes('India')) {
      setBillingCountry('IN');
      setCurrency('inr');
    } else {
      setBillingCountry('US');
      setCurrency('usd');
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ packageId }: { packageId: string }) => {
      const res = await apiRequest("POST", "/api/payments/create-order", {
        packageId,
        billingCountry
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoadingPackage(null);
    },
  });

  const handlePurchase = async (packageId: string) => {
    setLoadingPackage(packageId);
    
    try {
      const order = await createOrderMutation.mutateAsync({ packageId });
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: order.amount, // Use server-returned amount
        currency: order.currency, // Use server-returned currency
        name: 'SaasHub',
        description: `${order.package.name} - ${order.package.credits} Credits`,
        image: '/favicon.ico',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            await apiRequest("POST", "/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: packageId
            });
            
            // Invalidate user query to refresh credits
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            
            toast({
              title: "Payment Successful! 🎉",
              description: `${selectedPackage.credits} credits have been added to your account.`,
              variant: "default",
            });
            
            setLoadingPackage(null);
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message,
              variant: "destructive",
            });
            setLoadingPackage(null);
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
          email: user?.email,
        },
        notes: {
          package_id: packageId,
          user_id: user?.id,
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            setLoadingPackage(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error: any) {
      toast({
        title: "Payment Setup Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoadingPackage(null);
    }
  };

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat(curr === 'inr' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight" data-testid="text-buy-credits-title">
                Choose Your Credit Package
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select the perfect package for your AI needs. All packages include access to our full suite of AI models.
              </p>
              
              {/* Currency Toggle */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="text-sm text-muted-foreground">Currency:</span>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={currency === 'usd' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrency('usd')}
                    data-testid="button-currency-usd"
                    className="px-3"
                  >
                    🇺🇸 USD
                  </Button>
                  <Button
                    variant={currency === 'inr' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrency('inr')}
                    data-testid="button-currency-inr"
                    className="px-3"
                  >
                    🇮🇳 INR
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Current Balance</CardTitle>
                <CardDescription>Your available credits</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="text-current-credits">
                  {user?.credits || 0} Credits
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enough for approximately {Math.floor((user?.credits || 0) / 5)} AI requests
                </p>
              </CardContent>
            </Card>

            {/* Credit Packages */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {creditPackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`relative ${pkg.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                  data-testid={`card-package-${pkg.id}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        {formatPrice(pkg.price[currency], currency)}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {pkg.credits.toLocaleString()} Credits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(pkg.price[currency] / pkg.credits, currency)} per credit
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full" 
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={loadingPackage === pkg.id}
                      data-testid={`button-buy-${pkg.id}`}
                    >
                      {loadingPackage === pkg.id ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2">payment</span>
                          Buy Now
                        </>
                      )}
                    </Button>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Included:</h4>
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="material-symbols-outlined text-green-500 mr-2 text-base">check</span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Security */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold">Secure Payment Processing</h3>
                  <div className="flex items-center justify-center space-x-6">
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-green-500 mr-2">security</span>
                      <span className="text-sm">256-bit SSL</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-green-500 mr-2">verified</span>
                      <span className="text-sm">PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-green-500 mr-2">account_balance</span>
                      <span className="text-sm">Razorpay Secured</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All payments are processed securely through Razorpay. Your financial information is never stored on our servers.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">How do credits work?</h4>
                  <p className="text-sm text-muted-foreground">Each API call consumes credits based on the model and complexity. Simple text generation uses 1-5 credits, while complex operations may use 10-20 credits.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Do credits expire?</h4>
                  <p className="text-sm text-muted-foreground">Yes, credits have a validity period as mentioned in each package. Unused credits expire after the validity period.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Can I get a refund?</h4>
                  <p className="text-sm text-muted-foreground">We offer refunds for unused credits within 7 days of purchase. Please contact our support team for assistance.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Is there a free tier?</h4>
                  <p className="text-sm text-muted-foreground">New users receive 100 free credits upon registration. You can always purchase additional credits as needed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}