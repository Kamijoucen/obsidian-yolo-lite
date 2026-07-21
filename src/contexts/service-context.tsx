import React, { createContext, useContext } from 'react'

import type { AcpSessionService } from '../core/acp/service'

const ServiceContext = createContext<AcpSessionService | null>(null)

export const ServiceProvider = ({
  children,
  service,
}: {
  children: React.ReactNode
  service: AcpSessionService
}) => {
  return (
    <ServiceContext.Provider value={service}>
      {children}
    </ServiceContext.Provider>
  )
}

export const useSessionService = () => {
  const service = useContext(ServiceContext)
  if (!service) {
    throw new Error('useSessionService must be used within a ServiceProvider')
  }
  return service
}
