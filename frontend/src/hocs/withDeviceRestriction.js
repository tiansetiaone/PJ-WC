import React from 'react';
import { useDeviceRestriction } from '../hooks/useDeviceRestriction';
import MobileRestriction from '../components/MobileRestriction';

const withDeviceRestriction = (WrappedComponent) => {
  return (props) => {
    const isMobile = useDeviceRestriction();

    if (isMobile) {
      return <MobileRestriction />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDeviceRestriction;