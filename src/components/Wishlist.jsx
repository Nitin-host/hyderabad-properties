import React, { useEffect, useState } from "react";
import { propertiesAPI } from "../services/api";
import PropertyCard from "./PropertyCard";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

export default function Wishlist() {
  const { user } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useWishlist();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (favoritesLoading) return;
      setLoading(true);
      try {
        const hasFullProperties =
          Array.isArray(favorites) &&
          favorites.some((item) => item?.title || item?.images);

        if (user && hasFullProperties) {
          setWishlist(favorites.filter((item) => item && item._id));
          return;
        }

        const ids = (favorites || [])
          .map((item) => String(item?._id || item))
          .filter((id) => /^[a-fA-F0-9]{24}$/.test(id));

        if (ids.length === 0) {
          setWishlist([]);
          return;
        }

        const response = await propertiesAPI.getAll({
          ids: ids.join(","),
          limit: Math.max(ids.length, 1),
        });
        const list = response?.data || [];
        const order = new Map(ids.map((id, index) => [id, index]));
        setWishlist(
          [...list].sort(
            (a, b) =>
              (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0)
          )
        );
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, favorites, favoritesLoading]);

  const handleToggleFavorite = (propertyId) => {
    setWishlist((prev) =>
      prev.filter((item) => String(item._id) !== String(propertyId))
    );
  };

  return (
    <div className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

      {loading || favoritesLoading ? (
        <p className="text-muted mt-10">Loading your saved properties...</p>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <Heart className="w-16 h-16 text-muted mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-fg">
            Your wishlist is empty
          </h3>
          <p className="text-muted mb-6 max-w-sm">
            Save your favorite properties here. Start exploring and add some to
            your wishlist!
          </p>
          <Link
            to="/"
            className="bg-brand text-brand-fg px-6 py-2 rounded-md hover:opacity-90 transition"
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
