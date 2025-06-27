// admin/js/admin.js - Main SPA Router (Module Version)

// Define routes with paths to their HTML views and JS modules
const routes = {
  dashboard: {
    view: "/admin/views/dashboard.html",
    script: "/admin/js/dashboard.js",
    init: "initializeDashboard",
  },
  content: {
    view: "/admin/views/content.html",
    script: "/admin/js/content-manager.js",
    init: "initializeContentManager",
  },
  media: {
    view: "/admin/views/media.html",
    script: "/admin/js/media-manager.js",
    init: "initializeMediaManager",
  },
  comments: {
    view: "/admin/views/comments.html",
    // FIXED: Corrected filename from "comments-manager.js" to "comment-manager.js"
    script: "/admin/js/comment-manager.js",
    init: "initializeCommentManager",
  },
  requests: {
    view: "/admin/views/requests.html",
    script: "/admin/js/request-manager.js",
    init: "initializeRequestManager",
  },
};

const mainContent = document.getElementById("admin-main-content");

async function loadPage(page) {
  const route = routes[page];
  if (!route) {
    mainContent.innerHTML = "<h1>404 - Page Not Found</h1>";
    return;
  }

  try {
    // 1. Load HTML View
    const response = await fetch(route.view);
    if (!response.ok) throw new Error(`Page view not found: ${route.view}`);
    mainContent.innerHTML = await response.text();

    // 2. Dynamically import the corresponding JS module
    const module = await import(route.script);

    // 3. Call the exported initialization function
    if (module && typeof module[route.init] === "function") {
      module[route.init]();
    } else {
      console.error(
        `Initialization function ${route.init} not found or not exported in ${route.script}`
      );
    }
  } catch (error) {
    mainContent.innerHTML =
      "<h1>Error</h1><p>Could not load page content or script.</p>";
    console.error("Error loading page:", error);
  }
}

function handleNavigation(event) {
  event.preventDefault();
  const link = event.target.closest(".nav-link");
  if (!link) return;

  const page = link.dataset.page;
  const sidebar = document.querySelector(".admin-sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  // Close sidebar and overlay on navigation in mobile view
  if (sidebar && sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
  }

  const currentPath = window.location.pathname.replace(/^\/admin\/?/, "");
  const currentPage = currentPath.split("/")[0] || "dashboard";
  if (page === currentPage) return;

  // Update URL in browser history
  history.pushState(
    { page },
    `${page} - Admin`,
    `/${page === "dashboard" ? "admin/" : `admin/${page}`}`
  );

  setActiveLink(page);
  loadPage(page);
}

function setActiveLink(page) {
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  // Treat media page as part of content section for active link
  const activeLinkKey = page === "media" ? "content" : page;
  const activeLink = document.querySelector(
    `.nav-link[data-page="${activeLinkKey}"]`
  );
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

/**
 * Sets up the event listener for the mobile sidebar toggle button and overlay.
 */
function setupSidebarToggle() {
  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  const toggleSidebar = (event) => {
    if (event) event.stopPropagation();
    sidebar.classList.toggle("open");
    overlay.classList.toggle("visible");
  };

  if (sidebarToggle && sidebar && overlay) {
    sidebarToggle.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);
  }
}

function initialLoad() {
  // Determine the current page from the URL
  const path = window.location.pathname.replace(/^\/admin\/?/, "");
  let page = path.split("/")[0] || "dashboard";

  if (!routes[page]) {
    page = "dashboard"; // Fallback to dashboard if route not found
  }

  setActiveLink(page);
  loadPage(page);
}

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", () => {
  // Event listeners for navigation
  document
    .querySelector(".admin-nav")
    .addEventListener("click", handleNavigation);
  window.addEventListener("popstate", initialLoad);

  // Setup sidebar toggle
  setupSidebarToggle();

  // Initial page load
  initialLoad();
});
