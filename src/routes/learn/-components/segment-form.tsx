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
import { Progress } from "~/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Loader2,
  FileText,
  Link as LinkIcon,
  Video,
  FolderOpen,
  Crown,
  Upload,
  Edit,
  LucideIcon,
  Clock,
} from "lucide-react";
import { AutoComplete } from "~/components/ui/autocomplete";
import { Switch } from "~/components/ui/switch";
import type { UploadProgress } from "~/utils/storage/helpers";

export const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().optional(),
  transcripts: z.string().optional(),
  video: z.instanceof(File).optional(),
  moduleTitle: z.string().min(1, "Module ID is required"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  isPremium: z.boolean().default(false),
  isComingSoon: z.boolean().default(false),
});

export type SegmentFormValues = z.infer<typeof formSchema>;

interface SegmentFormProps {
  // Content customization
  headerTitle: string;
  headerDescription: string;
  buttonText: string;
  loadingText: string;
  buttonIcon?: LucideIcon;

  // Data
  moduleNames: string[];
  defaultValues?: Partial<SegmentFormValues>;

  // Functionality
  onSubmit: (values: SegmentFormValues) => Promise<void>;
  isSubmitting: boolean;
  uploadProgress?: UploadProgress | null;
}

export function SegmentForm({
  headerTitle,
  headerDescription,
  buttonText,
  loadingText,
  buttonIcon: ButtonIcon = Edit,
  moduleNames,
  defaultValues,
  onSubmit,
  isSubmitting,
  uploadProgress,
}: SegmentFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      content: defaultValues?.content || "",
      transcripts: defaultValues?.transcripts || "",
      video: undefined,
      slug: defaultValues?.slug || "",
      moduleTitle: defaultValues?.moduleTitle || "",
      isPremium: defaultValues?.isPremium || false,
      isComingSoon: defaultValues?.isComingSoon || false,
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-3 animate-fade-in">
        <div className="relative inline-block">
          <h1 className="text-3xl font-bold tracking-tight text-gradient mb-1">
            {headerTitle}
          </h1>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-theme-400 to-theme-600 rounded-full animate-scale-in" />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {headerDescription}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="module-card animate-slide-up border-theme-200/40 dark:border-theme-800/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-theme-500 to-theme-600 shadow-lg">
                    <Edit className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <FileText className="h-3 w-3" />
                          Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            autoFocus
                            placeholder="Enter a compelling title"
                            className="text-sm border-theme-200/40 dark:border-theme-800/40 focus:border-theme-500 dark:focus:border-theme-400 transition-colors duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-3 w-3" />
                          URL Slug
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="url-friendly-slug"
                            className="text-sm font-mono border-theme-200/40 dark:border-theme-800/40 focus:border-theme-500 dark:focus:border-theme-400 transition-colors duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/40 dark:border-amber-800/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Crown className="h-3 w-3 text-amber-600" />
                            <span className="text-amber-700 dark:text-amber-400">
                              Premium Content
                            </span>
                          </FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">
                            Only premium users can view
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-amber-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isComingSoon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-400">
                              Coming Soon
                            </span>
                          </FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">
                            Show placeholder instead
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="moduleTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <FolderOpen className="h-3 w-3" />
                        Module
                      </FormLabel>
                      <FormControl>
                        <AutoComplete
                          selectedValue={field.value}
                          onSelectedValueChange={field.onChange}
                          searchValue={field.value}
                          onSearchValueChange={field.onChange}
                          items={moduleNames.map((name) => ({
                            value: name,
                            label: name,
                          }))}
                          isLoading={false}
                          placeholder="Search or enter a module name"
                          emptyMessage="No modules found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Media & Content Tabs */}
            <Card className="module-card animate-slide-up border-theme-200/40 dark:border-theme-800/40">
              <Tabs defaultValue="media" className="w-full">
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="media"
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Media
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="transcripts"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Transcripts
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="media" className="mt-0">
                    <FormField
                      control={form.control}
                      name="video"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Video File (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {!value ? (
                                <div className="flex items-center justify-center w-full">
                                  <label className="group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-theme-300/40 dark:border-theme-700/40 rounded-lg cursor-pointer bg-gradient-to-br from-theme-50/30 to-transparent dark:from-theme-950/20 hover:from-theme-100/50 dark:hover:from-theme-900/30 transition-all duration-300 hover:border-theme-400/60 dark:hover:border-theme-600/60">
                                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-theme-500/20 to-theme-600/20 group-hover:from-theme-500/30 group-hover:to-theme-600/30 transition-all duration-300 mb-3">
                                        <Upload className="w-5 h-5 text-theme-600 dark:text-theme-400 group-hover:scale-110 transition-transform duration-300" />
                                      </div>
                                      <p className="mb-1 text-sm text-foreground">
                                        <span className="font-semibold text-theme-600 dark:text-theme-400">
                                          Click to upload
                                        </span>
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        MP4 files (Max 500MB)
                                      </p>
                                    </div>
                                    <Input
                                      type="file"
                                      accept="video/mp4"
                                      onChange={(e) =>
                                        onChange(e.target.files?.[0])
                                      }
                                      className="hidden"
                                      {...field}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <Card className="bg-accent/10 border-accent/20">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                                          <Video className="h-4 w-4 text-accent-foreground" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium">
                                            {value.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {(value.size / 1024 / 1024).toFixed(
                                              2
                                            )}{" "}
                                            MB
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onChange(undefined)}
                                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {uploadProgress && (
                                <Card className="bg-primary/10 border-primary/20">
                                  <CardContent className="pt-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                          <span className="text-xs font-medium">
                                            Uploading video...
                                          </span>
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {uploadProgress.percentage}%
                                        </Badge>
                                      </div>
                                      <Progress
                                        value={uploadProgress.percentage}
                                        className="w-full h-1.5"
                                      />
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>
                                          {Math.round(
                                            uploadProgress.loaded / 1024 / 1024
                                          )}{" "}
                                          MB uploaded
                                        </span>
                                        <span>
                                          {Math.round(
                                            uploadProgress.total / 1024 / 1024
                                          )}{" "}
                                          MB total
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="content" className="mt-0">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Lesson Content (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="# Welcome to the lesson&#10;&#10;Write your content here using **Markdown** formatting...&#10;&#10;- Bullet points&#10;- Code blocks&#10;- And more!"
                              className="min-h-[300px] text-sm font-mono border-theme-200/40 dark:border-theme-800/40 focus:border-theme-500 dark:focus:border-theme-400 transition-colors duration-200 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Supports Markdown syntax for headers, links, code
                            blocks, and more
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="transcripts" className="mt-0">
                    <FormField
                      control={form.control}
                      name="transcripts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Video Transcripts (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="# Video Transcripts&#10;&#10;Paste your transcripts here using **Markdown** formatting..."
                              className="min-h-[300px] text-sm font-mono border-theme-200/40 dark:border-theme-800/40 focus:border-theme-500 dark:focus:border-theme-400 transition-colors duration-200 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Supports Markdown syntax; great for searchable, accessible transcripts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="animate-slide-up">
            <div className="relative group max-w-md mx-auto">
              <Button type="submit" disabled={isSubmitting} size="lg">
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
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
