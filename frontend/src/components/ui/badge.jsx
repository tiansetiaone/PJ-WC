import React from 'react';

export const Badge = ({ children, className }) => (
  <span className={`inline-block px-2 py-1 text-sm bg-gray-200 rounded ${className || ''}`}>
    {children}
  </span>
);
