export const createSlug = (property) => {
  return `${property.bedrooms}-${property.title}-${property._id}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
