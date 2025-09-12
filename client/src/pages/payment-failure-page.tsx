import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
          </div>
          <CardTitle className="text-2xl text-red-600" data-testid="text-failure-title">
            Payment Failed
          </CardTitle>
          <CardDescription>
            We couldn't process your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="text-left">
            <span className="material-symbols-outlined h-4 w-4">info</span>
            <AlertDescription>
              <strong>Common reasons for payment failure:</strong>
              <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                <li>Insufficient balance in your account</li>
                <li>Card expired or blocked by bank</li>
                <li>Network connectivity issues</li>
                <li>Incorrect card details entered</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p>Don't worry! No amount has been charged to your account.</p>
            <p className="mt-2">You can try the payment again or contact our support team if the issue persists.</p>
          </div>

          <div className="space-y-3">
            <Link href="/buy-credits">
              <Button className="w-full" data-testid="button-try-again">
                <span className="material-symbols-outlined mr-2">refresh</span>
                Try Payment Again
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="w-full" data-testid="button-contact-support">
                <span className="material-symbols-outlined mr-2">support_agent</span>
                Contact Support
              </Button>
            </Link>
            <Link href="/app">
              <Button variant="ghost" className="w-full" data-testid="button-back-to-dashboard">
                <span className="material-symbols-outlined mr-2">arrow_back</span>
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p className="font-semibold">Need immediate help?</p>
            <p>Email: support@saashub.com</p>
            <p>Phone: 1-800-SAASHUB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}