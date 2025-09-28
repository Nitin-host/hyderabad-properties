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
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="border border-gray-600 rounded px-2 py-2 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="border border-gray-600 rounded px-2 py-2 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <PhoneInputDropdown
          allowedCountries={"IN"}
          onChange={(data) => {
            setFormData((prev) => ({ ...prev, phone: data.phone }));
          }}
        />
        <select
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
          required
          className="border border-gray-600 rounded px-2 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select Property Type
          </option>
          {propertyOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white rounded px-2 py-2 hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ContactPage;