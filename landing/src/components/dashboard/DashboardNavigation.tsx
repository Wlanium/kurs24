'use client'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

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

interface NavigationProps {
  stats: UserStats
}

export default function DashboardNavigation({ stats }: NavigationProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Debug logging
  console.log('🗂️ DashboardNavigation stats:', stats)

  const getMenuItems = () => {
    const baseItems = [
      {
        icon: '🏠',
        label: 'Dashboard',
        href: '/dashboard',
        description: 'Übersicht & Statistiken',
        available: true
      },
      {
        icon: '🌐',
        label: 'Subdomains',
        href: '/dashboard/subdomains',
        description: 'Academy-Verwaltung',
        available: true
      },
      {
        icon: '💳',
        label: 'Billing',
        href: '/dashboard/billing',
        description: 'Rechnungen & Zahlungen',
        available: true
      },
      {
        icon: '📄',
        label: 'Rechnungshistorie',
        href: '/dashboard/billing/history',
        description: 'Alle Rechnungen & Zahlungen',
        available: true
      },
      {
        icon: '⚙️',
        label: 'Einstellungen',
        href: '/dashboard/settings',
        description: 'Account & Profil',
        available: true
      }
    ]

    const basisItems = [
      {
        icon: '📊',
        label: 'Analytics',
        href: '/dashboard/analytics',
        description: 'Teilnehmer & Kurse',
        available: stats.currentPlan === 'basis' || stats.currentPlan === 'pro'
      },
      {
        icon: '📚',
        label: 'Kurse',
        href: '/dashboard/courses',
        description: 'Kurs-Management',
        available: stats.currentPlan === 'basis' || stats.currentPlan === 'pro'
      }
    ]

    const proItems = [
      {
        icon: '🤖',
        label: 'KI-Assistent',
        href: '/dashboard/ai-assistant',
        description: 'GPT-4 & Claude Integration',
        available: stats.currentPlan === 'pro'
      },
      {
        icon: '🔄',
        label: 'Workflows',
        href: '/dashboard/workflows',
        description: 'LangGraph Automatisierung',
        available: stats.currentPlan === 'pro'
      },
      {
        icon: '👥',
        label: 'CrewAI Teams',
        href: '/dashboard/crew-teams',
        description: 'Multi-Agent Systeme',
        available: stats.currentPlan === 'pro'
      },
      {
        icon: '🚀',
        label: 'API Zugang',
        href: '/dashboard/api',
        description: 'Entwickler Tools',
        available: stats.currentPlan === 'pro'
      }
    ]

    return [...baseItems, ...basisItems, ...proItems].filter(item => item.available)
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">👑 Pro</span>
      case 'basis':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">✓ Basis</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">Free</span>
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              src="/logo-royal-academy.png"
              alt="Royal Academy K.I."
              className="h-8 w-auto mr-3"
              onError={(e) => {
                // Fallback to crown emoji if logo not found
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="h-8 w-8 bg-yellow-400 rounded-full items-center justify-center mr-3" style={{display: 'none'}}>
              <span className="text-lg">👑</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Royal Academy K.I.</h1>
          </div>

          {/* User Info */}
          <div className="mt-6 px-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xl border-2 border-gray-200">
                {stats.avatar || '👤'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <div className="mt-1">
                  {getPlanBadge(stats.currentPlan)}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Upgrade Banner for Free and Basis Users */}
          {stats.currentPlan !== 'pro' && (
            <div className="flex-shrink-0 px-4 pb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-black">
                  {stats.currentPlan === 'free' ? '🚀 Upgrade auf Basis/Pro' : '👑 Upgrade auf Pro'}
                </h3>
                <p className="text-xs text-black mt-1">
                  {stats.currentPlan === 'free'
                    ? 'Erhalte Zugang zu allen Features'
                    : 'Schalte KI-Features & mehr frei'
                  }
                </p>
                <Link
                  href="/dashboard/billing/upgrade"
                  className="mt-2 block w-full text-center bg-black text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Jetzt upgraden
                </Link>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="flex-shrink-0 px-4">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="group w-full flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
            >
              <span className="mr-3 text-lg">🚪</span>
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center">
            <img
              src="/logo-royal-academy.png"
              alt="Royal Academy K.I."
              className="h-8 w-auto mr-2"
              onError={(e) => {
                // Fallback to crown emoji if logo not found
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="h-8 w-8 bg-yellow-400 rounded-full items-center justify-center mr-2" style={{display: 'none'}}>
              <span className="text-lg">👑</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <span className="mr-3">🚪</span>
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}