import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus, Edit, RotateCcw, Eye } from "lucide-react";
import { propertiesAPI } from "../services/api";
import DynamicForm from "./DynamicForm";
import { formHelpers } from "../config/propertyFormConfig";
import TableUtil from "../util/TableUtil";
import { useLocation } from "react-router-dom";

const PropertyManagement = ({
  properties: propProperties,
  refreshProperties,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState(() =>
    formHelpers.getInitialFormData()
  );
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [removedVideos, setRemovedVideos] = useState([]);
  const [replaceMap, setReplaceMap] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState(propProperties || []);
  const [loading, setLoading] = useState(!propProperties);
  const [error, setError] = useState(null);
  const [deletedProperties, setDeletedProperties] = useState([]); // ✅ NEW
  const [showDeleted, setShowDeleted] = useState(false); // ✅ NEW
  const [viewingProperty, setViewingProperty] = useState(null);
  const location = useLocation();

  // Fetch properties if not provided as props
  useEffect(() => {
    if (!propProperties) fetchProperties();
  }, [propProperties]);

  // Set form data when editing property
  useEffect(() => {
    if (editingProperty) {
      setFormData(formHelpers.getInitialFormData(editingProperty));
      setExistingImages(editingProperty.images || []);
      setExistingVideos(editingProperty.videos || []);
      setReplaceMap({});
      setRemovedImages([]);
      setRemovedVideos([]);
      setImages([]);
      setVideos([]);
    }
  }, [editingProperty]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load properties. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(formHelpers.getInitialFormData());
    setImages([]);
    setVideos([]);
    setExistingImages([]);
    setExistingVideos([]);
    setRemovedImages([]);
    setRemovedVideos([]);
    setReplaceMap({});
    setErrors({});
    setEditingProperty(null);
    setShowForm(false);
  };

  const handleAddProperty = async (propertyData) => {
    try {
      const res = await propertiesAPI.createProperty(propertyData);
      if (res.success) {
        await handleMediaUpload(res.data._id); // upload media if needed
        await fetchProperties();
        if (refreshProperties) await refreshProperties();
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateProperty = async (id, propertyData) => {
    try {
      const formDataObj = new FormData();

      Object.entries(propertyData).forEach(([key, value]) => {
        if (Array.isArray(value))
          formDataObj.append(key, JSON.stringify(value));
        else formDataObj.append(key, value ?? "");
      });

      // Removed media
      if (removedImages.length > 0)
        formDataObj.append("removedImages", JSON.stringify(removedImages));
      if (removedVideos.length > 0)
        formDataObj.append("removedVideos", JSON.stringify(removedVideos));

      // Replace media
      if (Object.keys(replaceMap).length > 0) {
        const mapPayload = {};

        Object.entries(replaceMap).forEach(([oldKey, file]) => {
          // Instead of replaceMapFiles → send them into images/videos depending on type
          if (file.type.startsWith("image/")) {
            formDataObj.append("images", file);
          } else if (file.type.startsWith("video/")) {
            formDataObj.append("videos", file);
          }

          mapPayload[oldKey] = file.name;
        });

        formDataObj.append("replaceMap", JSON.stringify(mapPayload));
      }

      // New uploads
      images.forEach((img) => formDataObj.append("images", img));
      videos.forEach((vid) => formDataObj.append("videos", vid));

      const res = await propertiesAPI.updateProperty(id, formDataObj);
      if (res.success) {
        await fetchProperties();
        if (refreshProperties) await refreshProperties();
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  const handleDeleteProperty = async (id) => {
    try {
      const response = await propertiesAPI.deleteProperty(id);
      if (response.success) {
        if (refreshProperties) await refreshProperties();
        return { success: true };
      }
      return {
        success: false,
        error: response.message || "Failed to delete property",
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: err.message || "An error occurred while deleting property",
      };
    }
  };

  // Fetch deleted properties
  const fetchDeletedProperties = async () => {
    setLoading(true);
    try {
      const response = await propertiesAPI.getDeleted();
      const data = response.data || [];
      setDeletedProperties(data);
      setError(null);
    } catch (err) {
      setError("Failed to load deleted properties. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Media Handling ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    setImages((prev) => [...prev, ...validFiles]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) return;
    setVideos([file]);
  };

  const removeExistingImage = (imageKey, index) => {
    if (imageKey) setRemovedImages((prev) => [...prev, imageKey]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    // Remove from replaceMap if exists
    setReplaceMap((prev) => {
      const newMap = { ...prev };
      delete newMap[imageKey];
      return newMap;
    });
  };

  const removeExistingVideo = (videoKey, index) => {
    if (videoKey) setRemovedVideos((prev) => [...prev, videoKey]);
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
    setReplaceMap((prev) => {
      const newMap = { ...prev };
      delete newMap[videoKey];
      return newMap;
    });
  };

  const removeImage = (index) =>
    setImages((prev) => prev.filter((_, i) => i !== index));
  const removeVideo = (index) =>
    setVideos((prev) => prev.filter((_, i) => i !== index));

  const handleReplaceImage = (e, oldKey) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setReplaceMap((prev) => ({ ...prev, [oldKey]: file }));
    setExistingImages((prev) =>
      prev.map((img) =>
        img.key === oldKey
          ? { ...img, preview: URL.createObjectURL(file) }
          : img
      )
    );
  };

  const handleReplaceVideo = (e, oldKey) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) return;
    setReplaceMap((prev) => ({ ...prev, [oldKey]: file }));
    setExistingVideos((prev) =>
      prev.map((v) =>
        v.key === oldKey ? { ...v, preview: URL.createObjectURL(file) } : v
      )
    );
  };

  const handleMediaUpload = async (propertyId) => {
    if (images.length > 0) {
      const imageForm = new FormData();
      images.forEach((img) => imageForm.append("images", img));
      await propertiesAPI.uploadImages(propertyId, imageForm);
    }
    if (videos.length > 0) {
      const videoForm = new FormData();
      videos.forEach((v) => videoForm.append("videos", v));
      await propertiesAPI.uploadVideos(propertyId, videoForm);
    }
  };

  // --- Form Handling ---
  const validateForm = () => {
    const newErrors = formHelpers.validateForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isAmenity = (key) => {
    const amenityKeys = [
      "clubhouseGym",
      "school",
      "hospital",
      "mall",
      "park",
      "balcony",
      "petFriendly",
      "cupBoard",
      "lift",
      "wifi",
      "ac",
      "gym",
      "swimmingPool",
      "kidsPlayArea",
      "clubHouse",
      "intercom",
      "spa",
      "servantRoom",
      "security",
      "shoppingCenter",
      "gasConnection",
      "sewageConnection",
      "rainWaterHarvesting",
      "houseKeeping",
      "powerBackup",
      "visitorParking",
      "inductionHob",
      "privateGarden",
      "caretaker",
      "washingMachine",
      "gasLeakage",
      "earthquake",
      "fireAlarm",
    ];
    return amenityKeys.includes(key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const amenitiesList = Array.isArray(formData.amenities)
        ? formData.amenities
        : [];

      // Prepare property data
      const propertyData = {
        ...formData,
        amenities: amenitiesList, // ensure it's an array
      };

      if (editingProperty) {
        const result = await handleUpdateProperty(
          editingProperty._id,
          propertyData
        );
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await handleAddProperty(propertyData);
        if (!result.success) throw new Error(result.error);
      }

      fetchProperties();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setErrors({ submit: error.message || "Failed to save property" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        const result = await handleDeleteProperty(propertyId);
        if (!result.success) throw new Error(result.error);
      } catch (error) {
        alert(error.message || "Failed to delete property");
      }
    }
  };

  const PermanentlyDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this property?")) {
      try {
        const result = await propertiesAPI.permanentlyDeleteProperty(id);
          await fetchDeletedProperties(); // refresh deleted list
        if (!result.success) throw new Error(result.error);
      } catch (error) {
        alert(error.message || "Failed to permanently delete property");
      }
    }
  };

 const handleRestoreProperty = async (id) => {
   try {
     const response = await propertiesAPI.restoreProperty(id);
     if (response.success) {
       await fetchDeletedProperties();
       await fetchProperties(); // keep active list updated
       if (refreshProperties) await refreshProperties();
       return { success: true };
     }
     return { success: false, error: response.message };
   } catch (err) {
     console.error(err);
     return { success: false, error: err.message };
   }
 }; 

const handleView = (property) => {
  setViewingProperty(property);
};

  const tableHeader = [
    {
      label: "Property",
      key: "title",
      imageKey: "images.0.presignUrl",
      textKey: "title",
    },
    { label: "Location", key: "location" },
    { label: "Price", key: "price", dataFormat: "currency" },
    { label: "Type", key: "propertyType" },
    { label: "Status", key: "status" },
  ];

  const enableMobileView = location.pathname !== "/";


  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Loading properties...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg">
          {error}
          <button
            onClick={fetchProperties}
            className="ml-4 underline hover:text-blue-500 dark:hover:text-blue-400"
          >
            Try Again
          </button>
        </div>
      ) : (showDeleted ? deletedProperties : properties).length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-400 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {showDeleted ? "No deleted properties" : "No properties found"}
          </p>
          {showDeleted ? (
            <button
              onClick={() => {
                setShowDeleted(false);
                fetchProperties();
              }}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Properties
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add your first property
            </button>
          )}
        </div>
      ) : (
        <TableUtil
          tableData={showDeleted ? deletedProperties : properties}
          tableHeader={tableHeader}
          tableName={showDeleted ? "Deleted Properties" : "Property Management"}
          searchKeys={["title"]}
          createBtn={[
            {
              label: showDeleted ? "Back to Properties" : "Add Property",
              icon: showDeleted ? RotateCcw : Plus,
              onClick: () =>
                showDeleted
                  ? (setShowDeleted(false), fetchProperties())
                  : setShowForm(true),
              btnClass:
                "flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
            },
            {
              label: "Deleted Properties",
              icon: Trash2,
              onClick: () => {
                setShowDeleted(true);
                fetchDeletedProperties(); // 🔥 load deleted from API
              },
              btnClass:
                "flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors",
            },
          ]}
          enableMobileView={enableMobileView}
          tableActions={
            showDeleted
              ? [
                  {
                    btnTitle: "Restore",
                    btnClass: "text-green-600 hover:text-green-500",
                    iconComponent: RotateCcw,
                    btnAction: (property) =>
                      handleRestoreProperty(property._id),
                  },
                  {
                    btnTitle: "Delete Permanently",
                    btnClass: "text-red-600 hover:text-red-500",
                    iconComponent: Trash2,
                    btnAction: (property) => PermanentlyDelete(property._id),
                  },
                  {
                    btnTitle: "View",
                    btnClass: "text-blue-600 hover:text-blue-500",
                    iconComponent: Eye,
                    btnAction: (property) => handleView(property),
                  },
                ]
              : [
                  {
                    btnTitle: "",
                    btnClass: "",
                    iconComponent: Edit,
                    btnAction: (property) => handleEdit(property),
                  },
                  {
                    btnTitle: "",
                    btnClass: "text-red-500 hover:text-red-400",
                    iconComponent: Trash2,
                    btnAction: (property) => handleDelete(property._id),
                  },
                ]
          }
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <DynamicForm
                formData={formData}
                onChange={(updatedData) => {
                  setFormData(updatedData);
                }}
                errors={errors}
              />

              {/* Media Section */}
              <div className="space-y-4">
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Images
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" /> Click to
                      upload images
                    </label>
                  </div>

                  {/* Existing Images with Replace */}
                  {existingImages.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        Existing Images
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.preview || image.presignUrl}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <label className="absolute bottom-1 left-1 bg-blue-600 text-white rounded px-2 py-1 cursor-pointer">
                              Replace
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleReplaceImage(e, image.key || image.id)
                                }
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                removeExistingImage(
                                  image.key || image.id,
                                  index
                                )
                              }
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Videos
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" /> Click to
                      upload video
                    </label>
                  </div>

                  {/* Existing Videos with Replace */}
                  {existingVideos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingVideos.map((video, index) => (
                        <div key={index} className="relative">
                          <video
                            src={video.preview || video.presignUrl}
                            controls
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <label className="absolute bottom-1 left-1 bg-blue-600 text-white rounded px-2 py-1 cursor-pointer">
                            Replace
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleReplaceVideo(e, video.key || video.id)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              removeExistingVideo(video.key || video.id, index)
                            }
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Videos Preview */}
                  {videos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((vid, index) => (
                        <div key={index} className="relative">
                          <video
                            src={URL.createObjectURL(vid)}
                            controls
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit & Cancel */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>

              {errors.submit && (
                <p className="text-red-500 mt-2">{errors.submit}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-700 animate-scaleUp">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
              <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                Property Details
              </h3>
              <button
                onClick={() => setViewingProperty(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Property Info */}
            <div className="space-y-4 text-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p>
                  <strong>Title:</strong> {viewingProperty.title}
                </p>
                <p>
                  <strong>Location:</strong> {viewingProperty.location}
                </p>
                <p>
                  <strong>Price:</strong> ₹
                  {viewingProperty.price?.toLocaleString()}
                </p>
                <p>
                  <strong>Type:</strong> {viewingProperty.propertyType}
                </p>
                <p>
                  <strong>Status:</strong> {viewingProperty.status}
                </p>
              </div>

              {viewingProperty.amenities &&
                viewingProperty.amenities.length > 0 && (
                  <p>
                    <strong>Amenities:</strong>{" "}
                    {viewingProperty.amenities.join(", ")}
                  </p>
                )}

              <p className="whitespace-pre-line">
                <strong>Description:</strong> {viewingProperty.description}
              </p>

              {/* Images */}
              {viewingProperty.images && viewingProperty.images.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold text-lg mb-2 text-purple-400">
                    Images
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {viewingProperty.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300"
                      >
                        <img
                          src={img.presignUrl || img.preview}
                          alt={img.title || "Property Image"}
                          className="w-full h-32 md:h-40 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {viewingProperty.videos && viewingProperty.videos.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-semibold text-lg mb-2 text-pink-400">
                    Videos
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingProperty.videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300"
                      >
                        <video
                          src={vid.presignUrl || vid.preview}
                          controls
                          className="w-full h-36 md:h-48 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-6 border-t border-gray-700 mt-6">
              <button
                onClick={() => setViewingProperty(null)}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;