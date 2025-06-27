// js/movieApi.js

const API_BASE_URL = "/api";
let allContentCache = null;

export async function getAllContent() {
  if (allContentCache) {
    return allContentCache;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/content`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allContentCache = data;
    return data;
  } catch (error) {
    console.error("Could not fetch content:", error);
    allContentCache = [];
    return [];
  }
}

// Function to force a refresh of the cache
export function invalidateContentCache() {
  allContentCache = null;
}

export async function getContentByType(type) {
  const allContent = await getAllContent();
  return allContent.filter(
    (item) => item.type.toLowerCase() === type.toLowerCase()
  );
}

export async function getAllGenres() {
  const allContent = await getAllContent();
  const allGenres = new Set();
  allContent.forEach((item) => {
    if (item.genres && Array.isArray(item.genres)) {
      item.genres.forEach((genre) => allGenres.add(genre));
    }
  });
  return Array.from(allGenres).sort();
}

export async function getContentById(id) {
  const allContent = await getAllContent();
  return allContent.find((item) => item.id === id) || null;
}

export async function getMediaById(contentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/media/${contentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Could not fetch media for ${contentId}:`, error);
    return { trailers: {}, screenshots: [], downloadLinks: {} };
  }
}

export async function getEpisodesById(contentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/episodes/${contentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Could not fetch episodes for ${contentId}:`, error);
    return { seasons: {}, zipFiles: [] };
  }
}

export async function getCommentsById(contentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${contentId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Could not fetch comments for ${contentId}:`, error);
    return [];
  }
}

export async function postComment(contentId, commentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${contentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Could not post comment for ${contentId}:`, error);
    return null;
  }
}

export async function postRequest(requestData) {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Could not post request:`, error);
    return null;
  }
}

// --- Admin API Functions ---

export async function addBulkContent(contentArray) {
  invalidateContentCache(); // Data is changing
  const response = await fetch(`${API_BASE_URL}/content/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contentArray),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }
  return response.json(); // Return the full response to handle status in the caller
}

export async function deleteMultipleContent(contentIds) {
  invalidateContentCache(); // Data is changing
  const response = await fetch(`${API_BASE_URL}/content/bulk`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: contentIds }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}
