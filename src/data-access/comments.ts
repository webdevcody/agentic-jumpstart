import { and, desc, eq, isNull } from "drizzle-orm";
import { database } from "~/db";
import { CommentCreate, comments, users } from "~/db/schema";

export type CommentsWithUser = Awaited<ReturnType<typeof getComments>>;
export type AllCommentsWithDetails = Awaited<
  ReturnType<typeof getAllRecentComments>
>;

const MAX_COMMENTS_PER_PAGE = 100;

export async function getComments(segmentId: number) {
  return database.query.comments.findMany({
    where: and(eq(comments.segmentId, segmentId), isNull(comments.parentId)),
    with: {
      profile: true,
      children: {
        with: {
          profile: true,
          repliedToProfile: true,
        },
      },
    },
    orderBy: [desc(comments.createdAt)],
  });
}

export async function createComment(comment: CommentCreate) {
  const result = await database
    .insert(comments)
    .values(comment)
    .returning();
  return result[0];
}

export async function deleteComment(commentId: number, userId: number) {
  await database
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
  return { success: true };
}

export async function updateComment(
  commentId: number,
  content: string,
  userId: number
) {
  const result = await database
    .update(comments)
    .set({ content })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
    .returning();
  return result[0];
}

export async function getAllRecentComments(
  limit = MAX_COMMENTS_PER_PAGE,
  filterAdminReplied = false
) {
  const allComments = await database.query.comments.findMany({
    where: isNull(comments.parentId),
    with: {
      profile: true,
      segment: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
      children: {
        with: {
          profile: true,
          repliedToProfile: true,
        },
      },
    },
    orderBy: [desc(comments.createdAt)],
    limit,
  });

  // Get admin user IDs to check against
  const adminUsers = await database.query.users.findMany({
    where: eq(users.isAdmin, true),
    columns: { id: true },
  });
  const adminUserIds = new Set(adminUsers.map((user) => user.id));

  // Add hasAdminReply flag to each comment
  const commentsWithAdminFlag = allComments.map((comment) => ({
    ...comment,
    hasAdminReply:
      comment.children?.some((child) =>
        adminUserIds.has(child.profile.userId)
      ) || false,
  }));

  if (!filterAdminReplied) {
    return commentsWithAdminFlag;
  }

  // Filter out comments that already have admin replies
  return commentsWithAdminFlag.filter((comment) => !comment.hasAdminReply);
}

export async function deleteCommentAsAdmin(commentId: number) {
  await database.delete(comments).where(eq(comments.id, commentId));
  return { success: true };
}
