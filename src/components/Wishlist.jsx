import React, { useEffect, useState } from "react";
import { authAPI, propertiesAPI } from "../services/api";
import PropertyCard from "./PropertyCard";
import { Heart } from "lucide-react"; // ✅ nice icon
import { Link } from "react-router-dom";

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
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      const updated = stored.filter((item) => item._id !== propertyId);
      localStorage.setItem("favorites", JSON.stringify(updated));
      setWishlist((prev) => prev.filter((item) => item._id !== propertyId));
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <Heart className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-200">
            Your wishlist is empty
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm">
            Save your favorite properties here. Start exploring and add some to
            your wishlist!
          </p>
          <Link
            to="/"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Browse Properties
          </Link>
        </div>
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