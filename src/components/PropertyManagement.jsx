import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus, Edit } from "lucide-react";
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
      console.log("Update response:", res);
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
      // Log full formData to debug
      console.log("FormData before amenities filter:", formData);

      const amenitiesList = Array.isArray(formData.amenities)
        ? formData.amenities
        : [];
      console.log("Selected amenities from formData.amenities:", amenitiesList);

      // Prepare property data
      const propertyData = {
        ...formData,
        amenities: amenitiesList, // ensure it's an array
      };
      console.log("Submitting property data:", propertyData);

      if (editingProperty) {
        const result = await handleUpdateProperty(
          editingProperty._id,
          propertyData
        );
        console.log("Update result:", result);
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

  const enableMobileView = location.pathname !=="/";


  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading properties...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
          <button
            onClick={fetchProperties}
            className="ml-4 underline hover:text-white"
          >
            Try Again
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">No properties found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-blue-500 hover:text-blue-400"
          >
            Add your first property
          </button>
        </div>
      ) : (
        <TableUtil
          tableData={properties}
          tableHeader={tableHeader}
          tableName="Property Management"
          searchKeys={["title"]}
          createBtn={[
            {
              label: "Add Property",
              icon: Plus,
              onClick: () => setShowForm(true),
              btnClass:
                "flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors",
            },
          ]}
          enableMobileView={enableMobileView}
          tableActions={[
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
          ]}
        />
        // <div className="overflow-x-auto">
        // <table className="min-w-full divide-y divide-gray-700">
        //   <thead>
        //     <tr>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Property
        //       </th>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Location
        //       </th>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Price
        //       </th>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Type
        //       </th>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Status
        //       </th>
        //       <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
        //         Actions
        //       </th>
        //     </tr>
        //   </thead>
        //   <tbody className="divide-y divide-gray-700">
        //     {properties.map((property) => (
        //       <tr key={property._id} className="hover:bg-gray-800/50">
        //         <td className="px-6 py-4 whitespace-nowrap">
        //           <div className="flex items-center">
        //             <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700 mr-4">
        //               {property.images && property.images[0]?.presignUrl && (
        //                 <img
        //                   src={property.images[0].presignUrl}
        //                   alt={property.title}
        //                   className="h-10 w-10 object-cover rounded"
        //                 />
        //               )}
        //             </div>
        //             <div className="text-sm font-medium text-white">
        //               {property.title}
        //             </div>
        //           </div>
        //         </td>
        //         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        //           {property.location}
        //         </td>
        //         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        //           ₹{property.price.toLocaleString()}
        //         </td>
        //         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        //           {property.propertyType}
        //         </td>
        //         <td className="px-6 py-4 whitespace-nowrap text-sm">{property.status}</td>
        //         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        //           <button
        //             onClick={() => handleEdit(property)}
        //             className="text-blue-500 hover:text-blue-400 mr-4"
        //           >
        //             <Edit size={16} />
        //           </button>
        //           <button
        //             onClick={() => handleDelete(property._id)}
        //             className="text-red-500 hover:text-red-400"
        //           >
        //             <Trash2 size={16} />
        //           </button>
        //         </td>
        //       </tr>
        //     ))}
        //   </tbody>
        // </table>
        // </div>
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
                  console.log("DynamicForm changed:", updatedData);
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
    </div>
  );
};

export default PropertyManagement;