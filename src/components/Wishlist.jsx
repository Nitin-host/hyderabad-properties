import React, { useEffect, useState } from "react";
import { authAPI, propertiesAPI } from "../services/api";
import PropertyCard from "./PropertyCard";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Fetch property details for guest user by IDs
  const fetchGuestWishlist = async () => {
    const stored = JSON.parse(localStorage.getItem("favorites")) || [];
    const ids = stored.map((item) => item._id);

    if (ids.length === 0) {
      setWishlist([]);
      return;
    }

    try {
      const response = await propertiesAPI.getAll();
      const filtered = response.data.filter((prop) => ids.includes(prop._id));
      setWishlist(filtered);
    } catch (error) {
      console.error("Error fetching guest wishlist properties:", error);
    }
  };

  // ✅ Fetch logged-in user's wishlist
  const fetchWishlist = async () => {
    try {
      if (isLoggedIn) {
        const response = await authAPI.getFavorites();
        setWishlist(response || []);
      } else {
        await fetchGuestWishlist();
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    fetchWishlist();
  }, [isLoggedIn]);

  // ✅ Remove property
  const handleToggleFavorite = (propertyId) => {
    if (isLoggedIn) {
      setWishlist((prev) => prev.filter((item) => item._id !== propertyId));
    } else {
      // Update localStorage IDs
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      const updated = stored.filter((item) => item._id !== propertyId);
      localStorage.setItem("favorites", JSON.stringify(updated));

      // Update local state
      setWishlist((prev) => prev.filter((item) => item._id !== propertyId));
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

      {wishlist.length === 0 ? (
        <p className="text-gray-500">No properties in wishlist</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              onToggleFavorite={() => handleToggleFavorite(property._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
