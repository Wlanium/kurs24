'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import Link from 'next/link'

interface Subdomain {
  id: string
  subdomain: string
  status: 'active' | 'provisioning' | 'suspended' | 'failed'
  planId: string
  academyUrl: string
  createdAt: string
  lastAccessed: string
  sslStatus: string
  customDomain?: string
  progress?: number
  dns_status?: string
}

export default function SubdomainsPage() {
  const { data: session } = useSession()
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newSubdomain, setNewSubdomain] = useState('')
  const [userPlan, setUserPlan] = useState<'free' | 'basis' | 'pro'>('free')
  const [provisioningSubdomain, setProvisioningSubdomain] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<{
    status: string
    progress: number
    message: string
  } | null>(null)

  useEffect(() => {
    loadSubdomains()
    if (session?.user?.email) {
      loadUserPlan()
    }
  }, [session])

  const loadUserPlan = async () => {
    try {
      if (!session?.user?.email) {
        setUserPlan('free')
        return
      }

      // Use the same stats API that's used throughout the app
      console.log('🌐 Subdomains: Loading user stats to get plan...')
      const response = await fetch('/api/user/stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🌐 Subdomains: Stats data:', data)
        setUserPlan(data.currentPlan as 'free' | 'basis' | 'pro')
      } else {
        console.error('🌐 Subdomains: Failed to load stats, status:', response.status)
        setUserPlan('free')
      }
    } catch (error) {
      console.error('🌐 Subdomains: Failed to load user plan:', error)
      setUserPlan('free') // Default to free on error
    }
  }

  const loadSubdomains = async () => {
    try {
      const response = await fetch('/api/subdomains')
      if (response.ok) {
        const data = await response.json()
        setSubdomains(data)
      }
    } catch (error) {
      console.error('Failed to load subdomains:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const pollSubdomainStatus = async () => {
    try {
      // Use new user ID-based tenant status API
      const response = await fetch('/api/user/tenant/status')

      if (response.ok) {
        const data = await response.json()

        if (data.status === 'success') {
          const statusMessages = {
            'provisioning': data.progress <= 10 ? '🌐 DNS-Eintrag wird erstellt...' :
                           data.progress <= 30 ? '📡 DNS-Propagation läuft...' :
                           data.progress <= 60 ? '⚙️ Caddy-Konfiguration wird erstellt...' :
                           data.progress <= 80 ? '🔒 SSL-Zertifikat wird erstellt...' :
                           '✅ Fast fertig...',
            'active': '🎉 Subdomain ist online!',
            'failed': '❌ Erstellung fehlgeschlagen'
          }

          setProgressData({
            status: data.status,
            progress: data.progress,
            message: statusMessages[data.status as keyof typeof statusMessages] || 'Status wird aktualisiert...'
          })

          // Continue polling if still provisioning
          if (data.status === 'provisioning' && data.progress < 100) {
            setTimeout(() => pollSubdomainStatus(), 2000) // Poll every 2 seconds
          } else {
            // Stop polling and reload subdomains list
            setProvisioningSubdomain(null)
            setProgressData(null)
            loadSubdomains()
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll subdomain status:', error)
    }
  }

  const handleCreateSubdomain = async () => {
    if (!newSubdomain.trim() || !session?.user?.email) return

    setIsCreating(true)
    setProvisioningSubdomain(newSubdomain.trim())

    try {
      const response = await fetch('/api/subdomains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: newSubdomain.trim(),
          planId: 'basis'
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Start progress tracking
        setProgressData({
          status: 'provisioning',
          progress: 0,
          message: '🚀 Subdomain-Erstellung gestartet...'
        })

        // Start polling for status updates
        setTimeout(() => pollSubdomainStatus(), 1000)

        setNewSubdomain('')

        // Show success message
        console.log(`✅ ${result.message}`)
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
        setProvisioningSubdomain(null)
      }
    } catch (error) {
      console.error('Failed to create subdomain:', error)
      alert('❌ Failed to create subdomain')
      setProvisioningSubdomain(null)
    } finally {
      setIsCreating(false)
    }
  }
  return (
    <DashboardLayout
      title="Subdomain Verwaltung"
      description="Verwalten Sie Ihre KI-Training Academy Subdomains"
    >
      <div className="space-y-6">
        {/* Create New Subdomain - Only for paid plans */}
        {userPlan === 'free' ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-8 border border-yellow-200">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Subdomains sind Premium-Feature</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Mit einem kostenpflichtigen Plan erhalten Sie Ihre eigene Academy-Domain (z.B. <strong>ihr-name.kurs24.io</strong>)
                und können professionelle Online-Trainings anbieten.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-blue-600 mb-2">✅ Basis Plan - €19/Monat</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Eigene Subdomain</li>
                    <li>• Unbegrenzte Kurse</li>
                    <li>• Bis zu 100 Teilnehmer</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-yellow-300">
                  <h4 className="font-semibold text-yellow-600 mb-2">👑 Pro Plan - €49/Monat</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Alles aus Basis Plan</li>
                    <li>• KI-Assistent (GPT-4, Claude)</li>
                    <li>• LangGraph Workflows</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard/billing/upgrade?plan=basis"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Basis Plan wählen - €19/Monat
                </Link>
                <Link
                  href="/dashboard/billing/upgrade?plan=pro"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  👑 Pro Plan wählen - €49/Monat
                </Link>
              </div>
            </div>
          </div>
        ) : subdomains.length === 0 && !isLoading ? (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🌐 Neue Subdomain erstellen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain Name
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="mein-name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .kurs24.io
                  </span>
                </div>
              </div>
              <button
                onClick={handleCreateSubdomain}
                disabled={isCreating || !newSubdomain.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isCreating ? 'Erstelle...' : 'Subdomain erstellen'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Progress Tracking */}
        {provisioningSubdomain && progressData && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🚀 Subdomain wird erstellt: {provisioningSubdomain}.kurs24.io
            </h3>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{progressData.message}</span>
                  <span className="text-sm text-gray-600">{progressData.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressData.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4">
                <div className={`p-3 rounded-lg text-center text-sm ${progressData.progress >= 10 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  <div className="font-medium">🌐 DNS</div>
                  <div className="text-xs mt-1">{progressData.progress >= 10 ? 'Erstellt' : 'Wartet...'}</div>
                </div>
                <div className={`p-3 rounded-lg text-center text-sm ${progressData.progress >= 30 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  <div className="font-medium">📡 Propagation</div>
                  <div className="text-xs mt-1">{progressData.progress >= 30 ? 'Abgeschlossen' : 'Wartet...'}</div>
                </div>
                <div className={`p-3 rounded-lg text-center text-sm ${progressData.progress >= 80 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  <div className="font-medium">⚙️ Caddy</div>
                  <div className="text-xs mt-1">{progressData.progress >= 80 ? 'Konfiguriert' : 'Wartet...'}</div>
                </div>
                <div className={`p-3 rounded-lg text-center text-sm ${progressData.progress >= 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  <div className="font-medium">🔒 SSL</div>
                  <div className="text-xs mt-1">{progressData.progress >= 100 ? 'Aktiv' : 'Wartet...'}</div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  ⏱️ <strong>Geschätzte Dauer:</strong> 2-5 Minuten
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Die Subdomain wird automatisch bereitgestellt. Sie können diese Seite schließen - der Vorgang läuft im Hintergrund weiter.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Subdomains */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Lade Subdomains...</p>
          </div>
        ) : subdomains.length > 0 ? (
          subdomains.map((subdomain) => (
            <div key={subdomain.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🌐 {subdomain.subdomain}.kurs24.io
              </h3>
              <div className={`border rounded-lg p-4 ${
                subdomain.status === 'active' ? 'bg-green-50 border-green-200' :
                subdomain.status === 'provisioning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-semibold ${
                      subdomain.status === 'active' ? 'text-green-800' :
                      subdomain.status === 'provisioning' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {subdomain.academyUrl}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      subdomain.status === 'active' ? 'text-green-700' :
                      subdomain.status === 'provisioning' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      Erstellt am {new Date(subdomain.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    subdomain.status === 'active' ? 'bg-green-100 text-green-800' :
                    subdomain.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      subdomain.status === 'active' ? 'bg-green-500' :
                      subdomain.status === 'provisioning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    {subdomain.status === 'active' ? 'Online' :
                     subdomain.status === 'provisioning' ? 'Wird erstellt' :
                     'Gesperrt'}
                  </span>
                </div>
                {subdomain.status === 'active' && (
                  <div className="mt-4 flex space-x-3">
                    <a
                      href={subdomain.academyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Academy öffnen →
                    </a>
                    <Link
                      href="/dashboard/settings"
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium inline-block"
                    >
                      Einstellungen
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : null}

        {/* DNS Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 DNS Einstellungen</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">SSL Status</h4>
                <p className="text-sm text-green-600 mt-1">✓ Zertifikat aktiv</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">DNS Propagation</h4>
                <p className="text-sm text-green-600 mt-1">✓ Vollständig verbreitet</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Performance</h4>
                <p className="text-sm text-blue-600 mt-1">⚡ 98ms Antwortzeit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Custom Domain (Pro Feature)</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-yellow-800 font-semibold mb-2">👑 Pro Plan erforderlich</h4>
            <p className="text-yellow-700 text-sm mb-4">
              Verwenden Sie Ihre eigene Domain (z.B. academy.ihrefirma.de) anstatt der kurs24.io Subdomain.
            </p>
            <Link
              href="/dashboard/billing/upgrade?plan=pro"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium inline-block"
            >
              Jetzt upgraden
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}