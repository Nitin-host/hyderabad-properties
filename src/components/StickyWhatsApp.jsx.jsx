// src/components/StickyWhatsApp.jsx
import React from "react";
import Whatsapp from "../assets/whatsapp.svg"


const StickyWhatsApp = () => {
  const phoneNumber = "919703319865"; // Replace with your WhatsApp number
  const message = "Hi there! I have a query."; // Default message

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  const waLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition z-50"
    >
        <img src={Whatsapp} width={20} height={20}/>
    </a>
  );
};

export default StickyWhatsApp;
