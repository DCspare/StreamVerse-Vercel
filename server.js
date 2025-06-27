// server.js (Corrected Final Version for Vercel Deployment)

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json()); // Body parser for API requests

// --- Helper Functions ---
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) { return null; }
    const data = fs.readFileSync(filePath, "utf8");
    if (data.trim() === "") { return null; }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading or parsing file: ${filePath}`, error);
    return null;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing file: ${filePath}`, error);
    return false;
  }
}

function generateUniqueSlug(title, existingContent) {
  let baseSlug = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = baseSlug;
  let counter = 2;
  while (existingContent.some((c) => c.id === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// --- API Endpoints ---
// This entire section is unchanged.
app.get("/api/content", (req, res) => {
  const content = readJsonFile(path.join(__dirname, "data", "content.json"));
  if (content) res.json(content);
  else res.status(500).json({ error: "Could not read content data." });
});

app.get("/api/media/:id", (req, res) => {
  const contentId = req.params.id;
  const mediaPath = path.join(__dirname, "data", "media.json");
  const allMedia = readJsonFile(mediaPath);
  if (!allMedia)
    return res.status(500).json({ error: "Could not read media data." });
  const contentMedia = allMedia[contentId];
  if (contentMedia) {
    res.json(contentMedia);
  } else {
    res.json({ trailers: {}, screenshots: [], downloadLinks: {} });
  }
});

app.get("/api/episodes/:id", (req, res) => {
  const contentId = req.params.id;
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  if (!allEpisodes)
    return res.status(500).json({ error: "Could not read episodes data." });

  const contentEpisodes = allEpisodes[contentId];
  if (contentEpisodes) {
    res.json(contentEpisodes);
  } else {
    res.json({ seasons: {}, zipFiles: [] });
  }
});

app.post("/api/content", (req, res) => {
  const data = req.body;
  if (!data.title || !data.type || !data.year) {
    return res
      .status(400)
      .json({ error: "Title, type, and year are required." });
  }
  const contentPath = path.join(__dirname, "data", "content.json");
  const content = readJsonFile(contentPath) || [];
  const newId = generateUniqueSlug(data.title, content);
  const newContent = {
    id: newId,
    title: data.title,
    type: data.type,
    year: parseInt(data.year, 10),
    poster: data.poster || null,
    genres: data.genres || [],
    rating: parseFloat(data.rating) || 0,
    duration: data.duration || null,
    quality: data.quality || null,
    storyline: data.storyline || "",
  };
  content.unshift(newContent);
  const mediaPath = path.join(__dirname, "data", "media.json");
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const media = readJsonFile(mediaPath) || {};
  const episodes = readJsonFile(episodesPath) || {};
  const comments = readJsonFile(commentsPath) || {};
  media[newContent.id] = { trailers: {}, screenshots: [], downloadLinks: {} };
  if (
    newContent.type === "Web Series" ||
    newContent.type === "Anime" ||
    newContent.type === "webseries" ||
    newContent.type === "animes"
  ) {
    episodes[newContent.id] = { seasons: {}, zipFiles: [] };
  }
  comments[newContent.id] = [];
  const success =
    writeJsonFile(contentPath, content) &&
    writeJsonFile(mediaPath, media) &&
    writeJsonFile(episodesPath, episodes) &&
    writeJsonFile(commentsPath, comments);
  if (success) res.status(201).json(newContent);
  else res.status(500).json({ error: "Failed to save new content." });
});

app.put("/api/content/:id", (req, res) => {
  const contentId = req.params.id;
  const updatedData = req.body;
  if (
    !updatedData ||
    !updatedData.title ||
    !updatedData.type ||
    !updatedData.year
  ) {
    return res
      .status(400)
      .json({ error: "Title, type, and year are required." });
  }
  const contentPath = path.join(__dirname, "data", "content.json");
  const content = readJsonFile(contentPath);
  if (!content)
    return res.status(500).json({ error: "Could not read content data." });
  const contentIndex = content.findIndex((c) => c.id === contentId);
  if (contentIndex === -1)
    return res
      .status(404)
      .json({ error: `Content with ID ${contentId} not found.` });
  const originalContent = content[contentIndex];
  const newContent = { ...originalContent, ...updatedData };
  content[contentIndex] = newContent;
  if (writeJsonFile(contentPath, content)) {
    res.status(200).json(newContent);
  } else {
    res.status(500).json({ error: "Failed to save updated content." });
  }
});

app.delete("/api/content/:id", (req, res) => {
  const contentId = req.params.id;
  const contentPath = path.join(__dirname, "data", "content.json");
  const mediaPath = path.join(__dirname, "data", "media.json");
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const content = readJsonFile(contentPath);
  const media = readJsonFile(mediaPath);
  const episodes = readJsonFile(episodesPath);
  const comments = readJsonFile(commentsPath);
  if (!content || !media || !episodes || !comments)
    return res
      .status(500)
      .json({ error: "Could not read one or more data files." });
  const contentIndex = content.findIndex((c) => c.id === contentId);
  if (contentIndex === -1)
    return res
      .status(404)
      .json({ error: `Content with ID ${contentId} not found.` });
  content.splice(contentIndex, 1);
  delete media[contentId];
  delete episodes[contentId];
  delete comments[contentId];
  const success =
    writeJsonFile(contentPath, content) &&
    writeJsonFile(mediaPath, media) &&
    writeJsonFile(episodesPath, episodes) &&
    writeJsonFile(commentsPath, comments);
  if (success)
    res
      .status(200)
      .json({ message: `Content ${contentId} deleted successfully.` });
  else
    res
      .status(500)
      .json({ error: "Failed to write updated data to one or more files." });
});

app.delete("/api/content/bulk", (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ error: "An array of content IDs is required." });
  }
  const contentPath = path.join(__dirname, "data", "content.json");
  const mediaPath = path.join(__dirname, "data", "media.json");
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const content = readJsonFile(contentPath);
  const media = readJsonFile(mediaPath);
  const episodes = readJsonFile(episodesPath);
  const comments = readJsonFile(commentsPath);
  if (!content || !media || !episodes || !comments) {
    return res
      .status(500)
      .json({ error: "Could not read one or more data files." });
  }
  const initialLength = content.length;
  const filteredContent = content.filter((c) => !ids.includes(c.id));
  if (filteredContent.length === initialLength) {
    return res
      .status(404)
      .json({ error: "None of the provided IDs were found." });
  }
  ids.forEach((id) => {
    delete media[id];
    delete episodes[id];
    delete comments[id];
  });
  const success =
    writeJsonFile(contentPath, filteredContent) &&
    writeJsonFile(mediaPath, media) &&
    writeJsonFile(episodesPath, episodes) &&
    writeJsonFile(commentsPath, comments);
  if (success) {
    res
      .status(200)
      .json({
        message: `${
          initialLength - filteredContent.length
        } items deleted successfully.`,
      });
  } else {
    res
      .status(500)
      .json({ error: "Failed to write updated data to one or more files." });
  }
});

app.post("/api/content/bulk", (req, res) => {
  const newContentArray = req.body;
  if (!Array.isArray(newContentArray)) {
    return res
      .status(400)
      .json({ error: "Request body must be an array of content objects." });
  }
  const contentPath = path.join(__dirname, "data", "content.json");
  const content = readJsonFile(contentPath) || [];
  const mediaPath = path.join(__dirname, "data", "media.json");
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const media = readJsonFile(mediaPath) || {};
  const episodes = readJsonFile(episodesPath) || {};
  const comments = readJsonFile(commentsPath) || {};
  let addedCount = 0;
  const addedItems = [];
  for (const data of newContentArray) {
    if (!data.title || !data.type || !data.year) {
      continue;
    }
    const newId = generateUniqueSlug(data.title, content.concat(addedItems));
    const newContent = {
      id: newId,
      title: data.title,
      type: data.type,
      year: data.year,
      posterImage: data.posterImage || null,
      genres: data.genres || [],
      rating: parseFloat(data.rating) || 0,
      duration: data.duration || null,
      storyline: data.storyline || "",
      ...data,
    };
    addedItems.push(newContent);
    media[newContent.id] = { trailers: {}, screenshots: [], downloadLinks: {} };
    if (["webseries", "animes"].includes(newContent.type)) {
      episodes[newContent.id] = { seasons: {}, zipFiles: [] };
    }
    comments[newContent.id] = [];
    addedCount++;
  }
  content.unshift(...addedItems);
  const success =
    writeJsonFile(contentPath, content) &&
    writeJsonFile(mediaPath, media) &&
    writeJsonFile(episodesPath, episodes) &&
    writeJsonFile(commentsPath, comments);
  if (success) {
    res
      .status(201)
      .json({
        message: `${addedCount} of ${newContentArray.length} items added successfully.`,
        items: addedItems,
      });
  } else {
    res.status(500).json({ error: "Failed to save new content." });
  }
});

app.post("/api/media/:id/:type", (req, res) => {
  const { id, type } = req.params;
  const mediaPath = path.join(__dirname, "data", "media.json");
  const allMedia = readJsonFile(mediaPath) || {};
  if (!allMedia[id]) {
    allMedia[id] = { trailers: {}, screenshots: [], downloadLinks: {} };
  }
  if (type === "trailers") {
    allMedia[id].trailers[req.body.name] = req.body.url;
  } else if (type === "screenshots") {
    allMedia[id].screenshots.push(req.body.url);
  } else if (type === "downloadLinks") {
    allMedia[id].downloadLinks[req.body.quality] = req.body.url;
  } else {
    return res.status(400).json({ error: "Invalid media type." });
  }
  if (writeJsonFile(mediaPath, allMedia)) {
    res.status(201).json({ message: "Media added successfully." });
  } else {
    res.status(500).json({ error: "Failed to save media." });
  }
});

app.delete("/api/media/:id/:type", (req, res) => {
  const { id, type } = req.params;
  const { key } = req.body;
  const mediaPath = path.join(__dirname, "data", "media.json");
  const allMedia = readJsonFile(mediaPath) || {};
  if (!allMedia[id]) {
    return res.status(404).json({ error: "Content ID not found." });
  }
  if (type === "trailers") {
    delete allMedia[id].trailers[key];
  } else if (type === "screenshots") {
    allMedia[id].screenshots.splice(parseInt(key, 10), 1);
  } else if (type === "downloadLinks") {
    delete allMedia[id].downloadLinks[key];
  } else {
    return res.status(400).json({ error: "Invalid media type." });
  }
  if (writeJsonFile(mediaPath, allMedia)) {
    res.status(200).json({ message: "Media deleted successfully." });
  } else {
    res.status(500).json({ error: "Failed to save media." });
  }
});

app.post("/api/episodes/:id/seasons", (req, res) => {
  const { id } = req.params;
  const { seasonNumber } = req.body;
  if (!seasonNumber || isNaN(parseInt(seasonNumber))) {
    return res.status(400).json({ error: "Valid season number is required." });
  }
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  if (!allEpisodes[id]) {
    allEpisodes[id] = { seasons: {}, zipFiles: [] };
  }
  if (allEpisodes[id].seasons[seasonNumber]) {
    return res
      .status(409)
      .json({ error: `Season ${seasonNumber} already exists.` });
  }
  allEpisodes[id].seasons[seasonNumber] = { qualities: {} };
  if (writeJsonFile(episodesPath, allEpisodes)) {
    res
      .status(201)
      .json({ message: `Season ${seasonNumber} added successfully.` });
  } else {
    res.status(500).json({ error: "Failed to save new season." });
  }
});

app.delete("/api/episodes/:id/seasons/:seasonNumber", (req, res) => {
  const { id, seasonNumber } = req.params;
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  if (!allEpisodes[id] || !allEpisodes[id].seasons[seasonNumber]) {
    return res.status(404).json({ error: "Season not found." });
  }
  delete allEpisodes[id].seasons[seasonNumber];
  if (writeJsonFile(episodesPath, allEpisodes)) {
    res
      .status(200)
      .json({ message: `Season ${seasonNumber} deleted successfully.` });
  } else {
    res.status(500).json({ error: "Failed to delete season." });
  }
});

app.post("/api/episodes/:id/seasons/:seasonNumber/episodes", (req, res) => {
  const { id, seasonNumber } = req.params;
  const { episodeNumber, title, quality, downloadUrl } = req.body;
  if (!episodeNumber || !title || !quality || !downloadUrl) {
    return res.status(400).json({ error: "Missing required episode data." });
  }
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  const season = allEpisodes[id]?.seasons?.[seasonNumber];
  if (!season) {
    return res.status(404).json({ error: "Season not found." });
  }
  if (!season.qualities[quality]) {
    season.qualities[quality] = [];
  }
  if (
    season.qualities[quality].some((ep) => ep.episodeNumber == episodeNumber)
  ) {
    return res.status(409).json({
      error: `Episode ${episodeNumber} already exists for ${quality}.`,
    });
  }
  const newEpisode = {
    episodeNumber: parseInt(episodeNumber, 10),
    title,
    downloadUrl,
  };
  season.qualities[quality].push(newEpisode);
  season.qualities[quality].sort((a, b) => a.episodeNumber - b.episodeNumber);
  if (writeJsonFile(episodesPath, allEpisodes)) {
    res.status(201).json({ message: "Episode added successfully." });
  } else {
    res.status(500).json({ error: "Failed to save episode." });
  }
});

app.put("/api/episodes/:id/seasons/:seasonNumber/episodes", (req, res) => {
  const { id, seasonNumber } = req.params;
  const { originalQuality, originalEpisodeNumber, updatedEpisode } = req.body;
  if (!originalQuality || !originalEpisodeNumber || !updatedEpisode) {
    return res.status(400).json({ error: "Missing required data for update." });
  }
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  const season = allEpisodes[id]?.seasons?.[seasonNumber];
  if (!season) return res.status(404).json({ error: "Season not found." });
  const originalQualityArray = season.qualities[originalQuality];
  if (!originalQualityArray)
    return res
      .status(404)
      .json({ error: `Quality '${originalQuality}' not found.` });
  const episodeIndex = originalQualityArray.findIndex(
    (ep) => ep.episodeNumber == originalEpisodeNumber
  );
  if (episodeIndex === -1)
    return res
      .status(404)
      .json({ error: `Episode ${originalEpisodeNumber} not found.` });
  const newQuality = updatedEpisode.quality;
  updatedEpisode.episodeNumber = parseInt(updatedEpisode.episodeNumber, 10);
  const { quality, ...epData } = updatedEpisode;
  const targetQualityArray = season.qualities[newQuality] || [];
  if (
    (originalQuality !== newQuality ||
      originalEpisodeNumber != updatedEpisode.episodeNumber) &&
    targetQualityArray.some(
      (ep) => ep.episodeNumber == updatedEpisode.episodeNumber
    )
  ) {
    return res.status(409).json({
      error: `Episode ${updatedEpisode.episodeNumber} already exists in ${newQuality}.`,
    });
  }
  if (originalQuality === newQuality) {
    originalQualityArray[episodeIndex] = epData;
    originalQualityArray.sort((a, b) => a.episodeNumber - b.episodeNumber);
  } else {
    originalQualityArray.splice(episodeIndex, 1);
    if (originalQualityArray.length === 0)
      delete season.qualities[originalQuality];
    if (!season.qualities[newQuality]) season.qualities[newQuality] = [];
    season.qualities[newQuality].push(epData);
    season.qualities[newQuality].sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    );
  }
  if (writeJsonFile(episodesPath, allEpisodes)) {
    res.status(200).json({ message: "Episode updated successfully." });
  } else {
    res.status(500).json({ error: "Failed to update episode." });
  }
});

app.delete("/api/episodes/:id/seasons/:seasonNumber/episodes", (req, res) => {
  const { id, seasonNumber } = req.params;
  const { key } = req.body;
  if (!key || key.indexOf(":") === -1) {
    return res
      .status(400)
      .json({ error: "Invalid key format for episode deletion." });
  }
  const [quality, episodeIndex] = key.split(":");
  const index = parseInt(episodeIndex, 10);
  const episodesPath = path.join(__dirname, "data", "episodes.json");
  const allEpisodes = readJsonFile(episodesPath);
  const qualityArray =
    allEpisodes[id]?.seasons?.[seasonNumber]?.qualities?.[quality];
  if (
    !qualityArray ||
    isNaN(index) ||
    index < 0 ||
    index >= qualityArray.length
  ) {
    return res.status(404).json({ error: "Episode not found." });
  }
  qualityArray.splice(index, 1);
  if (qualityArray.length === 0) {
    delete allEpisodes[id].seasons[seasonNumber].qualities[quality];
  }
  if (writeJsonFile(episodesPath, allEpisodes)) {
    res.status(200).json({ message: "Episode deleted successfully." });
  } else {
    res.status(500).json({ error: "Failed to delete episode." });
  }
});

app.get("/api/comments/:contentId", (req, res) => {
  const { contentId } = req.params;
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const requestsPath = path.join(__dirname, "data", "requests.json");
  const allCommentsData = readJsonFile(commentsPath) || {};
  const allRequestsData = readJsonFile(requestsPath) || [];
  const contentComments = (allCommentsData[contentId] || []).map((c) => ({
    ...c,
    type: "comment",
    sortDate: c.date || "1970-01-01T00:00:00.000Z",
  }));
  const contentRequests = allRequestsData
    .filter((r) => r.contentId === contentId)
    .map((r) => ({
      ...r,
      type: "request",
      sortDate: r.date || "1970-01-01T00:00:00.000Z",
    }));
  const combinedSubmissions = [...contentComments, ...contentRequests];
  combinedSubmissions.sort(
    (a, b) => new Date(b.sortDate) - new Date(a.sortDate)
  );
  combinedSubmissions.forEach((sub) => delete sub.sortDate);
  res.json(combinedSubmissions);
});

app.post("/api/comments/:contentId", (req, res) => {
  const { contentId } = req.params;
  const { user, text } = req.body;
  if (!user || !text) {
    return res.status(400).json({ error: "User and text are required." });
  }
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const allComments = readJsonFile(commentsPath) || {};
  if (!allComments[contentId]) {
    allComments[contentId] = [];
  }
  const newComment = {
    id: `comment-${Date.now()}`,
    type: "comment",
    user: user,
    text,
    date: new Date().toISOString(),
    replies: [],
  };
  allComments[contentId].unshift(newComment);
  if (writeJsonFile(commentsPath, allComments)) {
    res.status(201).json(newComment);
  } else {
    res.status(500).json({ error: "Failed to save comment." });
  }
});

app.get("/api/comments_all", (req, res) => {
  const commentsData = readJsonFile(
    path.join(__dirname, "data", "comments.json")
  );
  const contentData = readJsonFile(
    path.join(__dirname, "data", "content.json")
  );
  if (!commentsData || !contentData) {
    return res.status(500).json({ error: "Could not read data files." });
  }
  const contentMap = contentData.reduce((map, content) => {
    map[content.id] = content.title;
    return map;
  }, {});
  const allComments = [];
  for (const contentId in commentsData) {
    if (commentsData.hasOwnProperty(contentId)) {
      commentsData[contentId].forEach((comment, index) => {
        const commentId =
          comment.id || `${new Date(comment.date).getTime()}-${index}`;
        allComments.push({
          contentId: contentId,
          contentTitle: contentMap[contentId] || "Unknown Content",
          commentId: commentId,
          ...comment,
        });
      });
    }
  }
  allComments.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(allComments);
});

app.post("/api/comments/:contentId/reply", (req, res) => {
  const { contentId } = req.params;
  const { commentId, replyText } = req.body;
  if (!commentId || !replyText) {
    return res
      .status(400)
      .json({ error: "Comment ID and reply text are required." });
  }
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const allComments = readJsonFile(commentsPath);
  if (!allComments[contentId]) {
    return res.status(404).json({ error: "Content not found." });
  }
  const commentIndex = allComments[contentId].findIndex(
    (c) =>
      (c.id ||
        `${new Date(c.date).getTime()}-${allComments[contentId].indexOf(c)}`) ==
      commentId
  );
  if (commentIndex === -1) {
    return res.status(404).json({ error: "Comment not found." });
  }
  if (!allComments[contentId][commentIndex].replies) {
    allComments[contentId][commentIndex].replies = [];
  }
  const newReply = {
    user: "Admin",
    text: replyText,
    date: new Date().toISOString(),
  };
  allComments[contentId][commentIndex].replies.push(newReply);
  if (writeJsonFile(commentsPath, allComments)) {
    res.status(201).json(newReply);
  } else {
    res.status(500).json({ error: "Failed to save reply." });
  }
});

app.delete("/api/comments/:contentId/:commentId", (req, res) => {
  const { contentId, commentId } = req.params;
  const commentsPath = path.join(__dirname, "data", "comments.json");
  const allComments = readJsonFile(commentsPath);
  if (!allComments[contentId]) {
    return res.status(404).json({ error: "Content not found." });
  }
  const originalLength = allComments[contentId].length;
  const commentIdentifier = (c, index) =>
    c.id || `${new Date(c.date).getTime()}-${index}`;
  allComments[contentId] = allComments[contentId].filter(
    (c, index) => commentIdentifier(c, index) != commentId
  );
  if (allComments[contentId].length === originalLength) {
    return res.status(404).json({ error: "Comment not found." });
  }
  if (writeJsonFile(commentsPath, allComments)) {
    res.status(200).json({ message: "Comment deleted successfully." });
  } else {
    res.status(500).json({ error: "Failed to delete comment." });
  }
});

app.post("/api/requests", (req, res) => {
  const { user, text, contentId } = req.body;
  if (!user || !text) {
    return res.status(400).json({ error: "User and text are required." });
  }
  const requestsPath = path.join(__dirname, "data", "requests.json");
  const requests = readJsonFile(requestsPath) || [];
  const newRequest = {
    id: `req-${Date.now()}`,
    contentId: contentId || "N/A",
    status: "pending",
    user: user,
    text,
    date: new Date().toISOString(),
    replies: [],
  };
  requests.unshift(newRequest);
  if (writeJsonFile(requestsPath, requests)) {
    res.status(201).json(newRequest);
  } else {
    res.status(500).json({ error: "Failed to save request." });
  }
});

app.get("/api/requests", (req, res) => {
  const requests =
    readJsonFile(path.join(__dirname, "data", "requests.json")) || [];
  res.json(requests);
});

app.post("/api/requests/:id/reply", (req, res) => {
  const requestId = req.params.id;
  const { replyText } = req.body;
  if (!replyText) {
    return res.status(400).json({ error: "Reply text is required." });
  }
  const requestsPath = path.join(__dirname, "data", "requests.json");
  const requests = readJsonFile(requestsPath) || [];
  const requestIndex = requests.findIndex((r) => r.id === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ error: "Request not found." });
  }
  if (!requests[requestIndex].replies) {
    requests[requestIndex].replies = [];
  }
  const newReply = {
    user: "Admin",
    text: replyText,
    date: new Date().toISOString(),
  };
  requests[requestIndex].replies.push(newReply);
  if (writeJsonFile(requestsPath, requests)) {
    res.status(201).json(newReply);
  } else {
    res.status(500).json({ error: "Failed to save reply." });
  }
});

app.delete("/api/requests/:id", (req, res) => {
  const requestId = req.params.id;
  const requestsPath = path.join(__dirname, "data", "requests.json");
  const requests = readJsonFile(requestsPath) || [];
  const initialLength = requests.length;
  const filteredRequests = requests.filter((r) => r.id !== requestId);
  if (filteredRequests.length === initialLength) {
    return res.status(404).json({ error: "Request not found." });
  }
  if (writeJsonFile(requestsPath, filteredRequests)) {
    res.status(200).json({ message: "Request deleted successfully." });
  } else {
    res.status(500).json({ error: "Failed to delete request." });
  }
});


// =========================================================================
// === CORRECTED AND FINAL ROUTING SECTION =================================
// =========================================================================

// Serve all static files from the project root.
// This is the most important line for serving CSS, JS, images, templates, and even the .html files themselves.
// It must come before the other routes that might catch the same paths.
app.use(express.static(path.join(__dirname))); 

// This handles the Admin Panel Single Page Application (SPA).
// Any request that starts with /admin/ will be served the admin/index.html file,
// letting the client-side router handle the rest.
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`StreamVerse server is running on port ${PORT}.`);
});
