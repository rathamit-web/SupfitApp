import React from 'react';


// Use import for the image asset (Vite/ESM compatible)

// Custom SVG icon inspired by the provided screenshot
const RevenueTrackerIcon = ({ size = 32, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    {/* Red base layer */}
    <rect x="8" y="48" width="48" height="8" rx="4" fill="#F25C4D" />
    {/* White platform */}
    <rect x="12" y="40" width="40" height="8" rx="4" fill="#fff" />
    {/* Yellow main cylinder */}
    <ellipse cx="32" cy="36" rx="12" ry="8" fill="#FFD23C" />
    <rect x="20" y="20" width="24" height="16" rx="12" fill="#FFD23C" />
    {/* Blue tall cylinder */}
    <ellipse cx="48" cy="28" rx="6" ry="4" fill="#3CCBFF" />
    <rect x="42" y="12" width="12" height="16" rx="6" fill="#3CCBFF" />
    {/* Orange cylinder */}
    <ellipse cx="40" cy="20" rx="8" ry="5" fill="#FF6B4D" />
    <rect x="32" y="8" width="16" height="12" rx="8" fill="#FF6B4D" />
    {/* Purple cylinder */}
    <ellipse cx="20" cy="28" rx="6" ry="4" fill="#A259E6" />
    <rect x="14" y="16" width="12" height="12" rx="6" fill="#A259E6" />
    {/* Teal small cylinder */}
    <ellipse cx="54" cy="36" rx="4" ry="3" fill="#3CD6C7" />
    <rect x="50" y="32" width="8" height="4" rx="4" fill="#3CD6C7" />
  </svg>
);

export default RevenueTrackerIcon;
