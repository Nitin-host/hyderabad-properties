import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authAPI } from "../services/api";

const WishlistContext = createContext();

const sameId = (a, b) => String(a) === String(b);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const response = await authAPI.getFavorites();
          setFavorites(Array.isArray(response) ? response : []);
        } else {
          const storedFavorites = localStorage.getItem("favorites");
          setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
        const storedFavorites = localStorage.getItem("favorites");
        setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoading]);

  const isFavorite = (propertyId) => {
    if (!Array.isArray(favorites) || !propertyId) return false;
    return favorites.some((fav) => sameId(fav?._id || fav, propertyId));
  };

  const toggleFavorite = async (propertyId) => {
    const id = String(propertyId);
    const prev = favorites;
    const currentlyFav = isFavorite(id);

    try {
      if (currentlyFav) {
        setFavorites((list) =>
          list.filter((fav) => !sameId(fav?._id || fav, id))
        );
        if (user) {
          await authAPI.removeFromFavorites(id);
        }
      } else {
        setFavorites((list) =>
          list.some((fav) => sameId(fav?._id || fav, id))
            ? list
            : [...list, { _id: id }]
        );
        if (user) {
          await authAPI.addToFavorites(id);
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setFavorites(prev);
    }
  };

  const syncFavoritesOnLogin = async () => {
    try {
      const localFavoritesIds = favorites.map((f) => String(f._id || f));
      const response = await authAPI.getFavorites();
      const userFavorites = Array.isArray(response) ? response : [];
      for (const fId of localFavoritesIds) {
        if (
          fId &&
          !userFavorites.some((f) => sameId(f._id, fId))
        ) {
          await authAPI.addToFavorites(fId);
        }
      }
      const merged = await authAPI.getFavorites();
      setFavorites(Array.isArray(merged) ? merged : userFavorites);
    } catch (err) {
      console.error("Error syncing favorites:", err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        syncFavoritesOnLogin,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
