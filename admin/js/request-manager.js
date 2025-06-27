// admin/js/request-manager.js (Module Version)

import { showNotification } from "../../js/notifications.js";

export function initializeRequestManager() {
  console.log("Request Manager loaded.");
  loadAllRequests();
  setupRequestListeners();
}

async function loadAllRequests() {
  try {
    const response = await fetch("/api/requests");
    if (!response.ok) throw new Error("Failed to fetch requests.");
    const requests = await response.json();
    renderRequests(requests);
  } catch (error) {
    console.error("Error loading requests:", error);
    showNotification("Could not load requests.", { type: "error" });
    const tableBody = document.getElementById("requests-table-body");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Could not load requests.</td></tr>`;
    }
  }
}

function renderRequests(requests) {
  const tableBody = document.getElementById("requests-table-body");
  if (!tableBody) return;

  if (!Array.isArray(requests) || requests.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-message">No pending requests found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = requests
    .map(
      (req) => `
    <tr data-id="${req.id}">
      <td data-label="ID">${req.id}</td>
      <td data-label="Content ID">${req.contentId || "N/A"}</td>
      <td data-label="User">${(req.user && req.user.name) || "Anonymous"}</td>
      <td class="text-cell" data-label="Request">${req.text}</td>
      <td data-label="Date">${new Date(req.date).toLocaleString()}</td>
      <td data-label="Actions">
        <div class="action-buttons">
          <button class="btn btn-primary btn-small reply-btn" data-id="${
            req.id
          }" data-text="${escape(req.text)}">Reply</button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${
            req.id
          }">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function setupRequestListeners() {
  const table = document.getElementById("requests-table");
  const modalOverlay = document.getElementById("request-reply-modal-overlay");
  const replyForm = document.getElementById("request-reply-form");

  if (!table || !modalOverlay || !replyForm) return;

  table.addEventListener("click", (e) => {
    const replyButton = e.target.closest(".reply-btn");
    const deleteButton = e.target.closest(".delete-btn");

    if (replyButton) {
      const { id, text } = replyButton.dataset;
      openReplyModal(id, unescape(text));
    }
    if (deleteButton) {
      const { id } = deleteButton.dataset;
      handleDeleteRequest(id);
    }
  });

  document
    .getElementById("request-reply-modal-close-btn")
    ?.addEventListener("click", closeReplyModal);
  document
    .getElementById("request-reply-modal-cancel-btn")
    ?.addEventListener("click", closeReplyModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeReplyModal();
  });

  replyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const requestId = document.getElementById("reply-request-id").value;
    const replyText = document.getElementById("request-reply-text").value;

    try {
      const response = await fetch(`/api/requests/${requestId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to post reply.");

      showNotification("Reply posted successfully!", { type: "success" });
      closeReplyModal();
      loadAllRequests();
    } catch (error) {
      showNotification(`Error: ${error.message}`, { type: "error" });
    }
  });
}

function openReplyModal(requestId, requestText) {
  document.getElementById("reply-request-id").value = requestId;
  document.getElementById("original-request-text").textContent = requestText;
  document.getElementById("request-reply-text").value = "";
  document
    .getElementById("request-reply-modal-overlay")
    .classList.add("visible");
  document.getElementById("request-reply-text").focus();
}

function closeReplyModal() {
  document
    .getElementById("request-reply-modal-overlay")
    ?.classList.remove("visible");
}

function handleDeleteRequest(requestId) {
  showNotification("Are you sure you want to delete this request?", {
    type: "confirm",
    duration: 0,
    buttons: [
      {
        text: "Delete",
        class: "confirm-btn",
        action: async () => {
          try {
            const response = await fetch(`/api/requests/${requestId}`, {
              method: "DELETE",
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Failed to delete request.");

            showNotification("Request deleted successfully!", {
              type: "success",
            });
            loadAllRequests();
          } catch (error) {
            showNotification(`Error: ${error.message}`, { type: "error" });
          }
        },
      },
      { text: "Cancel", action: () => {} },
    ],
  });
}
