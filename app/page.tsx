"use client"

import { useAuth } from "@/contexts/AuthContext"
import { HomePage } from "@/components/public/HomePage"
import { RoleSelection } from "@/components/auth/RoleSelection"
import { OrganizerDashboard } from "@/components/dashboard/OrganizerDashboard"
import { AttendeeDashboard } from "@/components/dashboard/AttendeeDashboard"

export default function Home() {
  const { user, firebaseUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            EventHub
          </h2>
          <p className="text-gray-600">Loading your experience...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show public homepage
  if (!firebaseUser) {
    return <HomePage onAuthSuccess={() => window.location.reload()} />
  }

  // Authenticated but no role selected
  if (firebaseUser && !user?.role) {
    return <RoleSelection />
  }

  // Authenticated with role
  if (user?.role === "organizer") {
    return <OrganizerDashboard />
  }

  if (user?.role === "attendee") {
    return <AttendeeDashboard />
  }

  return <HomePage onAuthSuccess={() => window.location.reload()} />
}
