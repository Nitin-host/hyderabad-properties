import { Facebook, Instagram, Youtube } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/RR_PROP_LOGO.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-12">
        {/* Branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <img
            src={logo}
            alt="RR Properties Logo"
            className="h-16 w-auto object-contain mb-4"
          />
          <p className="text-sm text-gray-400">
            Helping you find your perfect home in Hyderabad.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-lg">
            Quick Links
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="hover:text-white transition-colors duration-200"
              >
                Properties
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors duration-200"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/favorites"
                className="hover:text-white transition-colors duration-200"
              >
                Favorites
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-lg">
            Contact Us
          </h4>
          <p className="text-sm text-gray-400 mb-2">
            Kondapur, Hyderabad, India
          </p>
          <p className="text-sm">
            Phone:{" "}
            <a
              href="tel:+919959120077"
              className="hover:text-white transition-colors duration-200"
            >
              +91 9959120077
            </a>
          </p>
          <p className="text-sm">
            Email:{" "}
            <a
              href="mailto:rakesh9959120077@gmail.com"
              className="hover:text-white transition-colors duration-200"
            >
              rakesh9959120077@gmail.com
            </a>
          </p>
        </div>

        {/* Social & Legal */}
        <div className="flex flex-col items-center md:items-end justify-between">
          <div className="flex space-x-4">
            <a
              href="https://instagram.com/hyderabad_properties_for_rent"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-800 hover:bg-pink-600 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com/profile.php?id=61560207062687"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-800 hover:bg-blue-600 transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com/@RakeshB-jx2cm"
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-800 hover:bg-red-600 transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/9959120077?text=Hi%20there!%20I%20have%20a%20query."
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-800 hover:bg-green-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gray-300 group-hover:text-white"
              >
                <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            &copy; {new Date().getFullYear()} RR Properties. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}