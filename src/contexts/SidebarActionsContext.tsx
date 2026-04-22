import { createContext, useContext } from "react";

interface SidebarActions {
  openImport: () => void;
  logout: () => void;
}

const SidebarActionsContext = createContext<SidebarActions | null>(null);

export function SidebarActionsProvider({
  value,
  children,
}: {
  value: SidebarActions;
  children: React.ReactNode;
}) {
  return (
    <SidebarActionsContext.Provider value={value}>
      {children}
    </SidebarActionsContext.Provider>
  );
}

export function useSidebarActions() {
  const ctx = useContext(SidebarActionsContext);
  if (!ctx) {
    throw new Error("useSidebarActions must be used within SidebarActionsProvider");
  }
  return ctx;
}
