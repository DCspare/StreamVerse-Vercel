// admin/js/content-manager.js (Module Version with Bulk Actions)

import {
  addBulkContent,
  deleteMultipleContent,
  invalidateContentCache,
} from "../../js/movieApi.js";
import { showNotification } from "../../js/notifications.js"; // Import the notification function

let allContentData = []; // Cache for all content
let selectedItems = new Set();
let undoStack = [];
let redoStack = [];

// --- Initialization ---
// Export the main function so the router can call it
export async function initializeContentManager() {
  console.log("Initializing Content Manager...");
  document.getElementById("content-modal")?.classList.remove("visible");
  document.getElementById("bulk-add-modal")?.classList.remove("visible");
  await loadContentTable();
  setupEventListeners();
  updateUndoRedoButtons();
  updateBulkActionsToolbar();
}

// --- Event Listeners ---
function setupEventListeners() {
  document
    .getElementById("add-content-btn")
    ?.addEventListener("click", openAddModal);
  document.getElementById("undo-btn")?.addEventListener("click", handleUndo);
  document.getElementById("redo-btn")?.addEventListener("click", handleRedo);
  document
    .getElementById("content-form")
    ?.addEventListener("submit", handleFormSubmit);
  document
    .getElementById("search-input")
    ?.addEventListener("input", handleSearch);
  document
    .getElementById("content-type")
    ?.addEventListener("change", toggleSeriesFields);

  // Bulk Action Listeners
  document
    .getElementById("bulk-add-btn")
    ?.addEventListener("click", openBulkAddModal);
  document
    .getElementById("bulk-add-form")
    ?.addEventListener("submit", handleBulkAddSubmit);
  document
    .getElementById("delete-selected-btn")
    ?.addEventListener("click", handleBulkDelete);
  document
    .getElementById("select-all-checkbox")
    ?.addEventListener("change", handleSelectAll);

  document
    .querySelectorAll(".close-modal")
    .forEach((btn) => btn.addEventListener("click", closeModal));

  document
    .getElementById("content-table-body")
    ?.addEventListener("click", (event) => {
      const target = event.target;
      const button = target.closest(
        "button.delete-btn, button.edit-btn, a.btn"
      );
      const checkbox = target.closest("input.row-checkbox");
      const row = target.closest("tr");

      if (button) {
        if (button.classList.contains("edit-btn")) {
          openEditModal(button.dataset.id);
        } else if (button.classList.contains("delete-btn")) {
          handleDeleteConfirmation(button.dataset.id);
        }
        // Let the media button link work as a normal link
      } else if (checkbox) {
        handleSelectionChange(checkbox.dataset.id, checkbox.checked);
      } else if (row && row.querySelector(".row-checkbox")) {
        // Clicking row toggles checkbox
        const rowCheckbox = row.querySelector(".row-checkbox");
        rowCheckbox.checked = !rowCheckbox.checked;
        handleSelectionChange(rowCheckbox.dataset.id, rowCheckbox.checked);
      }
    });
}

// --- Core Table & Search ---
async function loadContentTable() {
  try {
    invalidateContentCache(); // Ensure fresh data
    const response = await fetch("/api/content");
    if (!response.ok) throw new Error("Network response was not ok.");
    allContentData = await response.json();
    renderTable(allContentData);
    clearSelection();
  } catch (error) {
    console.error("Error loading content:", error);
    const tableBody = document.getElementById("content-table-body");
    if (tableBody)
      tableBody.innerHTML = `<tr><td colspan="7" class="error-message">Error loading content.</td></tr>`;
  }
}

function renderTable(contentArray) {
  const tableBody = document.getElementById("content-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = contentArray
    .map(
      (content) => `
    <tr data-id="${content.id}" class="${
        selectedItems.has(content.id) ? "selected" : ""
      }">
      <td class="checkbox-cell" data-label="Select">
        <input type="checkbox" class="row-checkbox" data-id="${content.id}" ${
        selectedItems.has(content.id) ? "checked" : ""
      } />
      </td>
      <td class="table-poster-cell" data-label="Poster">
        <img src="${
          content.posterImage || "/assets/images/placeholder_poster.png"
        }" alt="Poster" class="table-poster" onerror="this.onerror=null;this.src='/assets/images/placeholder_poster.png';">
      </td>
      <td class="id-cell" data-label="ID">${content.id}</td>
      <td data-label="Title">${content.title}</td>
      <td data-label="Type">${content.type}</td>
      <td data-label="Year">${content.year}</td>
      <td data-label="Actions">
        <div class="action-buttons">
          <a href="/admin/media#${
            content.id
          }" class="btn btn-secondary btn-small">Media</a>
          <button class="btn btn-primary btn-small edit-btn" data-id="${
            content.id
          }">Edit</button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${
            content.id
          }">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const filteredContent = allContentData.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm) ||
      c.id.toLowerCase().includes(searchTerm)
  );
  renderTable(filteredContent);
  updateSelectAllCheckboxState();
}

// --- Selection Logic ---
function handleSelectionChange(contentId, isSelected) {
  if (isSelected) {
    selectedItems.add(contentId);
  } else {
    selectedItems.delete(contentId);
  }
  document
    .querySelector(`tr[data-id="${contentId}"]`)
    ?.classList.toggle("selected", isSelected);
  updateBulkActionsToolbar();
  updateSelectAllCheckboxState();
}

function handleSelectAll(event) {
  const isChecked = event.target.checked;
  const checkboxes = document.querySelectorAll(
    "#content-table-body .row-checkbox"
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
    handleSelectionChange(checkbox.dataset.id, isChecked);
  });
}

function updateBulkActionsToolbar() {
  const toolbar = document.getElementById("bulk-actions-toolbar");
  const countSpan = document.getElementById("selection-count");
  const count = selectedItems.size;

  if (toolbar && countSpan) {
    if (count > 0) {
      toolbar.style.display = "flex";
      countSpan.textContent = `${count} item${count > 1 ? "s" : ""} selected`;
    } else {
      toolbar.style.display = "none";
    }
  }
}

function updateSelectAllCheckboxState() {
  const selectAllCheckbox = document.getElementById("select-all-checkbox");
  const allRowCheckboxes = document.querySelectorAll(
    "#content-table-body .row-checkbox"
  );
  const totalVisible = allRowCheckboxes.length;

  if (!selectAllCheckbox) return;

  if (totalVisible === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }

  const numSelected = Array.from(allRowCheckboxes).filter(
    (cb) => cb.checked
  ).length;

  if (numSelected === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (numSelected === totalVisible) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

function clearSelection() {
  selectedItems.clear();
  const selectAllCheckbox = document.getElementById("select-all-checkbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }
  document
    .querySelectorAll("tr.selected")
    .forEach((row) => row.classList.remove("selected"));
  updateBulkActionsToolbar();
}

// --- Bulk Action Handlers ---
function openBulkAddModal() {
  document.getElementById("bulk-add-modal")?.classList.add("visible");
  document.getElementById("bulk-json-input").value = "";
  document.body.classList.add("modal-open"); // ADDED: Lock body scroll
}

async function handleBulkAddSubmit(event) {
  event.preventDefault();
  const jsonInput = document.getElementById("bulk-json-input");
  let contentArray;

  try {
    contentArray = JSON.parse(jsonInput.value);
    if (!Array.isArray(contentArray)) {
      throw new Error("Input must be a JSON array.");
    }
  } catch (error) {
    showNotification(`Invalid JSON: ${error.message}`, { type: "error" });
    return;
  }

  try {
    const response = await addBulkContent(contentArray);
    showNotification(response.message || "Bulk add completed.", {
      type: "success",
    });
    closeModal();
    await loadContentTable();
  } catch (error) {
    showNotification(`Error adding content: ${error.message}`, {
      type: "error",
    });
  }
}

function handleBulkDelete() {
  const count = selectedItems.size;
  if (count === 0) return;

  showNotification(
    `Permanently delete ${count} selected item${count > 1 ? "s" : ""}?`,
    {
      type: "confirm",
      duration: 0,
      buttons: [
        { text: "Delete", class: "confirm-btn", action: performBulkDelete },
        { text: "Cancel", action: () => {} },
      ],
    }
  );
}

async function performBulkDelete() {
  const idsToDelete = Array.from(selectedItems);
  try {
    const response = await deleteMultipleContent(idsToDelete);
    showNotification(response.message || "Items deleted successfully.", {
      type: "success",
    });
    await loadContentTable(); // This also clears selection
  } catch (error) {
    showNotification(`Error deleting items: ${error.message}`, {
      type: "error",
    });
  }
}

// --- Form & Modal Logic (Single Item) ---
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const contentId = form.dataset.id;
  const formData = new FormData(form);

  const data = Object.fromEntries(formData.entries());

  const toArray = (str) =>
    str ? str.split(",").map((item) => item.trim()) : [];
  data.genres = toArray(data.genres);
  data.cast = toArray(data.cast);
  data.tags = toArray(data.tags);
  data.languages = toArray(data.languages);
  data.quality = toArray(data.quality);

  const isUpdate = !!contentId;
  const url = isUpdate ? `/api/content/${contentId}` : "/api/content";

  let oldContent = null;
  if (isUpdate) {
    oldContent = allContentData.find((c) => c.id === contentId);
  }

  try {
    const response = await fetch(url, {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    if (!response.ok) {
      try {
        throw new Error(JSON.parse(responseText).error || responseText);
      } catch (e) {
        throw new Error(responseText);
      }
    }
    const savedContent = JSON.parse(responseText);

    if (isUpdate) {
      recordAction({
        type: "update",
        oldContent: oldContent,
        newContent: savedContent,
      });
    } else {
      recordAction({ type: "create", content: savedContent });
    }

    closeModal();
    await loadContentTable();
    showNotification(
      `Content ${isUpdate ? "updated" : "added"} successfully!`,
      { type: "success" }
    );
  } catch (error) {
    showNotification(`Error: ${error.message}`, { type: "error" });
  }
}

function openModal(modalId) {
  document.getElementById(modalId)?.classList.add("visible");
  document.body.classList.add("modal-open"); // ADDED: Lock body scroll
}

function closeModal() {
  document.querySelectorAll(".modal-overlay.visible").forEach((modal) => {
    modal.classList.remove("visible");
  });
  document.body.classList.remove("modal-open"); // ADDED: Unlock body scroll
}

function openAddModal() {
  const form = document.getElementById("content-form");
  if (!form) return;
  form.reset();
  delete form.dataset.id;
  document.getElementById("modal-title").textContent = "Add New Content";
  document.getElementById("content-id-display").value = "";
  toggleSeriesFields();
  openModal("content-modal");
}

function openEditModal(contentId) {
  const content = allContentData.find((c) => c.id === contentId);
  if (!content) return;

  const form = document.getElementById("content-form");
  if (!form) return;
  form.reset();
  form.dataset.id = contentId;
  document.getElementById(
    "modal-title"
  ).textContent = `Edit Content: ${content.title}`;
  const safeJoin = (arr) => (Array.isArray(arr) ? arr.join(", ") : arr || "");
  form.querySelector("#content-id-display").value = content.id || "";
  form.querySelector("#content-title").value = content.title || "";
  form.querySelector("#content-type").value = content.type || "movie";
  form.querySelector("#content-description").value = content.description || "";
  form.querySelector("#content-fullDescription").value =
    content.fullDescription || "";
  form.querySelector("#content-year").value = content.year || "";
  form.querySelector("#content-rating").value = content.rating || "";
  form.querySelector("#content-director").value = safeJoin(content.director);
  form.querySelector("#content-studio").value = content.studio || "";
  form.querySelector("#content-duration").value = content.duration || "";
  form.querySelector("#content-duration-series").value = content.duration || "";
  form.querySelector("#content-posterImage").value = content.posterImage || "";
  form.querySelector("#content-heroImage").value = content.heroImage || "";
  form.querySelector("#content-genres").value = safeJoin(content.genres);
  form.querySelector("#content-cast").value = safeJoin(content.cast);
  form.querySelector("#content-tags").value = safeJoin(content.tags);
  form.querySelector("#content-languages").value = safeJoin(content.languages);
  form.querySelector("#content-quality").value = safeJoin(content.quality);

  toggleSeriesFields();
  openModal("content-modal");
}

function toggleSeriesFields() {
  const type = document.getElementById("content-type")?.value;
  const form = document.getElementById("content-form");
  if (!type || !form) return;

  form.querySelectorAll("[data-type-specific]").forEach((el) => {
    const types = el.dataset.typeSpecific.split(" ");
    el.style.display = types.includes(type) ? "block" : "none";
  });
  const movieDurationGroup = form.querySelector('[data-type-specific="movie"]');
  const seriesDurationGroup = form.querySelector(
    '[data-type-specific="webseries animes"]'
  );
  if (type === "movie") {
    if (seriesDurationGroup)
      seriesDurationGroup.querySelector("input").value = "";
  } else {
    if (movieDurationGroup)
      movieDurationGroup.querySelector("input").value = "";
  }
}

// --- Undo/Redo & Deletion Logic (Single Item) ---
function recordAction(action) {
  undoStack.push(action);
  redoStack = [];
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function handleDeleteConfirmation(contentId) {
  const content = allContentData.find((c) => c.id === contentId);
  if (!content) return;
  showNotification(`Permanently delete "${content.title}"?`, {
    type: "confirm",
    duration: 0,
    buttons: [
      {
        text: "Delete",
        class: "confirm-btn",
        action: () => performDelete(content),
      },
      { text: "Cancel", action: () => {} },
    ],
  });
}

async function performDelete(content) {
  try {
    const response = await fetch(`/api/content/${content.id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(await response.text());
    recordAction({ type: "delete", content: content });
    await loadContentTable();
    showNotification("Content deleted.", { type: "success" });
  } catch (error) {
    showNotification(`Error: ${error.message}`, { type: "error" });
  }
}

async function handleUndo() {
  if (undoStack.length === 0) return;
  const action = undoStack.pop();
  let promise;
  switch (action.type) {
    case "create":
      promise = fetch(`/api/content/${action.content.id}`, {
        method: "DELETE",
      });
      break;
    case "delete":
      promise = fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.content),
      });
      break;
    case "update":
      promise = fetch(`/api/content/${action.oldContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.oldContent),
      });
      break;
  }
  try {
    const response = await promise;
    if (!response.ok) throw new Error(await response.text());
    redoStack.push(action);
    updateUndoRedoButtons();
    await loadContentTable();
    showNotification("Action undone.", { type: "info" });
  } catch (error) {
    undoStack.push(action);
    showNotification(`Undo failed: ${error.message}`, { type: "error" });
  }
}

async function handleRedo() {
  if (redoStack.length === 0) return;
  const action = redoStack.pop();
  let promise;
  switch (action.type) {
    case "create":
      promise = fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.content),
      });
      break;
    case "delete":
      promise = fetch(`/api/content/${action.content.id}`, {
        method: "DELETE",
      });
      break;
    case "update":
      promise = fetch(`/api/content/${action.newContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.newContent),
      });
      break;
  }
  try {
    const response = await promise;
    if (!response.ok) throw new Error(await response.text());
    undoStack.push(action);
    updateUndoRedoButtons();
    await loadContentTable();
    showNotification("Action redone.", { type: "info" });
  } catch (error) {
    redoStack.push(action);
    showNotification(`Redo failed: ${error.message}`, { type: "error" });
  }
}
