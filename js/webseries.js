import { getAllContent } from "./movieApi.js";
import { createContentCard } from "./main.js";

document.addEventListener("DOMContentLoaded", async function () {
  const webseriesCategoryGrid = document.getElementById(
    "webseriesCategoryGrid"
  );
  const preloader = document.getElementById("preloader");

  if (webseriesCategoryGrid) {
    try {
      const allContent = await getAllContent();
      const webseries = allContent.filter(
        (item) => item.type.toLowerCase() === "webseries"
      );

      webseriesCategoryGrid.innerHTML = "";
      if (webseries.length > 0) {
        webseries.forEach((item) => {
          const card = createContentCard(item);
          webseriesCategoryGrid.appendChild(card);
        });
      } else {
        webseriesCategoryGrid.innerHTML =
          '<p class="empty-message">No webseries found.</p>';
      }
    } catch (error) {
      console.error("Error loading webseries content:", error);
      webseriesCategoryGrid.innerHTML =
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
