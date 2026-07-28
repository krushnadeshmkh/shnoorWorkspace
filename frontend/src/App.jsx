import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { useAuth } from './hooks/useAuth'

function App() {
  const { loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-navy border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading workspace...</p>
        </div>
      </div>
    )
  }
  
  return <AppRoutes />
}

export default App