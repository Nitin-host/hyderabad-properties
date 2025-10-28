import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus, Edit, RotateCcw, Eye } from "lucide-react";
import { propertiesAPI } from "../services/api";
import DynamicForm from "./DynamicForm";
import { formHelpers } from "../config/propertyFormConfig";
import TableUtil from "../util/TableUtil";
import { useLocation } from "react-router-dom";
import NeonVideoPlayer from "../util/NeonVideoPlayer";
import { useAuth } from "../context/AuthContext";
import { notifyError, notifySuccess, notifyWarning } from "../util/Notifications";


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
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewingProperty, setViewingProperty] = useState(null);
  const location = useLocation();
  const { user } = useAuth();
  // Pagination + Search + Sort
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, asc: true });
  const [count, setCount] = useState();


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

  // Fetch all (only uses spinner if loading=true)
const fetchProperties = async (isInitial = false) => {
  if (isInitial) setLoading(true);
  try {
    const params = {
      page,
      limit,
      search: searchText,
      sortKey: sortConfig.key,
      sortOrder: sortConfig.asc ? "asc" : "desc",
    };
    // Assuming you add a new `getAdminAll` method in propertiesAPI
    const response = await propertiesAPI.getAdminAll(params);
    console.log('response', response)
    const { data, pagination } = response;
    setProperties(data || []);
    setTotalPages(pagination.pages || 1);
    setCount(pagination.total);
    setError(null);
  } catch (err) {
    setError("Failed to load admin properties. Please try again.");
  } finally {
    if (isInitial) setLoading(false);
  }
};

 // Trigger fetch on pagination, search, or sort changes
 useEffect(() => {
   if (user?.role === "admin" || user?.role === "super_admin") {
     fetchProperties();
   }
 }, [page, limit, searchText, sortConfig, user]);

  useEffect(() => {
    if (showDeleted) fetchDeletedProperties();
    else fetchProperties();
  }, [page, limit, searchText, sortConfig, showDeleted]);

 // Initial load
 useEffect(() => {
   if (!propProperties) fetchProperties(true);
 }, [propProperties]);

  const fetchDeletedProperties = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchText,
        sortKey: sortConfig.key,
        sortOrder: sortConfig.asc ? "asc" : "desc",
      };
      const response = await propertiesAPI.getDeleted(params);
      const { data, pagination } = response;
      setDeletedProperties(data || []);
      setTotalPages(pagination.pages || 1);
      setCount(pagination.total)
      setError(null);
    } catch (err) {
      setError("Failed to load deleted properties. Please try again.");
    } finally {
      if (isInitial) setLoading(false);
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
        const propertyId = res.data._id;
        try {
          await handleMediaUpload(propertyId);
        } catch {
          notifyError("Failed to upload images or videos");
          resetForm();
          setShowForm(false);
          return { success: false };
        }
        setProperties((prev) => [res.data, ...prev]);
        notifySuccess(res.message || "Property added successfully");
        fetchProperties(); // Update in background in case of backend changes
        if (refreshProperties) refreshProperties();
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      notifyError(err.message || "Failed to add property");
      resetForm();
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
      if (removedImages.length > 0)
        formDataObj.append("removedImages", JSON.stringify(removedImages));
      if (removedVideos.length > 0)
        formDataObj.append("removedVideos", JSON.stringify(removedVideos));
      if (Object.keys(replaceMap).length > 0) {
        const mapPayload = {};
        Object.entries(replaceMap).forEach(([oldKey, file]) => {
          if (file.type.startsWith("image/")) {
            formDataObj.append("images", file);
          } else if (file.type.startsWith("video/")) {
            formDataObj.append("videos", file);
          }
          mapPayload[oldKey] = file.name;
        });
        formDataObj.append("replaceMap", JSON.stringify(mapPayload));
      }
      images.forEach((img) => formDataObj.append("images", img));
      videos.forEach((v) => formDataObj.append("videos", v));

      const res = await propertiesAPI.updateProperty(id, formDataObj);
      if (res.success) {
        setProperties((prev) =>
          prev.map((prop) => (prop._id === id ? { ...res.data } : prop))
        );
        notifySuccess(res.message || "Property updated successfully");
        fetchProperties(); // background sync
        if (refreshProperties) refreshProperties();
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      notifyError(err.message || "Failed to update property");
      resetForm();
      return { success: false, error: err.message };
    }
  };

  const handleDeleteProperty = async (id) => {
    try {
      const response = await propertiesAPI.deleteProperty(id);
      if (response.success) {
        setProperties((prev) => prev.filter((prop) => prop._id !== id));
        fetchProperties(); // background sync
        if (refreshProperties) refreshProperties();
        notifySuccess(response.message || "Property deleted successfully");
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      notifyError(err.message || "An error occurred while deleting property");
      return { success: false, error: err.message };
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      const result = await handleDeleteProperty(propertyId);
      if (!result.success) alert(result.error || "Failed to delete property");
    }
  };

  const PermanentlyDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this property?"
      )
    ) {
      try {
        const result = await propertiesAPI.permanentlyDeleteProperty(id);
        if (result.success) {
          setDeletedProperties((prev) =>
            prev.filter((prop) => prop._id !== id)
          );
          notifySuccess(result.message || "Property permanently deleted");
          fetchDeletedProperties();
        }
        if (!result.success) throw new Error(result.error);
      } catch (error) {
        notifyError(error.message || "Failed to permanently delete property");
      }
    }
  };

  const handleRestoreProperty = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to restore this property?"
      )
    ){
      try {
        const response = await propertiesAPI.restoreProperty(id);
        if (response.success) {
          setDeletedProperties((prev) =>
            prev.filter((prop) => prop._id !== id)
          );
          fetchDeletedProperties();
          notifySuccess(response.message || "Property restored successfully");
          if (refreshProperties) refreshProperties();
          return { success: true };
        }
        return { success: false, error: response.message };
      } catch (err) {
        notifyError(
          err.message || "An error occurred while restoring property"
        );
        return { success: false, error: err.message };
      }
    }
  };

  // --- Media Handling --- (same logic as your original)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Calculate how many more images can be added
    const remainingSlots = 20 - (existingImages.length + images.length);

    if (remainingSlots <= 0) {
      notifyWarning("You can only have a maximum of 20 images per property.");
      return;
    }

    let validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 15 * 1024 * 1024
    );

    if (validFiles.length > remainingSlots) {
      validFiles = validFiles.slice(0, remainingSlots);
      notifyWarning(`You can only add ${remainingSlots} more image(s).`);
    }

    if (validFiles.length < files.length) {
      notifyWarning("Some images were too large or invalid and were skipped.");
    }

    setImages((prev) => [...prev, ...validFiles]);
  };

 const handleVideoUpload = (e) => {
   const file = e.target.files[0];
   if (file && file.size > 200 * 1024 * 1024) {
     notifyWarning("Video size too large. Max 200MB allowed.");
     e.target.value = "";
     return;
   }
   if (file) setVideos((prev) => [...prev, file]);
   e.target.value = "";
 };


  const removeExistingImage = (imageKey, index) => {
    if (imageKey) setRemovedImages((prev) => [...prev, imageKey]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
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

  const replaceVideo = (file, index) => {
    setVideos((prev) => prev.map((v, i) => (i === index ? file : v)));
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
      const res = await propertiesAPI.uploadImages(propertyId, imageForm);
      if (!res.success) {
        resetForm();
        throw new Error("Image upload failed");
      }
    }
    if (videos.length > 0) {
      const videoForm = new FormData();
      videos.forEach((v) => videoForm.append("videos", v));
      const res = await propertiesAPI.uploadVideos(propertyId, videoForm);
      if (!res.success) {
        resetForm();
        throw new Error("Video upload failed");
      }
    }
  };

  const validateForm = () => {
    const newErrors = formHelpers.validateForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const propertyData = { ...formData, amenities: amenitiesList };
      let result;
      if (editingProperty) {
        result = await handleUpdateProperty(editingProperty._id, propertyData);
      } else {
        result = await handleAddProperty(propertyData);
      }
      if (!result.success) throw result;
      await fetchProperties();
      setShowForm(false);
      resetForm();
    } catch (error) {
      if (error?.error && Array.isArray(error.error)) {
        const fieldErrors = {};
        error.error.forEach((err) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else if (error.message) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "Failed to save property" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleView = (property) => setViewingProperty(property);

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

  if (showDeleted) {
    tableHeader.push({ label: "Deleted By", key: "deletedBy.name" });
    tableHeader.push({
      label: "Deleted At",
      key: "deletedAt",
      dataFormat: "date",
    });
  } else {
    tableHeader.push({ label: "Created By", key: "createdBy.name" });
    tableHeader.push({ label: "Updated By", key: "updatedBy.name" });
  }

  const enableMobileView = location.pathname !== "/";

  return (
    <div className="space-y-6">
      {/* Only initial load spinner */}
      {loading && properties.length === 0 ? (
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
            onClick={() => fetchProperties(properties.length === 0)}
            className="ml-4 underline hover:text-blue-500 dark:hover:text-blue-400"
          >
            Try Again
          </button>
        </div>
      ) : (
          <TableUtil
            tableData={showDeleted ? deletedProperties : properties}
            tableHeader={tableHeader}
            tableName={showDeleted ? `Deleted Properties(${count})` : `Property Management(${count})`}
            searchKeys={["title", "createdBy.name", "updatedBy.name"]}
            isServerPaginated={true} // Must be true
            currentPage={page} // Controlled current page
            rowsPerPage={limit} // controlled rows per page
            totalPages={totalPages} // total pages from server
            onPageChange={setPage} // Trigger to change page
            onRowsPerPageChange={setLimit}
            onSearchChange={setSearchText}
            onSortChange={setSortConfig}
            searchPlaceholder={
              showDeleted
                ? "Search deleted properties..."
                : "Search properties..."
              }
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
              ...(!showDeleted
                ? [
                    {
                      label: "Deleted Properties",
                      icon: Trash2,
                      onClick: () => {
                        setShowDeleted(true);
                        fetchDeletedProperties();
                      },
                      btnClass:
                        "flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors",
                    },
                  ]
                : []),
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
                      // isVisible: () => user?.role === "super_admin",
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

                  {/* Show upload UI only if there is no existing video */}
                  {existingVideos.length === 0 && (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload} // handleVideoUpload should add to videos array
                        className="hidden"
                        id="video-upload"
                      />
                      <label
                        htmlFor="video-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        Click to upload video
                      </label>
                    </div>
                  )}

                  {/* Existing Videos with NeonVideoPlayer */}
                  {existingVideos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingVideos.map((video, index) => (
                        <NeonVideoPlayer
                          key={video.key || video.id || index}
                          src={video.presignUrl}
                          fullScreen={false}
                          canEdit={
                            user?.role === "admin" ||
                            user?.role === "super_admin"
                          }
                          onReplace={(file) =>
                            handleReplaceVideo(
                              { target: { files: [file] } },
                              video.key || video.id
                            )
                          }
                          onDelete={() =>
                            removeExistingVideo(video.key || video.id, index)
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* New Videos Preview (before upload) */}
                  {videos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((vid, index) => (
                        <NeonVideoPlayer
                          key={index}
                          src={URL.createObjectURL(vid)}
                          fullScreen={false}
                          canEdit={true} // allow replace/delete before upload
                          onDelete={() => removeVideo(index)}
                          onReplace={(file) => replaceVideo(file, index)}
                        />
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
                      <NeonVideoPlayer
                        key={idx}
                        src={vid.presignUrl || vid.preview}
                        fullScreen={false}
                        canEdit={false}
                      />
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