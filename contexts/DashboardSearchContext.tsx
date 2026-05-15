'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type DashboardSearchContextValue = {
  navFilter: string;
  setNavFilter: (value: string) => void;
};

const DashboardSearchContext = createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [navFilter, setNavFilter] = useState('');
  const value = useMemo(() => ({ navFilter, setNavFilter }), [navFilter]);
  return <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>;
}

export function useDashboardSearch() {
  const ctx = useContext(DashboardSearchContext);
  if (!ctx) {
    throw new Error('useDashboardSearch must be used within DashboardSearchProvider');
  }
  return ctx;
}
