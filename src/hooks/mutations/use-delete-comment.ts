import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";
import { deleteCommentFn } from "~/fn/comments";
import { getCommentsQuery } from "~/lib/queries/comments";
import { useAuth } from "../use-auth";

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { segment } = useLoaderData({ from: "/learn/$slug/_layout/" });
  const user = useAuth();
  return useMutation({
    mutationFn: (commentId: { commentId: number }) =>
      deleteCommentFn({ data: commentId }),
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
      queryClient.setQueryData(getCommentsQuery(segment.id).queryKey, (old) => {
        if (!old) return old;
        return old
          .filter((comment) => comment.id !== variables.commentId)
          .map((comment) => ({
            ...comment,
            children: comment.children?.filter(
              (child) => child.id !== variables.commentId
            ) || [],
          }));
      });
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
