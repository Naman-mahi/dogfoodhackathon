"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0F172A",
          color: "#F8FAFC",
          border: "1px solid #1E293B",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "12px",
          padding: "10px 16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#080C16",
          },
          style: {
            border: "1px solid rgba(16, 185, 129, 0.3)",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#080C16",
          },
          style: {
            border: "1px solid rgba(239, 68, 68, 0.3)",
          },
        },
      }}
    />
  );
}
