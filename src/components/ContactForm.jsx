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

  const fieldClass =
    "w-full border border-line rounded-lg px-4 py-3 bg-raised text-fg placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition";

  return (
    <div className="flex justify-center items-center px-4 py-10 min-h-screen bg-page">
      <div className="w-full max-w-2xl bg-surface text-fg rounded-2xl shadow-lg border border-line p-8 md:p-12">
        <h2 className="text-3xl font-extrabold text-center mb-6">
          Contact Us
        </h2>
        <p className="text-muted text-center mb-8">
          Fill in your details and we’ll get back to you shortly.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Phone Number</label>
            <PhoneInputDropdown
              allowedCountries={"IN"}
              onChange={(data) => {
                setFormData((prev) => ({ ...prev, phone: data.phone }));
              }}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Property Type</label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
              className={fieldClass}
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
          </div>

          <button
            type="submit"
            aria-label="Submit"
            className="w-full bg-brand hover:opacity-90 text-brand-fg font-semibold rounded-lg px-4 py-3 transition shadow-md"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
