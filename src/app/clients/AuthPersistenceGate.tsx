'use client';

import type { ReactNode } from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import { useClientReady } from '@/hooks/useClientReady';
import { persistor } from '@/store';

export default function AuthPersistenceGate({ children }: { children: ReactNode }) {
  const isClientReady = useClientReady();
  if (!isClientReady) return <RouteLoadingFallback />;

  return (
    <PersistGate loading={<RouteLoadingFallback />} persistor={persistor}>
      {children}
    </PersistGate>
  );
}
