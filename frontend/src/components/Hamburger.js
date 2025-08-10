import React from 'react';

const Hamburger = ({ onClick, isOpen }) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Penting untuk mencegah bubbling
    onClick(e);
  };

  return (
    <button 
      className={`hamburger ${isOpen ? 'open' : ''}`} 
      onClick={handleClick}
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
};

export default Hamburger;