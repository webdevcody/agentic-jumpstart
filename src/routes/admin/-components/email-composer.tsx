import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Send, Eye, TestTube, Info, Loader2 } from "lucide-react";

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

interface EmailComposerProps {
  form: ReturnType<typeof useForm<EmailFormData>>;
  onSubmit: (data: EmailFormData) => void;
  onTestEmail: () => void;
  getRecipientCount: (type: string) => number;
  createEmailBatchPending: boolean;
  showMarkdownGuide: boolean;
  setShowMarkdownGuide: (show: boolean) => void;
}

export function EmailComposer({
  form,
  onSubmit,
  onTestEmail,
  getRecipientCount,
  createEmailBatchPending,
  showMarkdownGuide,
  setShowMarkdownGuide,
}: EmailComposerProps) {
  // Configure marked for preview
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Watch form values
  const subject = form.watch("subject");
  const content = form.watch("content");

  // Parse markdown to HTML for preview
  const htmlContent = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content, { async: false });
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

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Email Composer - 60% width */}
      <div className="lg:col-span-3 module-card">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject..." {...field} />
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
                        onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Info className="h-3 w-3" />
                        {showMarkdownGuide ? "Hide" : "Show"} Markdown Guide
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
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={onTestEmail}
                >
                  <TestTube className="h-4 w-4" />
                  Send Test
                </Button>

                <Button
                  type="submit"
                  disabled={createEmailBatchPending}
                  className="btn-gradient flex items-center gap-2 ml-auto"
                >
                  {createEmailBatchPending ? (
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
      <div className="lg:col-span-2 module-card">
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
  );
}
