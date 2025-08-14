import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "~/hooks/use-auth";
import { useToast } from "~/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Toaster } from "~/components/ui/toaster";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getGuestBookEntriesQuery } from "~/lib/queries/guest-book";
import { createGuestBookEntryFn } from "~/fn/guest-book";

const guestBookSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be at most 500 characters"),
});

export const Route = createFileRoute("/guest-book")({
  component: GuestBookPage,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getGuestBookEntriesQuery());
  },
});

function GuestBookPage() {
  const user = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery(getGuestBookEntriesQuery());
  const { toast } = useToast();

  const form = useForm<z.infer<typeof guestBookSchema>>({
    resolver: zodResolver(guestBookSchema),
    defaultValues: { message: "" },
  });

  async function onSubmit(values: z.infer<typeof guestBookSchema>) {
    try {
      await createGuestBookEntryFn({ data: values });
      form.reset();
      toast({ title: "Thanks!", description: "Your entry has been added." });
      queryClient.invalidateQueries({ queryKey: ["guest-book"] });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to add entry. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 my-12 space-y-8">
      <h1 className="text-3xl font-bold">Guest Book</h1>

      {user ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Leave a message..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Sign Guest Book</Button>
            </div>
          </form>
        </Form>
      ) : (
        <p className="text-muted-foreground">
          Please log in to sign the guest book.
        </p>
      )}

      <div className="space-y-4">
        {data?.entries?.length ? (
          data.entries.map((entry: any) => (
            <div key={entry.id} className="border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {entry.profile?.displayName ??
                  entry.profile?.userId ??
                  "Anonymous"}
              </div>
              <div className="whitespace-pre-wrap">{entry.message}</div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No entries yet. Be the first!</p>
        )}
      </div>
      <Toaster />
    </div>
  );
}
