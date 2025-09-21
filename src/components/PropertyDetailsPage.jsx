import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useWishlist } from '../context/WishlistContext';
import PropertyShare from './PropertyShare';
import StickyContactForm from './ContactForm';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoSlide, setAutoSlide] = useState(true);
  const autoSlideIntervalRef = useRef(null);
  const { isFavorite, toggleFavorite } = useWishlist();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await propertiesAPI.getById(id);
        setProperty(response.data);
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Auto-slide effect for images
  useEffect(() => {
    if (autoSlide && property?.images?.length > 1) {
      autoSlideIntervalRef.current = setInterval(() => {
        nextImage();
      }, 3000); // Change image every 3 seconds
    }
    
    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [autoSlide, property, currentImageIndex]);

  const nextImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
    
    // Pause auto-slide when manually navigating
    if (autoSlide) {
      setAutoSlide(false);
      setTimeout(() => setAutoSlide(true), 10000); // Resume after 10 seconds of inactivity
    }
  };

  const prevImage = () => {
    if (property?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
    
    // Pause auto-slide when manually navigating
    if (autoSlide) {
      setAutoSlide(false);
      setTimeout(() => setAutoSlide(true), 10000); // Resume after 10 seconds of inactivity
    }
  };
  
  const toggleAutoSlide = () => {
    setAutoSlide(!autoSlide);
  };
  
  const handleFavoriteToggle = () => {
    if (property) {
      toggleFavorite(property._id);
    }
  };

  const nextVideo = () => {
    if (property?.videos?.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % property.videos.length);
    }
  };

  const prevVideo = () => {
    if (property?.videos?.length > 0) {
      setCurrentVideoIndex((prev) => (prev - 1 + property.videos.length) % property.videos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <StickyContactForm/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Title and Price */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {property.title}
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-blue-400">
            ₹{property.price?.toLocaleString()}
          </p>
          <p className="text-gray-300 mt-2 text-sm sm:text-base">
            {property.location} {property.landmark}
          </p>
          <div className="fixed bottom-19 right-4 z-50">
            <PropertyShare propertyId={property._id} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Images and Videos */}
          <div className="lg:col-span-2">
            {/* Images Section */}
            {property.images && property.images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Images</h2>
                <div className="relative">
                  <img
                    src={
                      property.images[
                        currentImageIndex
                      ]?.cloudinaryUrl?.trim() || "/api/placeholder/800/400"
                    }
                    alt={
                      property.images[currentImageIndex]?.caption ||
                      property.title
                    }
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                      
                      {/* Auto-slide control */}
                      <button
                        onClick={toggleAutoSlide}
                        className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-75"
                      >
                        {autoSlide ? 'Pause Slideshow' : 'Play Slideshow'}
                      </button>
                      
                      {/* Favorite button */}
                      <button
                        onClick={handleFavoriteToggle}
                        className="absolute top-4 right-4 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-6 w-6 ${isFavorite(property._id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Image Thumbnails */}
                {property.images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto">
                    {property.images.map((image, index) => (
                      <button
                        key={image._id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex
                            ? "border-blue-500"
                            : "border-gray-600"
                        }`}
                      >
                        <img
                          src={
                            image.cloudinaryUrl?.trim() ||
                            "/api/placeholder/80/80"
                          }
                          alt={image.caption || `Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Videos Section */}
            {property.videos && property.videos.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Videos</h2>

                {/* Video Container */}
                <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                  <video
                    src={property.videos[0]?.cloudinaryUrl?.trim()}
                    controls
                    className="w-full h-96 object-cover"
                    poster="/api/placeholder/800/400"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Caption */}
                {property.videos[0]?.caption && (
                  <p className="mt-3 px-3 py-2 bg-gray-800 text-gray-200 rounded-lg text-sm">
                    {property.videos[0].caption}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">
                {property.description}
              </p>
            </div>
          </div>

          {/* Right Column - Property Details */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 lg:fixed lg:top-24 lg:right-4 lg:w-80 lg:z-30">
              {/* Tabs */}
             <div className="flex mb-6 bg-gray-900/60 rounded-xl p-1 backdrop-blur-sm border border-gray-700">
                {["overview", "details", "amenities", "location"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 p-2 rounded-lg text-sm font-small transition-all duration-200 relative
                      ${
                        activeTab === tab
                          ? "bg-blue-500 text-white shadow-md scale-[1.02]"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/70"
                      }`}
                  >
                    <span className="capitalize">{tab}</span>
                  </button>
                ))}
              </div>

              
              <div className='min-h-60'>
                {/* Tab Content */}
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Property Type</p>
                        <p className="font-medium text-sm">
                          {property.propertyType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className="font-medium text-sm">{property.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Size</p>
                        <p className="font-medium text-sm">
                          {property.size} {property.sizeUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bedrooms</p>
                        <p className="font-medium text-sm">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bathrooms</p>
                        <p className="font-medium text-sm">
                          {property.bathrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Furnished</p>
                        <p className="font-medium text-sm">
                          {property.furnished}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-4">
                    {/* Basic Details */}
                    <div>
                      <h3 className="font-semibold mb-2 text-white text-sm">
                        Basic Details
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-300 text-xs">Parking:</span>
                          <span className="font-medium text-xs">
                            {property.parking}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300 text-xs">
                            Security Deposit:
                          </span>
                          <span className="font-medium text-xs">
                            ₹{property.securityDeposit?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                      <h3 className="font-semibold mb-2 text-white text-sm">
                        Additional Details
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Flooring:</span>
                          <span className="font-medium">
                            {property.flooring || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Overlooking:</span>
                          <span className="font-medium">
                            {property.overlooking || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">
                            Water Availability:
                          </span>
                          <span className="font-medium">
                            {property.waterAvailability || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Electricity:</span>
                          <span className="font-medium">
                            {property.statusOfElectricity || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">
                            Age of Construction:
                          </span>
                          <span className="font-medium">
                            {property.ageOfConstruction || "N/A"}
                          </span>
                        </div>
                        {property.additionalRooms && (
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">
                              Additional Rooms:
                            </span>
                            <span className="font-medium text-xs">
                              {property.additionalRooms}
                            </span>
                          </div>
                        )}
                        {property.lift && (
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">Lifts:</span>
                            <span className="font-medium text-xs">
                              {property.lift}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-white text-sm">
                      Amenities
                    </h3>
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1.5">
                        {property.amenities.map((amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300 text-xs">
                              {amenity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs">No amenities listed</p>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-white text-sm">
                      Location Details
                    </h3>
                    <div className="space-y-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="font-medium text-xs">{property.location}</p>
                      </div>
                      {property?.landmark && (
                        <div>
                          <p className="text-xs text-gray-400">Landmark</p>
                          <p className="font-medium text-xs">
                            {property.landmark}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Agent Information */}
                    {property.agent && (
                      <div>
                        <h3 className="font-semibold mb-2 text-white text-sm">
                          Agent Information
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">Name:</span>
                            <span className="font-medium text-xs">
                              {property.agent.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">Email:</span>
                            <span className="font-medium text-xs">
                              {property.agent.email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">Phone:</span>
                            <span className="font-medium text-xs">
                              {property.agent.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;