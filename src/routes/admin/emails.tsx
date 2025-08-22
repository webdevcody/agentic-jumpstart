import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Mail,
  Send,
  Eye,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  Calendar,
  Info,
} from "lucide-react";
import { toast } from "~/hooks/use-toast";
import { queryOptions } from "@tanstack/react-query";
import {
  createEmailBatchFn,
  sendTestEmailFn,
  getEmailBatchesFn,
  getUsersForEmailingFn,
} from "~/fn/emails";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";

// Skeleton components
function CountSkeleton() {
  return <div className="h-5 w-8 bg-muted/50 rounded animate-pulse"></div>;
}

function EmailBatchSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="h-5 w-48 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="h-4 w-16 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-6 w-12 bg-muted/50 rounded animate-pulse"></div>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-6 w-10 bg-muted/50 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div className="h-2 w-full bg-muted/30 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

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

  const queryClient = useQueryClient();
  const { data: emailBatches, isLoading: emailBatchesLoading } = useQuery(
    emailBatchesQueryOptions
  );
  const { data: usersForEmailing, isLoading: usersLoading } = useQuery(
    usersForEmailingQueryOptions
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

  // Test email form
  const testForm = useForm<TestEmailData>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      email: "",
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
      testForm.reset();
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

  // Configure marked for preview
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Watch form values
  const subject = form.watch("subject");
  const content = form.watch("content");

  // Parse markdown to HTML for preview - moved outside of renderEmailPreview
  const htmlContent = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content);
    } catch (error) {
      console.error("Failed to parse markdown:", error);
      return content;
    }
  }, [content]);

  const renderEmailPreview = () => {
    return (
      <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
        <div className="border-b pb-4 mb-4">
          <div className="text-sm text-muted-foreground mb-2">Subject:</div>
          <div className="font-semibold">{subject || "No subject"}</div>
        </div>
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(htmlContent || "<p>No content</p>", {
              allowedTags: [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "blockquote",
                "p",
                "a",
                "ul",
                "ol",
                "nl",
                "li",
                "b",
                "i",
                "strong",
                "em",
                "strike",
                "code",
                "hr",
                "br",
                "div",
                "table",
                "thead",
                "caption",
                "tbody",
                "tr",
                "th",
                "td",
                "pre",
                "span",
              ],
              allowedAttributes: {
                a: ["href", "name", "target"],
                img: ["src", "alt", "width", "height"],
                div: ["class"],
                span: ["class"],
                p: ["class"],
                "*": ["class"],
              },
              allowedSchemes: ["http", "https", "mailto"],
              allowedSchemesByTag: {},
              allowedSchemesAppliedToAttributes: ["href"],
            }),
          }}
        />
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Page>
      <PageHeader
        title="Email Composer"
        highlightedWord="Composer"
        description="Send bulk emails to your course participants and manage email campaigns"
        actions={
          <div className="grid grid-cols-5 gap-2">
            {/* Total Users */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center mx-auto mb-1">
                <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {usersLoading ? <CountSkeleton /> : getRecipientCount("all")}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>

            {/* Premium Users */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center mx-auto mb-1">
                <CheckCircle className="h-4 w-4 text-theme-500 dark:text-theme-400" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {usersLoading ? (
                  <CountSkeleton />
                ) : (
                  getRecipientCount("premium")
                )}
              </div>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>

            {/* Free Users */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-green-500/10 dark:bg-green-400/20 flex items-center justify-center mx-auto mb-1">
                <Mail className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {usersLoading ? <CountSkeleton /> : getRecipientCount("free")}
              </div>
              <p className="text-xs text-muted-foreground">Free</p>
            </div>

            {/* Newsletter Subscribers */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-400/20 flex items-center justify-center mx-auto mb-1">
                <Mail className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {usersLoading ? (
                  <CountSkeleton />
                ) : (
                  getRecipientCount("newsletter")
                )}
              </div>
              <p className="text-xs text-muted-foreground">Newsletter</p>
            </div>

            {/* Waitlist */}
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 dark:bg-orange-400/20 flex items-center justify-center mx-auto mb-1">
                <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {usersLoading ? (
                  <CountSkeleton />
                ) : (
                  getRecipientCount("waitlist")
                )}
              </div>
              <p className="text-xs text-muted-foreground">Waitlist</p>
            </div>
          </div>
        }
      />

      {/* Main Tabs Interface */}
      <Tabs
        defaultValue="compose"
        className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose & Preview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Email History
          </TabsTrigger>
        </TabsList>

        {/* Compose & Preview Tab */}
        <TabsContent
          value="compose"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div
            className="grid gap-6 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            {/* Email Composer - 60% width */}
            <div
              className="lg:col-span-3 module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.4s", animationFillMode: "both" }}
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  <Send className="h-6 w-6 text-theme-500" />
                  Compose Email
                </h2>
                <p className="text-muted-foreground">
                  Create and send emails to your course participants
                </p>
              </div>
              <div className="p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email subject..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipients</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recipient type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">
                                All Users ({getRecipientCount("all")})
                              </SelectItem>
                              <SelectItem value="premium">
                                Premium Users ({getRecipientCount("premium")})
                              </SelectItem>
                              <SelectItem value="free">
                                Free Users ({getRecipientCount("free")})
                              </SelectItem>
                              <SelectItem value="newsletter">
                                Newsletter Subscribers (
                                {getRecipientCount("newsletter")})
                              </SelectItem>
                              <SelectItem value="waitlist">
                                Waitlist ({getRecipientCount("waitlist")})
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Email Content</FormLabel>
                            <span className="text-xs text-muted-foreground">
                              Supports Markdown formatting
                            </span>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your email content here. You can use **bold**, *italic*, [links](url), lists, headers (#, ##), and more..."
                              className="min-h-64 font-mono text-sm resize-none"
                              {...field}
                            />
                          </FormControl>
                          <div className="mt-2 space-y-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowMarkdownGuide(!showMarkdownGuide)
                              }
                              className="text-xs flex items-center gap-1"
                            >
                              <Info className="h-3 w-3" />
                              {showMarkdownGuide ? "Hide" : "Show"} Markdown
                              Guide
                            </Button>
                            {showMarkdownGuide && (
                              <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-xs">
                                <div>
                                  <p className="font-semibold mb-1">
                                    Text Formatting:
                                  </p>
                                  <code className="block bg-background p-2 rounded">
                                    **bold text** → <strong>bold text</strong>
                                    <br />
                                    *italic text* → <em>italic text</em>
                                    <br />
                                    ***bold italic*** →{" "}
                                    <strong>
                                      <em>bold italic</em>
                                    </strong>
                                  </code>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">Headers:</p>
                                  <code className="block bg-background p-2 rounded">
                                    # Heading 1<br />
                                    ## Heading 2<br />
                                    ### Heading 3
                                  </code>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">
                                    Links & Images:
                                  </p>
                                  <code className="block bg-background p-2 rounded">
                                    [Link text](https://example.com)
                                    <br />
                                    ![Alt text](image-url.jpg)
                                  </code>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">Lists:</p>
                                  <code className="block bg-background p-2 rounded">
                                    - Bullet point
                                    <br />
                                    - Another point
                                    <br />
                                    <br />
                                    1. Numbered item
                                    <br />
                                    2. Second item
                                  </code>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">Code:</p>
                                  <code className="block bg-background p-2 rounded">
                                    `inline code`
                                    <br />
                                    <br />
                                    ```
                                    <br />
                                    code block
                                    <br />
                                    multiple lines
                                    <br />
                                    ```
                                  </code>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">Other:</p>
                                  <code className="block bg-background p-2 rounded">
                                    &gt; Blockquote
                                    <br />
                                    --- (horizontal line)
                                    <br />
                                    Line break: two spaces at end
                                  </code>
                                </div>
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Dialog
                        open={testEmailOpen}
                        onOpenChange={setTestEmailOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <TestTube className="h-4 w-4" />
                            Send Test
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Test Email</DialogTitle>
                            <DialogDescription>
                              Send a test email to verify your content and
                              formatting.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...testForm}>
                            <form onSubmit={testForm.handleSubmit(onTestEmail)}>
                              <FormField
                                control={testForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Test Email Address</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="test@example.com"
                                        type="email"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter className="mt-6">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setTestEmailOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={sendTestEmail.isPending}
                                  className="flex items-center gap-2"
                                >
                                  {sendTestEmail.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                  Send Test
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        type="submit"
                        disabled={createEmailBatch.isPending}
                        className="btn-gradient flex items-center gap-2 ml-auto"
                      >
                        {createEmailBatch.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Email
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Live Preview - 40% width */}
            <div
              className="lg:col-span-2 module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-theme-500" />
                  Live Preview
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getRecipientCount(form.watch("recipientType"))} recipients
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 lg:h-[500px] overflow-y-auto">
                  {renderEmailPreview()}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Email History Tab */}
        <TabsContent
          value="history"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div
            className="module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-6 w-6 text-theme-500" />
                Recent Email Batches
              </h2>
              <p className="text-muted-foreground">
                Track the status of your recent email campaigns
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {emailBatchesLoading ? (
                  [...Array(3)].map((_, idx) => (
                    <EmailBatchSkeleton key={idx} />
                  ))
                ) : emailBatches && emailBatches.length > 0 ? (
                  emailBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="group relative overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6 hover:bg-card/80 dark:hover:bg-card/60 hover:border-theme-400/30 hover:shadow-elevation-2 transition-all duration-300"
                    >
                      {/* Subtle hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>

                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1 flex-1">
                            <h4 className="text-lg font-semibold text-foreground">
                              {batch.subject}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(batch.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <Badge
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(batch.status)}`}
                          >
                            {getStatusIcon(batch.status)}
                            {batch.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              Recipients
                            </div>
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {batch.recipientCount}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              Sent
                            </div>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {batch.sentCount}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {batch.sentCount} / {batch.recipientCount}
                            </span>
                          </div>
                          <Progress
                            value={
                              batch.recipientCount > 0
                                ? (batch.sentCount / batch.recipientCount) * 100
                                : 0
                            }
                            className="h-2"
                          />
                        </div>

                        {batch.failedCount > 0 && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            {batch.failedCount} failed deliveries
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Mail className="h-16 w-16 mx-auto mb-6 opacity-30" />
                    <p className="text-lg">No email batches yet</p>
                    <p className="text-sm">Your sent emails will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog with improved styling */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Send Test Email
            </DialogTitle>
            <DialogDescription className="text-base">
              Send a test email to verify your content and formatting.
            </DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form
              onSubmit={testForm.handleSubmit(onTestEmail)}
              className="space-y-6"
            >
              <FormField
                control={testForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="test@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestEmailOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendTestEmail.isPending}
                  className="btn-gradient flex-1"
                >
                  {sendTestEmail.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Test
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
