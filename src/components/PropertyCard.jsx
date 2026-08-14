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
import logo from '../assets/RR_PROP_LOGO.png'
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { createSlug } from '../util/CreateSlug';

// ...rest of imports remain same

const PropertyCard = ({ property, onToggleFavorite, priority = false }) => {
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

  const goToDetails = () => {
    if (isSold) return;
    const slug = property.slug || createSlug(property);
    navigate(`/property/${slug}`);
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
      ? property.images[currentImageIndex]?.presignUrl
      : "";

  const isSold =
    ["sold", "occupied", "rented"].includes(
      (property.status || "").toLowerCase()
    );

  return (
    <div
      className={`h-full flex flex-col rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-line ${
        isSold ? "bg-raised opacity-70 cursor-not-allowed" : "bg-surface"
      }`}
    >
      {/* Image Section */}
      <div
        className={`relative h-48 w-full shrink-0 overflow-hidden ${
          isSold ? "" : "cursor-pointer"
        }`}
        onClick={goToDetails}
        role={isSold ? undefined : "link"}
      >
        <LazyLoadImage
          src={currentImage || logo}
          alt={property.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          effect={currentImage ? "blur" : undefined}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !isSold ? "hover:scale-105" : ""
          }`}
        />
        {/* <img
          src={currentImage || logo}
          alt={property.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            !isSold ? "hover:scale-105" : ""
          }`}
          style={{ filter: "blur(10px)" }}
          onLoad={(e) => (e.currentTarget.style.filter = "none")}
        /> */}

        {/* Status Badge */}
        {!isSold ? (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500 text-white">
              {capitalizeFirst(property.status)}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="relative transform scale-90 md:scale-100 pointer-events-none">
              {/* Hanging string (centered) */}
              <div className="flex justify-center">
                <div className="w-1.5 h-8 bg-gray-700 rounded-full"></div>
              </div>

              {/* Hanging board */}
              <div className="relative mt-0 bg-red-500 text-white rounded-lg px-6 py-3 shadow-lg">
                {/* right-side depth */}
                {/* <div className="absolute right-2 top-2 w-2 h-full bg-red-600 rounded-lg shadow-inner"></div> */}

                <span className="block text-2xl md:text-3xl font-extrabold tracking-wide">
                  {capitalizeFirst(property.status)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Like Button (disable if sold) */}
        <button
          name="favorite"
          aria-label="Like your Favorite property"
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
              name="left-arrow"
              aria-label='Left arrow to change the images'
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
            >
              ‹
            </button>
            <button
              name="right-arrow"
              aria-label='Right arrow to change the images'
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <h3 className="text-xl font-bold text-fg mb-1 leading-7 truncate">
          {formatPrice(property.price)}
        </h3>
        <h4
          className="text-lg font-semibold text-fg mb-2 leading-6 h-12 line-clamp-2"
          title={property.title}
        >
          {property.title}
        </h4>
        <div className="flex items-center text-muted mb-3 h-5 min-w-0">
          <MapPin size={16} className="mr-1 shrink-0" />
          <span className="text-sm truncate">
            {[property?.location, property?.landmarks].filter(Boolean).join(", ")}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted mb-3 gap-2 h-5 overflow-hidden">
          <div className="flex items-center min-w-0">
            <Bed size={16} className="mr-1 shrink-0" />
            <span className="truncate">{property.bedrooms}</span>
          </div>
          <div className="flex items-center min-w-0">
            <Square size={16} className="mr-1 shrink-0" />
            <span className="truncate">
              {property.size} {property.sizeUnit}
            </span>
          </div>
          {property.parking && (
            <div className="flex items-center min-w-0">
              <SquareParking size={16} className="mr-1 shrink-0" />
              <span className="truncate">{capitalizeFirst(property.parking)}</span>
            </div>
          )}
        </div>

        <div className="mb-3 h-7 flex items-center gap-2 overflow-hidden">
          {property.amenities?.length > 0 ? (
            <>
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-raised text-muted rounded shrink-0 max-w-[7rem] truncate"
                  title={amenity}
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="px-2 py-1 text-xs bg-raised text-muted rounded shrink-0">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted italic">
              No amenities listed
            </span>
          )}
        </div>

        <div className="mt-auto">
          <button
            name="property-details"
            aria-label="View Property Details"
            onClick={() => {
              if (!isSold) {
                goToDetails();
              }
            }}
            disabled={isSold}
            className={`w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              isSold
                ? "bg-raised text-muted cursor-not-allowed"
                : "bg-brand hover:opacity-90 text-brand-fg"
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