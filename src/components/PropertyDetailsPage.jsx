import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { propertiesAPI } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import PropertyShare from "./PropertyShare";
import StickyWhatsApp from "./StickyWhatsApp.jsx";
import logo from "../assets/RR_PROP_LOGO.png";
import {
  Play,
  Pause,
  Heart,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  House,
  ClipboardList,
  Sparkles,
  Building2,
  Layers,
  Tag,
  CalendarClock,
  Maximize2,
  Sofa,
  BedDouble,
  Bath,
  DoorOpen,
  IndianRupee,
} from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import PropertySEONoDep from "./PropertySEO.jsx";

const NeonVideoPlayer = lazy(() => import("../util/NeonVideoPlayer.jsx"));

const PropertyDetailsPage = () => {
  // const { id } = useParams();
  const { slug } = useParams();
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
  const [mediaTab, setMediaTab] = useState("photos");
  const thumbnailsRef = useRef(null);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isImageModalOpen) return;

      if (e.key === "ArrowLeft") {
        setModalImageIndex(
          (prev) => (prev - 1 + property.images.length) % property.images.length
        );
      } else if (e.key === "ArrowRight") {
        setModalImageIndex((prev) => (prev + 1) % property.images.length);
      } else if (e.key === "Escape") {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, property?.images]);



  const openImageModal = (index) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };


useEffect(() => {
  const controller = new AbortController();

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);

      const extractedId = slug.split("-").pop();
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(extractedId);
      const config = { signal: controller.signal };

      if (!isObjectId) {
        const slugResponse = await propertiesAPI.getSlug(slug, config);
        setProperty(slugResponse.data);
      } else {
        const response = await propertiesAPI.getById(extractedId, config);
        const fetchedProperty = response.data;

        const blockedStatuses = ["sold", "rented", "occupied"];

        if (blockedStatuses.includes(fetchedProperty.status?.toLowerCase())) {
          navigate("/", { replace: true });
          return;
        }

        setProperty(fetchedProperty);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError("Failed to load property details");
      console.error("Error fetching property:", err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  if (slug) {
    fetchProperty();
  }

  return () => controller.abort();
}, [slug, navigate]);



  // Auto-slide effect for images
  useEffect(() => {
    if (autoSlide && mediaTab === "photos" && property?.images?.length > 1) {
      autoSlideIntervalRef.current = setInterval(() => {
        nextImage();
      }, 3000); // Change image every 3 seconds
    }
    
    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [autoSlide, mediaTab, property, currentImageIndex]);

  useEffect(() => {
    if (thumbnailsRef.current && property?.images?.length > 0) {
      const container = thumbnailsRef.current;
      const activeThumbnail = container.children[currentImageIndex];
      if (activeThumbnail) {
        const containerRect = container.getBoundingClientRect();
        const thumbRect = activeThumbnail.getBoundingClientRect();

        // If thumbnail is out of view on the right → scrollRight
        if (thumbRect.right > containerRect.right) {
          container.scrollBy({
            left: thumbRect.right - containerRect.right + 8, // add small padding
            behavior: "smooth",
          });
        }

        // If thumbnail is out of view on the left → scrollLeft
        if (thumbRect.left < containerRect.left) {
          container.scrollBy({
            left: thumbRect.left - containerRect.left - 8, // add small padding
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentImageIndex, property?.images]);


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
      <div className="min-h-screen flex flex-col items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand"></div>
        <p className="mt-4 text-muted">Loading property details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            aria-label='To go back to the Properties'
            onClick={() => navigate('/')}
            className="bg-brand text-brand-fg px-4 py-2 rounded-lg hover:opacity-90"
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

  const isPresentDetail = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "number") return !Number.isNaN(value) && value !== 0;
    const text = String(value).trim();
    if (!text) return false;
    const lower = text.toLowerCase();
    return ![
      "not available",
      "n/a",
      "na",
      "none",
      "-",
    ].includes(lower);
  };

  const additionalDetails = additionalDetailsConfig.filter((field) =>
    isPresentDetail(property[field.name])
  );
  const hasParking = isPresentDetail(property.parking);
  const hasDeposit =
    property.securityDeposit !== undefined &&
    property.securityDeposit !== null &&
    property.securityDeposit !== "";
  const hasBasicDetails = hasParking || hasDeposit;

  const API = import.meta.env.VITE_API_BASE_URL || "";
  const video = property?.videos?.[0];
  const hasVideo = Boolean(
    video?.masterProxyUrl && video.masterProxyUrl.trim() !== ""
  );
  const hasImages = property.images?.length > 0;
  const showMediaTabs = hasImages && hasVideo;

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
    return `₹${Number(price || 0).toLocaleString()}`;
  };

  const detailTabs = [
    { id: "overview", label: "Overview", icon: House },
    { id: "details", label: "Details", icon: ClipboardList },
    { id: "amenities", label: "Amenities", icon: Sparkles },
    { id: "location", label: "Location", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-page">
      <StickyWhatsApp />
      {property && (
        <PropertySEONoDep
          property={property}
          siteUrl={
            import.meta.env.VITE_SITE_URL || "https://rrpropertieshyderabad.com"
          }
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          <ChevronLeft size={16} /> Back to listings
        </button>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-1">
              {property.title}
            </h1>
            <p className="text-2xl font-semibold text-brand">
              {formatPrice(property.price)}
            </p>
            <p className="text-muted mt-2 text-sm sm:text-base flex items-center gap-1.5">
              <MapPin size={16} className="shrink-0" />
              <span>
                {[property.location, property.landmarks || property.landmark]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={
                isFavorite(property._id)
                  ? "Remove from Favorites"
                  : "Add to Favorites"
              }
              onClick={handleFavoriteToggle}
              className="p-2.5 rounded-full border border-line bg-surface hover:bg-raised"
            >
              <Heart
                size={18}
                className={
                  isFavorite(property._id)
                    ? "fill-red-500 text-red-500"
                    : "text-muted"
                }
              />
            </button>
            <div className="rounded-full border border-line bg-surface">
              <PropertyShare
                propertyId={property.slug ? property.slug : slug}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Media and description */}
          <div className="lg:col-span-2 space-y-6">
            {(hasImages || hasVideo) && (
              <div className="rounded-2xl border border-line bg-surface overflow-hidden">
                {showMediaTabs && (
                  <div className="flex gap-1 p-2 border-b border-line bg-raised/50">
                    <button
                      type="button"
                      onClick={() => setMediaTab("photos")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        mediaTab === "photos"
                          ? "bg-brand text-brand-fg"
                          : "text-muted hover:text-fg hover:bg-surface"
                      }`}
                    >
                      <ImageIcon size={16} /> Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTab("video");
                        setAutoSlide(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        mediaTab === "video"
                          ? "bg-brand text-brand-fg"
                          : "text-muted hover:text-fg hover:bg-surface"
                      }`}
                    >
                      <Video size={16} /> Video
                    </button>
                  </div>
                )}

                {(!showMediaTabs || mediaTab === "photos") && hasImages && (
                  <div>
                    <div className="relative group">
                      <img
                        src={
                          property.images[currentImageIndex]?.presignUrl?.trim() ||
                          logo
                        }
                        alt={
                          property.images[currentImageIndex]?.caption ||
                          property.title
                        }
                        className="w-full h-56 sm:h-72 md:h-96 lg:h-[28rem] object-cover object-center cursor-zoom-in"
                        onClick={() => openImageModal(currentImageIndex)}
                      />

                      {property.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            aria-label="Previous image"
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/55 text-white p-2 rounded-full hover:bg-black/75"
                          >
                            <ChevronLeft size={22} />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            aria-label="Next image"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/55 text-white p-2 rounded-full hover:bg-black/75"
                          >
                            <ChevronRight size={22} />
                          </button>
                          <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={
                                autoSlide ? "Pause slideshow" : "Play slideshow"
                              }
                              onClick={toggleAutoSlide}
                              className="bg-black/55 text-white p-2 rounded-full hover:bg-black/75"
                            >
                              {autoSlide ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                            <span className="bg-black/55 text-white text-xs px-2.5 py-1 rounded-full">
                              {currentImageIndex + 1} / {property.images.length}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {property.images.length > 1 && (
                      <div
                        ref={thumbnailsRef}
                        className="flex gap-2 p-3 overflow-x-auto"
                      >
                        {property.images.map((image, index) => (
                          <button
                            type="button"
                            aria-label={`View image ${index + 1}`}
                            key={image._id || index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${
                              index === currentImageIndex
                                ? "border-brand"
                                : "border-transparent opacity-80 hover:opacity-100"
                            }`}
                          >
                            <LazyLoadImage
                              src={image.presignUrl || logo}
                              alt={image.key || `Image ${index + 1}`}
                              effect="blur"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(mediaTab === "video" || (!hasImages && hasVideo)) && (
                  <div className="bg-black">
                    {!isVideoPlaying ? (
                      <button
                        type="button"
                        className="relative w-full aspect-video group"
                        onClick={() => setIsVideoPlaying(true)}
                      >
                        <img
                          src={video?.thumbnail || logo}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                        <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <span className="h-16 w-16 rounded-full bg-brand text-brand-fg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Play size={28} fill="currentColor" className="ml-0.5" />
                          </span>
                          <span className="mt-3 text-sm font-medium">
                            Play property video
                          </span>
                        </span>
                      </button>
                    ) : (
                      <Suspense
                        fallback={
                          <div className="aspect-video bg-raised animate-pulse rounded-xl" />
                        }
                      >
                      <NeonVideoPlayer
                        src={`${API}${video?.masterProxyUrl || ""}`}
                        poster={video?.thumbnail || logo}
                        autoPlay
                        className="aspect-video"
                      />
                      </Suspense>
                    )}
                  </div>
                )}
              </div>
            )}

            {isImageModalOpen && hasImages && (
              <div
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                onTouchStart={(e) =>
                  (window.touchStartX = e.changedTouches[0].screenX)
                }
                onTouchEnd={(e) => {
                  const touchEndX = e.changedTouches[0].screenX;
                  const deltaX = window.touchStartX - touchEndX;
                  if (deltaX > 50) {
                    setModalImageIndex(
                      (modalImageIndex + 1) % property.images.length
                    );
                  } else if (deltaX < -50) {
                    setModalImageIndex(
                      (modalImageIndex - 1 + property.images.length) %
                        property.images.length
                    );
                  }
                }}
              >
                <button
                  type="button"
                  aria-label="Close image"
                  onClick={closeImageModal}
                  className="absolute top-4 right-4 text-white text-2xl"
                >
                  ✕
                </button>
                <LazyLoadImage
                  src={property.images[modalImageIndex]?.presignUrl || logo}
                  alt="Expanded"
                  effect="blur"
                  className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() =>
                        setModalImageIndex(
                          (modalImageIndex - 1 + property.images.length) %
                            property.images.length
                        )
                      }
                      className="hidden md:flex absolute left-4 h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white text-3xl"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() =>
                        setModalImageIndex(
                          (modalImageIndex + 1) % property.images.length
                        )
                      }
                      className="hidden md:flex absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white text-3xl"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            )}

            {property.description && (
              <div className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="text-lg font-semibold text-fg mb-3">
                  About this property
                </h2>
                <p className="text-muted leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Property Details */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-2xl shadow-sm p-4 sm:p-5 lg:sticky lg:top-24 lg:h-fit border border-line">
              <div className="grid grid-cols-4 gap-1 mb-5 bg-raised rounded-xl p-1">
                {detailTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      type="button"
                      aria-label={`Switch to ${tab.label}`}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] font-medium ${
                        activeTab === tab.id
                          ? "bg-brand text-brand-fg"
                          : "text-muted hover:text-fg"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="min-h-60">
                {/* Tab Content */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-2 gap-3">
                    {property.propertyType && (
                      <OverviewItem
                        icon={Building2}
                        label="Property Type"
                        value={property.propertyType}
                      />
                    )}
                    {property.totalFloors && (
                      <OverviewItem
                        icon={Layers}
                        label="Total Floors"
                        value={property.totalFloors}
                      />
                    )}
                    {property.status && (
                      <OverviewItem
                        icon={Tag}
                        label="Status"
                        value={property.status}
                      />
                    )}
                    {(property.availabilityDate || property.availability) && (
                      <OverviewItem
                        icon={CalendarClock}
                        label="Availability"
                        value={
                          property.availabilityDate
                            ? new Date(
                                property.availabilityDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : property.availability
                        }
                      />
                    )}
                    {property.size && property.sizeUnit && (
                      <OverviewItem
                        icon={Maximize2}
                        label="Size"
                        value={`${property.size} ${property.sizeUnit}`}
                      />
                    )}
                    {property.furnished && (
                      <OverviewItem
                        icon={Sofa}
                        label="Furnished Status"
                        value={property.furnished}
                      />
                    )}
                    {property.bedrooms && (
                      <OverviewItem
                        icon={BedDouble}
                        label="Bedrooms"
                        value={property.bedrooms}
                      />
                    )}
                    {property.bathrooms && (
                      <OverviewItem
                        icon={Bath}
                        label="Bathrooms"
                        value={property.bathrooms}
                      />
                    )}
                    {property.balconies > 0 && (
                      <OverviewItem
                        icon={DoorOpen}
                        label="Balconies"
                        value={property.balconies}
                      />
                    )}
                    <OverviewItem
                      icon={IndianRupee}
                      label="Maintenance"
                      value={`₹${property.maintenance}`}
                    />
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-4">
                    {hasBasicDetails && (
                      <div>
                        <h3 className="font-semibold mb-2 text-fg text-sm">
                          Basic Details
                        </h3>
                        <div className="space-y-1.5">
                          {hasParking && (
                            <div className="flex justify-between">
                              <span className="text-muted text-xs">
                                Parking:
                              </span>
                              <span className="font-medium text-xs">
                                {property.parking}
                              </span>
                            </div>
                          )}
                          {hasDeposit && (
                            <div className="flex justify-between">
                              <span className="text-muted text-xs">
                                Security Deposit:
                              </span>
                              <span className="font-medium text-xs">
                                ₹
                                {Number(
                                  property.securityDeposit
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {additionalDetails.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-fg text-sm">
                          Additional Details
                        </h3>
                        <div className="space-y-1.5">
                          {additionalDetails.map((field) => (
                            <div
                              key={field.name}
                              className="flex justify-between"
                            >
                              <span className="text-muted text-xs">
                                {field.label}:
                              </span>
                              <span className="font-medium text-xs">
                                {property[field.name]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-fg text-sm">
                      Amenities
                    </h3>
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 text-xs rounded-full bg-raised text-fg border border-line"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-xs">
                        No amenities listed
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-fg text-sm">
                      Location Details
                    </h3>
                    <div className="flex flex-row space-x-6 mb-4">
                      <div>
                        <p className="text-xs text-muted">Address</p>
                        <p className="font-medium text-xs">
                          {property.location}
                        </p>
                      </div>
                      {property?.landmarks && (
                        <div>
                          <p className="text-xs text-muted">Landmark</p>
                          <p className="font-medium text-xs">
                            {property.landmarks}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Agent Information */}
                    {property.agent && (
                      <div>
                        <h3 className="font-semibold mb-2 text-fg text-sm">
                          Agent Information
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted text-xs">Name:</span>
                            <span className="font-medium text-xs">
                              {property.agent.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted text-xs">
                              Email:
                            </span>
                            <span className="font-medium text-xs">
                              <a
                                href={`mailto:${property.agent.email}`}
                                className="ml-1 transition-colors hover:underline"
                              >
                                {property.agent.email}
                              </a>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted text-xs">
                              Phone:
                            </span>
                            <span className="font-medium text-xs">
                              <a
                                href={`tel:${property.agent.phone}`}
                                className="hover:underline text-brand"
                              >
                                {property.agent.phone}
                              </a>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted text-xs">
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

              <a
                href={`https://wa.me/919959120077?text=${encodeURIComponent(
                  `Hi, I'm interested in ${property.title}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center w-full py-2.5 rounded-lg bg-brand text-brand-fg font-medium hover:opacity-90"
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <Icon size={16} className="mt-0.5 shrink-0 text-brand" />
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-sm break-words">{value}</p>
    </div>
  </div>
);

export default PropertyDetailsPage;