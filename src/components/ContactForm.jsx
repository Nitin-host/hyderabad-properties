import React, { useState } from "react";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";
import api from "../services/api";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
  });

  const propertyOptions = [
    "Standalone",
    "Gated Community",
    "Apartment",
    "Villa",
    "Independent House",
    "Plot",
    "Commercial",
    "Office Space",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/contact", formData);
      alert("Thank you! We will contact you soon.");
      setFormData({ name: "", email: "", phone: "", propertyType: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 py-10 bg-gray-800 min-h-screen">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white rounded-2xl shadow-lg p-8 md:p-12">
        <h2 className="text-3xl font-extrabold text-center mb-6">
          Contact Us
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Fill in your details and we’ll get back to you shortly.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block mb-2 text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-2 text-sm font-medium">Phone Number</label>
            <PhoneInputDropdown
              allowedCountries={"IN"}
              onChange={(data) => {
                setFormData((prev) => ({ ...prev, phone: data.phone }));
              }}
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block mb-2 text-sm font-medium">Property Type</label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
              className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="" disabled>
                Select Property Type
              </option>
              {propertyOptions.map((type) => (
                <option key={type} value={type} className="text-black">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            aria-label="Submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition transform hover:scale-105 shadow-md"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;