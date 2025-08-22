import { useQuery } from "@tanstack/react-query";
import { getImageUrlFn } from "~/fn/storage";

interface BlogImageProps {
  imageKey?: string;
  alt: string;
  className?: string;
}

export function BlogImage({ imageKey, alt, className }: BlogImageProps) {
  // If no image key, don't render anything
  if (!imageKey) return null;

  // If imageKey is already a full URL, use it directly
  const isUrl = imageKey.startsWith("http://") || imageKey.startsWith("https://");

  const { data: imageData, isLoading } = useQuery({
    queryKey: ["image", imageKey],
    queryFn: () => getImageUrlFn({ data: { imageKey } }),
    enabled: !isUrl, // Only fetch if it's not already a URL
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const imageUrl = isUrl ? imageKey : imageData?.imageUrl;

  if (isLoading && !isUrl) {
    return (
      <div className={`bg-muted animate-pulse ${className}`} />
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
    />
  );
}