import { PropsWithChildren, createContext, useContext, useMemo } from 'react'

import { ToolManager } from '../core/tools/toolManager'

export type ToolContextType = {
  getToolManager: () => Promise<ToolManager>
}

const ToolContext = createContext<ToolContextType | null>(null)

export function ToolProvider({
  getToolManager,
  children,
}: PropsWithChildren<{ getToolManager: () => Promise<ToolManager> }>) {
  const value = useMemo(() => {
    return { getToolManager }
  }, [getToolManager])

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>
}

export function useTools() {
  const context = useContext(ToolContext)
  if (!context) {
    throw new Error('useTools must be used within a ToolProvider')
  }
  return context
}
