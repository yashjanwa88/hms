/**
 * React Query Configuration and Setup
 * Centralized state management for data fetching, caching, and synchronization
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 2 minutes (data considered fresh for 2 minutes)
      staleTime: 2 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
      // Retry delay
      retryDelay: 1000,
    },
  },
});

// Query keys for cache management
export const queryKeys = {
  // Patient queries
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.patients.lists(), filters] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
    search: (term: string) => [...queryKeys.patients.all, 'search', term] as const,
  },
  
  // Laboratory queries
  laboratory: {
    all: ['laboratory'] as const,
    investigations: {
      all: () => [...queryKeys.laboratory.all, 'investigations'] as const,
      lists: () => [...queryKeys.laboratory.investigations.all(), 'list'] as const,
      list: (filters: any) => [...queryKeys.laboratory.investigations.lists(), filters] as const,
      details: () => [...queryKeys.laboratory.investigations.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.laboratory.investigations.details(), id] as const,
    },
    requisitions: {
      all: () => [...queryKeys.laboratory.all, 'requisitions'] as const,
      lists: () => [...queryKeys.laboratory.requisitions.all(), 'list'] as const,
      list: (filters: any) => [...queryKeys.laboratory.requisitions.lists(), filters] as const,
      details: () => [...queryKeys.laboratory.requisitions.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.laboratory.requisitions.details(), id] as const,
    },
    results: {
      all: () => [...queryKeys.laboratory.all, 'results'] as const,
      lists: () => [...queryKeys.laboratory.results.all(), 'list'] as const,
      list: (filters: any) => [...queryKeys.laboratory.results.lists(), filters] as const,
      details: () => [...queryKeys.laboratory.results.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.laboratory.results.details(), id] as const,
    },
  },
  
  // Pharmacy queries
  pharmacy: {
    all: ['pharmacy'] as const,
    medicines: {
      all: () => [...queryKeys.pharmacy.all, 'medicines'] as const,
      lists: () => [...queryKeys.pharmacy.medicines.all(), 'list'] as const,
      list: (filters: any) => [...queryKeys.pharmacy.medicines.lists(), filters] as const,
      details: () => [...queryKeys.pharmacy.medicines.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.pharmacy.medicines.details(), id] as const,
    },
    inventory: {
      all: () => [...queryKeys.pharmacy.all, 'inventory'] as const,
      lists: () => [...queryKeys.pharmacy.inventory.all(), 'list'] as const,
      list: (filters: any) => [...queryKeys.pharmacy.inventory.lists(), filters] as const,
      lowStock: () => [...queryKeys.pharmacy.inventory.all(), 'low-stock'] as const,
      expiryAlerts: () => [...queryKeys.pharmacy.inventory.all(), 'expiry-alerts'] as const,
    },
  },
  
  // Appointment queries
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    availableSlots: (doctorId: string, date: string) => [...queryKeys.appointments.all, 'available-slots', doctorId, date] as const,
    doctors: () => [...queryKeys.appointments.all, 'doctors'] as const,
    patients: () => [...queryKeys.appointments.all, 'patients'] as const,
    types: () => [...queryKeys.appointments.all, 'types'] as const,
  },
  
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    analytics: () => [...queryKeys.dashboard.all, 'analytics'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
  },
  
  // Master data queries
  masterData: {
    all: ['master-data'] as const,
    patientTypes: () => [...queryKeys.masterData.all, 'patient-types'] as const,
    registrationTypes: () => [...queryKeys.masterData.all, 'registration-types'] as const,
    genders: () => [...queryKeys.masterData.all, 'genders'] as const,
    bloodGroups: () => [...queryKeys.masterData.all, 'blood-groups'] as const,
    countries: () => [...queryKeys.masterData.all, 'countries'] as const,
    states: (countryId?: string) => [...queryKeys.masterData.all, 'states', countryId] as const,
    cities: (stateId?: string) => [...queryKeys.masterData.all, 'cities', stateId] as const,
    departments: () => [...queryKeys.masterData.all, 'departments'] as const,
    specimenTypes: () => [...queryKeys.masterData.all, 'specimen-types'] as const,
    medicineCategories: () => [...queryKeys.masterData.all, 'medicine-categories'] as const,
    medicineTypes: () => [...queryKeys.masterData.all, 'medicine-types'] as const,
    uoms: () => [...queryKeys.masterData.all, 'uoms'] as const,
  },
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate queries
  invalidateQueries: (queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
  },
  
  // Refetch queries
  refetchQueries: (queryKey: any[]) => {
    queryClient.refetchQueries({ queryKey });
  },
  
  // Remove queries from cache
  removeQueries: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Set query data
  setQueryData: (queryKey: any[], data: any) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get query data
  getQueryData: (queryKey: any[]) => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Prefetch queries
  prefetchQuery: async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};

// React Query Provider Component
interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ children }) => {
  const isDevelopment = import.meta.env.DEV;
  
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
    isDevelopment
      ? React.createElement(ReactQueryDevtools, { initialIsOpen: false })
      : null
  );
};
