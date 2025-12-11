// src/components/PropertySEONoDep.jsx
import React, { useEffect } from "react";

function setMeta(nameOrProp, attr, value) {
  // attr = 'name' or 'property'
  const selector =
    attr === "name"
      ? `meta[name="${nameOrProp}"]`
      : `meta[property="${nameOrProp}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeElementIfExists(selector) {
  const el = document.head.querySelector(selector);
  if (el) el.remove();
}

export default function PropertySEONoDep({
  property = {},
  siteUrl = "https://rrpropertieshyderabad.com",
}) {
  // destructure and include location
  const {
    title,
    description,
    slug,
    price,
    images = [],
    bedrooms,
    bathrooms,
    size,
    sizeUnit = "sqft",
    createdAt,
    updatedAt,
    createdBy,
    propertyType,
    status,
    location,
  } = property || {};

  // helper: ensure siteUrl has no trailing slash, path has no leading slash
  const cleanSiteUrl = (u) => (u ? u.replace(/\/+$/, "") : "");
  const cleanedSite = cleanSiteUrl(siteUrl);

  // robust helper to turn item (string or object) into absolute URL or null
  const makeAbsoluteUrl = (item) => {
    if (!item) return null;
    // handle string items
    let path;
    if (typeof item === "string") {
      path = item;
    } else if (item && typeof item === "object") {
      path = item.presignUrl || item.url || item.path || null;
    } else {
      path = null;
    }
    if (!path) return null;

    // already absolute: http(s) or protocol-relative (//cdn.example)
    if (/^(https?:)?\/\//i.test(path)) return path;

    // otherwise join with siteUrl ensuring single slash
    const cleanedPath = String(path).replace(/^\/+/, "");
    return `${cleanedSite}/${cleanedPath}`;
  };

  // safe mainImage + JSON-LD image list
  const safeMainImage =
    (Array.isArray(images) && images.length && makeAbsoluteUrl(images[0])) ||
    `${cleanedSite}/og-image.png`;

  useEffect(() => {
    // Save previous head values so we can restore them on cleanup
    const prev = {
      title: document.title,
      metas: {},
      links: {},
      jsonLdScript:
        document.head.querySelector("script#rrproperties-jsonld")?.innerText ||
        null,
    };

    // helper to save a meta by selector
    const saveMeta = (selector, keyName) => {
      const el = document.head.querySelector(selector);
      prev.metas[keyName] = el ? el.getAttribute("content") : null;
    };

    // list of metas we work with
    const metaSelectors = [
      { sel: 'meta[name="description"]', key: "description" },
      { sel: 'meta[property="og:type"]', key: "og:type" },
      { sel: 'meta[property="og:title"]', key: "og:title" },
      { sel: 'meta[property="og:description"]', key: "og:description" },
      { sel: 'meta[property="og:url"]', key: "og:url" },
      { sel: 'meta[property="og:image"]', key: "og:image" },
      { sel: 'meta[name="twitter:card"]', key: "twitter:card" },
      { sel: 'meta[name="twitter:title"]', key: "twitter:title" },
      { sel: 'meta[name="twitter:description"]', key: "twitter:description" },
      { sel: 'meta[name="twitter:image"]', key: "twitter:image" },
    ];

    metaSelectors.forEach(({ sel, key }) => saveMeta(sel, key));

    // save canonical link if present
    const canonicalEl = document.head.querySelector('link[rel="canonical"]');
    prev.links.canonical = canonicalEl
      ? canonicalEl.getAttribute("href")
      : null;

    // --- APPLY NEW META ---
    const safeTitle = title || "Property | RR Properties";
    const safeDesc =
      description ||
      "Find your dream property in Hyderabad with RR Properties.";
    const pageUrl = slug
      ? `${cleanedSite}/property/${encodeURIComponent(slug)}`
      : cleanedSite;

    const metaTitle = `${bedrooms ? bedrooms + " " : ""}${
      propertyType ? propertyType + " in " : ""
    }${(location || "").toString().trim()}${
      price ? ` | ${status || ""} ₹${price}` : ""
    } | RR Properties`;

    document.title = metaTitle || `${safeTitle} | RR Properties`;

    // basic meta
    setMeta("description", "name", safeDesc);
    setLink("canonical", pageUrl);

    // Open Graph (use 'property' attr)
    setMeta("og:type", "property", "article");
    setMeta("og:title", "property", metaTitle || safeTitle);
    setMeta("og:description", "property", safeDesc);
    setMeta("og:url", "property", pageUrl);
    setMeta("og:image", "property", safeMainImage);

    // Twitter card
    setMeta("twitter:card", "name", "summary_large_image");
    setMeta("twitter:title", "name", metaTitle || safeTitle);
    setMeta("twitter:description", "name", safeDesc);
    setMeta("twitter:image", "name", safeMainImage);

    // JSON-LD structured data
    const jsonLdImages =
      Array.isArray(images) && images.length
        ? images.map((i) => makeAbsoluteUrl(i)).filter(Boolean)
        : [safeMainImage];

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      url: pageUrl,
      name: safeTitle,
      description: safeDesc,
      image: jsonLdImages,
      datePosted: createdAt,
      dateModified: updatedAt,
      numberOfRooms: bedrooms,
      floorSize: size
        ? { "@type": "QuantitativeValue", value: size, unitText: sizeUnit }
        : undefined,
      numberOfBathroomsTotal: bathrooms,
      offers: price
        ? {
            "@type": "Offer",
            price: String(price),
            priceCurrency: "INR",
            availability:
              status &&
              typeof status === "string" &&
              status.toLowerCase().includes("rent")
                ? "https://schema.org/ForRent"
                : "https://schema.org/ForSale",
            validFrom: createdAt,
          }
        : undefined,
      seller:
        createdBy && (createdBy.name || createdBy.phone || createdBy.email)
          ? {
              "@type": "RealEstateAgent",
              ...(createdBy.name ? { name: createdBy.name } : {}),
              ...(createdBy.phone ? { telephone: createdBy.phone } : {}),
              ...(createdBy.email ? { email: createdBy.email } : {}),
            }
          : undefined,
    };

    // Remove undefined entries helper
    const clean = (o) => {
      if (!o || typeof o !== "object") return o;
      if (Array.isArray(o)) return o.map(clean).filter(Boolean);
      const res = {};
      Object.keys(o).forEach((k) => {
        if (o[k] === undefined || o[k] === null) return;
        const val = o[k];
        res[k] = typeof val === "object" ? clean(val) : val;
      });
      return res;
    };

    // replace previous JSON-LD if any
    const scriptId = "rrproperties-jsonld";
    removeElementIfExists(`script#${scriptId}`);
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = scriptId;
    s.innerText = JSON.stringify(clean(jsonLd));
    document.head.appendChild(s);

    // --- CLEANUP: restore previous head values on unmount ---
    return () => {
      // restore title
      if (prev.title !== undefined && prev.title !== null) {
        document.title = prev.title;
      }

      // restore meta tags: if a previous value existed set it, otherwise remove the tag we added
      metaSelectors.forEach(({ sel, key }) => {
        const prevVal = prev.metas[key];
        if (prevVal !== null && prevVal !== undefined) {
          // set back
          const attr = sel.includes("property") ? "property" : "name";
          const nameOrProp =
            attr === "property"
              ? sel.match(/meta\[property="(.+)"\]/)[1]
              : sel.match(/meta\[name="(.+)"\]/)[1];
          setMeta(nameOrProp, attr, prevVal);
        } else {
          // remove the current tag if it exists
          const el = document.head.querySelector(sel);
          if (el) el.remove();
        }
      });

      // restore canonical
      if (prev.links.canonical) {
        setLink("canonical", prev.links.canonical);
      } else {
        // remove canonical if it didn't exist before
        removeElementIfExists('link[rel="canonical"]');
      }

      // restore JSON-LD script (if there was old content restore it, otherwise remove)
      if (prev.jsonLdScript) {
        removeElementIfExists(`script#${scriptId}`);
        const old = document.createElement("script");
        old.type = "application/ld+json";
        old.id = scriptId;
        old.innerText = prev.jsonLdScript;
        document.head.appendChild(old);
      } else {
        removeElementIfExists(`script#${scriptId}`);
      }
    };
    // run when property or siteUrl changes
  }, [property, siteUrl]);

  return null;
}