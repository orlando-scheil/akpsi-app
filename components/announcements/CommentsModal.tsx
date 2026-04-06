// CommentsModal — shows all comments on an announcement with add/edit/delete support.
// Opened from AnnouncementCard on the Announcements page.
"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Trash2, Pencil, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  subscribeToComments,
  addComment,
  updateComment,
  deleteComment,
} from "@/lib/firestore";
import type { AnnouncementComment } from "@/types/announcement";
import { formatRelativeTime } from "@/lib/utils";
import { theme } from "@/lib/theme";

interface CurrentUser {
  uid: string;
  name: string;
  avatar?: string;
}

interface CommentsModalProps {
  announcementId: string;
  announcementTitle: string;
  open: boolean;
  onClose: (open: boolean) => void;
  currentUser: CurrentUser | null;
}

export function CommentsModal({
  announcementId,
  announcementTitle,
  open,
  onClose,
  currentUser,
}: CommentsModalProps) {
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const unsub = subscribeToComments(
      announcementId,
      (data) => {
        setComments(data);
        setLoading(false);
      }
    );
    return unsub;
  }, [open, announcementId]);

  // Scroll to bottom when comments load or a new one arrives
  useEffect(() => {
    if (!loading && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments, loading]);

  async function handleAdd() {
    if (!currentUser || !newBody.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(announcementId, {
        body: newBody.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
      });
      setNewBody("");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(comment: AnnouncementComment) {
    setEditingId(comment.id);
    setEditBody(comment.body);
  }

  async function handleSaveEdit(commentId: string) {
    if (!editBody.trim()) return;
    await updateComment(announcementId, commentId, editBody.trim());
    setEditingId(null);
  }

  async function handleDelete(commentId: string) {
    await deleteComment(announcementId, commentId);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base" style={{ color: theme.textPrimary }}>
            Comments
          </DialogTitle>
          <p className="text-xs truncate" style={{ color: theme.textSecondary }}>
            {announcementTitle}
          </p>
        </DialogHeader>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-4"
          style={{ maxHeight: "380px", minHeight: "80px" }}
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-4 w-4 rounded-full border-2 animate-spin"
                style={{
                  borderColor: `${theme.primary}40`,
                  borderTopColor: theme.primary,
                }}
              />
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: theme.textDim }}>
              No comments yet. Be the first!
            </p>
          )}

          {!loading &&
            comments.map((comment) => {
              const isOwn = currentUser?.uid === comment.authorId;
              const isEditing = editingId === comment.id;

              return (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                    <AvatarFallback
                      className="text-[10px] font-bold"
                      style={{ background: theme.primary, color: "white" }}
                    >
                      {comment.authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {comment.authorName}
                      </span>
                      <span className="text-[10px]" style={{ color: theme.textDim }}>
                        {formatRelativeTime(comment.createdAt)}
                        {comment.updatedAt && " · edited"}
                      </span>
                      {isOwn && !isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="ml-auto h-5 w-5 flex items-center justify-center rounded transition-colors focus-visible:outline-none"
                            style={{ color: theme.textDim }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = theme.textDim;
                            }}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => startEdit(comment)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                              onClick={() => handleDelete(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-1 flex flex-col gap-1.5">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="text-sm min-h-[60px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3"
                            style={{ background: theme.primary, color: "white" }}
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editBody.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-3"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-sm mt-0.5 leading-relaxed whitespace-pre-line"
                        style={{ color: theme.textSecondary }}
                      >
                        {comment.body}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Add comment input */}
        <div
          className="px-5 py-3 flex gap-2 items-end"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <Textarea
            placeholder="Write a comment…"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            className="text-sm resize-none min-h-[38px] max-h-28 flex-1"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            style={{ background: theme.primary, color: "white" }}
            onClick={handleAdd}
            disabled={!newBody.trim() || submitting || !currentUser}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
