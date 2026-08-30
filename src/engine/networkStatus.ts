/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Network Status & Online Connectivity Engine for TinT
 * Provides reactive online/offline detection without requiring page refreshes.
 */

import { useState, useEffect } from 'react';

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine !== false;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => isOnline());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
