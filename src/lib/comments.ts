import type { TutorComment, UserRole } from "@/lib/types";

export interface CommentThread {
  root: TutorComment;
  replies: TutorComment[];
}

export function buildCommentThreads(comments: TutorComment[]): CommentThread[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const repliesByRoot = new Map<string, TutorComment[]>();
  const roots: TutorComment[] = [];

  for (const comment of comments) {
    if (!comment.parent_comment_id) {
      roots.push(comment);
      continue;
    }

    let rootId = comment.parent_comment_id;
    let parent = byId.get(rootId);
    while (parent?.parent_comment_id) {
      rootId = parent.parent_comment_id;
      parent = byId.get(rootId);
    }

    const bucket = repliesByRoot.get(rootId) ?? [];
    bucket.push(comment);
    repliesByRoot.set(rootId, bucket);
  }

  return roots
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((root) => ({
      root,
      replies: (repliesByRoot.get(root.id) ?? []).sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      ),
    }));
}

export function commentAuthorLabel(
  comment: TutorComment,
  currentUserId?: string
): string {
  if (currentUserId && comment.author_id === currentUserId) {
    return "You";
  }

  const name = comment.profiles?.full_name?.trim();
  if (name) return name;

  switch (comment.profiles?.role as UserRole | undefined) {
    case "admin":
      return "Tutor";
    case "parent":
      return "Parent";
    case "student":
      return "Student";
    default:
      return "User";
  }
}

export function commentRoleLabel(comment: TutorComment): string {
  switch (comment.profiles?.role as UserRole | undefined) {
    case "admin":
      return "Tutor";
    case "parent":
      return "Parent";
    case "student":
      return "Student";
    default:
      return "User";
  }
}

export function canReplyToComment(
  comment: TutorComment,
  role: UserRole | "admin"
): boolean {
  if (role === "admin") return true;
  if (role === "student") return comment.visible_to_student;
  if (role === "parent") return comment.visible_to_parent;
  return false;
}
