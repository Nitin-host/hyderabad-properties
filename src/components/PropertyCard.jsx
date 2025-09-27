import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Square,
  SquareParking,
  Heart,
} from "lucide-react";
import { useWishlist } from '../context/WishlistContext';

// ...rest of imports remain same

const PropertyCard = ({ property, onToggleFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useWishlist();

  const capitalizeFirst = (text) =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const nextImage = () => {
    if (property.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const currentImage =
    property.images && property.images.length > 0
      ? property.images[currentImageIndex]?.cloudinaryUrl ||
        property.images[currentImageIndex]?.presignUrl?.replace(/`/g, "").trim()
      : "";

  const isSold = property.status.toLowerCase() === "sold" || property.status.toLowerCase() === "occupied" || property.status.toLowerCase() === "rented";

  return (
    <div
      className={`mt-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${
        isSold ? "bg-gray-700 opacity-70 cursor-not-allowed" : "bg-gray-800"
      }`}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentImage}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !isSold ? "hover:scale-105" : ""
          }`}
        />

        {/* Status Badge */}
        {!isSold ? (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">
              {capitalizeFirst(property.status)}
            </span>
          </div>
        ) : (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 border-2 border-red-600 text-red-600 font-bold text-lg px-4 py-2 opacity-90 tracking-wider bg-white/0">
            {capitalizeFirst(property.status)}
          </div>
        )}

        {/* Like Button (disable if sold) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSold) {
              toggleFavorite(property._id);
              if (onToggleFavorite) onToggleFavorite();
            }
          }}
          className={`absolute bottom-2 right-2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all ${
            isSold ? "cursor-not-allowed" : ""
          }`}
        >
          <Heart
            size={16}
            className={`${
              isFavorite(property._id)
                ? "fill-red-500 text-red-500"
                : "text-gray-600"
            }`}
          />
        </button>

        {/* Image Navigation */}
        {!isSold && property.images?.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white">
            {formatPrice(property.price)}
          </h3>
        </div>
        <h4 className="text-lg font-semibold text-gray-200 mb-2 line-clamp-2">
          {property.title}
        </h4>
        <div className="flex items-center text-gray-400 mb-3">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">
            {property?.location}, {property?.landmarks}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <div className="flex items-center">
            <Bed size={16} className="mr-1" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Square size={16} className="mr-1" />
            <span>
              {property.size} {property.sizeUnit}
            </span>
          </div>
          {property.parking && (
            <div className="flex items-center">
              <SquareParking size={16} className="mr-1" />
              <span>{capitalizeFirst(property.parking)}</span>
            </div>
          )}
        </div>

        {/* Amenities Preview */}
        {property.amenities?.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1">
            {property.amenities.slice(0, 2).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <span className="text-xs text-gray-500 italic">
              No amenities listed
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (!isSold) {
                const propertyId =
                  property._id?.$oid || property._id || property.id;
                navigate(`/property/${propertyId}`);
              }
            }}
            disabled={isSold}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              isSold
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;