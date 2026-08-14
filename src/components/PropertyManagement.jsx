import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, Plus, Edit, RotateCcw, Eye } from "lucide-react";
import { propertiesAPI } from "../services/api";
import DynamicForm from "./DynamicForm";
import { formHelpers, propertyFormConfig } from "../config/propertyFormConfig";
import TableUtil from "../util/TableUtil";
import { useLocation } from "react-router-dom";
import NeonVideoPlayer from "../util/NeonVideoPlayer";
import { useAuth } from "../context/AuthContext";
import { notifyError, notifySuccess, notifyWarning } from "../util/Notifications";
import { uploadVideoInChunks } from "../util/chunkedVideoUpload";


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
  const [videoProgress, setVideoProgress] = useState(null);
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobileView, setIsMobileView] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const fetchLock = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileView(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobileView) setPage(1);
  }, [isMobileView]);


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

  const mergeById = (prev, next) => {
    const ids = new Set(prev.map((item) => String(item._id)));
    return [...prev, ...(next || []).filter((item) => !ids.has(String(item._id)))];
  };

  const fetchProperties = async ({ initial = false, append = false } = {}) => {
    if (append && fetchLock.current) return;
    fetchLock.current = true;
    if (initial) setLoading(true);
    if (append) setLoadingMore(true);
    try {
      const params = {
        page,
        limit,
        search: searchText,
        sortKey: sortConfig.key,
        sortOrder: sortConfig.asc ? "asc" : "desc",
      };
      const response = await propertiesAPI.getAdminAll(params);
      const { data, pagination } = response;
      setProperties((prev) =>
        append ? mergeById(prev, data) : data || []
      );
      setTotalPages(pagination.pages || 1);
      setCount(pagination.total);
      setError(null);
    } catch (err) {
      setError("Failed to load admin properties. Please try again.");
    } finally {
      fetchLock.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchDeletedProperties = async ({
    initial = false,
    append = false,
  } = {}) => {
    if (append && fetchLock.current) return;
    fetchLock.current = true;
    if (initial) setLoading(true);
    if (append) setLoadingMore(true);
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
      setDeletedProperties((prev) =>
        append ? mergeById(prev, data) : data || []
      );
      setTotalPages(pagination.pages || 1);
      setCount(pagination.total);
      setError(null);
    } catch (err) {
      setError("Failed to load deleted properties. Please try again.");
    } finally {
      fetchLock.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "super_admin") return;
    const append = isMobileView && page > 1;
    const initial =
      page === 1 &&
      (showDeleted ? deletedProperties.length === 0 : properties.length === 0);
    if (showDeleted) fetchDeletedProperties({ initial, append });
    else fetchProperties({ initial, append });
  }, [page, limit, searchText, sortConfig, showDeleted, user, isMobileView]);

  const refreshList = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    if (showDeleted) fetchDeletedProperties();
    else fetchProperties();
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
    setVideoProgress(null);
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
        refreshList();
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
      const allowedFields = new Set(
        Object.keys(propertyFormConfig.defaultFormData)
      );
      Object.entries(propertyData).forEach(([key, value]) => {
        if (!allowedFields.has(key)) return;
        if (Array.isArray(value))
          formDataObj.append(key, JSON.stringify(value));
        else formDataObj.append(key, value ?? "");
      });
      if (removedImages.length > 0)
        formDataObj.append("removedImages", JSON.stringify(removedImages));

      images.forEach((img) => formDataObj.append("images", img));

      const pendingVideos = [...videos];
      const videosToRemove = [...removedVideos];
      if (Object.keys(replaceMap).length > 0) {
        const mapPayload = {};
        Object.entries(replaceMap).forEach(([oldKey, file]) => {
          if (file.type.startsWith("image/")) {
            formDataObj.append("images", file);
            mapPayload[oldKey] = file.name;
          } else if (file.type.startsWith("video/")) {
            pendingVideos.push(file);
            if (!videosToRemove.includes(oldKey)) {
              videosToRemove.push(oldKey);
            }
          }
        });
        if (Object.keys(mapPayload).length > 0) {
          formDataObj.append("replaceMap", JSON.stringify(mapPayload));
        }
      }
      if (pendingVideos[0]) {
        const keysToClear =
          videosToRemove.length > 0
            ? videosToRemove
            : existingVideos
                .map((v) => v.masterKey || v.key)
                .filter(Boolean);
        formDataObj.append(
          "removedVideos",
          JSON.stringify(keysToClear.length ? keysToClear : ["__replace_video__"])
        );
      } else if (videosToRemove.length > 0) {
        formDataObj.append("removedVideos", JSON.stringify(videosToRemove));
      }

      const res = await propertiesAPI.updateProperty(id, formDataObj);
      if (res.success) {
        if (pendingVideos[0]) {
          setVideoProgress(0);
          await uploadVideoInChunks({
            propertyId: id,
            file: pendingVideos[0],
            onProgress: setVideoProgress,
          });
        }
        setProperties((prev) =>
          prev.map((prop) => (prop._id === id ? { ...res.data } : prop))
        );
        notifySuccess(res.message || "Property updated successfully");
        refreshList();
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
        refreshList();
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
          refreshList();
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

    const remainingSlots = 20 - (existingImages.length + images.length);

    if (remainingSlots <= 0) {
      notifyWarning("You can only have a maximum of 20 images per property.");
      e.target.value = "";
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

    setImages((prev) => [
      ...prev,
      ...validFiles.map((file) => {
        file.preview = URL.createObjectURL(file);
        return file;
      }),
    ]);
    e.target.value = "";
  };

 const handleVideoUpload = (e) => {
   const file = e.target.files[0];
   if (file) setVideos([file]);
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
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 15 * 1024 * 1024) {
      notifyWarning("Each image must be 15MB or smaller.");
      return;
    }
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
        v.key === oldKey || v.masterKey === oldKey
          ? {
              ...v,
              preview: URL.createObjectURL(file),
              masterProxyUrl: "",
            }
          : v
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
      setVideoProgress(0);
      const res = await uploadVideoInChunks({
        propertyId,
        file: videos[0],
        onProgress: setVideoProgress,
      });
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

  const handleRefreshVideoStatus = async (propertyId) => {
    try {
      const response = await propertiesAPI.checkVideoStatus(propertyId);
      if (response.success) {
        const updatedVideos = response.data.videos;

        setProperties((prev) =>
          prev.map((prop) =>
            prop._id === propertyId ? { ...prop, videos: updatedVideos } : prop
          )
        );

        notifySuccess("Video status refreshed successfully");
      } else {
        notifyError(response.message || "Failed to refresh video status");
      }
    } catch (error) {
      notifyError("Failed to refresh video status");
    }
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

  if (showDeleted) {
    tableHeader.push({ label: "Deleted By", key: "deletedBy.name" });
    tableHeader.push({
      label: "Deleted At",
      key: "deletedAt",
      dataFormat: "date",
    });
  } else {
    tableHeader.push({ label: "Created By", key: "createdBy.name" });
    tableHeader.push({ label: "Video Status", key: "videos[0].videoStatus" });
  }

  // Video is not completed yet, so hide edit button
  const isVideoCompleted = () => true;

  // refresh button for video status visible
  const isRefreshVisible = (property) => {
    return property.videos && property.videos[0]?.videoStatus !== "completed" &&  property.videos[0]?.videoStatus !== "failed" && property.videos[0]?.videoStatus !== undefined && property.videos[0]?.videoStatus !== "error";
  };

  const enableMobileView = location.pathname !== "/";

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  return (
    <div className="space-y-6">
      {/* Only initial load spinner */}
      {loading && properties.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
          <p className="mt-2 text-muted">
            Loading properties...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg">
          {error}
          <button
            aria-label="Try Again to fetch the property"
            onClick={() => fetchProperties({ initial: properties.length === 0 })}
            className="ml-4 underline hover:text-brand"
          >
            Try Again
          </button>
        </div>
      ) : (
        <TableUtil
          tableData={showDeleted ? deletedProperties : properties}
          tableHeader={tableHeader}
          tableName={
            showDeleted
              ? `Deleted Properties(${count})`
              : `Property Management(${count})`
          }
          searchKeys={["title", "createdBy.name", "updatedBy.name"]}
          isServerPaginated={true} // Must be true
          currentPage={page} // Controlled current page
          rowsPerPage={limit} // controlled rows per page
          totalPages={totalPages} // total pages from server
          onPageChange={setPage} // Trigger to change page
          onRowsPerPageChange={setLimit}
          onSearchChange={setSearchText}
          onSortChange={setSortConfig}
          infiniteScrollOnMobile
          isLoadingMore={loadingMore}
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
                  ? (setShowDeleted(false), setPage(1))
                  : setShowForm(true),
              btnClass:
                "flex items-center space-x-2 px-4 py-2 bg-brand hover:opacity-90 text-brand-fg rounded-lg transition-colors",
            },
            ...(!showDeleted
              ? [
                  {
                    label: "Deleted Properties",
                    icon: Trash2,
                    onClick: () => {
                      setShowDeleted(true);
                      setPage(1);
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
                    btnTitle: "Edit",
                    btnClass: "text-blue-400",
                    iconComponent: Edit,
                    isVisible: (property) => isVideoCompleted(property),
                    btnAction: (property) => handleEdit(property),
                  },
                  {
                    btnTitle: "Refresh",
                    btnClass: "text-purple-400",
                    iconComponent: RotateCcw,
                    isVisible: (property) => isRefreshVisible(property),
                    btnAction: (property) =>
                      handleRefreshVideoStatus(property._id),
                  },
                  {
                    btnTitle: "Delete",
                    btnClass: "text-red-400",
                    iconComponent: Trash2,
                    btnAction: (property) => handleDelete(property._id),
                  },
                ]
          }
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60]">
          <div className="bg-surface w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:max-w-4xl sm:m-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 sm:p-6 border-b border-line shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-fg">
                {editingProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                aria-label="Close Property Form"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-muted hover:text-fg p-2 -mr-2"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-6">
              <DynamicForm
                formData={formData}
                onChange={(updatedData) => {
                  setFormData(updatedData);
                }}
                errors={errors}
              />

              {/* Media Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-fg">Photos & video</h3>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-muted">
                      Photos
                    </label>
                    <span className="text-xs text-muted">
                      {existingImages.length + images.length} / 20
                    </span>
                  </div>

                  {(existingImages.length > 0 || images.length > 0) && (
                    <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {existingImages.map((image, index) => (
                        <div
                          key={image.key || index}
                          className="overflow-hidden rounded-lg border border-line bg-raised"
                        >
                          <div className="relative">
                            <img
                              src={image.preview || image.presignUrl}
                              alt={`Property photo ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            {image.preview && (
                              <span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-brand-fg">
                                Replaced
                              </span>
                            )}
                          </div>
                          <div className="flex border-t border-line text-xs">
                            <label className="flex-1 cursor-pointer py-1.5 text-center text-fg hover:bg-surface">
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
                              aria-label="Remove the Image"
                              onClick={() =>
                                removeExistingImage(
                                  image.key || image.id,
                                  index
                                )
                              }
                              className="flex-1 border-l border-line py-1.5 text-red-600 hover:bg-surface"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {images.map((img, index) => (
                        <div
                          key={`new-${index}`}
                          className="overflow-hidden rounded-lg border border-line bg-raised"
                        >
                          <div className="relative">
                            <img
                              src={img.preview}
                              alt={`New upload ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-brand-fg">
                              New
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove the Image"
                            onClick={() => removeImage(index)}
                            className="w-full border-t border-line py-1.5 text-xs text-red-600 hover:bg-surface"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {existingImages.length + images.length < 20 ? (
                    <div className="border-2 border-dashed border-line rounded-lg p-4">
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
                        className="flex flex-col items-center justify-center cursor-pointer text-muted"
                      >
                        <Upload className="w-8 h-8 mb-2" />
                        Click to add photos
                        <span className="mt-1 text-xs">
                          Up to 20 images, 15MB each
                        </span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Maximum of 20 photos reached. Remove one to add another.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Video
                  </label>

                  {existingVideos.some((v) => v.masterProxyUrl || v.preview) ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingVideos.map((video, index) => (
                        <NeonVideoPlayer
                          key={video.key || video.id || index}
                          src={
                            video.preview ||
                            (video.masterProxyUrl
                              ? `${API}${video.masterProxyUrl}`
                              : "")
                          }
                          className="aspect-video"
                          fullScreen={false}
                          showQualityNotice={false}
                          canEdit={
                            user?.role === "admin" ||
                            user?.role === "super_admin"
                          }
                          onReplace={(file) =>
                            handleReplaceVideo(
                              { target: { files: [file] } },
                              video.masterKey || video.id
                            )
                          }
                          onDelete={() =>
                            removeExistingVideo(
                              video.masterKey || video.id,
                              index
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : existingVideos.some((v) =>
                      ["uploading", "queued", "processing"].includes(
                        v.videoStatus
                      )
                    ) ? (
                    <div className="mt-2 rounded-lg border border-line bg-surface/60 p-4 text-sm text-muted">
                      <p>
                        Video is {existingVideos[0]?.videoStatus || "processing"}.
                        Wait for it to finish, or remove it to upload a new one.
                      </p>
                      <button
                        type="button"
                        className="mt-3 rounded-md bg-red-600 px-3 py-2 text-white"
                        onClick={() =>
                          removeExistingVideo(
                            existingVideos[0]?.masterKey ||
                              existingVideos[0]?.key ||
                              "__pending_video__",
                            0
                          )
                        }
                      >
                        Remove video
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-line rounded-lg p-4 mt-2">
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
                        <Upload className="w-8 h-8 text-muted mb-2" />
                        <span>Click to upload video</span>
                        <span className="text-xs text-muted mt-1">
                          Uploaded in chunks · processed as 480p, 720p and 1080p
                        </span>
                      </label>
                    </div>
                  )}

                  {videoProgress !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Uploading video…</span>
                        <span>{videoProgress}%</span>
                      </div>
                      <div className="h-2 bg-raised rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-300"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 🆕 New Videos Preview (before upload) */}
                  {videos.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((vid, index) => (
                        <NeonVideoPlayer
                          key={index}
                          src={URL.createObjectURL(vid)}
                          fullScreen={false}
                          canEdit={true}
                          onDelete={() => removeVideo(index)}
                          onReplace={(file) => replaceVideo(file, index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="shrink-0 border-t border-line px-4 py-3 sm:px-6 bg-surface flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  aria-label="Close Property Form"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-raised hover:bg-line text-fg rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  aria-label="Save Property"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand hover:opacity-90 text-brand-fg rounded-lg disabled:opacity-60"
                >
                  {isSubmitting
                    ? videoProgress !== null
                      ? `Uploading video ${videoProgress}%`
                      : "Saving..."
                    : "Save"}
                </button>
              </div>

              {errors.submit && (
                <p className="text-red-500 px-4 pb-2">{errors.submit}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProperty && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60]">
          <div className="bg-surface w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:max-w-5xl sm:m-4 flex flex-col overflow-hidden border border-line">
            <div className="flex justify-between items-center px-4 py-3 sm:p-6 border-b border-line shrink-0">
              <h3 className="text-lg sm:text-2xl font-bold text-fg truncate pr-2">
                Property Details
              </h3>
              <button
                aria-label="Close Property Details"
                onClick={() => setViewingProperty(null)}
                className="text-muted hover:text-fg p-2 -mr-2 shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-4 text-fg">
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
                        src={
                          vid.preview ||
                          (vid.masterProxyUrl
                            ? `${API}${vid.masterProxyUrl}`
                            : vid.presignUrl || "")
                        }
                        poster={vid.thumbnail}
                        fullScreen={false}
                        canEdit={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-line px-4 py-3 sm:px-6">
              <button
                aria-label="Close Property Details"
                onClick={() => setViewingProperty(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand hover:opacity-90 text-brand-fg font-semibold rounded-lg"
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