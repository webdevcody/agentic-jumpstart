import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Settings, Mail, Bell, Save, Loader2, Check } from "lucide-react";
import { toast } from "~/hooks/use-toast";
import { authenticatedMiddleware } from "~/lib/auth";
import { queryOptions } from "@tanstack/react-query";
import {
  getUserEmailPreferencesFn,
  updateEmailPreferencesFn,
} from "~/fn/user-settings";
import { assertAuthenticatedFn } from "~/fn/auth";

// Form validation schema
const emailPreferencesSchema = z.object({
  allowCourseUpdates: z.boolean(),
  allowPromotional: z.boolean(),
});

type EmailPreferencesData = z.infer<typeof emailPreferencesSchema>;

// Query options
const emailPreferencesQueryOptions = queryOptions({
  queryKey: ["user", "emailPreferences"],
  queryFn: () => getUserEmailPreferencesFn(),
});

export const Route = createFileRoute("/settings")({
  beforeLoad: () => assertAuthenticatedFn(),
  loader: ({ context }) => {
    return {
      emailPreferences: context.queryClient.ensureQueryData(
        emailPreferencesQueryOptions
      ),
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: emailPreferences } = useSuspenseQuery(
    emailPreferencesQueryOptions
  );

  // Form setup
  const form = useForm<EmailPreferencesData>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: {
      allowCourseUpdates: emailPreferences?.allowCourseUpdates ?? true,
      allowPromotional: emailPreferences?.allowPromotional ?? true,
    },
  });

  // Update email preferences mutation
  const updatePreferences = useMutation({
    mutationFn: (data: EmailPreferencesData) =>
      updateEmailPreferencesFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "emailPreferences"] });
      toast({
        title: "Settings saved!",
        description: "Your email preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailPreferencesData) => {
    updatePreferences.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-theme-600" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and notifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preferences
            </CardTitle>
            <CardDescription>
              Choose which emails you'd like to receive from us
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="allowCourseUpdates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Course Updates
                        </FormLabel>
                        <FormDescription>
                          Receive notifications when new course content is
                          released, important announcements, and course-related
                          updates.
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

                <FormField
                  control={form.control}
                  name="allowPromotional"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Promotional Emails
                        </FormLabel>
                        <FormDescription>
                          Receive emails about new courses, special offers,
                          discounts, and other promotional content.
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

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updatePreferences.isPending}
                    className="flex items-center gap-2"
                  >
                    {updatePreferences.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : updatePreferences.isSuccess ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {updatePreferences.isPending
                      ? "Saving..."
                      : updatePreferences.isSuccess
                        ? "Saved!"
                        : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              More notification settings coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Additional notification preferences will be available soon.</p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Questions about your account or course access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you need to completely unsubscribe from all emails or have
              questions about your account, please contact support.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Contact Support:</p>
              <p className="text-muted-foreground">
                Email: webdevcody@gmail.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
