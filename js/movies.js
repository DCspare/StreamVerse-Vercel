import { getAllContent } from "./movieApi.js";
import { createContentCard } from "./main.js";

document.addEventListener("DOMContentLoaded", async function () {
  const moviesContentGrid = document.getElementById("moviesCategoryGrid");
  const preloader = document.getElementById("preloader");

  if (moviesContentGrid) {
    try {
      const allContent = await getAllContent();
      const movies = allContent.filter(
        (item) => item.type.toLowerCase() === "movie"
      );

      moviesContentGrid.innerHTML = "";
      if (movies.length > 0) {
        movies.forEach((item) => {
          const card = createContentCard(item);
          moviesContentGrid.appendChild(card);
        });
      } else {
        moviesContentGrid.innerHTML =
          '<p class="empty-message">No movies found.</p>';
      }
    } catch (error) {
      console.error("Error loading movie content:", error);
      moviesContentGrid.innerHTML =
        '<p class="empty-message">Could not load content. Please try again later.</p>';
    } finally {
      if (preloader) {
        preloader.classList.add("loaded");
      }
    }
  } else {
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }
});
