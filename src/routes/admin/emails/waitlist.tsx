import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryOptions } from "@tanstack/react-query";
import {
  getWaitlistEmailTemplateFn,
  updateWaitlistEmailTemplateFn,
} from "~/fn/email-templates";
import { WaitlistEmailEditor } from "./-components/waitlist-email-editor";
import { toast } from "sonner";

const waitlistEmailSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  content: z.string().min(1, "Content is required"),
});

type WaitlistEmailData = z.infer<typeof waitlistEmailSchema>;

const waitlistEmailTemplateQueryOptions = queryOptions({
  queryKey: ["admin", "waitlistEmailTemplate"],
  queryFn: () => getWaitlistEmailTemplateFn(),
});

export const Route = createFileRoute("/admin/emails/waitlist")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(waitlistEmailTemplateQueryOptions);
  },
  component: WaitlistEmailPage,
});

function WaitlistEmailPage() {
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const queryClient = useQueryClient();

  const { data: waitlistTemplate, isLoading: waitlistTemplateLoading } =
    useQuery(waitlistEmailTemplateQueryOptions);

  const waitlistForm = useForm<WaitlistEmailData>({
    resolver: zodResolver(waitlistEmailSchema),
    defaultValues: {
      subject: waitlistTemplate?.subject || "",
      content: waitlistTemplate?.content || "",
    },
  });

  useEffect(() => {
    if (waitlistTemplate) {
      waitlistForm.reset({
        subject: waitlistTemplate.subject,
        content: waitlistTemplate.content,
      });
    }
  }, [waitlistTemplate, waitlistForm]);

  const updateWaitlistTemplate = useMutation({
    mutationFn: (data: WaitlistEmailData) =>
      updateWaitlistEmailTemplateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "waitlistEmailTemplate"],
      });
      toast.success("Template saved!", {
        description: "Waitlist email template has been updated.",
      });
    },
    onError: (error) => {
      toast.error("Failed to save template", {
        description: error.message,
      });
    },
  });

  const onWaitlistTemplateSubmit = (data: WaitlistEmailData) => {
    updateWaitlistTemplate.mutate(data);
  };

  return (
    <div
    >
      <WaitlistEmailEditor
        form={waitlistForm}
        onSubmit={onWaitlistTemplateSubmit}
        isSaving={updateWaitlistTemplate.isPending}
        showMarkdownGuide={showMarkdownGuide}
        setShowMarkdownGuide={setShowMarkdownGuide}
      />
    </div>
  );
}
