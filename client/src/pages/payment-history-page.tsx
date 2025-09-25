import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ITransactionType } from "@shared/schema";

export default function PaymentHistoryPage() {
  const [filter, setFilter] = useState("all");

  const { data: transactions, isLoading: transactionsLoading } = useQuery<ITransactionType[]>({
    queryKey: ["/api/payments"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalSpent: string;
    totalTransactions: number;
    totalTokens: number;
  }>({
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
      <>
        <div className="p-6">
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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Payment History</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">View all your transactions and receipts</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Total Spent</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2" data-testid="summary-total-spent">
                      ${summary?.totalSpent || "0.00"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">payments</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">Total Transactions</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2" data-testid="summary-total-transactions">
                      {summary?.totalTransactions || 0}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-green-500/20 dark:bg-green-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">receipt_long</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">Tokens Purchased</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2" data-testid="summary-total-tokens">
                      {summary?.totalTokens?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-500/20 dark:bg-purple-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">account_balance_wallet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Table */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/30 dark:border-slate-700/50 shadow-xl rounded-2xl">
            <div className="p-8 border-b border-white/30 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold text-slate-800 dark:text-white">Recent Transactions</h3>
                <div className="flex items-center space-x-4">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-52 bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/50 rounded-xl" data-testid="filter-transactions">
                      <SelectValue placeholder="Filter transactions" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/30 dark:border-slate-700/50">
                      <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-800">All Transactions</SelectItem>
                      <SelectItem value="completed" className="hover:bg-slate-100 dark:hover:bg-slate-800">Successful</SelectItem>
                      <SelectItem value="failed" className="hover:bg-slate-100 dark:hover:bg-slate-800">Failed</SelectItem>
                      <SelectItem value="pending" className="hover:bg-slate-100 dark:hover:bg-slate-800">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" data-testid="button-export-csv">
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
                    <Button onClick={() => window.location.href = "/tokens"} data-testid="button-buy-tokens">
                      Buy Your First Tokens
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
                              {transaction.tokens.toLocaleString()} Tokens
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
