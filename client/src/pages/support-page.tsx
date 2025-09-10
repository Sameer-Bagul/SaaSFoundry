import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { insertSupportTicketSchema } from "@shared/schema";

const supportTicketSchema = insertSupportTicketSchema.extend({
  userId: z.string().optional(),
});

const faqs = [
  {
    question: "How do AI credits work?",
    answer: "AI credits are consumed each time you make an API call or use our AI services. Different operations consume different amounts of credits based on complexity and computational requirements. You can monitor your credit usage in your dashboard and purchase additional credits as needed."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can change your credit package at any time. Simply visit the Buy Credits page and select your preferred package. There are no long-term commitments, and you can adjust your usage based on your needs."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through Razorpay, including credit cards, debit cards, UPI, net banking, and digital wallets. Payments are processed securely with bank-grade encryption."
  },
  {
    question: "How secure is my data?",
    answer: "We take data security very seriously. All data is encrypted in transit and at rest using industry-standard encryption. We comply with major security standards and regularly audit our systems for vulnerabilities."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer refunds on a case-by-case basis. If you're not satisfied with our service, please contact our support team within 30 days of your purchase, and we'll work with you to find a solution."
  },
  {
    question: "How can I integrate your API?",
    answer: "Integration is straightforward with our comprehensive API documentation. You'll need your API key (found in Settings) and can make HTTP requests to our endpoints. We provide SDKs for popular programming languages and detailed examples."
  }
];

export default function SupportPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  const supportForm = useForm<z.infer<typeof supportTicketSchema>>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      category: "",
      message: "",
    },
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/support/tickets"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supportTicketSchema>) => {
      const res = await apiRequest("POST", "/api/support/tickets", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Support ticket created",
        description: "Your support ticket has been submitted successfully. We'll get back to you soon!",
      });
      supportForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitTicket = (data: z.infer<typeof supportTicketSchema>) => {
    createTicketMutation.mutate(data);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Help & Support</h1>
              <p className="text-muted-foreground">Get help and find answers to common questions</p>
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
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                search
              </span>
              <Input
                type="text"
                placeholder="Search for help articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-help"
              />
            </div>
          </div>

          {/* Quick Help Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:border-primary transition-colors cursor-pointer" data-testid="card-getting-started">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">help</span>
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">Getting Started</h3>
                <p className="text-muted-foreground text-sm">Learn the basics and set up your account</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" data-testid="card-api-docs">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-chart-2">code</span>
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">API Documentation</h3>
                <p className="text-muted-foreground text-sm">Integrate our AI services into your applications</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" data-testid="card-billing-help">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-chart-3">account_balance_wallet</span>
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">Billing & Credits</h3>
                <p className="text-muted-foreground text-sm">Understand pricing, billing, and credit usage</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* FAQ Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Find answers to common questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredFaqs.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-muted-foreground text-4xl mb-2 block">search_off</span>
                        <p className="text-muted-foreground">No FAQs found matching your search.</p>
                      </div>
                    ) : (
                      filteredFaqs.map((faq, index) => (
                        <Collapsible
                          key={index}
                          open={openFaqs.includes(index)}
                          onOpenChange={() => toggleFaq(index)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full text-left p-4 hover:bg-accent transition-colors flex items-center justify-between border border-border rounded-lg"
                              data-testid={`faq-toggle-${index}`}
                            >
                              <span className="font-medium">{faq.question}</span>
                              <span className="material-symbols-outlined">
                                {openFaqs.includes(index) ? 'expand_less' : 'expand_more'}
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                            {faq.answer}
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Support Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>Get in touch with our team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer" data-testid="contact-email">
                    <span className="material-symbols-outlined text-primary">email</span>
                    <div>
                      <div className="font-medium">Email Support</div>
                      <div className="text-sm text-muted-foreground">support@aisaas.com</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer" data-testid="contact-forum">
                    <span className="material-symbols-outlined text-primary">forum</span>
                    <div>
                      <div className="font-medium">Community Forum</div>
                      <div className="text-sm text-muted-foreground">Get help from community</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer" data-testid="contact-chat">
                    <span className="material-symbols-outlined text-primary">chat</span>
                    <div>
                      <div className="font-medium">Live Chat</div>
                      <div className="text-sm text-muted-foreground">Chat with our team</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submit a Ticket</CardTitle>
                  <CardDescription>Create a support ticket for personalized help</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...supportForm}>
                    <form onSubmit={supportForm.handleSubmit(handleSubmitTicket)} className="space-y-4">
                      <FormField
                        control={supportForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Brief description of your issue"
                                data-testid="input-ticket-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={supportForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-ticket-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technical">Technical Issue</SelectItem>
                                <SelectItem value="billing">Billing Question</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                                <SelectItem value="account">Account Issue</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={supportForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder="Describe your issue in detail..."
                                data-testid="textarea-ticket-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createTicketMutation.isPending}
                        data-testid="button-submit-ticket"
                      >
                        {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* My Tickets */}
              {tickets && tickets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Tickets</CardTitle>
                    <CardDescription>Your recent support tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tickets.slice(0, 3).map((ticket: any) => (
                        <div key={ticket.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{ticket.subject}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
