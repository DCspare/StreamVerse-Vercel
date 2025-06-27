import { getAllContent } from "./movieApi.js";
import { createContentCard } from "./main.js";
import { ensureTemplatesLoaded } from "./templates.js";

document.addEventListener("DOMContentLoaded", async function () {
  console.log("azContent.js DOMContentLoaded fired.");
  const azContentGrid = document.getElementById("azContentGrid");
  const sectionTitle = document.querySelector(
    ".content-section .section-title"
  );
  const azFilterButtonsContainer = document.querySelector(".az-filter-buttons");
  const preloader = document.getElementById("preloader");

  await ensureTemplatesLoaded();

  if (azFilterButtonsContainer) {
    // ... (rest of the logic is the same)
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    alphabet.forEach((letter) => {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-secondary");
      button.textContent = letter;
      button.dataset.letter = letter;
      azFilterButtonsContainer.appendChild(button);
    });
    const numButton = document.createElement("button");
    numButton.classList.add("btn", "btn-secondary");
    numButton.textContent = "0-9";
    numButton.dataset.letter = "0-9";
    azFilterButtonsContainer.appendChild(numButton);
    azFilterButtonsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn")) {
        const selectedLetter = event.target.dataset.letter;
        filterAndDisplayContent(selectedLetter);
        azFilterButtonsContainer
          .querySelectorAll(".btn")
          .forEach((btn) => btn.classList.remove("active"));
        event.target.classList.add("active");
      }
    });
  }

  if (azContentGrid) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const letter = urlParams.get("letter");
      await filterAndDisplayContent(letter);
      if (letter && azFilterButtonsContainer) {
        const activeButton = azFilterButtonsContainer.querySelector(
          `.btn[data-letter="${letter.toUpperCase()}"]`
        );
        if (activeButton) activeButton.classList.add("active");
      }
    } catch (error) {
      console.error("Error loading A-Z content:", error);
      azContentGrid.innerHTML =
        "<p>Could not load content. Please try again later.</p>";
    } finally {
      if (preloader) preloader.classList.add("loaded");
    }
  } else {
    if (preloader) preloader.classList.add("loaded");
  }

  async function filterAndDisplayContent(selectedLetter) {
    // ... (rest of the logic is the same)
    let contentToDisplay = [];
    let titleText = "Browse Titles (A-Z)";
    const allContent = await getAllContent();

    if (selectedLetter) {
      if (selectedLetter === "0-9") {
        contentToDisplay = allContent.filter((item) =>
          /^[0-9]/.test(item.title)
        );
        titleText = "Titles starting with 0-9";
      } else {
        const regex = new RegExp(`^${selectedLetter}`, "i");
        contentToDisplay = allContent.filter((item) => regex.test(item.title));
        titleText = `Titles starting with ${selectedLetter.toUpperCase()}`;
      }
    } else {
      contentToDisplay = [...allContent].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }
    if (sectionTitle) sectionTitle.textContent = titleText;
    if (azContentGrid) {
      azContentGrid.innerHTML = "";
      if (contentToDisplay.length > 0) {
        contentToDisplay.forEach((item) => {
          const card = createContentCard(item);
          azContentGrid.appendChild(card);
        });
      } else {
        azContentGrid.innerHTML =
          '<p class="empty-message">No content found for this letter.</p>';
      }
    }
  }
});
