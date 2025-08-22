import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { createLaunchKitFn } from "~/fn/launch-kits";

const createLaunchKitSchema = z.object({
  name: z.string().min(2, "Launch kit name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  longDescription: z.string().optional(),
  repositoryUrl: z.string().url("Please enter a valid repository URL"),
  demoUrl: z
    .string()
    .url("Please enter a valid demo URL")
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  tagIds: z.array(z.number()).optional(),
});

export type CreateLaunchKitForm = z.infer<typeof createLaunchKitSchema>;

export function useCreateLaunchKit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<CreateLaunchKitForm>({
    resolver: zodResolver(createLaunchKitSchema),
    defaultValues: {
      name: "",
      description: "",
      longDescription: "",
      repositoryUrl: "",
      demoUrl: "",
      imageUrl: "",
      tagIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: createLaunchKitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launch-kits"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kit-stats"] });
      toast.success("Launch kit created successfully!");
      navigate({ to: "/admin/launch-kits" });
    },
    onError: (error: any) => {
      setFormError(error?.message || "Failed to create launch kit");
      toast.error("Failed to create launch kit");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: CreateLaunchKitForm) => {
    setIsLoading(true);
    setFormError("");

    try {
      await createMutation.mutateAsync({
        data: {
          name: data.name,
          description: data.description,
          longDescription: data.longDescription || undefined,
          repositoryUrl: data.repositoryUrl,
          demoUrl: data.demoUrl || undefined,
          imageUrl: data.imageUrl || undefined,
          tagIds: data.tagIds || [],
        },
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleTagToggle = (tagId: number, checked: boolean) => {
    const currentTags = form.getValues("tagIds") || [];
    if (checked) {
      form.setValue("tagIds", [...currentTags, tagId]);
    } else {
      form.setValue(
        "tagIds",
        currentTags.filter((id) => id !== tagId)
      );
    }
  };

  return {
    form,
    isLoading,
    formError,
    onSubmit,
    handleTagToggle,
  };
}