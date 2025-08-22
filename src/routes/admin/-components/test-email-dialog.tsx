import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
} from "~/components/ui/dialog";
import { Send } from "lucide-react";

const testEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type TestEmailData = z.infer<typeof testEmailSchema>;

interface TestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TestEmailData) => void;
  isPending: boolean;
}

export function TestEmailDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: TestEmailDialogProps) {
  const form = useForm<TestEmailData>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = (data: TestEmailData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Send Test Email
          </DialogTitle>
          <DialogDescription className="text-base">
            Send a test email to verify your content and formatting.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
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
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="btn-gradient flex-1"
              >
                {isPending ? (
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
  );
}
