import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'admin' | 'agent';

interface RoleContextValue {
  role: UserRole;
  setRole: (value: UserRole) => void;
  isAdmin: boolean;
  isAgent: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'agent';
    const stored = window.localStorage.getItem('dashboardRole');
    return stored === 'admin' ? 'admin' : 'agent';
  });

  useEffect(() => {
    window.localStorage.setItem('dashboardRole', role);
  }, [role]);

  const setRole = (value: UserRole) => setRoleState(value);

  const value = useMemo(
    () => ({ role, setRole, isAdmin: role === 'admin', isAgent: role === 'agent' }),
    [role]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};
