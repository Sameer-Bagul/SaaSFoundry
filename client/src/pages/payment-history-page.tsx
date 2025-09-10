import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PaymentHistoryPage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/payments/summary"],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const filteredTransactions = transactions?.filter((transaction: any) => {
    if (filter === "all") return true;
    return transaction.status.toLowerCase() === filter;
  }) || [];

  if (transactionsLoading || summaryLoading) {
    return (
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
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
              <h1 className="font-heading text-2xl font-bold">Payment History</h1>
              <p className="text-muted-foreground">View all your transactions and receipts</p>
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
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Spent</p>
                    <p className="text-2xl font-bold" data-testid="summary-total-spent">
                      ${summary?.totalSpent || "0.00"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">payments</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Transactions</p>
                    <p className="text-2xl font-bold" data-testid="summary-total-transactions">
                      {summary?.totalTransactions || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-chart-2">receipt_long</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Credits Purchased</p>
                    <p className="text-2xl font-bold" data-testid="summary-total-credits">
                      {summary?.totalCredits?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-chart-3">account_balance_wallet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Table */}
          <Card>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold">Recent Transactions</h3>
                <div className="flex items-center space-x-4">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-48" data-testid="filter-transactions">
                      <SelectValue placeholder="Filter transactions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="completed">Successful</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" data-testid="button-export-csv">
                    <span className="material-symbols-outlined mr-2">download</span>
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-muted-foreground text-4xl mb-4 block">receipt_long</span>
                  <h3 className="font-heading text-lg font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === "all" 
                      ? "You haven't made any transactions yet."
                      : `No ${filter} transactions found.`
                    }
                  </p>
                  {filter === "all" && (
                    <Button onClick={() => window.location.href = "/credits"} data-testid="button-buy-credits">
                      Buy Your First Credits
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: any) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/50">
                        <TableCell>
                          <span className="font-mono text-sm" data-testid={`transaction-id-${transaction.id}`}>
                            #{transaction.transactionId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.packageName}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.credits.toLocaleString()} Credits
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {transaction.currency === "INR" ? "₹" : "$"}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)} data-testid={`status-${transaction.id}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto"
                              data-testid={`button-view-receipt-${transaction.id}`}
                            >
                              View Receipt
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto"
                              data-testid={`button-download-${transaction.id}`}
                            >
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {filteredTransactions.length > 0 && (
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
