'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore, AppStore, createPersistor } from '@/lib/store';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  const persistorRef = useRef<any>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    if (typeof window !== 'undefined') {
      persistorRef.current = createPersistor(storeRef.current);
    }
  }

  return (
    <Provider store={storeRef.current}>
      {persistorRef.current ? (
        <PersistGate loading={null} persistor={persistorRef.current}>
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  );
}
