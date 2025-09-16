import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface TokenPackage {
  tokens: number;
  priceUSD: number;
  priceINR: number;
  name: string;
}

export default function TokensPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("professional");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  const { data: packages, isLoading: packagesLoading } = useQuery<Record<string, TokenPackage>>({
    queryKey: ["/api/credits/packages"],
    select: (res: any) => {
      const list = Array.isArray(res?.packages) ? res.packages : res;
      const map: Record<string, TokenPackage> = {};
      for (const p of Array.isArray(list) ? list : []) {
        const tokens = (p.tokens ?? p.credits) ?? 0;
        const priceUSD = +(tokens * 2).toFixed(2);
        const priceINR = Math.round(priceUSD * 88);
        map[p.id ?? p.key ?? p.name?.toLowerCase() ?? "unknown"] = {
          name: p.name,
          tokens,
          priceUSD,
          priceINR
        };
      }
      return map;
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { packageType: string; currency: string }) => {
      const res = await apiRequest("POST", "/api/tokens/create-order", data);
      return await res.json();
    },
    onSuccess: (orderData) => {
      handleRazorpayPayment(orderData);
    },
    onError: (error: Error) => {
      toast({
        title: "Order creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest("POST", "/api/tokens/verify-payment", paymentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment successful!",
        description: "Tokens have been added to your account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRazorpayPayment = (orderData: any) => {
    if (!packages || !packages[selectedPackage]) {
      toast({
        title: "Package not found",
        description: "Selected package is not available.",
        variant: "destructive",
      });
      return;
    }
    // In a real implementation, you would load the Razorpay SDK
    // and create the payment interface here
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: "AISAAS",
      description: `${packages[selectedPackage].name} - ${packages[selectedPackage].tokens} Tokens`,
      handler: function (response: any) {
        verifyPaymentMutation.mutate({
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      prefill: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
        email: user?.email,
        contact: user?.phone || "",
      },
      theme: {
        color: "#3B82F6",
      },
    };

    // For demonstration purposes, we'll simulate the payment flow
    toast({
      title: "Payment Gateway",
      description: "In a real implementation, Razorpay payment interface would open here.",
    });

    // Simulate successful payment after 2 seconds
    setTimeout(() => {
      verifyPaymentMutation.mutate({
        razorpayOrderId: orderData.orderId,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: "simulated_signature",
      });
    }, 2000);
  };

  const handlePurchase = () => {
    createOrderMutation.mutate({
      packageType: selectedPackage,
      currency,
    });
  };

  if (packagesLoading) {
    return (
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Buy Tokens</h1>
              <p className="text-muted-foreground">Purchase tokens to power your AI operations</p>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-mobile-menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Current Balance */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-2">Current Balance</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-primary" data-testid="text-current-tokens">
                      {user?.tokens?.toLocaleString() || 0} Tokens
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ≈ ${((user?.tokens || 0) * 2).toFixed(2)} USD value
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packages */}
          <div className="mb-8">
            <h3 className="font-heading text-lg font-semibold mb-6">Choose Token Package</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages && Object.entries(packages).map(([key, pkg]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-colors ${
                    selectedPackage === key ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary'
                  } ${key === 'professional' ? 'relative' : ''}`}
                  onClick={() => setSelectedPackage(key)}
                  data-testid={`card-package-${key}`}
                >
                  {key === 'professional' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <h4 className="font-heading text-xl font-semibold mb-2">{pkg.name}</h4>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {pkg.tokens.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground mb-4">Tokens</div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">${pkg.priceUSD} USD</div>
                      <div className="text-sm text-muted-foreground">₹{pkg.priceINR} INR</div>
                    </div>
                    {key === 'professional' && (
                      <div className="mt-4 text-sm text-green-600">
                        Save 10% • Most Popular
                      </div>
                    )}
                    {key === 'enterprise' && (
                      <div className="mt-4 text-sm text-green-600">
                        Save 20% • Best Value
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading text-lg font-semibold mb-6">Payment Details</h3>
                
                {/* Currency Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <Select value={currency} onValueChange={(value: "USD" | "INR") => setCurrency(value)}>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Package Display */}
                {packages && selectedPackage && packages[selectedPackage] && (
                  <div className="mb-6 p-4 bg-muted rounded-lg" data-testid="selected-package-display">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{packages[selectedPackage].name}</div>
                        <div className="text-sm text-muted-foreground">
                          {packages[selectedPackage].tokens.toLocaleString()} Tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {currency === "USD" 
                            ? `$${packages[selectedPackage].priceUSD}` 
                            : `₹${packages[selectedPackage].priceINR}`
                          } {currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handlePurchase}
                  disabled={createOrderMutation.isPending || verifyPaymentMutation.isPending}
                  data-testid="button-pay-with-razorpay"
                >
                  <span className="material-symbols-outlined mr-2">payment</span>
                  {createOrderMutation.isPending || verifyPaymentMutation.isPending
                    ? "Processing..."
                    : "Pay with Razorpay"
                  }
                </Button>

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Secure payment powered by Razorpay. Your payment information is encrypted and secure.
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm font-medium mb-3">Accepted Payment Methods</p>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <span className="material-symbols-outlined">credit_card</span>
                    <span className="material-symbols-outlined">account_balance</span>
                    <span className="material-symbols-outlined">wallet</span>
                    <span className="text-xs">UPI, Cards, Net Banking & More</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
