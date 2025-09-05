import { useState, useEffect } from 'react';

export const useDeviceRestriction = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobileBreakpoint = 1024; // Sesuaikan dengan kebutuhan
      setIsMobile(window.innerWidth <= mobileBreakpoint);
    };

    // Check initially
    checkDevice();

    // Add event listener for window resize
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};