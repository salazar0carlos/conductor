import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApiRequest,
  ApiResponse,
  Collection,
  Environment,
  RequestHistory,
} from './types';
import { createEmptyRequest, generateId } from './utils';

interface PlaygroundState {
  // Current request being edited
  currentRequest: ApiRequest;
  currentResponse: ApiResponse | null;
  isLoading: boolean;

  // Collections
  collections: Collection[];
  activeCollectionId: string | null;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;

  // History
  history: RequestHistory[];
  maxHistorySize: number;

  // Favorites
  favorites: string[]; // request IDs

  // UI State
  activeTab: 'request' | 'response' | 'code' | 'docs';
  sidebarTab: 'collections' | 'history' | 'environments';
  showSidebar: boolean;

  // Actions - Request
  setCurrentRequest: (request: ApiRequest) => void;
  updateCurrentRequest: (updates: Partial<ApiRequest>) => void;
  setCurrentResponse: (response: ApiResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetRequest: () => void;

  // Actions - Collections
  createCollection: (name: string, description?: string) => Collection;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  setActiveCollection: (id: string | null) => void;
  addRequestToCollection: (collectionId: string, request: ApiRequest) => void;
  updateRequestInCollection: (
    collectionId: string,
    requestId: string,
    updates: Partial<ApiRequest>
  ) => void;
  deleteRequestFromCollection: (collectionId: string, requestId: string) => void;
  loadRequestFromCollection: (collectionId: string, requestId: string) => void;

  // Actions - Environments
  createEnvironment: (name: string) => Environment;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;

  // Actions - History
  addToHistory: (request: ApiRequest, response?: ApiResponse) => void;
  clearHistory: () => void;
  loadFromHistory: (historyId: string) => void;

  // Actions - Favorites
  toggleFavorite: (requestId: string) => void;
  isFavorite: (requestId: string) => boolean;

  // Actions - UI
  setActiveTab: (tab: 'request' | 'response' | 'code' | 'docs') => void;
  setSidebarTab: (tab: 'collections' | 'history' | 'environments') => void;
  toggleSidebar: () => void;

  // Actions - Import/Export
  importCollection: (collection: Collection) => void;
  exportCollection: (collectionId: string) => Collection | null;
}

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentRequest: createEmptyRequest(),
      currentResponse: null,
      isLoading: false,
      collections: [],
      activeCollectionId: null,
      environments: [
        {
          id: 'default',
          name: 'Default',
          variables: [],
          isActive: true,
        },
      ],
      activeEnvironmentId: 'default',
      history: [],
      maxHistorySize: 50,
      favorites: [],
      activeTab: 'request',
      sidebarTab: 'collections',
      showSidebar: true,

      // Request actions
      setCurrentRequest: (request) => set({ currentRequest: request }),

      updateCurrentRequest: (updates) =>
        set((state) => ({
          currentRequest: { ...state.currentRequest, ...updates },
        })),

      setCurrentResponse: (response) => set({ currentResponse: response }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      resetRequest: () =>
        set({
          currentRequest: createEmptyRequest(),
          currentResponse: null,
        }),

      // Collection actions
      createCollection: (name, description) => {
        const collection: Collection = {
          id: generateId(),
          name,
          description,
          requests: [],
          folders: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          collections: [...state.collections, collection],
        }));
        return collection;
      },

      updateCollection: (id, updates) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id
              ? { ...col, ...updates, updatedAt: Date.now() }
              : col
          ),
        })),

      deleteCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((col) => col.id !== id),
          activeCollectionId:
            state.activeCollectionId === id ? null : state.activeCollectionId,
        })),

      setActiveCollection: (id) => set({ activeCollectionId: id }),

      addRequestToCollection: (collectionId, request) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  requests: [...col.requests, { ...request, id: generateId() }],
                  updatedAt: Date.now(),
                }
              : col
          ),
        })),

      updateRequestInCollection: (collectionId, requestId, updates) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  requests: col.requests.map((req) =>
                    req.id === requestId ? { ...req, ...updates } : req
                  ),
                  updatedAt: Date.now(),
                }
              : col
          ),
        })),

      deleteRequestFromCollection: (collectionId, requestId) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  requests: col.requests.filter((req) => req.id !== requestId),
                  updatedAt: Date.now(),
                }
              : col
          ),
        })),

      loadRequestFromCollection: (collectionId, requestId) => {
        const state = get();
        const collection = state.collections.find(
          (col) => col.id === collectionId
        );
        const request = collection?.requests.find((req) => req.id === requestId);
        if (request) {
          set({ currentRequest: { ...request }, currentResponse: null });
        }
      },

      // Environment actions
      createEnvironment: (name) => {
        const environment: Environment = {
          id: generateId(),
          name,
          variables: [],
          isActive: false,
        };
        set((state) => ({
          environments: [...state.environments, environment],
        }));
        return environment;
      },

      updateEnvironment: (id, updates) =>
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === id ? { ...env, ...updates } : env
          ),
        })),

      deleteEnvironment: (id) =>
        set((state) => ({
          environments: state.environments.filter((env) => env.id !== id),
          activeEnvironmentId:
            state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        })),

      setActiveEnvironment: (id) =>
        set((state) => ({
          environments: state.environments.map((env) => ({
            ...env,
            isActive: env.id === id,
          })),
          activeEnvironmentId: id,
        })),

      // History actions
      addToHistory: (request, response) =>
        set((state) => {
          const historyItem: RequestHistory = {
            id: generateId(),
            request,
            response,
            timestamp: Date.now(),
          };
          const newHistory = [historyItem, ...state.history];
          return {
            history: newHistory.slice(0, state.maxHistorySize),
          };
        }),

      clearHistory: () => set({ history: [] }),

      loadFromHistory: (historyId) => {
        const state = get();
        const historyItem = state.history.find((item) => item.id === historyId);
        if (historyItem) {
          set({
            currentRequest: { ...historyItem.request },
            currentResponse: historyItem.response || null,
          });
        }
      },

      // Favorites actions
      toggleFavorite: (requestId) =>
        set((state) => ({
          favorites: state.favorites.includes(requestId)
            ? state.favorites.filter((id) => id !== requestId)
            : [...state.favorites, requestId],
        })),

      isFavorite: (requestId) => get().favorites.includes(requestId),

      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),

      // Import/Export actions
      importCollection: (collection) =>
        set((state) => ({
          collections: [...state.collections, collection],
        })),

      exportCollection: (collectionId) => {
        const collection = get().collections.find(
          (col) => col.id === collectionId
        );
        return collection || null;
      },
    }),
    {
      name: 'api-playground-storage',
      partialize: (state) => ({
        collections: state.collections,
        environments: state.environments,
        history: state.history,
        favorites: state.favorites,
        activeEnvironmentId: state.activeEnvironmentId,
      }),
    }
  )
);
