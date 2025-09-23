import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Edit } from 'lucide-react';
import { propertiesAPI } from '../services/api';
import DynamicForm from './DynamicForm';
import { formHelpers } from '../config/propertyFormConfig';

const PropertyManagement = ({ properties: propProperties, onAddProperty, onEditProperty, onDeleteProperty }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState(() => formHelpers.getInitialFormData());
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState(propProperties || []);
  const [loading, setLoading] = useState(!propProperties);
  const [error, setError] = useState(null);

  // Configuration is now handled by propertyFormConfig

  // Fetch properties if not provided as props
  useEffect(() => {
    if (!propProperties) {
      fetchProperties();
    }
  }, [propProperties]);

  // Set form data when editing property
  useEffect(() => {
    if (editingProperty) {
      setFormData(formHelpers.getInitialFormData(editingProperty));
      setExistingImages(editingProperty.images || []);
      setExistingVideos(editingProperty.videos || []);
    }
  }, [editingProperty]);
  
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
      console.error('Error fetching properties:', err);
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
    setErrors({});
    setEditingProperty(null);
    setShowForm(false);
  };
  
  const handleAddProperty = async (propertyData) => {
    try {
      const res = await propertiesAPI.createProperty(propertyData);
      if (res.success) {
        await handleMediaUpload(res.data._id); // upload media if needed
        await fetchProperties(); // <-- fetch updated list
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
      const res = await propertiesAPI.updateProperty(id, propertyData);
      if (res.success) {
        await handleMediaUpload(id); // upload media if needed
        await fetchProperties(); // <-- fetch updated list
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
        // If props callback exists, use it
        if (onDeleteProperty) {
          onDeleteProperty(id);
        } else {
          // Otherwise update local state
          setProperties(prev => prev.filter(p => p._id !== id));
        }
        return { success: true };
      }
      return { success: false, error: response.message || 'Failed to delete property' };
    } catch (err) {
      console.error('Error deleting property:', err);
      return { success: false, error: err.message || 'An error occurred while deleting property' };
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          images: 'Please select valid image files (max 5MB each)'
        }));
      }
      return isValid;
    });
    setImages(prev => [...prev, ...validFiles]);
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]; // only take first file
    if (!file) return;

    const isValid = file.type.startsWith("video/");

    if (!isValid) {
      setErrors((prev) => ({
        ...prev,
        videos: "Please select a valid video file",
      }));
      return;
    }

    // replace any existing video with the new one
    setVideos([file]);

    // clear error if valid
    if (errors.videos) {
      setErrors((prev) => ({ ...prev, videos: "" }));
    }
  };


  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId, index) => {
    try {
      if (editingProperty && imageId) {
        await propertiesAPI.deleteImage(editingProperty.id, imageId);
      }
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing image:', error);
      setErrors(prev => ({ ...prev, images: 'Failed to remove image' }));
    }
  };

  const removeExistingVideo = async (videoId, index) => {
    try {
      if (editingProperty && videoId) {
        await propertiesAPI.deleteVideo(editingProperty.id, videoId);
      }
      setExistingVideos(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing video:', error);
      setErrors(prev => ({ ...prev, videos: 'Failed to remove video' }));
    }
  };

  const validateForm = () => {
    const newErrors = formHelpers.validateForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMediaUpload = async (propertyId) => {
    if (images.length > 0) {
      const imageForm = new FormData();
      images.forEach((img) => imageForm.append("images", img));
      await propertiesAPI.uploadImages(propertyId, imageForm);
    }
    if (videos.length > 0) {
      const videoForm = new FormData();
      videos.forEach((v) => videoForm.append("video", v));
      await propertiesAPI.uploadVideos(propertyId, videoForm);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        bedrooms: formData.bedrooms,
        bathrooms: parseInt(formData.bathrooms) || 0,
        totalFloors: parseInt(formData.totalFloors) || null,
        maintenance: parseFloat(formData.maintenance) || null,
        amenities: formData.amenities,
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

      // After create/update, fetch latest properties
      await fetchProperties();

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving property:", error);
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
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const result = await handleDeleteProperty(propertyId);
        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        alert(error.message || 'Failed to delete property');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Property Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Property</span>
        </button>
      </div>

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {properties.map((property) => (
                <tr key={property._id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700 mr-4">
                        {property.images &&
                          property.images[0]?.cloudinaryUrl && (
                            <img
                              src={property.images[0].cloudinaryUrl}
                              alt={property.title}
                              className="h-10 w-10 object-cover rounded"
                            />
                          )}
                      </div>
                      <div className="text-sm font-medium text-white">
                        {property.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {property.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ₹{property.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {property.propertyType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(property)}
                      className="text-blue-500 hover:text-blue-400 mr-4"
                    >
                      <Edit size={16}/>
                    </button>
                    <button
                      onClick={() => handleDelete(property._id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              {/* Dynamic Form Fields */}
              <DynamicForm
                formData={formData}
                onChange={setFormData}
                errors={errors}
              />

              {/* Media Upload */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2">
                  Media
                </h4>

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
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-400">
                        Click to upload images
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Max 5MB per image
                      </span>
                    </label>
                  </div>
                  {errors.images && (
                    <p className="text-red-400 text-sm mt-1">{errors.images}</p>
                  )}

                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        Existing Images
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.cloudinaryUrl || image.url}
                              alt={`Property ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeExistingImage(image.id, index)
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
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        New Images
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`New ${index + 1}`}
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
                      multiple={false}
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-400">
                        Click to upload videos
                      </span>
                    </label>
                  </div>
                  {errors.videos && (
                    <p className="text-red-400 text-sm mt-1">{errors.videos}</p>
                  )}

                  {/* Existing Videos */}
                  {existingVideos.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        Existing Videos
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {existingVideos.map((video, index) => (
                          <div key={index} className="relative">
                            <video
                              src={video.cloudinaryUrl || video.url}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeExistingVideo(video.id, index)
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

                  {/* New Videos Preview */}
                  {videos.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        New Videos
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video, index) => (
                          <div key={index} className="relative">
                            <video
                              src={URL.createObjectURL(video)}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
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
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingProperty
                    ? "Update Property"
                    : "Add Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;