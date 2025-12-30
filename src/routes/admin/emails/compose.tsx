import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryOptions } from "@tanstack/react-query";
import {
  createEmailBatchFn,
  sendTestEmailFn,
  getUsersForEmailingFn,
} from "~/fn/emails";
import { EmailComposer } from "./-components/email-composer";
import { TestEmailDialog } from "./-components/test-email-dialog";
import { toast } from "sonner";

const emailFormSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
  recipientType: z.enum([
    "all",
    "premium",
    "free",
    "newsletter",
    "waitlist",
    "everyone",
  ]),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

const testEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type TestEmailData = z.infer<typeof testEmailSchema>;

const usersForEmailingQueryOptions = queryOptions({
  queryKey: ["admin", "usersForEmailing"],
  queryFn: () => getUsersForEmailingFn(),
});

export const Route = createFileRoute("/admin/emails/compose")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(usersForEmailingQueryOptions);
  },
  component: ComposeEmailPage,
});

function ComposeEmailPage() {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const queryClient = useQueryClient();

  const { data: usersForEmailing, isLoading: usersLoading } = useQuery(
    usersForEmailingQueryOptions
  );

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: "",
      content: "",
      recipientType: "all",
    },
  });

  const createEmailBatch = useMutation({
    mutationFn: (data: EmailFormData) => createEmailBatchFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "emailBatches"] });
      form.reset();
      toast.success("Email batch created!", {
        description: "Your email is being sent to recipients.",
      });
    },
    onError: (error) => {
      toast.error("Failed to create email batch", {
        description: error.message,
      });
    },
  });

  const sendTestEmail = useMutation({
    mutationFn: (data: { email: string; subject: string; content: string }) =>
      sendTestEmailFn({ data }),
    onSuccess: () => {
      setTestEmailOpen(false);
      toast.success("Test email sent!", {
        description: "Check your inbox for the test email.",
      });
    },
    onError: (error) => {
      toast.error("Failed to send test email", {
        description: error.message,
      });
    },
  });

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
      case "everyone":
        return usersForEmailing.everyoneCount || 0;
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
      toast.error("Missing content", {
        description:
          "Please enter both subject and content before sending test email.",
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
    <>
      <div
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

      <TestEmailDialog
        open={testEmailOpen}
        onOpenChange={setTestEmailOpen}
        onSubmit={onTestEmail}
        isPending={sendTestEmail.isPending}
      />
    </>
  );
}
