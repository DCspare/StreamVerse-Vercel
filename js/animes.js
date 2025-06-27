import { getAllContent } from "./movieApi.js";
import { createContentCard } from "./main.js";

document.addEventListener("DOMContentLoaded", async function () {
  const animesCategoryGrid = document.getElementById("animesCategoryGrid");
  const preloader = document.getElementById("preloader");

  if (animesCategoryGrid) {
    try {
      const allContent = await getAllContent();
      const animes = allContent.filter(
        (item) => item.type.toLowerCase() === "animes"
      );

      animesCategoryGrid.innerHTML = "";
      if (animes.length > 0) {
        animes.forEach((item) => {
          const card = createContentCard(item);
          animesCategoryGrid.appendChild(card);
        });
      } else {
        animesCategoryGrid.innerHTML =
          '<p class="empty-message">No animes found.</p>';
      }
    } catch (error) {
      console.error("Error loading anime content:", error);
      animesCategoryGrid.innerHTML =
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
