// admin/js/dashboard.js (Module Version)

import { showNotification } from "../../js/notifications.js";

// Export the main function so the router can call it
export function initializeDashboard() {
  console.log("Dashboard view loaded.");
  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const response = await fetch("/api/content");
    if (!response.ok) throw new Error(`API request failed`);
    const content = await response.json();

    const total = content.length;
    const movies = content.filter((c) => c.type === "movie").length;
    const series = content.filter((c) => c.type === "webseries").length;
    const animes = content.filter((c) => c.type === "animes").length;

    const totalEl = document.getElementById("total-content-count");
    const movieEl = document.getElementById("movie-count");
    const seriesEl = document.getElementById("series-count");
    const animeEl = document.getElementById("anime-count");

    if (totalEl) totalEl.textContent = total;
    if (movieEl) movieEl.textContent = movies;
    if (seriesEl) seriesEl.textContent = series;
    if (animeEl) animeEl.textContent = animes;
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    showNotification("Error loading dashboard stats.", { type: "error" });
    const statElements = document.querySelectorAll(".stat-card-number");
    statElements.forEach((el) => (el.textContent = "Error"));
  }
}
