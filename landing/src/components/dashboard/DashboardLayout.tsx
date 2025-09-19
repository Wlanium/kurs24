'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardNavigation from './DashboardNavigation'

interface UserStats {
  subdomain?: string
  subdomainStatus: 'none' | 'provisioning' | 'active' | 'suspended'
  currentPlan: 'free' | 'basis' | 'pro'
  nextBilling?: string
  avatar?: string
  usage?: {
    apiCalls: number
    aiGenerations: number
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    subdomainStatus: 'none',
    currentPlan: 'free'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('🏗️ DashboardLayout useEffect triggered, status:', status, 'session:', !!session)
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Load user stats
    console.log('🏗️ DashboardLayout about to call loadUserStats()')
    loadUserStats()
  }, [session, status, router])

  const loadUserStats = async () => {
    try {
      console.log('🏗️ DashboardLayout loading user stats...')
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('🏗️ DashboardLayout received stats:', data)
        setStats({
          subdomain: data.subdomain,
          subdomainStatus: data.subdomainStatus,
          currentPlan: data.currentPlan,
          nextBilling: data.nextBilling,
          avatar: data.avatar,
          usage: data.usage
        })
        console.log('🏗️ DashboardLayout stats state updated:', {
          subdomain: data.subdomain,
          subdomainStatus: data.subdomainStatus,
          currentPlan: data.currentPlan,
          nextBilling: data.nextBilling,
          avatar: data.avatar,
          usage: data.usage
        })
      } else {
        console.error('Failed to fetch user stats')
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Dashboard wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <DashboardNavigation stats={stats} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden lg:ml-64">
        {/* Page header */}
        {(title || description) && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}