# Content Data Schema

This document describes the structure for the content data files. There are three main data files:

1. `content.json`: Contains core content metadata.
2. `media.json`: Contains media assets (trailers, screenshots) for content.
3. `episodes.json`: Contains episode data for series content.

## content.json Schema

Each item in the `content.json` array has the following structure:

```json
{
    "id": "unique-content-id",                  // String: Unique identifier (e.g., "interstellar"). REQUIRED.
    "mediaRef": "same-as-id",                   // String: Reference to corresponding media.json entry. Should match the id. REQUIRED.
    "episodesRef": "same-as-id",                // String: Reference to corresponding episodes.json entry (for series). Should match the id. Omit for movies.
    "type": "movie",                            // String: Type of content ("movie", "anime", "series"). REQUIRED.
    "title": "Title of the Content",            // String: Main title. REQUIRED.
    "description": "Short Info.",               // String: Used in Slider. REQUIRED.
    "fullDescription": "Detailed synopsis.",    // String: Used in content detail pages. REQUIRED.
    "year": "2025",                             // String: Release year. REQUIRED.
    "duration": "2h 43m",                       // String: Runtime or episode count (e.g., "24 Episodes"). REQUIRED.
    "genres": ["Sci-Fi", "Adventure"],          // Array of Strings: List of genres. REQUIRED.
    "rating": "9.2",                            // String: Rating value (e.g., "0.0" to "10.0"). REQUIRED.
    "director": "Lena Khan",                    // String: Used in movies content page. REQUIRED for movies.
    "studio": "Studio Name",                    // String: Used for anime. REQUIRED for anime.
    "cast": ["Elara Vance", "Jaxson Kael"],     // Array of Strings: Used in content pages. REQUIRED.
    "releaseDate": "October 26, 2025",          // String: Full release date. REQUIRED.
    "country": "USA",                           // String: Country of origin. REQUIRED.
    "status": "Released",                       // String: Release status (e.g., "Released", "Ongoing"). REQUIRED.
    "posterImage": "url/to/poster.jpg",         // String: URL for the content card image. REQUIRED.
    "heroImage": "url/to/hero.jpg",             // String: URL for hero slider or featured section image. REQUIRED.
    "tags": ["featured-movie", "trending"],     // Array of Strings: Optional tags for categorization (e.g., "trending", "new-release").
    "languages": ["English", "Spanish"],        // Array of Strings: Available audio languages.
    "subtitles": ["English", "French"],         // Array of Strings: Available subtitle languages.
    "quality": ["4K", "HD"]                     // Array of Strings: Available streaming qualities.
}
```

## media.json Schema

This file is a JSON object where each key is a content ID (matching `content.json`'s `id`). The value is an object with:

```json
{
    "trailers": {
        "Official": "https://youtube.com/embed/...",
        "Hindi": "https://youtube.com/embed/..."
    },
    "screenshots": [
        "url/to/screenshot1.jpg",
        "url/to/screenshot2.jpg"
    ]
}
```

## episodes.json Schema

This file is a JSON object where each key is a content ID for a series (matching `content.json`'s `id`). The value is an array of episode objects:

```json
[
    {
        "title": "Episode 1: Pilot",
        "streamingUrl": "https://embed.com/ep1",
        "downloadUrl": "https://download.com/ep1",
        "subtitles": ["English", "Japanese"]
    },
    // ... more episodes
]
```

## Adding New Content

To add new content:

1. **content.json**:
   - Add a new object to the array with the required fields.
   - Set `mediaRef` to the same as `id`.
   - For series, set `episodesRef` to the same as `id`; for movies, omit `episodesRef`.

2. **media.json**:
   - Add a new entry with the key being the content ID (same as `id` in content.json).
   - Provide at least one trailer and at least one screenshot.

3. **episodes.json** (for series only):
   - Add a new entry with the key being the content ID (same as `id` in content.json).
   - Provide an array of episodes.

Note: Ensure all image URLs are valid and accessible.
