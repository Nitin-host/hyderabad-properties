// netlify/functions/sitemap.js

export async function handler(event, context) {
  const SITE_URL = process.env.SITE_URL || "https://rrpropertieshyderabad.com";
  const API_URL =
    process.env.SITEMAP_API_URL ||
    "https://api.rrpropertieshyderabad.com/api/properties";

  function isNonEmpty(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function extractSlug(item) {
    if (!item) return null;
    if (typeof item === "string" && isNonEmpty(item)) return item.trim();
    if (isNonEmpty(item.slug)) return item.slug.trim();
    if (item.attributes?.slug) return item.attributes.slug.trim();
    return null;
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      return {
        statusCode: 500,
        body: `API error ${res.status}`,
      };
    }

    const data = await res.json();

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : [];

    const slugs = list.map(extractSlug).filter(Boolean);

    const urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/property/`,
      `${SITE_URL}/favorites`,
    ];

    slugs.forEach((slug) => {
      urls.push(`${SITE_URL}/property/${encodeURIComponent(slug)}`);
    });

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) => `
  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("\n") +
      `\n</urlset>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
      body: xml,
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Error: " + e.message,
    };
  }
}
