'use client';

import { useEffect, useState } from 'react';

export const useClientReady = () => {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  return isClientReady;
};
