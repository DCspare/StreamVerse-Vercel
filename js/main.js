// js/main.js (Module Version)

// Import necessary functions from other modules
import { getAllContent, getContentByType, getAllGenres } from "./movieApi.js";
import { ensureTemplatesLoaded } from "./templates.js";
import { showAuthModal, hideAuthModal } from "./auth.js";
import { addToWatchlist, isInWatchlist } from "./watchlist.js";
import { showNotification } from "./notifications.js";

// Declare searchResultsContainer globally within this module
let searchResultsContainer = null;

// The main DOMContentLoaded listener remains the same
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOMContentLoaded fired in main.js.");
  const preloader = document.getElementById("preloader");

  // Wait for templates to be loaded by the templates module
  await ensureTemplatesLoaded();
  console.log("Templates loaded.");

  searchResultsContainer = document.getElementById("searchResultsContainer");
  if (!searchResultsContainer) {
    console.error("searchResultsContainer NOT found after templates loaded!");
  }

  await getAllContent();
  console.log("Content data loaded.");

  initializeHeaderFunctionality();

  const isHomePage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/";
  if (isHomePage) {
    try {
      initializeHeroSlider();
      await populateContentSections();
    } catch (error) {
      console.error("Error initializing homepage content:", error);
    } finally {
      if (preloader) {
        preloader.classList.add("loaded");
      }
    }
  } else {
    console.log(
      "main.js: Not on homepage, skipping hero slider and main content section population."
    );
  }

  populateGenreGrid();
  populateGenreDropdown();
  setTimeout(populateAZDropdown, 500);
  setTimeout(initWatchlistCardStates, 700);

  window.addEventListener("click", function (event) {
    const authModal = document.getElementById("authModal");
    const mainNav = document.getElementById("mainNav");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const searchBar = document.getElementById("searchBar");
    const searchToggle = document.getElementById("searchToggle");

    const allDropdownWrappers = document.querySelectorAll(
      ".nav-item-dropdown-wrapper"
    );

    if (authModal && event.target === authModal) hideAuthModal();

    if (
      mainNav &&
      mainNav.classList.contains("active") &&
      mobileMenuToggle &&
      !mainNav.contains(event.target) &&
      !mobileMenuToggle.contains(event.target) &&
      !event.target.closest("#closeMobileMenuBtn")
    ) {
      mainNav.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }

    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      if (
        searchBar &&
        !searchBar.classList.contains("hidden") &&
        searchToggle &&
        !searchBar.contains(event.target) &&
        !searchToggle.contains(event.target)
      ) {
        searchBar.classList.add("hidden");
      }
    }

    allDropdownWrappers.forEach((wrapper) => {
      const dropdown = wrapper.querySelector(
        ".genre-dropdown, .watchlist-dropdown, .user-profile-dropdown, .az-dropdown"
      );
      const toggle = wrapper.querySelector('.nav-link[id$="DropdownToggle"]');

      if (dropdown && toggle && !dropdown.classList.contains("hidden")) {
        if (
          !dropdown.contains(event.target) &&
          !toggle.contains(event.target)
        ) {
          dropdown.classList.add("hidden");
          wrapper.classList.remove("active");
        }
      }
    });

    const activeCards = document.querySelectorAll(
      ".content-card.tapped-active"
    );
    activeCards.forEach((card) => {
      const isClickInsideCardActions = event.target.closest(".card-action-btn");
      if (
        !card.contains(event.target) ||
        (card.contains(event.target) && !isClickInsideCardActions)
      ) {
        card.classList.remove("tapped-active");
      }
    });
  });

  window.addEventListener("watchlistUpdated", function (event) {
    const contentId = event.detail.contentId;
    console.log(
      `Watchlist updated for content ID: ${contentId}. Updating card state.`
    );
    document
      .querySelectorAll(`.add-list-trigger[data-content-id="${contentId}"]`)
      .forEach((button) => {
        updateWatchlistButtonState(button, contentId);
      });
  });

  window.addEventListener("resize", function () {
    const mainNav = document.getElementById("mainNav");
    if (
      window.innerWidth >= 768 &&
      mainNav &&
      mainNav.classList.contains("active")
    ) {
      mainNav.classList.remove("active");
      document.body.classList.remove("no-scroll");
    }
    const searchBar = document.getElementById("searchBar");
    const searchToggle = document.getElementById("searchToggle");
    if (
      window.innerWidth >= 768 &&
      searchBar &&
      !searchBar.classList.contains("hidden")
    ) {
      searchBar.classList.add("hidden");
      document.body.classList.remove("no-scroll");
      if (searchToggle) searchToggle.classList.remove("search-active");
    }
  });
});

function initializeHeaderFunctionality() {
  const searchToggle = document.getElementById("searchToggle");
  const searchBar = document.getElementById("searchBar");
  const closeSearchBtn = document.getElementById("closeSearchBtn");
  const searchInputField = document.getElementById("searchInputField");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const searchInputWrapper = searchInputField
    ? searchInputField.closest(".search-input-wrapper")
    : null;
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mainNav = document.getElementById("mainNav");
  const closeMobileMenuBtn = document.getElementById("closeMobileMenuBtn");

  if (searchBar) searchBar.classList.add("hidden");

  if (searchToggle && searchBar && searchInputField) {
    searchToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      const isMobile = window.innerWidth < 768;
      if (searchBar.classList.contains("hidden")) {
        searchBar.classList.remove("hidden");
        searchInputField.focus();
        if (isMobile) {
          document.body.classList.add("no-scroll");
          searchToggle.classList.add("search-active");
        }
        document
          .querySelectorAll(
            ".genre-dropdown, .watchlist-dropdown, .user-profile-dropdown, .az-dropdown"
          )
          .forEach((dropdown) => dropdown.classList.add("hidden"));
        document
          .querySelectorAll(".nav-item-dropdown-wrapper.active")
          .forEach((wrapper) => wrapper.classList.remove("active"));
      } else {
        searchBar.classList.add("hidden");
        if (isMobile) {
          document.body.classList.remove("no-scroll");
          searchToggle.classList.remove("search-active");
        }
        clearSearchResults();
        searchInputField.value = "";
        searchClearBtn.classList.add("hidden");
        if (searchInputWrapper)
          searchInputWrapper.classList.remove("has-clear");
      }
    });

    if (closeSearchBtn) {
      closeSearchBtn.addEventListener("click", function () {
        searchBar.classList.add("hidden");
        document.body.classList.remove("no-scroll");
        searchToggle.classList.remove("search-active");
        clearSearchResults();
        searchInputField.value = "";
        searchClearBtn.classList.add("hidden");
        if (searchInputWrapper)
          searchInputWrapper.classList.remove("has-clear");
      });
    }

    searchInputField.addEventListener("input", async function () {
      const query = this.value.trim();
      if (query.length > 0) {
        searchClearBtn.classList.remove("hidden");
        if (searchInputWrapper) searchInputWrapper.classList.add("has-clear");
        if (searchResultsContainer) await displaySearchResults(query);
      } else {
        searchClearBtn.classList.add("hidden");
        if (searchInputWrapper)
          searchInputWrapper.classList.remove("has-clear");
        clearSearchResults();
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", function () {
        searchInputField.value = "";
        searchClearBtn.classList.add("hidden");
        if (searchInputWrapper)
          searchInputWrapper.classList.remove("has-clear");
        searchInputField.focus();
        clearSearchResults();
      });
    }
  }

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      mainNav.classList.add("active");
      document.body.classList.add("no-scroll");
      document
        .querySelectorAll(
          ".search-bar-dropdown, .genre-dropdown, .watchlist-dropdown, .user-profile-dropdown, .az-dropdown"
        )
        .forEach((dropdown) => dropdown.classList.add("hidden"));
      document
        .querySelectorAll(".nav-item-dropdown-wrapper.active")
        .forEach((wrapper) => wrapper.classList.remove("active"));
      if (searchToggle) searchToggle.classList.remove("search-active");
    });
  }

  if (closeMobileMenuBtn && mainNav) {
    closeMobileMenuBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      mainNav.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });
  }

  const allToggles = document.querySelectorAll(
    "#genreDropdownToggle, #azDropdownToggle, #watchlistDropdownToggle"
  );

  allToggles.forEach((toggle) => {
    if (!toggle) return;

    toggle.addEventListener("click", (e) => {
      if (window.innerWidth >= 768) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const currentWrapper = toggle.closest(".nav-item-dropdown-wrapper");
      const currentDropdown = currentWrapper.querySelector(
        ".genre-dropdown, .az-dropdown, .watchlist-dropdown"
      );

      const isOpening = currentDropdown.classList.contains("hidden");

      document
        .querySelectorAll(".nav-item-dropdown-wrapper")
        .forEach((otherWrapper) => {
          if (otherWrapper !== currentWrapper) {
            otherWrapper.classList.remove("active");
            const otherDropdown = otherWrapper.querySelector(
              ".genre-dropdown, .az-dropdown, .watchlist-dropdown, .user-profile-dropdown"
            );
            if (otherDropdown) {
              otherDropdown.classList.add("hidden");
            }
          }
        });

      currentWrapper.classList.toggle("active");
      currentDropdown.classList.toggle("hidden");
    });
  });
}

async function displaySearchResults(query) {
  if (!searchResultsContainer) return;

  searchResultsContainer.innerHTML = "";
  if (query.length < 2) {
    searchResultsContainer.innerHTML =
      '<p class="no-results-message">Type at least 2 characters to search.</p>';
    return;
  }

  try {
    const allContent = await getAllContent();
    const filteredContent = allContent.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const genreMatch =
        item.genres &&
        item.genres.some((genre) =>
          genre.toLowerCase().includes(query.toLowerCase())
        );
      return titleMatch || genreMatch;
    });

    if (filteredContent.length === 0) {
      searchResultsContainer.innerHTML =
        '<p class="no-results-message">No results found.</p>';
      return;
    }

    filteredContent.slice(0, 10).forEach((item) => {
      const resultItem = document.createElement("a");
      resultItem.href = `contentDetails.html?id=${item.id}`;
      resultItem.classList.add("search-result-item");
      resultItem.innerHTML = `
                <img src="${item.posterImage}" alt="${item.title}" loading="lazy">
                <span>${item.title}</span>
            `;
      searchResultsContainer.appendChild(resultItem);
    });
  } catch (error) {
    console.error("Error displaying search results:", error);
    searchResultsContainer.innerHTML =
      '<p class="no-results-message">Error loading search results.</p>';
  }
}

function clearSearchResults() {
  if (searchResultsContainer) {
    searchResultsContainer.innerHTML = "";
  }
}

async function initializeHeroSlider() {
  const heroSliderElement = document.getElementById("heroSlider");
  const dotsContainer = document.querySelector(".hero-slider-dots");
  if (!heroSliderElement || !dotsContainer) return;

  const allContent = await getAllContent();
  const heroData = allContent.filter((item) => item.heroImage).slice(0, 5);
  if (heroData.length === 0) {
    dotsContainer.innerHTML = "";
    const existingGradient = heroSliderElement.querySelector(
      ".hero-gradient-overlay"
    );
    heroSliderElement.innerHTML = "";
    if (existingGradient) heroSliderElement.appendChild(existingGradient);
    return;
  }

  const existingGradient = heroSliderElement.querySelector(
    ".hero-gradient-overlay"
  );
  heroSliderElement.innerHTML = "";
  if (existingGradient) heroSliderElement.appendChild(existingGradient);

  heroData.forEach((item, index) => {
    const slideDiv = document.createElement("div");
    slideDiv.style.backgroundImage = `url('${item.heroImage}')`;
    slideDiv.dataset.slideIndex = index;
    if (index === 0) slideDiv.classList.add("active-slide");
    slideDiv.innerHTML += `<h1 class="slider-title">${item.title}</h1>`;
    heroSliderElement.insertBefore(slideDiv, existingGradient);
  });

  const dots = dotsContainer.querySelectorAll("button");
  const bgSlides = heroSliderElement.querySelectorAll("div[data-slide-index]");
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    if (bgSlides.length === 0) return;
    bgSlides.forEach((slide) => slide.classList.remove("active-slide"));
    dots.forEach((dot) => dot.classList.remove("active"));
    if (bgSlides[index]) bgSlides[index].classList.add("active-slide");
    if (dots[index]) dots[index].classList.add("active");
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % bgSlides.length;
    showSlide(currentSlide);
  }

  function startSlideshow() {
    if (bgSlides.length > 0) {
      showSlide(0);
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      clearInterval(slideInterval);
      currentSlide = parseInt(dot.dataset.slide);
      showSlide(currentSlide);
      slideInterval = setInterval(nextSlide, 5000);
    });
  });

  startSlideshow();
}

/**
 * Creates and returns a content card HTML element.
 * Exported for use in other JS files like movies.js, animes.js, etc.
 * @param {object} item - The content item object.
 * @returns {HTMLElement} The created content card div element.
 */
export function createContentCard(item) {
  const card = document.createElement("div");
  card.classList.add("content-card");
  card.innerHTML = `
        <div class="content-card-image-wrapper group">
            <img src="${item.posterImage}" alt="${item.title}" class="content-card-image" loading="lazy">
            <div class="card-overlay">
                <button class="card-action-btn watchlist-toggle add-list-trigger" data-content-id="${item.id}">
                    <i class="ri-add-line text-white"></i>
                </button>
                <button class="card-action-btn play-centered video-play-trigger" data-content-id="${item.id}">
                    <i class="ri-play-fill text-white"></i>
                </button>
                <h3 class="card-title-overlay">${item.title}</h3>
            </div>
        </div>
    `;

  const image = card.querySelector(".content-card-image");
  if (image.complete) {
    image.classList.add("loaded");
  } else {
    image.addEventListener("load", () => {
      image.classList.add("loaded");
    });
  }

  const addListBtnIcon = card.querySelector(".add-list-trigger");
  updateWatchlistButtonState(addListBtnIcon, item.id);

  card.addEventListener("click", (e) => {
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      if (e.target.closest(".video-play-trigger")) {
        e.stopPropagation();
        window.open(`contentDetails.html?id=${item.id}`, "_blank");
      } else if (e.target.closest(".add-list-trigger")) {
        e.stopPropagation();
        if (localStorage.getItem("loggedInUser")) {
          addToWatchlist(item.id);
        } else {
          showAuthModal();
        }
      }
      return;
    }

    const playBtnClicked = e.target.closest(".video-play-trigger");
    const addListBtnClicked = e.target.closest(".add-list-trigger");

    if (card.classList.contains("tapped-active")) {
      if (playBtnClicked) {
        e.stopPropagation();
        window.open(`contentDetails.html?id=${item.id}`, "_blank");
      } else if (addListBtnClicked) {
        e.stopPropagation();
        if (localStorage.getItem("loggedInUser")) {
          addToWatchlist(item.id);
        } else {
          showAuthModal();
        }
      } else {
        card.classList.remove("tapped-active");
      }
    } else {
      document
        .querySelectorAll(".content-card.tapped-active")
        .forEach((activeCard) => {
          activeCard.classList.remove("tapped-active");
        });
      card.classList.add("tapped-active");
    }
  });

  return card;
}

/**
 * Updates the appearance of a watchlist button based on whether the content is in the list.
 * Exported for use in other modules.
 * @param {HTMLElement} buttonElement - The button to update.
 * @param {string} contentId - The ID of the content.
 */
export function updateWatchlistButtonState(buttonElement, contentId) {
  if (!buttonElement) return;

  const iconElement = buttonElement.querySelector("i");
  if (isInWatchlist(contentId)) {
    buttonElement.classList.add("added-to-watchlist");
    if (iconElement) iconElement.className = "ri-check-line text-white";
    buttonElement.title = "Remove from My List";
  } else {
    buttonElement.classList.remove("added-to-watchlist");
    if (iconElement) iconElement.className = "ri-add-line text-white";
    buttonElement.title = "Add to My List";
  }
}

function initWatchlistCardStates() {
  document.querySelectorAll(".add-list-trigger").forEach((button) => {
    const contentId = button.dataset.contentId;
    if (contentId) {
      updateWatchlistButtonState(button, contentId);
    }
  });
}

async function populateContentSections() {
  const moviesRow1 = document.getElementById("moviesRow1");
  const moviesRow2 = document.getElementById("moviesRow2");
  const animesRow1 = document.getElementById("animesRow1");
  const animesRow2 = document.getElementById("animesRow2");
  const webseriesRow1 = document.getElementById("webseriesRow1");
  const webseriesRow2 = document.getElementById("webseriesRow2");

  const movieItems = await getContentByType("movie");
  const animesItems = await getContentByType("animes");
  const webseriesItems = await getContentByType("webseries");

  if (moviesRow1 && moviesRow2) {
    moviesRow1.innerHTML = "";
    moviesRow2.innerHTML = "";
    movieItems
      .slice(0, 10)
      .forEach((item) => moviesRow1.appendChild(createContentCard(item)));
    movieItems
      .slice(10, 20)
      .forEach((item) => moviesRow2.appendChild(createContentCard(item)));
  }

  if (animesRow1 && animesRow2) {
    animesRow1.innerHTML = "";
    animesRow2.innerHTML = "";
    animesItems
      .slice(0, 10)
      .forEach((item) => animesRow1.appendChild(createContentCard(item)));
    animesItems
      .slice(10, 20)
      .forEach((item) => animesRow2.appendChild(createContentCard(item)));
  }

  if (webseriesRow1 && webseriesRow2) {
    webseriesRow1.innerHTML = "";
    webseriesRow2.innerHTML = "";
    webseriesItems
      .slice(0, 10)
      .forEach((item) => webseriesRow1.appendChild(createContentCard(item)));
    webseriesItems
      .slice(10, 20)
      .forEach((item) => webseriesRow2.appendChild(createContentCard(item)));
  }
}

async function populateGenreDropdown() {
  const genreDropdownWrapper = document.getElementById("genreDropdownWrapper");
  const genreDropdownToggle = document.getElementById("genreDropdownToggle");
  const genreDropdown = document.getElementById("genreDropdown");
  const azDropdownWrapper = document.getElementById("azDropdownWrapper");
  const azDropdownToggle = document.getElementById("azDropdownToggle");
  const azDropdown = document.getElementById("azDropdown");
  const watchlistDropdownWrapper = document.getElementById(
    "watchlistDropdownWrapper"
  );
  const watchlistDropdownToggle = document.getElementById(
    "watchlistDropdownToggle"
  );
  const watchlistDropdown = document.getElementById("watchlistDropdown");

  if (!genreDropdownToggle || !genreDropdown || !genreDropdownWrapper) return;
  if (!azDropdownToggle || !azDropdown || !azDropdownWrapper) return;
  if (
    !watchlistDropdownToggle ||
    !watchlistDropdown ||
    !watchlistDropdownWrapper
  )
    return;

  const genres = await getAllGenres();
  genreDropdown.innerHTML = "";

  genres.forEach((genreName) => {
    const genreLink = document.createElement("a");
    genreLink.href = `category.html?category=${encodeURIComponent(
      genreName.toLowerCase()
    )}`;
    genreLink.classList.add("dropdown-item");
    genreLink.textContent = genreName;
    genreLink.target = "_blank";
    genreDropdown.appendChild(genreLink);
  });

  if (watchlistDropdownToggle && watchlistDropdownWrapper) {
    const setupHover = (toggle, dropdown, wrapper) => {
      let timeout;
      toggle.addEventListener("mouseover", () => {
        if (window.innerWidth >= 768) {
          clearTimeout(timeout);
          dropdown.classList.remove("hidden");
          wrapper.classList.add("active");
        }
      });
      toggle.addEventListener("mouseout", () => {
        if (window.innerWidth >= 768) {
          timeout = setTimeout(() => {
            dropdown.classList.add("hidden");
            wrapper.classList.remove("active");
          }, 200);
        }
      });
      dropdown.addEventListener("mouseover", () => clearTimeout(timeout));
      dropdown.addEventListener("mouseout", () => {
        if (window.innerWidth >= 768) {
          timeout = setTimeout(() => {
            dropdown.classList.add("hidden");
            wrapper.classList.remove("active");
          }, 200);
        }
      });
    };

    setupHover(
      watchlistDropdownToggle,
      watchlistDropdown,
      watchlistDropdownWrapper
    );
    setupHover(genreDropdownToggle, genreDropdown, genreDropdownWrapper);
    setupHover(azDropdownToggle, azDropdown, azDropdownWrapper);
  }
}

async function populateAZDropdown() {
  const azDropdown = document.getElementById("azDropdown");
  if (!azDropdown) return;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  azDropdown.innerHTML = "";
  alphabet.forEach((letter) => {
    const link = document.createElement("a");
    link.href = `az-page.html?letter=${letter}`;
    link.classList.add("dropdown-item");
    link.textContent = letter;
    azDropdown.appendChild(link);
  });
}

async function populateGenreGrid() {
  const genreGrid = document.getElementById("genreGrid");
  if (!genreGrid) return;

  const genres = await getAllGenres();
  const genreImagePlaceholders = {
    Action:
      "https://assets.vogue.in/photos/5f16b3bc9ffca08d184%2060%2Cc_limit/must-watch%2520action%2520movies.jpg",
    Comedy:
      "https://readdy.ai/api/search-image?query=comedy%20movie%20scene%20laughing%2C%20cinematic&width=400&height=225&seq=21&orientation=landscape",
    Horror:
      "https://readdy.ai/api/search-image?query=horror%20movie%20scene%20dark%2C%20cinematic&width=400&height=225&seq=22&orientation=landscape",
    "Sci-Fi":
      "https://readdy.ai/api/search-image?query=sci-fi%20movie%20scene%20futuristic%2C%20technology%2C%20cinematic&width=400&height=225&seq=23&orientation=landscape",
    Romance:
      "https://readdy.ai/api/search-image?query=romance%20movie%20scene%20couple%20emotional%2C%20cinematic&width=400&height=225&seq=24&orientation=landscape",
    Anime:
      "https://readdy.ai/api/search-image?query=anime%20scene%20vibrant%20colors%2C%20action&width=400&height=225&seq=25&orientation=landscape",
    Fantasy:
      "https://readdy.ai/api/search-image?query=fantasy%20world%20landscape%20cinematic&width=400&height=225&seq=26&orientation=landscape",
    Drama:
      "https://readdy.ai/api/search-image?query=dramatic%20actor%20portrait%20cinematic&width=400&height=225&seq=27&orientation=landscape",
    Adventure:
      "https://readdy.ai/api/search-image?query=adventure%20jungle%20explorer%2C%20cinematic&width=400%20height=225&seq=28&orientation=landscape",
    Thriller:
      "https://readdy.ai/api/search-image?query=thriller%20suspense%20detective%2C%20cinematic&width=400&height=225&seq=29&orientation=landscape",
    Animation:
      "https://readdy.ai/api/search-image?query=animated%20movie%20scene%20colorful%20characters&width=400&height=225&seq=30&orientation=landscape",
    Family:
      "https://readdy.ai/api/search-image?query=family%20movie%20scene%20happy%20kids&width=400&height=225&seq=31&orientation=landscape",
    Mystery:
      "https://readdy.ai/api/search-image?query=mystery%20detective%20clues%2C%20cinematic&width=400&height=225&seq=32&orientation=landscape",
    Crime:
      "https://readdy.ai/api/search-image?query=crime%20scene%20investigation%2C%20cinematic&width=400&height=225&seq=33&orientation=landscape",
    Documentary:
      "https://readdy.ai/api/search-image?query=documentary%20nature%20wildlife&width=400&height=225&seq=34&orientation=landscape",
    History:
      "https://readdy.ai/api/search-image?query=historical%20movie%20scene%20ancient%20city&width=400&height=225&seq=35&orientation=landscape",
    Music:
      "https://readdy.ai/api/search-image?query=music%20concert%20stage%20lights&width=400&height=225&seq=36&orientation=landscape",
    Musical:
      "https://readdy.ai/api/search-image?query=musical%20theater%20stage%20performance&width=400&height=225&seq=37&orientation=landscape",
    Sport:
      "https://readdy.ai/api/search-image?query=sport%20event%20stadium%20action&width=400&height=225&seq=38&orientation=landscape",
    War: "https://readdy.ai/api/search-image?query=war%20movie%20scene%20battlefield&width=400&height=225&seq=39&orientation=landscape",
    Western:
      "https://readdy.ai/api/search-image?query=western%20movie%20scene%20cowboy%20desert&width=400&height=225&seq=40&orientation=landscape",
  };

  genreGrid.innerHTML = "";
  genres.forEach((genreName) => {
    const genreCard = document.createElement("a");
    genreCard.href = `category.html?category=${encodeURIComponent(
      genreName.toLowerCase()
    )}`;
    genreCard.classList.add("genre-card");
    const imageUrl =
      genreImagePlaceholders[genreName] || genreImagePlaceholders["Action"];
    genreCard.style.backgroundImage = `url('${imageUrl}')`;
    genreCard.innerHTML = `
            <div class="genre-card-overlay">
                <span class="genre-card-name">${genreName}</span>
            </div>
        `;
    genreGrid.appendChild(genreCard);
  });
}
