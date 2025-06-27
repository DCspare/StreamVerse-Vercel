// js/watchlist.js (Module Version)

import { getAllContent } from "./movieApi.js";
import { showNotification } from "./notifications.js";
import { ensureTemplatesLoaded } from "./templates.js";
import { createContentCard } from "./main.js"; // Assuming main.js exports this

/**
 * Retrieves the current user's watchlist from localStorage.
 * @returns {Array<string>} An array of content IDs.
 */
function getWatchlist() {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) return [];
  const allUserWatchlists = JSON.parse(
    localStorage.getItem("userWatchlists") || "{}"
  );
  return allUserWatchlists[loggedInUser] || [];
}

/**
 * Saves the given watchlist array to localStorage.
 * @param {Array<string>} watchlist - The array of content IDs to save.
 */
function saveWatchlist(watchlist) {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) return;
  const allUserWatchlists = JSON.parse(
    localStorage.getItem("userWatchlists") || "{}"
  );
  allUserWatchlists[loggedInUser] = watchlist;
  localStorage.setItem("userWatchlists", JSON.stringify(allUserWatchlists));
}

export function addToWatchlist(contentId) {
  const watchlist = getWatchlist();
  if (watchlist.includes(contentId)) {
    removeFromWatchlist(contentId);
    return;
  }
  watchlist.push(contentId);
  saveWatchlist(watchlist);
  showNotification("Item added to your watchlist!", { type: "success" });
  updateWatchlistDropdown();
  window.dispatchEvent(
    new CustomEvent("watchlistUpdated", { detail: { contentId: contentId } })
  );
}

export function removeFromWatchlist(contentId) {
  let watchlist = getWatchlist();
  const initialLength = watchlist.length;
  watchlist = watchlist.filter((id) => id !== contentId);

  if (initialLength > watchlist.length) {
    saveWatchlist(watchlist);
    showNotification("Item removed from your watchlist!", { type: "info" });
    updateWatchlistDropdown();
    if (document.getElementById("watchlistContentGrid")) {
      populateWatchlistGrid();
    }
    window.dispatchEvent(
      new CustomEvent("watchlistUpdated", { detail: { contentId: contentId } })
    );
  }
}

export function isInWatchlist(contentId) {
  return getWatchlist().includes(contentId);
}

export async function updateWatchlistDropdown() {
  const watchlistDropdown = document.getElementById("watchlistDropdown");
  const watchlistDropdownToggle = document.getElementById(
    "watchlistDropdownToggle"
  );
  if (!watchlistDropdown || !watchlistDropdownToggle) return;

  const watchlistIds = getWatchlist();
  watchlistDropdown.innerHTML = "";

  const watchlistCountBadge = watchlistDropdownToggle.querySelector(
    ".watchlist-count-badge"
  );
  if (watchlistCountBadge) {
    watchlistCountBadge.textContent = watchlistIds.length;
    watchlistCountBadge.classList.toggle("hidden", watchlistIds.length === 0);
  }

  if (watchlistIds.length === 0) {
    watchlistDropdown.innerHTML =
      '<p class="dropdown-empty-message">Your watchlist is empty.</p>';
    return;
  }

  const allContent = await getAllContent();
  const watchlistItems = allContent.filter((item) =>
    watchlistIds.includes(item.id)
  );

  if (watchlistItems.length > 0) {
    watchlistItems.forEach((item) => {
      const itemElement = document.createElement("a");
      itemElement.href = `contentDetails.html?id=${item.id}`;
      itemElement.classList.add("watchlist-dropdown-item");
      itemElement.target = "_blank";
      itemElement.innerHTML = `
                <img src="${item.posterImage}" alt="${item.title}">
                <span>${item.title}</span>
                <button class="remove-from-watchlist-btn" data-id="${item.id}" title="Remove from Watchlist">
                    <i class="ri-close-line"></i>
                </button>
            `;
      watchlistDropdown.appendChild(itemElement);
      itemElement
        .querySelector(".remove-from-watchlist-btn")
        .addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeFromWatchlist(e.currentTarget.dataset.id);
        });
    });

    const seeAllLink = document.createElement("a");
    seeAllLink.href = "watchlist.html";
    seeAllLink.classList.add("dropdown-see-all");
    seeAllLink.textContent = "See All";
    seeAllLink.target = "_blank";
    watchlistDropdown.appendChild(seeAllLink);
  } else {
    watchlistDropdown.innerHTML =
      '<p class="dropdown-empty-message">No content found in your watchlist.</p>';
  }
}

export async function populateWatchlistGrid() {
  const watchlistGrid = document.getElementById("watchlistContentGrid");
  if (!watchlistGrid) return;

  const watchlistIds = getWatchlist();
  watchlistGrid.innerHTML = "";

  if (watchlistIds.length === 0) {
    watchlistGrid.innerHTML =
      '<p class="empty-message">Your watchlist is empty.</p>';
    return;
  }

  const allContent = await getAllContent();
  const watchlistItems = allContent.filter((item) =>
    watchlistIds.includes(item.id)
  );

  if (watchlistItems.length > 0) {
    watchlistItems.forEach((item) => {
      const card = createContentCard(item);
      watchlistGrid.appendChild(card);
    });
  } else {
    watchlistGrid.innerHTML =
      '<p class="empty-message">No content found in your watchlist.</p>';
  }
}

// Initialization logic
document.addEventListener("DOMContentLoaded", async () => {
  console.log("watchlist.js: DOMContentLoaded fired.");
  await ensureTemplatesLoaded();

  updateWatchlistDropdown();

  if (document.getElementById("watchlistContentGrid")) {
    const preloader = document.getElementById("preloader");
    try {
      await populateWatchlistGrid();
    } catch (error) {
      console.error("Error populating watchlist grid:", error);
      document.getElementById("watchlistContentGrid").innerHTML =
        '<p class="empty-message">Could not load your watchlist.</p>';
    } finally {
      if (preloader) {
        preloader.classList.add("loaded");
      }
    }
  }
});
