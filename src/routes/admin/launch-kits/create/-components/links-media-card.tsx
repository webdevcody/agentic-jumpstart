import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Info } from "lucide-react";
import { CreateLaunchKitForm } from "./basic-information-card";

interface LinksMediaCardProps {
  form: UseFormReturn<CreateLaunchKitForm>;
  isLoading: boolean;
}

export function LinksMediaCard({ form, isLoading }: LinksMediaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Links & Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="repositoryUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://github.com/username/repo"
                  type="url"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="demoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Demo URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://demo.example.com"
                  type="url"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/screenshot.png"
                  type="url"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Image Guidelines:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Recommended size: 800x600px</li>
                <li>Format: PNG, JPG, or WebP</li>
                <li>Should showcase the project</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}