import React, { useState, useRef, useEffect } from 'react';

export const Popover = ({ children }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trigger = React.Children.toArray(children).find(
    child => child.type === PopoverTrigger
  );

  const content = React.Children.toArray(children).find(
    child => child.type === PopoverContent
  );

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div ref={popoverRef} className="absolute z-50 mt-1">
          {content}
        </div>
      )}
    </div>
  );
};

export const PopoverTrigger = ({ children, asChild = false, className = '' }) => {
  return asChild ? (
    React.cloneElement(React.Children.only(children), { className })
  ) : (
    <button className={className}>{children}</button>
  );
};

export const PopoverContent = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-md shadow-lg p-2 ${className}`}>
      {children}
    </div>
  );
};