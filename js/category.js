import { getAllContent } from "./movieApi.js";
import { createContentCard } from "./main.js";
import { ensureTemplatesLoaded } from "./templates.js";

document.addEventListener("DOMContentLoaded", async function () {
  console.log("category.js DOMContentLoaded fired.");
  const categoryContentGrid = document.getElementById("categoryContentGrid");
  const sectionTitle = document.querySelector(
    ".content-section .section-title"
  );
  const preloader = document.getElementById("preloader");

  await ensureTemplatesLoaded();

  if (categoryContentGrid) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get("category");
      console.log("Category from URL params:", category);

      let contentToDisplay = [];
      let titleText = "Browse by Category";
      const allContent = await getAllContent();

      if (category) {
        // ... (rest of the logic is the same)
        if (category === "trending") {
          contentToDisplay = allContent.filter(
            (item) => item.tags && item.tags.includes("trending")
          );
          titleText = "Trending Now";
        } else if (category === "anime") {
          contentToDisplay = allContent.filter(
            (item) => item.type.toLowerCase() === "anime"
          );
          titleText = "Popular Anime";
        } else if (category === "series") {
          contentToDisplay = allContent.filter(
            (item) => item.type.toLowerCase() === "series"
          );
          titleText = "Popular Web Series";
        } else {
          contentToDisplay = allContent.filter(
            (item) =>
              item.genres &&
              Array.isArray(item.genres) &&
              item.genres.some(
                (genre) => genre.toLowerCase() === category.toLowerCase()
              )
          );
          titleText = `Category: ${
            category.charAt(0).toUpperCase() + category.slice(1)
          }`;
        }
      } else {
        contentToDisplay = [...allContent].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      }

      if (sectionTitle) sectionTitle.textContent = titleText;

      categoryContentGrid.innerHTML = "";
      if (contentToDisplay.length > 0) {
        contentToDisplay.forEach((item) => {
          const card = createContentCard(item);
          categoryContentGrid.appendChild(card);
        });
      } else {
        categoryContentGrid.innerHTML =
          '<p class="empty-message">No content found for this category.</p>';
      }
    } catch (error) {
      console.error("Error loading category content:", error);
      categoryContentGrid.innerHTML =
        "<p>Could not load content. Please try again later.</p>";
    } finally {
      if (preloader) preloader.classList.add("loaded");
    }
  } else {
    if (preloader) preloader.classList.add("loaded");
  }
});
