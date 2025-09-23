import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authAPI } from "../services/api";

const WishlistContext = createContext();

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

  // Load favorites from API or localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const response = await authAPI.getFavorites();
          // response.data is array of favorite property objects
          setFavorites(response || []);
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

  // Persist favorites to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoading]);

  // Check if property is favorite
  const isFavorite = (propertyId) => {
    return favorites.some(fav => fav._id === propertyId);
  };

  // Toggle favorite
  const toggleFavorite = async (propertyId) => {
    try {
      if (isFavorite(propertyId)) {
        if (user) {
          await authAPI.removeFromFavorites(propertyId);
        }
        setFavorites(favorites.filter(fav => fav._id.toString() !== propertyId.toString()));
      } else {
        if (user) {
          await authAPI.addToFavorites(propertyId);
          // fetch full object from API
          const updatedFavorites = await authAPI.getFavorites();
          setFavorites(updatedFavorites || []);
        } else {
          // For guest, just store the ID
          setFavorites([...favorites, { _id: propertyId }]);
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Sync favorites on login
  const syncFavoritesOnLogin = async () => {
    try {
      const localFavoritesIds = favorites.map(f => f._id);
      const response = await authAPI.getFavorites();
      const userFavorites = response.data || [];
      // Add any local favorites not already in user favorites
      for (const fId of localFavoritesIds) {
        if (!userFavorites.some(f => f._id.toString() === fId.toString())) {
          await authAPI.addToFavorites(fId);
        }
      }

      // Update state with merged list
      const merged = [...userFavorites, ...favorites.filter(f => !userFavorites.some(uf => uf._id.toString() === f._id.toString()))];
      setFavorites(merged);
    } catch (err) {
      console.error("Error syncing favorites:", err);
    }
  };

  return (
    <WishlistContext.Provider value={{ favorites, isLoading, isFavorite, toggleFavorite, syncFavoritesOnLogin }}>
      {children}
    </WishlistContext.Provider>
  );
};
