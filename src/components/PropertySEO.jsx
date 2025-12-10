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
  } = property || {};

  const pageUrl = slug
    ? `${siteUrl}/property/${encodeURIComponent(slug)}`
    : siteUrl;
  const safeTitle = title || "Property | RR Properties";
  const safeDesc =
    description || "Find your dream property in Hyderabad with RR Properties.";
  const mainImage =
    images && images.length
      ? images[0].startsWith("http")
        ? images[0]
        : `${siteUrl}${images[0]}`
      : `${siteUrl}/og-image.png`;

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

    // --- APPLY NEW META (same logic as before) ---
    const metaTitle = `${bedrooms ? bedrooms + " " : ""}${
      propertyType ? propertyType + " in " : ""
    }${property.location ? property.location.trim() : ""}${
      price ? ` | ${status || ""} ₹${price}` : ""
    } | RR Properties`;
    document.title = metaTitle || `${safeTitle} | RR Properties`;

    // basic meta
    setMeta("description", "name", safeDesc);
    setLink("canonical", pageUrl);

    // Open Graph
    setMeta("og:type", "property", "article"); // note: we set property attr programmatically below
    setMeta("og:title", "property", metaTitle || safeTitle);
    setMeta("og:description", "property", safeDesc);
    setMeta("og:url", "property", pageUrl);
    setMeta("og:image", "property", mainImage);

    // Twitter card (harmless)
    setMeta("twitter:card", "name", "summary_large_image");
    setMeta("twitter:title", "name", metaTitle || safeTitle);
    setMeta("twitter:description", "name", safeDesc);
    setMeta("twitter:image", "name", mainImage);

    // JSON-LD structured data (clean function reused)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      url: pageUrl,
      name: safeTitle,
      description: safeDesc,
      image:
        images && images.length
          ? images.map((i) => (i.startsWith("http") ? i : `${siteUrl}${i}`))
          : [mainImage],
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
              status && status.toLowerCase().includes("rent")
                ? "https://schema.org/ForRent"
                : "https://schema.org/ForSale",
            validFrom: createdAt,
          }
        : undefined,
      seller: createdBy
        ? {
            "@type": "RealEstateAgent",
            name: createdBy.name,
            telephone: createdBy.phone,
            email: createdBy.email,
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
        res[k] = typeof o[k] === "object" ? clean(o[k]) : o[k];
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
  }, [property]); // run when property changes

  return null;
}
