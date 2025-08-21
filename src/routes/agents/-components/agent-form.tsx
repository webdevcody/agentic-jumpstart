import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Loader2,
  FileText,
  Bot,
  Code,
  Zap,
  Eye,
  Edit,
  LucideIcon,
} from "lucide-react";
import { MarkdownRenderer } from "~/components/markdown-renderer";

export const agentFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  type: z.enum(["agent", "command", "hook"]),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isPublic: z.boolean().optional().default(true),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  headerTitle?: string;
  headerDescription?: string;
  buttonText: string;
  loadingText: string;
  buttonIcon?: LucideIcon;
  defaultValues?: Partial<AgentFormValues>;
  onSubmit: (values: AgentFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AgentForm({
  headerTitle,
  headerDescription,
  buttonText,
  loadingText,
  buttonIcon: ButtonIcon = Edit,
  defaultValues,
  onSubmit,
  isSubmitting,
}: AgentFormProps) {
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      type: defaultValues?.type || "agent",
      content: defaultValues?.content || "",
      isPublic: defaultValues?.isPublic ?? true,
    },
  });

  const currentContent = form.watch("content");
  const currentType = form.watch("type");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "agent":
        return <Bot className="h-4 w-4" />;
      case "command":
        return <Code className="h-4 w-4" />;
      case "hook":
        return <Zap className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "agent":
        return "Complete AI assistant with specific instructions and behaviors";
      case "command":
        return "Specific command or script for development tasks";
      case "hook":
        return "Integration point for extending Claude Code functionality";
      default:
        return "Select a type for your agent";
    }
  };

  return (
    <div className="">
      {/* Header Section */}
      {headerTitle && headerDescription && (
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{headerTitle}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {headerDescription}
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6 col-span-2">
              {/* Content */}
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-theme-500" />
                    Agent Content
                  </CardTitle>
                  <CardDescription>
                    Write the main content for your agent in Markdown. This will
                    be shown to users as the agent's documentation and
                    instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markdown Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="# My Agent&#10;&#10;Description of what this agent does...&#10;&#10;## Instructions&#10;&#10;1. Step one&#10;2. Step two"
                            className="min-h-[400px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Write your agent instructions in Markdown.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Basic Information */}
            <div className="col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-orange-500" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Provide basic information about your agent. This will be
                    shown to users as the agent's documentation and
                    instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., React Testing Assistant"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of what this agent does..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, concise description to help others understand
                          your agent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agent type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="agent">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                Agent
                              </div>
                            </SelectItem>
                            <SelectItem value="command">
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Command
                              </div>
                            </SelectItem>
                            <SelectItem value="hook">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Hook
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {getTypeDescription(currentType)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Public Agent
                          </FormLabel>
                          <FormDescription>
                            Make this agent visible to everyone
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              <>
                <ButtonIcon className="mr-2 h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
