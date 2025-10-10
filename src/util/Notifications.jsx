import React from "react";
import { createRoot } from "react-dom/client";
import { X } from "lucide-react";

let container;

const createContainer = () => {
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-root";
    container.className =
      "fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end";
    document.body.appendChild(container);
  }
  return container;
};

const Notification = ({ message, type = "success", duration = 3000 }) => {
  const notif = document.createElement("div");
  notif.className = `flex items-center justify-between px-4 py-2 rounded shadow-lg text-white ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-yellow-500"
  } opacity-0 transform translate-x-4 transition-all duration-300`;
  notif.innerHTML = `<span>${message}</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  closeBtn.className = "ml-2 cursor-pointer text-white";
  closeBtn.onclick = () => container.removeChild(notif);

  notif.appendChild(closeBtn);

  const container = createContainer();
  container.appendChild(notif);

  // Animate in
  setTimeout(() => {
    notif.classList.remove("opacity-0", "translate-x-4");
    notif.classList.add("opacity-100", "translate-x-0");
  }, 10);

  // Auto remove
  setTimeout(() => {
    notif.classList.add("opacity-0", "translate-x-4");
    setTimeout(() => container.removeChild(notif), 300);
  }, duration);
};

export const notifySuccess = (msg, duration) =>
  Notification({ message: msg, type: "success", duration });

export const notifyError = (msg, duration) =>
  Notification({ message: msg, type: "error", duration });

export const notifyWarning = (msg, duration) =>
  Notification({ message: msg, type: "warning", duration });
