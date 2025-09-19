'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

interface UserStats {
  subdomain?: string
  subdomainStatus: 'none' | 'provisioning' | 'active' | 'suspended'
  currentPlan: 'free' | 'basis' | 'pro'
  nextBilling?: string
  usage?: {
    apiCalls: number
    aiGenerations: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats>({
    subdomainStatus: 'none',
    currentPlan: 'free'
  })

  useEffect(() => {
    if (session) {
      loadUserStats()
    }
  }, [session])

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          subdomain: data.subdomain,
          subdomainStatus: data.subdomainStatus,
          currentPlan: data.currentPlan,
          nextBilling: data.nextBilling,
          usage: data.usage
        })
      } else {
        console.error('Failed to fetch user stats')
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">👑 Pro Plan</span>
      case 'basis':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">✓ Basis Plan</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">Kostenlos</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Aktiv</span>
      case 'provisioning':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>Wird erstellt</span>
      case 'suspended':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>Gesperrt</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Nicht erstellt</span>
    }
  }

  return (
    <DashboardLayout
      title={`Willkommen zurück, ${session?.user?.name?.split(' ')[0]}!`}
      description="Verwalten Sie Ihre KI-Training Academy"
    >

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subdomain Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.subdomain ? `${stats.subdomain}.kurs24.io` : 'Nicht erstellt'}
                </p>
              </div>
              <span className="text-2xl">🌐</span>
            </div>
            <div className="mt-4">
              {getStatusBadge(stats.subdomainStatus)}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktueller Plan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.currentPlan === 'pro' ? 'Pro' : stats.currentPlan === 'basis' ? 'Basis' : 'Kostenlos'}
                </p>
              </div>
              <span className="text-2xl">💳</span>
            </div>
            <div className="mt-4">
              {getPlanBadge(stats.currentPlan)}
            </div>
          </div>

          {stats.currentPlan === 'pro' && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">KI-Nutzung</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.usage?.aiGenerations || 0}</p>
                    <p className="text-xs text-gray-500">Generierungen diesen Monat</p>
                  </div>
                  <span className="text-2xl">🤖</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Calls</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.usage?.apiCalls || 0}</p>
                    <p className="text-xs text-gray-500">Diesen Monat</p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </>
          )}

          {stats.currentPlan !== 'pro' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nächste Rechnung</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.nextBilling ? `€${stats.currentPlan === 'basis' ? '19' : '0'}` : '€0'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.nextBilling ? `am ${stats.nextBilling}` : 'Kein Abo aktiv'}
                  </p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subdomain Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🌐 Subdomain Verwaltung
            </h3>
            {stats.subdomainStatus === 'active' ? (
              <div className="space-y-4">
                <p className="text-gray-600">Ihre Academy ist online und bereit für Teilnehmer!</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://${stats.subdomain}.kurs24.io`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
                  >
                    Academy öffnen →
                  </a>
                  <Link
                    href="/dashboard/subdomains"
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-center"
                  >
                    Einstellungen
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Erstellen Sie Ihre eigene KI-Training Academy!</p>
                <Link
                  href="/dashboard/subdomains"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block text-center w-full sm:w-auto"
                >
                  Subdomain erstellen
                </Link>
              </div>
            )}
          </div>

          {/* Plan Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              💳 Abonnement & Billing
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Aktueller Plan:</span>
                {getPlanBadge(stats.currentPlan)}
              </div>
              {stats.nextBilling && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Nächste Zahlung:</span>
                  <span className="text-sm text-gray-900">€{stats.currentPlan === 'pro' ? '49' : '19'} am {stats.nextBilling}</span>
                </div>
              )}
              <div className="flex space-x-3">
                {stats.currentPlan === 'free' && (
                  <Link
                    href="/dashboard/billing/upgrade"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium inline-block"
                  >
                    Plan upgraden
                  </Link>
                )}
                <Link
                  href="/dashboard/billing/history"
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium inline-block"
                >
                  Rechnungen anzeigen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/subdomains" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl mb-2">🌐</span>
              <span className="text-sm font-medium text-gray-700">Subdomains</span>
            </Link>
            <Link href="/dashboard/billing" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl mb-2">💳</span>
              <span className="text-sm font-medium text-gray-700">Billing</span>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl mb-2">⚙️</span>
              <span className="text-sm font-medium text-gray-700">Einstellungen</span>
            </Link>
            <a href="mailto:support@kurs24.io" className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl mb-2">🎧</span>
              <span className="text-sm font-medium text-gray-700">Support</span>
            </a>
          </div>
        </div>
    </DashboardLayout>
  )
}