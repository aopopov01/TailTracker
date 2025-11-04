/**
 * useNetworkStatus Hook
 */

import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');

  useEffect(() => {
    // Mock implementation
    setIsOnline(true);
    setConnectionType('wifi');
  }, []);

  return { isOnline, connectionType };
};
