import React from 'react';

export const Badge = ({ children, className }) => (
  <span className={`inline-block px-2 py-1 text-sm bg-gray-200 rounded ${className || ''}`}>
    {children}
  </span>
);


export const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded p-4 ${className || ''}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={`mt-2 ${className || ''}`}>
    {children}
  </div>
);