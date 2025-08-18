import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { processUnsubscribeFn } from "~/fn/user-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";

const unsubscribeSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) =>
    unsubscribeSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps: { token } }) => {
    if (!token) {
      return {
        status: "error",
        message: "No unsubscribe token provided",
      };
    }

    return await processUnsubscribeFn({ data: { token } });
  },
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const data = Route.useLoaderData();

  const renderContent = () => {
    if (data.status === "success") {
      return (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6 mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              Successfully Unsubscribed
            </CardTitle>
            <CardDescription className="text-base">
              You have been unsubscribed from marketing emails for{" "}
              <span className="font-medium">{data.emailAddress}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2 justify-center">
                <AlertTriangle className="h-4 w-4" />
                You will still receive course updates and important
                notifications
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              className="btn-gradient"
            >
              Return to Homepage
            </Button>
          </CardContent>
        </>
      );
    } else {
      return (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-6 mx-auto">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
              Unsubscribe Failed
            </CardTitle>
            <CardDescription className="text-base">
              {data.message || "We couldn't process your unsubscribe request"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The unsubscribe link may have expired or already been used. If you
              continue to receive unwanted emails, please contact our support
              team.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
              >
                Return to Homepage
              </Button>
              <Button
                onClick={() => (window.location.href = "/settings")}
                className="btn-gradient"
              >
                Manage Email Settings
              </Button>
            </div>
          </CardContent>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-theme-50/5 to-theme-100/10 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="module-card">{renderContent()}</Card>
      </div>
    </div>
  );
}
