import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createSegmentFn, validateSlugFn } from "./server-functions";
import { type SegmentFormValues } from "../segment-form";
import {
  uploadVideoWithPresignedUrl,
  type UploadProgress,
} from "~/utils/storage/helpers";
import { generateRandomUUID } from "~/utils/uuid";
import { usePreventTabClose } from "~/hooks/use-prevent-tab-close";
import { toast } from "sonner";

export function useAddSegment() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  usePreventTabClose(isSubmitting);

  const onSubmit = async (values: SegmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Validate slug before uploading video to avoid wasting time on large uploads
      await validateSlugFn({ data: { slug: values.slug } });

      let videoKey;
      let videoDuration;

      if (values.video) {
        videoKey = `${generateRandomUUID()}.mp4`;
        const uploadResult = await uploadVideoWithPresignedUrl(
          videoKey,
          values.video,
          progress => setUploadProgress(progress)
        );
        videoDuration = uploadResult.duration;
      }

      const segment = await createSegmentFn({
        data: {
          title: values.title,
          content: values.content,
          transcripts: values.transcripts,
          slug: values.slug,
          moduleTitle: values.moduleTitle,
          length: videoDuration,
          videoKey,
          icon: values.icon,
          isPremium: values.isPremium,
          isComingSoon: values.isComingSoon,
          notifyUsers: values.notifyUsers,
        },
      });

      // Navigate to the new segment
      navigate({ to: "/learn/$slug", params: { slug: segment.slug } });
    } catch (error) {
      console.error("Failed to create segment:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create segment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return {
    onSubmit,
    isSubmitting,
    uploadProgress,
  };
}
