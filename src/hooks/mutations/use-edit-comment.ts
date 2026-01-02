import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommentFn, UpdateCommentSchema } from "~/fn/comments";
import { useLoaderData } from "@tanstack/react-router";
import { useAuth } from "../use-auth";
import { getCommentsQuery } from "~/lib/queries/comments";

export function useEditComment() {
  const { segment } = useLoaderData({ from: "/learn/$slug/_layout/" });
  const user = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: UpdateCommentSchema) =>
      updateCommentFn({ data: variables }),
    onSuccess: async () => {
      // Invalidate and refetch to ensure the UI updates
      await queryClient.refetchQueries({
        queryKey: getCommentsQuery(segment.id).queryKey,
      });
    },
    onMutate: (variables) => {
      // Only do optimistic update if we have a user
      // Don't throw errors here - let the server function handle validation
      if (!user) {
        return { previousComments: undefined };
      }

      const previousComments = queryClient.getQueryData(
        getCommentsQuery(segment.id).queryKey
      );

      // Optimistically update both top-level comments and nested replies
      queryClient.setQueryData(getCommentsQuery(segment.id).queryKey, (old) =>
        old?.map((comment) => {
          if (comment.id === variables.commentId) {
            return { ...comment, content: variables.content };
          }
          // Check if any nested child matches
          if (comment.children?.some((child) => child.id === variables.commentId)) {
            return {
              ...comment,
              children: comment.children.map((child) =>
                child.id === variables.commentId
                  ? { ...child, content: variables.content }
                  : child
              ),
            };
          }
          return comment;
        })
      );
      return { previousComments };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        getCommentsQuery(segment.id).queryKey,
        context?.previousComments
      );
    },
  });
}
