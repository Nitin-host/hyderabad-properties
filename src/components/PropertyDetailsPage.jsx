import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useWishlist } from '../context/WishlistContext';
import PropertyShare from './PropertyShare';
import StickyContactForm from './ContactForm';
import { Play } from 'lucide-react';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoSlide, setAutoSlide] = useState(true);
  const autoSlideIntervalRef = useRef(null);
  const { isFavorite, toggleFavorite } = useWishlist();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);


  const openImageModal = (index) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };


  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await propertiesAPI.getById(id);
        const fetchedProperty = response.data;

        // List of statuses for which the page should not show
        const blockedStatuses = ["sold", "rented", "occupied"];

        if (blockedStatuses.includes(fetchedProperty.status?.toLowerCase())) {
          // Redirect to home or another page
          navigate("/", { replace: true });
          return;
        }

        setProperty(fetchedProperty);
      } catch (err) {
        setError("Failed to load property details");
        console.error("Error fetching property:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id, navigate]);


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

  const additionalDetailsConfig = [
    { name: "flooring", label: "Flooring" },
    { name: "overlooking", label: "Overlooking" },
    { name: "waterAvailability", label: "Water Availability" },
    { name: "statusOfElectricity", label: "Electricity" },
    { name: "ageOfConstruction", label: "Age of Construction" },
    { name: "additionalRooms", label: "Additional Rooms" },
    { name: "lift", label: "Lifts" },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <StickyContactForm />
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
                      property.images[currentImageIndex]?.presignUrl?.trim() ||
                      "/api/placeholder/800/400"
                    }
                    alt={
                      property.images[currentImageIndex]?.caption ||
                      property.title
                    }
                    className="w-full h-96 object-cover rounded-lg cursor-pointer"
                    onClick={() => {
                      setModalImageIndex(currentImageIndex);
                      setIsImageModalOpen(true);
                    }}
                  />
                  {/* <button
                    onClick={() => openImageModal(currentImageIndex)}
                    className="absolute bottom-4 right-4"
                  >
                    ⛶
                  </button> */}

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
                        {autoSlide ? "Pause Slideshow" : "Play Slideshow"}
                      </button>

                      {/* Favorite button */}
                      <button
                        onClick={handleFavoriteToggle}
                        className="absolute top-4 right-4 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-6 w-6 ${
                            isFavorite(property._id)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-600"
                          }`}
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
                {isImageModalOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                    onTouchStart={(e) =>
                      (window.touchStartX = e.changedTouches[0].screenX)
                    }
                    onTouchEnd={(e) => {
                      const touchEndX = e.changedTouches[0].screenX;
                      const deltaX = window.touchStartX - touchEndX;

                      if (deltaX > 50) {
                        // Swipe left → next image
                        setModalImageIndex(
                          (modalImageIndex + 1) % property.images.length
                        );
                      } else if (deltaX < -50) {
                        // Swipe right → previous image
                        setModalImageIndex(
                          (modalImageIndex - 1 + property.images.length) %
                            property.images.length
                        );
                      }
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={closeImageModal}
                      className="absolute top-4 right-4 text-white text-2xl"
                    >
                      ✕
                    </button>

                    {/* Image */}
                    <img
                      src={
                        property.images[
                          modalImageIndex
                        ]?.cloudinaryUrl?.trim() ||
                        property.images[modalImageIndex]?.presignUrl?.trim()
                      }
                      alt="Expanded"
                      className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                    />

                    {/* Desktop-only arrows */}
                    <button
                      onClick={() =>
                        setModalImageIndex(
                          (modalImageIndex - 1 + property.images.length) %
                            property.images.length
                        )
                      }
                      className="hidden md:block absolute left-4 text-white text-3xl"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setModalImageIndex(
                          (modalImageIndex + 1) % property.images.length
                        )
                      }
                      className="hidden md:block absolute right-4 text-white text-3xl"
                    >
                      ›
                    </button>
                  </div>
                )}

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
                          src={image.presignUrl}
                          alt={image.key || `Image ${index + 1}`}
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
                <div className="relative bg-gray-900 rounded-xl shadow-lg overflow-hidden h-96">
                  {!isVideoPlaying ? (
                    <div
                      className="w-full h-full flex items-center justify-center cursor-pointer relative"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <img
                        src={
                          property.videos[0]?.thumbnail ||
                          "/api/placeholder/800/400"
                        }
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={65} />
                      </div>
                    </div>
                  ) : (
                    <video
                      src={property.videos[0]?.presignUrl}
                      controls
                      autoPlay
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
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
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 lg:sticky lg:top-24 lg:w-80 lg:h-fit lg:self-start">
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

              <div className="min-h-60">
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
                        <p className="text-xs text-gray-400">Total Floors</p>
                        <p className="font-medium text-sm">
                          {property.totalFloors || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className="font-medium text-sm">{property.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Availability</p>
                        <p className="font-medium text-sm">
                          {property.availabilityDate
                            ? new Date(
                                property.availabilityDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : property.availability || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Size</p>
                        <p className="font-medium text-sm">
                          {property.size} {property.sizeUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          Furnished Status
                        </p>
                        <p className="font-medium text-sm">
                          {property.furnished}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bedrooms</p>
                        <p className="font-medium text-sm">
                          {property.bedrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bathrooms</p>
                        <p className="font-medium text-sm">
                          {property.bathrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Balconies</p>
                        <p className="font-medium text-sm">
                          {property.balconies > 0 ? property.balconies : "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Maintenance</p>
                        <p className="font-medium text-sm">
                          ₹{property.maintenance}
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
                          <span className="text-gray-300 text-xs">
                            Parking:
                          </span>
                          <span className="font-medium text-xs">
                            {property.parking}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300 text-xs">
                            Security Deposit:
                          </span>
                          <span className="font-medium text-xs">
                            ₹
                            {property.securityDeposit?.toLocaleString() ||
                              "N/A"}
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
                        {additionalDetailsConfig.map((field) => {
                          const value = property[field.name];
                          const hasValue =
                            value !== undefined &&
                            value !== null &&
                            value !== "";

                          return (
                            <div
                              key={field.name}
                              className="flex justify-between"
                            >
                              <span className="text-gray-300 text-xs">
                                {field.label}:
                              </span>
                              <span className="font-medium text-xs">
                                {hasValue ? value : "Not Available"}
                              </span>
                            </div>
                          );
                        })}
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
                              {amenity.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs">
                        No amenities listed
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-white text-sm">
                      Location Details
                    </h3>
                    <div className="d-flex flex-col space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="font-medium text-xs">
                          {property.location}
                        </p>
                      </div>
                      {property?.landmarks && (
                        <div>
                          <p className="text-xs text-gray-400">Landmark</p>
                          <p className="font-medium text-xs">
                            {property.landmarks}
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
                            <span className="text-gray-300 text-xs">
                              Email:
                            </span>
                            <span className="font-medium text-xs">
                              {property.agent.email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">
                              Phone:
                            </span>
                            <span className="font-medium text-xs">
                              {property.agent.phone}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-xs">
                              Broker Charge:
                            </span>
                            <span className="font-medium text-xs">
                              {property.brokerCharge}
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