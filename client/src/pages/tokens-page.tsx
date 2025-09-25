import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TokenPackage {
  tokens: number;
  priceUSD: number;
  priceINR: number;
  name: string;
}

export default function TokensPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>("10");
  const [currency, setCurrency] = useState<"USD" | "INR">(user?.country === "IN" || user?.country === "India" ? "INR" : "USD");
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const { data: packages, isLoading: packagesLoading } = useQuery<Record<string, TokenPackage>>({
    queryKey: ["/api/tokens/packages"],
    select: (res: any) => {
      const list = Array.isArray(res?.packages) ? res.packages : res;
      const map: Record<string, TokenPackage> = {};
      for (const p of Array.isArray(list) ? list : []) {
        const tokens = p.tokens ?? 0;
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
    mutationFn: async (data: { packageId?: string; billingCountry: string; customTokens?: number }) => {
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
    // Load Razorpay SDK if not already loaded
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        openRazorpayCheckout(orderData);
      };
      script.onerror = () => {
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please try again.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    } else {
      openRazorpayCheckout(orderData);
    }
  };

  const openRazorpayCheckout = (orderData: any) => {
    const options = {
      key: orderData.key || process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.id, // Use orderData.id instead of orderId
      name: "AISAAS",
      description: `${orderData.package.name} - ${orderData.package.tokens} Tokens`,
      handler: function (response: any) {
        // Payment successful
        verifyPaymentMutation.mutate({
          razorpayOrderId: orderData.id,
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
      modal: {
        ondismiss: function() {
          // Payment cancelled by user
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled. You can try again.",
            variant: "destructive",
          });
        }
      }
    };

    const razorpayInstance = new (window as any).Razorpay(options);
    razorpayInstance.open();
  };

  const handlePurchase = () => {
    const billingCountry = currency === 'INR' ? 'IN' : 'US';

    if (isCustom && customQuantity) {
      createOrderMutation.mutate({
        customTokens: parseInt(customQuantity),
        billingCountry,
      });
    } else {
      createOrderMutation.mutate({
        packageId: selectedPackage,
        billingCountry,
      });
    }
  };

  if (packagesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Buy Tokens</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Purchase tokens to power your AI operations</p>
          </div>
        </div>
      </div>

      <div className="p-6">
          {/* Current Balance */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Current Balance</h3>
                  <div className="flex items-center space-x-6">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-current-tokens">
                      {user?.tokens?.toLocaleString() || 0}
                      <span className="text-2xl ml-2">Tokens</span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                      ≈ ${((user?.tokens || 0) * 2).toFixed(2)} USD value
                    </div>
                  </div>
                </div>
                <div className="w-20 h-20 bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">account_balance_wallet</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Packages */}
          <div className="mb-8">
            <h3 className="font-heading text-2xl font-semibold text-slate-800 dark:text-white mb-8 text-center">Choose Token Package</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 10 Tokens */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPackage === "10" && !isCustom
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800/50 shadow-xl'
                    : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 shadow-lg hover:shadow-xl'
                } rounded-2xl`}
                onClick={() => { setSelectedPackage("10"); setIsCustom(false); }}
                data-testid="card-package-10"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">token</span>
                  </div>
                  <h4 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">Starter Pack</h4>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10</div>
                  <div className="text-slate-600 dark:text-slate-400 mb-6">Tokens</div>
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-slate-800 dark:text-white">$20 USD</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">₹1,760 INR</div>
                  </div>
                </CardContent>
              </Card>

              {/* 50 Tokens */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 relative ${
                  selectedPackage === "50" && !isCustom
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-800/50 shadow-xl'
                    : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 hover:border-green-300 dark:hover:border-green-600 shadow-lg hover:shadow-xl'
                } rounded-2xl`}
                onClick={() => { setSelectedPackage("50"); setIsCustom(false); }}
                data-testid="card-package-50"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    🔥 Most Popular
                  </span>
                </div>
                <CardContent className="p-8 text-center pt-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">stars</span>
                  </div>
                  <h4 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">Pro Pack</h4>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">50</div>
                  <div className="text-slate-600 dark:text-slate-400 mb-6">Tokens</div>
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-slate-800 dark:text-white">$100 USD</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">₹8,800 INR</div>
                  </div>
                  <div className="mt-6 text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full inline-block">
                    Best Value
                  </div>
                </CardContent>
              </Card>

              {/* 100 Tokens */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPackage === "100" && !isCustom
                    ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-300 dark:border-purple-600 ring-2 ring-purple-200 dark:ring-purple-800/50 shadow-xl'
                    : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-600 shadow-lg hover:shadow-xl'
                } rounded-2xl`}
                onClick={() => { setSelectedPackage("100"); setIsCustom(false); }}
                data-testid="card-package-100"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">diamond</span>
                  </div>
                  <h4 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">Enterprise Pack</h4>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">100</div>
                  <div className="text-slate-600 dark:text-slate-400 mb-6">Tokens</div>
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-slate-800 dark:text-white">$200 USD</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">₹17,600 INR</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Custom Quantity */}
            <div className="mt-8">
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isCustom
                    ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-300 dark:border-orange-600 ring-2 ring-orange-200 dark:ring-orange-800/50 shadow-xl'
                    : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 hover:border-orange-300 dark:hover:border-orange-600 shadow-lg hover:shadow-xl'
                } rounded-2xl`}
                onClick={() => setIsCustom(true)}
                data-testid="card-package-custom"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">tune</span>
                  </div>
                  <h4 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-4">Custom Quantity</h4>
                  <div className="mb-6">
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter token quantity"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-white/30 dark:border-slate-600/50 rounded-xl text-center text-2xl font-bold focus:border-orange-500 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 mb-6">Tokens</div>
                  {customQuantity && parseInt(customQuantity) > 0 && (
                    <div className="space-y-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        ${(parseInt(customQuantity) * 2).toFixed(2)} USD
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        ₹{(parseInt(customQuantity) * 176).toLocaleString()} INR
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Form */}
          <div className="max-w-lg mx-auto">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl rounded-2xl">
              <CardContent className="p-8">
                <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-8 text-center">Payment Details</h3>

                {/* Currency Selector */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Select Currency</label>
                  <Select value={currency} onValueChange={(value: "USD" | "INR") => setCurrency(value)}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-xl h-12" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                      <SelectItem value="USD" className="hover:bg-slate-100 dark:hover:bg-slate-800">🇺🇸 USD - US Dollar</SelectItem>
                      <SelectItem value="INR" className="hover:bg-slate-100 dark:hover:bg-slate-800">🇮🇳 INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Package Display */}
                {(selectedPackage && !isCustom) || (isCustom && customQuantity && parseInt(customQuantity) > 0) ? (
                  <div className="mb-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50" data-testid="selected-package-display">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg text-slate-800 dark:text-white">
                          {isCustom ? `${customQuantity} Tokens` : `${selectedPackage} Tokens`}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {isCustom ? parseInt(customQuantity).toLocaleString() : parseInt(selectedPackage).toLocaleString()} Tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">
                          {currency === "USD"
                            ? `$${(isCustom ? parseInt(customQuantity) * 2 : parseInt(selectedPackage) * 2).toFixed(2)}`
                            : `₹${(isCustom ? parseInt(customQuantity) * 176 : parseInt(selectedPackage) * 176).toLocaleString()}`
                          }
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{currency}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Payment Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-2xl h-14 text-lg font-semibold"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={createOrderMutation.isPending || verifyPaymentMutation.isPending}
                  data-testid="button-pay-with-razorpay"
                >
                  {createOrderMutation.isPending || verifyPaymentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined mr-3 text-xl">payment</span>
                      Pay with Razorpay
                    </>
                  )}
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center">
                    <span className="material-symbols-outlined mr-2 text-green-500">security</span>
                    Secure payment powered by Razorpay. Your payment information is encrypted and secure.
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="mt-8 pt-8 border-t border-white/30 dark:border-slate-700/50">
                  <p className="text-lg font-semibold text-slate-800 dark:text-white mb-4 text-center">Accepted Payment Methods</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/30 dark:border-slate-600/50">
                      <span className="material-symbols-outlined text-blue-500">credit_card</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">Credit/Debit Cards</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/30 dark:border-slate-600/50">
                      <span className="material-symbols-outlined text-green-500">account_balance</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">Net Banking</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/30 dark:border-slate-600/50">
                      <span className="material-symbols-outlined text-purple-500">wallet</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">Digital Wallets</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/30 dark:border-slate-600/50">
                      <span className="material-symbols-outlined text-orange-500">smartphone</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">UPI</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </>
  );
}
