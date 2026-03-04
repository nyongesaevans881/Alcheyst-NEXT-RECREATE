import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from './storage';
import profilesReducer from './features/profiles/profilesSlice';
import profileDetailsReducer from './features/profiles/profileDetailsSlice';
import uiReducer from './features/ui/uiSlice';

const isClient = typeof window !== 'undefined';

// Persist configuration for profiles
const profilesPersistConfig = {
  key: 'profiles',
  storage,
  whitelist: ['allProfiles', 'lastFetchTime', 'filteredProfiles', 'filteredSpas'],
  timeout: 300000,
};

// Persist configuration for profile details (cache individual profiles)
const profileDetailsPersistConfig = {
  key: 'profileDetails',
  storage,
  whitelist: ['profileCache'],
  timeout: 300000,
};

// Persist configuration for UI
const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['filters', 'selectedCounty'],
};

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // @ts-expect-error - persistReducer adds _persist to state type, causing type mismatch in conditional
      profiles: isClient
        ? persistReducer(profilesPersistConfig, profilesReducer)
        : profilesReducer,
      // @ts-expect-error - persistReducer adds _persist to state type, causing type mismatch in conditional
      profileDetails: isClient
        ? persistReducer(profileDetailsPersistConfig, profileDetailsReducer)
        : profileDetailsReducer,
      // @ts-expect-error - persistReducer adds _persist to state type, causing type mismatch in conditional
      ui: isClient ? persistReducer(uiPersistConfig, uiReducer) : uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });

  return store;
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Export function to create persistor (called from client-side only)
export const createPersistor = (appStore: AppStore) => {
  if (!isClient) return null;
  return persistStore(appStore);
};
