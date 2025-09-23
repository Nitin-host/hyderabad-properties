import { Label } from "recharts";

// Property Management Form Configuration
export const propertyFormConfig = {
  // Basic form structure
  sections: [
    {
      id: "basic",
      title: "Basic Information",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Property Title",
          required: true,
          placeholder: "Enter property title",
          validation: { minLength: 3, maxLength: 100 },
        },
        {
          name: "propertyType",
          type: "select",
          label: "Property Type",
          required: true,
          options: [
            { value: "Standalone", label: "Standalone" },
            { value: "Gated Community", label: "Gated Community" },
            { value: "Apartment", label: "Apartment" },
            { value: "Villa", label: "Villa" },
            { value: "Independent House", label: "Independent House" },
            { value: "Plot", label: "Plot" },
            { value: "Commercial", label: "Commercial" },
            { value: "Office Space", label: "Office Space" },
            { value: "Other", label: "Other" },
          ],
        },
        {
          name: "price",
          type: "number",
          label: "Monthly Rent (₹)",
          required: true,
          placeholder: "Enter price",
          validation: { min: 0 },
        },
        {
          name: "maintenance",
          type: "number",
          label: "Maintenance (₹/month)",
          placeholder: "Monthly maintenance cost",
          validation: { min: 0 },
        },
        {
          name: "location",
          type: "text",
          label: "Location",
          required: true,
          placeholder: "Enter location",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          name: "landmarks",
          type: "textarea",
          label: "Landmarks",
          placeholder: "Enter nearby landmarks",
          validation: { maxLength: 500 },
          rows: 3,
        },
      ],
    },
    {
      id: "details",
      title: "Property Details",
      fields: [
        {
          name: "bedrooms",
          type: "select",
          label: "Bedrooms",
          required: true,
          options: [
            { value: "1BHK", label: "1BHK" },
            { value: "2BHK", label: "2BHK" },
            { value: "3BHK", label: "3BHK" },
            { value: "4BHK", label: "4BHK" },
          ],
        },
        {
          name: "bathrooms",
          type: "number",
          label: "Bathrooms",
          required: true,
          placeholder: "Number of bathrooms",
          validation: { min: 0, max: 20 },
        },
        {
          name: "balconies",
          type: "select",
          label: "Balconies",
          options: [
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
          ],
        },
        {
          name: "size",
          type: "number",
          label: "Size (sq ft)",
          required: true,
          placeholder: "Total size in square feet",
          validation: { min: 0 },
        },
        {
          name: "totalFloors",
          type: "number",
          label: "Total Floors",
          placeholder: "Total floors in building",
          validation: { min: 1, max: 200 },
        },
        {
          name: "furnished",
          type: "select",
          label: "Furnished Status",
          options: [
            { value: "Fully Furnished", label: "Fully Furnished" },
            { value: "Semi Furnished", label: "Semi Furnished" },
            { value: "Unfurnished", label: "Unfurnished" },
          ],
        },
        {
          name: "parking",
          type: "select",
          label: "Parking Available",
          options: [
            { value: "bike", label: "Bike" },
            { value: "car", label: "Car" },
            { value: "car & bike", label: "Car & Bike" },
            { value: "none", label: "None" },
          ],
        },
        {
          name: "securityDeposit",
          type: "number",
          label: "Security Deposit",
          placeholder: "Enter security deposit amount",
          validation: { min: 0 },
        },
        {
          name: "flooring",
          type: "select",
          label: "Flooring Type",
          options: [
            { value: "Marble", label: "Marble" },
            { value: "Tiles", label: "Tiles" },
            { value: "Wooden", label: "Wooden" },
            { value: "Granite", label: "Granite" },
            { value: "Ceramic", label: "Ceramic" },
            { value: "Vitrified", label: "Vitrified" },
            { value: "Other", label: "Other" },
          ],
        },
        {
          name: "overlooking",
          type: "select",
          label: "Overlooking",
          options: [
            { value: "Main Road", label: "Main Road" },
            { value: "Garden", label: "Garden" },
            { value: "Park", label: "Park" },
            { value: "Pool", label: "Pool" },
            { value: "Club", label: "Club" },
            { value: "Other", label: "Other" },
          ],
        },
        {
          name: "ageOfConstruction",
          type: "select",
          label: "Age of Construction",
          options: [
            { value: "Newly Built", label: "Newly Built" },
            { value: "Under Construction", label: "Under Construction" },
            { value: "Less than 5 years", label: "Less than 5 years" },
            { value: "5-10 years", label: "5-10 years" },
            { value: "10-15 years", label: "10-15 years" },
            { value: "15-20 years", label: "15-20 years" },
            { value: "More than 20 years", label: "More than 20 years" },
          ],
        },
        {
          name: "additionalRooms",
          type: "select",
          label: "Additional Rooms",
          options: [
            { value: "Puja Room", label: "Puja Room" },
            { value: "Study Room", label: "Study Room" },
            { value: "Servant Room", label: "Servant Room" },
            { value: "Store Room", label: "Store Room" },
            { value: "Other", label: "Other" },
          ],
        },
        {
          name: "waterAvailability",
          type: "select",
          label: "Water Availability",
          options: [
            { value: "24 Hours Available", label: "24 Hours Available" },
            { value: "12 Hours Available", label: "12 Hours Available" },
            { value: "6 Hours Available", label: "6 Hours Available" },
            { value: "Limited Supply", label: "Limited Supply" },
            { value: "Borewell", label: "Borewell" },
            { value: "Corporation Water", label: "Corporation Water" },
            { value: "Both", label: "Both" },
          ],
        },
        {
          name: "statusOfElectricity",
          type: "select",
          label: "Electricity Status",
          options: [
            { value: "No/Rare Powercut", label: "No/Rare Powercut" },
            { value: "Frequent Powercut", label: "Frequent Powercut" },
            {
              value: "Power Backup Available",
              label: "Power Backup Available",
            },
            { value: "No Power Issues", label: "No Power Issues" },
            { value: "Generator Available", label: "Generator Available" },
          ],
        },
        {
          name: "lift",
          type: "number",
          label: "Number of Lifts",
          placeholder: "Enter number of lifts",
          validation: { min: 0 },
        },
        {
          name: "status",
          type: "select",
          label: "Property Status",
          required: true,
          options: [
            { value: "For Sale", label: "For Sale" },
            { value: "For Rent", label: "For Rent" },
            { value: "Sold", label: "Sold" },
            { value: "Rented", label: "Rented" },
            { value: "Under Contract", label: "Under Contract" },
            { value: "Available", label: "Available" },
            { value: "Occupied", label: "Occupied" },
          ],
        },
        {
          name: "availability",
          type: "radio-date",
          label: "Property Availability",
          options: [
            { value: "immediate", label: "Immediate" },
            { value: "date", label: "Select Date" },
          ],
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          required: true,
          placeholder: "Enter property description",
          rows: 4,
          colSpan: 2,
          validation: { minLength: 10, maxLength: 1000 },
        },
        {
          name: "listedBy",
          type: "select",
          label: "Listed By",
          required: true,
          options: [
            { value: "owner", label: "Owner" },
            { value: "agent", label: "Agent" },
          ],
          placeholder: "Select who is listing the property",
          colSpan: 1,
        },
        {
          name: "brokerCharge",
          type: "select",
          label: "Broker Charge",
          options: [
            { value: "20 Days", label: "20 Days Rent" },
            { value: "1 month", label: "One Month Rent" },
            { value: "no charge", label: "No Charge" },
            { value: "Contact for details", label: "Contact for Details" },
          ],
        },
      ],
    },
    {
      id: "amenities",
      title: "Amenities & Features",
      type: "checkbox-group",
      fields: [
        { name: "clubhouseGym", label: "Clubhouse Gym" },
        { name: "school", label: "School Nearby" },
        { name: "hospital", label: "Hospital Nearby" },
        { name: "mall", label: "Mall Nearby" },
        { name: "park", label: "Park Nearby" },
        { name: "balcony", label: "Balcony" },
        { name: "petFriendly", label: "Pet Friendly" },
        { name: "cupBoard", label: "Cupboard" },
        { name: "lift", label: "Lift/Elevator" },
        { name: "wifi", label: "WiFi" },
        { name: "ac", label: "Air Conditioning" },
        { name: "gym", label: "Gym" },
        { name: "swimmingPool", label: "Swimming Pool" },
        { name: "kidsPlayArea", label: "Kids Play Area" },
        { name: "clubHouse", label: "Club House" },
        { name: "intercom", label: "Intercom" },
        { name: "spa", label: "Spa" },
        { name: "servantRoom", label: "Servant Room" },
        { name: "security", label: "24x7 Security" },
        { name: "shoppingCenter", label: "Shopping Center" },
        { name: "gasConnection", label: "Gas Connection" },
        { name: "sewageConnection", label: "Sewage Connection" },
        { name: "rainWaterHarvesting", label: "Rain Water Harvesting" },
        { name: "houseKeeping", label: "House Keeping" },
        { name: "powerBackup", label: "Power Backup" },
        { name: "visitorParking", label: "Visitor Parking" },
        { name: "inductionHob", label: "Induction Hob" },
        { name: "privateGarden", label: "Private Garden" },
        { name: "caretaker", label: "Caretaker" },
        { name: "washingMachine", label: "Washing Machine" },
        { name: "gasLeakage", label: "Gas Leakage Detector" },
        { name: "earthquake", label: "Earthquake Resistant" },
        { name: "fireAlarm", label: "Fire Alarm" },
      ],
    },
  ],

  // Default form data structure
  defaultFormData: {
    title: "",
    description: "",
    price: "",
    location: "",
    propertyType: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    balconies: "",
    brokerCharge: "",
    totalFloors: "",
    furnished: "",
    listedBy: "",
    maintenance: "",
    parking: "",
    status: "Available",
    availability: "immediate", // default option
    availabilityDate: "", // only used if user selects date
    // Additional fields
    securityDeposit: "",
    landmarks: "",
    flooring: "",
    overlooking: "",
    ageOfConstruction: "",
    additionalRooms: "",
    waterAvailability: "",
    statusOfElectricity: "",
    lift: "",
    // Amenities (all default to false)
    clubhouseGym: false,
    school: false,
    hospital: false,
    mall: false,
    park: false,
    balcony: false,
    petFriendly: false,
    cupBoard: false,
    lift: false,
    wifi: false,
    ac: false,
    gym: false,
    swimmingPool: false,
    kidsPlayArea: false,
    clubHouse: false,
    intercom: false,
    spa: false,
    servantRoom: false,
    security: false,
    shoppingCenter: false,
    gasConnection: false,
    sewageConnection: false,
    rainWaterHarvesting: false,
    houseKeeping: false,
    powerBackup: false,
    visitorParking: false,
    inductionHob: false,
    privateGarden: false,
    caretaker: false,
    washingMachine: false,
    gasLeakage: false,
    earthquake: false,
    fireAlarm: false,
    amenities: [],
  },

  // Validation rules
  validationRules: {
    required: [
      "title",
      "description",
      "price",
      "location",
      "propertyType",
      "size",
      "bedrooms",
      "maintenance",
      "bathrooms",
      "status",
      "listedBy",
    ],
    numeric: [
      "price",
      "size",
      "bathrooms",
      "totalFloors",
      "maintenance",
      "securityDeposit",
      "lift",
    ],
    minLength: {
      title: 3,
      description: 10,
      location: 3,
    },
    maxLength: {
      title: 200,
      description: 2000,
      location: 200,
      landmarks: 500,
    },
    min: {
      price: 0,
      size: 0,
      bathrooms: 0,
      totalFloors: 1,
      maintenance: 0,
      securityDeposit: 0,
      lift: 0,
    },
    max: {
      bathrooms: 20,
      totalFloors: 50,
    },
    conditionalRequired: {
      availabilityDate: (formData) => formData.availability === "date",
    },
  },

  // Form styling classes
  styles: {
    container: "space-y-6",
    section: "space-y-4",
    sectionTitle: "text-lg font-semibold text-white mb-4",
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    fieldContainer: "space-y-1",
    label: "block text-sm font-medium text-gray-300 mb-1",
    input:
      "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    select:
      "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    textarea:
      "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    checkbox:
      "h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500",
    checkboxLabel: "ml-2 text-sm text-gray-300",
    checkboxContainer: "flex items-center",
    checkboxGrid: "grid grid-cols-2 md:grid-cols-3 gap-3",
    error: "text-red-400 text-sm mt-1",
    colSpan2: "md:col-span-2",
  },
};

// Helper functions for form operations
export const formHelpers = {
  // Get initial form data
  getInitialFormData: (editingProperty = null) => {
    if (editingProperty) {
      return {
        ...propertyFormConfig.defaultFormData,
        ...editingProperty,
        // Ensure amenities array is properly set
        amenities: editingProperty.amenities || []
      };
    }
    return { ...propertyFormConfig.defaultFormData };
  },

  // Validate form data
  validateForm: (formData) => {
    const errors = {};
    const { validationRules } = propertyFormConfig;

    // Helper function to get nested field value
    const getFieldValue = (fieldName) => {
      if (fieldName.includes(".")) {
        const parts = fieldName.split(".");
        let value = formData;
        for (const part of parts) {
          value = value?.[part];
        }
        return value;
      }
      return formData[fieldName];
    };

    // Check conditional required
    if (validationRules.conditionalRequired) {
      Object.entries(validationRules.conditionalRequired).forEach(
        ([field, condition]) => {
          if (condition(formData)) {
            const value = formData[field];
            if (!value || value.toString().trim() === "") {
              const displayName = field.includes(".")
                ? field.split(".").pop()
                : field;
              errors[field] = `${
                displayName.charAt(0).toUpperCase() + displayName.slice(1)
              } is required`;
            }
          }
        }
      );
    }

    // Check required fields
    validationRules.required.forEach((field) => {
      const value = getFieldValue(field);
      if (!value || value.toString().trim() === "") {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } is required`;
      }
    });

    // Check numeric fields
    validationRules.numeric.forEach((field) => {
      const value = getFieldValue(field);
      if (value && isNaN(Number(value))) {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } must be a number`;
      }
    });

    // Check min length
    Object.entries(validationRules.minLength).forEach(([field, minLen]) => {
      const value = getFieldValue(field);
      if (value && value.length < minLen) {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } must be at least ${minLen} characters`;
      }
    });

    // Check max length
    Object.entries(validationRules.maxLength).forEach(([field, maxLen]) => {
      const value = getFieldValue(field);
      if (value && value.length > maxLen) {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } must be no more than ${maxLen} characters`;
      }
    });

    // Check min values
    Object.entries(validationRules.min).forEach(([field, minVal]) => {
      const value = getFieldValue(field);
      if (value && Number(value) < minVal) {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } must be at least ${minVal}`;
      }
    });

    // Check max values
    Object.entries(validationRules.max).forEach(([field, maxVal]) => {
      const value = getFieldValue(field);
      if (value && Number(value) > maxVal) {
        const displayName = field.includes(".")
          ? field.split(".").pop()
          : field;
        errors[field] = `${
          displayName.charAt(0).toUpperCase() + displayName.slice(1)
        } must be no more than ${maxVal}`;
      }
    });

    return errors;
  },

  // Update amenities array based on checkbox changes
  updateAmenities: (formData, fieldName, checked) => {
    const amenities = [...(formData.amenities || [])];
    if (checked && !amenities.includes(fieldName)) {
      amenities.push(fieldName);
    } else if (!checked && amenities.includes(fieldName)) {
      const index = amenities.indexOf(fieldName);
      amenities.splice(index, 1);
    }
    return amenities;
  }
};