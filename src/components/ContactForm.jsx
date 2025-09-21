// src/components/StickyContactForm.jsx
import React, { useState } from "react";
import { Contact, X } from "lucide-react"; // For close icon, install lucide-react: npm i lucide-react
import PhoneInputDropdown from "../util/PhoneNumberDropdown";
import api from "../services/api";

const StickyContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "",  propertyType: "" });

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
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    try{
        api.post('/contact', formData);
        alert("Thank you! We will contact you soon.");
        setFormData({ name: "", email: "", phone: "",  propertyType: "" });
        setIsOpen(false);
    }catch(err){
        alert(err.message);
    }
  };

  return (
    <>
      {/* Contact Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition z-50"
        >
          <Contact size={16}/>
        </button>
      )}

      {/* Contact Form */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white shadow-lg rounded-lg p-4 w-80 z-50">
          {/* Close Button */}
          <div className="flex justify-between">
             <h3 className="text-lg font-semibold mb-2">Contact Us</h3> 
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              className="border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <PhoneInputDropdown
                allowedCountries={'IN'}
                onChange={(data) => {
                     setFormData((prev) => ({ ...prev, phone: data.phone }));
                  }}
            />
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
              className="border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 transition mt-2"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default StickyContactForm;
