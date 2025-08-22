import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { updateLaunchKitFn } from "~/fn/launch-kits";

const editLaunchKitSchema = z.object({
  name: z.string().min(2, "Launch kit name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  longDescription: z.string().optional(),
  repositoryUrl: z.url("Please enter a valid repository URL"),
  demoUrl: z.url("Please enter a valid demo URL").optional().or(z.literal("")),
  imageUrl: z
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  tagIds: z.array(z.number()).optional(),
});

export type EditLaunchKitForm = z.infer<typeof editLaunchKitSchema>;

export function useEditLaunchKit(launchKit?: any) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<EditLaunchKitForm>({
    resolver: zodResolver(editLaunchKitSchema),
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

  // Populate form when launch kit data is loaded
  useEffect(() => {
    if (launchKit) {
      form.reset({
        name: launchKit.name || "",
        description: launchKit.description || "",
        longDescription: launchKit.longDescription || "",
        repositoryUrl: launchKit.repositoryUrl || "",
        demoUrl: launchKit.demoUrl || "",
        imageUrl: launchKit.imageUrl || "",
        tagIds: launchKit.tags?.map((tag: any) => tag.id) || [],
      });
    }
  }, [launchKit, form]);

  const updateMutation = useMutation({
    mutationFn: updateLaunchKitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "launch-kits"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kits"] });
      queryClient.invalidateQueries({ queryKey: ["launch-kit-stats"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "launch-kit", launchKit?.id.toString()],
      });
      toast.success("Launch kit updated successfully!");
      navigate({ to: "/admin/launch-kits" });
    },
    onError: (error: any) => {
      setFormError(error?.message || "Failed to update launch kit");
      toast.error("Failed to update launch kit");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: EditLaunchKitForm) => {
    if (!launchKit) return;

    setIsLoading(true);
    setFormError("");

    try {
      await updateMutation.mutateAsync({
        data: {
          id: launchKit.id,
          updates: {
            name: data.name,
            description: data.description,
            longDescription: data.longDescription || undefined,
            repositoryUrl: data.repositoryUrl,
            demoUrl: data.demoUrl || undefined,
            imageUrl: data.imageUrl || undefined,
            tagIds: data.tagIds || [],
          },
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
