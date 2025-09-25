import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-900/20 dark:via-slate-900 dark:to-orange-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/30 dark:border-slate-700/50 shadow-2xl rounded-3xl">
        <CardHeader className="pb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="material-symbols-outlined text-white text-4xl">error</span>
          </div>
          <CardTitle className="text-3xl text-red-600 dark:text-red-400 font-bold" data-testid="text-failure-title">
            Payment Failed
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
            We couldn't process your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Alert className="text-left bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-800/50 rounded-2xl">
            <span className="material-symbols-outlined h-5 w-5 text-red-500">info</span>
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong className="text-base">Common reasons for payment failure:</strong>
              <ul className="list-disc list-inside mt-3 text-sm space-y-2">
                <li>Insufficient balance in your account</li>
                <li>Card expired or blocked by bank</li>
                <li>Network connectivity issues</li>
                <li>Incorrect card details entered</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="text-base text-slate-600 dark:text-slate-400">
            <p>Don't worry! No amount has been charged to your account.</p>
            <p className="mt-2">You can try the payment again or contact our support team if the issue persists.</p>
          </div>

          <div className="space-y-4">
            <Link href="/tokens">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl h-12 text-base font-semibold" data-testid="button-try-again">
                <span className="material-symbols-outlined mr-2">refresh</span>
                Try Payment Again
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="w-full border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-12 text-base" data-testid="button-contact-support">
                <span className="material-symbols-outlined mr-2">support_agent</span>
                Contact Support
              </Button>
            </Link>
            <Link href="/app">
              <Button variant="ghost" className="w-full hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl h-12 text-base" data-testid="button-back-to-dashboard">
                <span className="material-symbols-outlined mr-2">arrow_back</span>
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 border-t border-white/30 dark:border-slate-700/50 pt-6">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Need immediate help?</p>
            <p className="text-slate-600 dark:text-slate-400">Email: support@saashub.com</p>
            <p className="text-slate-600 dark:text-slate-400">Phone: 1-800-SAASHUB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}