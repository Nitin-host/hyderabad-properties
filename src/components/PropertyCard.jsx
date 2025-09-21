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

const PropertyCard = ({ property}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useWishlist();

  const capitalizeFirst = (text) =>
    text.charAt(0).toUpperCase() + text.slice(1);


  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const currentImage = property.images && property.images.length > 0 
    ? property.images[currentImageIndex]?.cloudinaryUrl?.replace(/`/g, '').trim()
    : '';

  return (
    <div className="mt-5 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentImage}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* Image Navigation */}
        {property.images && property.images.length > 1 && (
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

            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {property.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex
                      ? "bg-white"
                      : "bg-white bg-opacity-50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              property.status === "For Sale"
                ? "bg-green-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {property.status}
          </span>
        </div>

        {/* Featured Badge */}
        {property.featured && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-white">
              Featured
            </span>
          </div>
        )}
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(property._id);
          }}
          className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
        >
          <Heart
            size={16}
            className={`${
              isFavorite(property._id) ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white">
            {formatPrice(property.price)}
          </h3>
          <span className="text-sm text-gray-400">{property.sizeUnit}</span>
        </div>

        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-200 mb-2 line-clamp-2">
          {property.title}
        </h4>

        {/* Location */}
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

        {/* Property Type & Year */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <span>{property.propertyType}</span>
          {/* <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{property.ageofconstruction}</span>
          </div> */}
        </div>

        {/* Amenities Preview */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
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
          </div>
        )}
        {property.amenities && property.amenities.length === 0 && (
          <div className="mb-3">
            <span className="text-xs text-gray-500 italic">
              No amenities listed
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const propertyId =
                property._id?.$oid || property._id || property.id;
              navigate(`/property/${propertyId}`);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;