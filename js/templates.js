// js/templates.js (Module Version)

async function loadTemplate(url, placeholderId) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${url}`);
    }
    const text = await response.text();
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) {
      placeholder.innerHTML = text;
      console.log(`Template ${url} loaded into ${placeholderId}.`);
    } else {
      // This can happen if the page doesn't have the placeholder, which is okay.
      // console.warn(`Placeholder element with ID '${placeholderId}' not found.`);
    }
  } catch (error) {
    console.error(error);
  }
}

// This promise will resolve once all template loading attempts are settled.
const templatesLoadedPromise = Promise.allSettled([
  loadTemplate("/templates/header.html", "header-placeholder"),
  loadTemplate("/templates/footer.html", "footer-placeholder"),
]);

// Export a function that returns the promise, allowing other modules to wait for it.
export function ensureTemplatesLoaded() {
  return templatesLoadedPromise;
}
