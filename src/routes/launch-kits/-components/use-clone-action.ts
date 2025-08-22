import { toast } from "sonner";
import { cloneLaunchKitFn } from "~/fn/launch-kits";

export function useCloneAction() {
  const handleClone = async (kit: any) => {
    try {
      await cloneLaunchKitFn({ data: { slug: kit.slug } });
      toast.success(`${kit.name} cloned! Check your repository.`);
      window.open(kit.repositoryUrl, "_blank");
    } catch (error) {
      toast.error("Failed to track clone");
      window.open(kit.repositoryUrl, "_blank");
    }
  };

  return { handleClone };
}