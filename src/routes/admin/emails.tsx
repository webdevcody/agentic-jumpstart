import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "~/hooks/use-toast";
import { queryOptions } from "@tanstack/react-query";
import {
  createEmailBatchFn,
  sendTestEmailFn,
  getEmailBatchesFn,
  getUsersForEmailingFn,
  getEmailAnalyticsFn,
} from "~/fn/emails";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import { EmailComposer } from "./-components/email-composer";
import { EmailHistory } from "./-components/email-history";
import { EmailAnalytics, EmailAnalyticsHeader } from "./-components/email-analytics";
import { TestEmailDialog } from "./-components/test-email-dialog";
import { HeaderStats, HeaderStatCard } from "./-components/header-stats";


// Form validation schema
const emailFormSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  recipientType: z.enum(["all", "premium", "free", "newsletter", "waitlist"]),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

const testEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type TestEmailData = z.infer<typeof testEmailSchema>;

// Query options
const emailBatchesQueryOptions = queryOptions({
  queryKey: ["admin", "emailBatches"],
  queryFn: () => getEmailBatchesFn(),
});

const usersForEmailingQueryOptions = queryOptions({
  queryKey: ["admin", "usersForEmailing"],
  queryFn: () => getUsersForEmailingFn(),
});

const emailAnalyticsQueryOptions = (year: number, month: number, type: "waitlist" | "newsletter") => queryOptions({
  queryKey: ["admin", "emailAnalytics", year, month, type],
  queryFn: () => getEmailAnalyticsFn({ data: { year, month, type } }),
});

export const Route = createFileRoute("/admin/emails")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(emailBatchesQueryOptions);
    context.queryClient.ensureQueryData(usersForEmailingQueryOptions);
  },
  component: AdminEmailsPage,
});

function AdminEmailsPage() {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  
  // Analytics state
  const currentDate = new Date();
  const [analyticsDate, setAnalyticsDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });
  const [analyticsType, setAnalyticsType] = useState<"waitlist" | "newsletter">("waitlist");

  const queryClient = useQueryClient();
  const { data: emailBatches, isLoading: emailBatchesLoading } = useQuery(
    emailBatchesQueryOptions
  );
  const { data: usersForEmailing, isLoading: usersLoading } = useQuery(
    usersForEmailingQueryOptions
  );
  
  // Analytics query
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    emailAnalyticsQueryOptions(analyticsDate.year, analyticsDate.month, analyticsType)
  );

  // Main email form
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: "",
      content: "",
      recipientType: "all",
    },
  });

  // Create email batch mutation
  const createEmailBatch = useMutation({
    mutationFn: (data: EmailFormData) => createEmailBatchFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
      form.reset();
      toast({
        title: "Email batch created!",
        description: "Your email is being sent to recipients.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create email batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send test email mutation
  const sendTestEmail = useMutation({
    mutationFn: (data: { email: string; subject: string; content: string }) =>
      sendTestEmailFn({ data }),
    onSuccess: () => {
      setTestEmailOpen(false);
      toast({
        title: "Test email sent!",
        description: "Check your inbox for the test email.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-refresh email batches to update progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Get recipient count based on selection
  const getRecipientCount = (type: string) => {
    if (!usersForEmailing || usersLoading) return 0;

    switch (type) {
      case "all":
        return usersForEmailing.totalUsers;
      case "premium":
        return usersForEmailing.premiumUsers;
      case "free":
        return usersForEmailing.freeUsers;
      case "newsletter":
        return usersForEmailing.newsletterUsers || 0;
      case "waitlist":
        return usersForEmailing.waitlistUsers || 0;
      default:
        return 0;
    }
  };

  const onSubmit = (data: EmailFormData) => {
    createEmailBatch.mutate(data);
  };

  const onTestEmail = (data: TestEmailData) => {
    const subject = form.getValues("subject");
    const content = form.getValues("content");

    if (!subject || !content) {
      toast({
        title: "Missing content",
        description:
          "Please enter both subject and content before sending test email.",
        variant: "destructive",
      });
      return;
    }

    sendTestEmail.mutate({
      email: data.email,
      subject,
      content,
    });
  };

  return (
    <Page>
      <PageHeader
        title="Email Composer"
        highlightedWord="Composer"
        description="Send bulk emails to your course participants and manage email campaigns"
        actions={
          <HeaderStats columns={5}>
            <HeaderStatCard
              icon={Users}
              iconColor="blue"
              value={getRecipientCount("all")}
              label="Total"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={CheckCircle}
              iconColor="theme"
              value={getRecipientCount("premium")}
              label="Premium"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Mail}
              iconColor="green"
              value={getRecipientCount("free")}
              label="Free"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Mail}
              iconColor="purple"
              value={getRecipientCount("newsletter")}
              label="Newsletter"
              loading={usersLoading}
            />
            <HeaderStatCard
              icon={Clock}
              iconColor="orange"
              value={getRecipientCount("waitlist")}
              label="Waitlist"
              loading={usersLoading}
            />
          </HeaderStats>
        }
      />

      {/* Main Tabs Interface */}
      <Tabs
        defaultValue="compose"
        className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose & Preview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Email History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Compose & Preview Tab */}
        <TabsContent
          value="compose"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <EmailComposer
              form={form}
              onSubmit={onSubmit}
              onTestEmail={() => setTestEmailOpen(true)}
              getRecipientCount={getRecipientCount}
              createEmailBatchPending={createEmailBatch.isPending}
              showMarkdownGuide={showMarkdownGuide}
              setShowMarkdownGuide={setShowMarkdownGuide}
            />
          </div>
        </TabsContent>

        {/* Email History Tab */}
        <TabsContent
          value="history"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <EmailHistory
              emailBatches={emailBatches}
              emailBatchesLoading={emailBatchesLoading}
            />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent
          value="analytics"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div
            className="module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <EmailAnalyticsHeader
              analyticsDate={analyticsDate}
              analyticsType={analyticsType}
              setAnalyticsDate={setAnalyticsDate}
              setAnalyticsType={setAnalyticsType}
            />
            <EmailAnalytics
              analyticsData={analyticsData}
              analyticsLoading={analyticsLoading}
              analyticsDate={analyticsDate}
              analyticsType={analyticsType}
              setAnalyticsDate={setAnalyticsDate}
              setAnalyticsType={setAnalyticsType}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <TestEmailDialog
        open={testEmailOpen}
        onOpenChange={setTestEmailOpen}
        onSubmit={onTestEmail}
        isPending={sendTestEmail.isPending}
      />
    </Page>
  );
}
