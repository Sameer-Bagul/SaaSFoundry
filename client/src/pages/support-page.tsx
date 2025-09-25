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
import { insertSupportTicketSchema, ISupportTicketType } from "@shared/schema";

const supportTicketSchema = insertSupportTicketSchema.extend({
  userId: z.string().optional(),
});

const faqs = [
  {
    question: "How do AI tokens work?",
    answer: "AI tokens are consumed each time you make an API call or use our AI services. Different operations consume different amounts of tokens based on complexity and computational requirements. You can monitor your token usage in your dashboard and purchase additional tokens as needed."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can change your token package at any time. Simply visit the Buy Tokens page and select your preferred package. There are no long-term commitments, and you can adjust your usage based on your needs."
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

  const { data: tickets, isLoading: ticketsLoading } = useQuery<ISupportTicketType[]>({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Help & Support</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Get help and find answers to common questions</p>
            </div>
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
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl hover:scale-105 cursor-pointer group" data-testid="card-getting-started">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">help</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">Getting Started</h3>
                <p className="text-slate-600 dark:text-slate-400 text-base">Learn the basics and set up your account</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl hover:scale-105 cursor-pointer group" data-testid="card-api-docs">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">code</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">API Documentation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-base">Integrate our AI services into your applications</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl hover:scale-105 cursor-pointer group" data-testid="card-billing-help">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">account_balance_wallet</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white mb-3">Billing & Credits</h3>
                <p className="text-slate-600 dark:text-slate-400 text-base">Understand pricing, billing, and credit usage</p>
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
