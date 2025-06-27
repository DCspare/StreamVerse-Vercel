// admin/js/comment-manager.js (Module Version)

import { showNotification } from "../../js/notifications.js";

export function initializeCommentManager() {
  console.log("Comment Manager loaded.");
  loadAllComments();
  setupCommentListeners();
}

async function loadAllComments() {
  try {
    const response = await fetch("/api/comments_all");
    if (!response.ok) throw new Error("Failed to fetch comments.");
    const comments = await response.json();
    renderComments(comments);
  } catch (error) {
    console.error("Error loading comments:", error);
    const tableBody = document.getElementById("comments-table-body");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" class="error-message">Could not load comments.</td></tr>`;
    }
  }
}

function renderComments(comments) {
  const tableBody = document.getElementById("comments-table-body");
  if (!tableBody) return;

  if (!comments || comments.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-message">No comments found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = comments
    .map(
      (comment) => `
      <tr data-comment-id="${comment.commentId}" data-content-id="${
        comment.contentId
      }">
        <td data-label="Content">${comment.contentTitle || "Unknown"}</td>
        <td data-label="User">${
          (comment.user && comment.user.name) || comment.user || "Anonymous"
        }</td>
        <td class="text-cell" data-label="Comment">${comment.text}</td>
        <td data-label="Date">${new Date(comment.date).toLocaleString()}</td>
        <td data-label="Actions">
          <div class="action-buttons">
            <button class="btn btn-primary btn-small reply-btn">Reply</button>
            <button class="btn btn-danger btn-small delete-btn">Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

function setupCommentListeners() {
  const table = document.getElementById("comments-table");
  if (!table) return;

  table.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    const { commentId, contentId } = row.dataset;

    if (e.target.classList.contains("reply-btn")) {
      const text = row.querySelector(".text-cell").textContent;
      openCommentReplyModal(commentId, contentId, text);
    }

    if (e.target.classList.contains("delete-btn")) {
      handleDeleteComment(commentId, contentId);
    }
  });

  document
    .getElementById("comment-reply-modal-close-btn")
    ?.addEventListener("click", closeCommentReplyModal);
  document
    .getElementById("comment-reply-modal-cancel-btn")
    ?.addEventListener("click", closeCommentReplyModal);
  document
    .getElementById("comment-reply-form")
    ?.addEventListener("submit", handleReplySubmit);
}

function openCommentReplyModal(commentId, contentId, text) {
  document.getElementById("reply-comment-id").value = commentId;
  document.getElementById("reply-content-id").value = contentId;
  document.getElementById("original-comment-text").textContent = text;
  document
    .getElementById("comment-reply-modal-overlay")
    .classList.add("visible");
  document.body.classList.add("modal-open"); // ADD THIS LINE
}

function closeCommentReplyModal() {
  document
    .getElementById("comment-reply-modal-overlay")
    ?.classList.remove("visible");
  document.body.classList.remove("modal-open"); // ADD THIS LINE
}

async function handleReplySubmit(e) {
  e.preventDefault();
  const contentId = document.getElementById("reply-content-id").value;
  const commentId = document.getElementById("reply-comment-id").value;
  const replyText = document.getElementById("comment-reply-text").value;

  try {
    const response = await fetch(`/api/comments/${contentId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyText }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to submit reply.");

    showNotification("Reply posted successfully!", { type: "success" });
    closeCommentReplyModal();
    loadAllComments();
  } catch (error) {
    showNotification(`Error: ${error.message}`, { type: "error" });
  }
}

function handleDeleteComment(commentId, contentId) {
  showNotification("Are you sure you want to delete this comment?", {
    type: "confirm",
    duration: 0,
    buttons: [
      {
        text: "Delete",
        class: "confirm-btn",
        action: async () => {
          try {
            const response = await fetch(
              `/api/comments/${contentId}/${commentId}`,
              { method: "DELETE" }
            );
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Failed to delete comment.");
            showNotification("Comment deleted successfully!", {
              type: "success",
            });
            loadAllComments();
          } catch (error) {
            showNotification(`Error: ${error.message}`, { type: "error" });
          }
        },
      },
      { text: "Cancel", action: () => {} },
    ],
  });
}
