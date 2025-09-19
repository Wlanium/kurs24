'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

function BillingContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [currentPlan, setCurrentPlan] = useState<'free' | 'basis' | 'pro'>('free')
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
  const [downgradeLoading, setDowngradeLoading] = useState(false)

  const loadUserData = async () => {
    if (session?.user?.email) {
      try {
        // Use user stats API that already handles user ID lookup
        const statsResponse = await fetch('/api/user/stats')
        console.log('Stats response status:', statsResponse.status)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log('Stats data:', statsData)
          setCurrentPlan(statsData.currentPlan as 'free' | 'basis' | 'pro')
        } else {
          console.error('Failed to fetch stats:', statsResponse.status)
        }

        // Get billing history using the new user billing API
        const billingResponse = await fetch('/api/user/billing')
        console.log('Billing response status:', billingResponse.status)
        if (billingResponse.ok) {
          const billingData = await billingResponse.json()
          console.log('Billing data:', billingData)
          setBillingHistory(billingData.billing_history || [])
        }

        // Invoices are handled on separate history page
      } catch (error) {
        console.error('Failed to load billing data:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Show success message if redirected from upgrade
    if (searchParams.get('upgrade') === 'success') {
      alert('🎉 Ihr Abonnement wurde erfolgreich erstellt!')
      // Reload user data to get updated plan
      loadUserData()
    }
  }, [searchParams])

  useEffect(() => {
    loadUserData()
  }, [session])

  const handleDowngrade = async () => {
    if (!session?.user?.email) return

    setDowngradeLoading(true)
    try {
      const targetPlan = currentPlan === 'pro' ? 'basis' : 'free'
      const response = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          targetPlan: targetPlan,
          currentPlan: currentPlan
        })
      })

      if (response.ok) {
        alert(`✅ Downgrade zu ${targetPlan.toUpperCase()} Plan wurde eingeleitet. Änderung wird zum nächsten Abrechnungszeitraum wirksam.`)
        setShowDowngradeDialog(false)
        // Reload user data to show updated status
        await loadUserData()
      } else {
        const error = await response.json()
        alert(`❌ Fehler beim Downgrade: ${error.error}`)
      }
    } catch (error) {
      console.error('Downgrade error:', error)
      alert('❌ Fehler beim Downgrade. Bitte versuchen Sie es später erneut.')
    } finally {
      setDowngradeLoading(false)
    }
  }
  return (
    <DashboardLayout
      title="Billing & Abonnement"
      description="Verwalten Sie Ihre Zahlungen und Abonnements"
    >
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            👑 Aktueller Plan
          </h3>
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div className={`border rounded-lg p-6 ${
              currentPlan === 'pro' ? 'bg-yellow-50 border-yellow-200' :
              currentPlan === 'basis' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {currentPlan === 'pro' ? 'Pro Plan' :
                     currentPlan === 'basis' ? 'Basis Plan' :
                     'Free Plan'}
                  </h4>
                  <p className="text-gray-600 mt-1">
                    {currentPlan === 'pro' ? 'Alle Features inklusive KI-Assistent' :
                     currentPlan === 'basis' ? 'Eigene Subdomain mit unbegrenzten Kursen' :
                     'Kostenlose Testversion'}
                  </p>
                  <div className="mt-3 space-y-2">
                    {currentPlan === 'pro' && (
                      <>
                        <p className="text-sm text-gray-700">✅ Eigene Subdomain</p>
                        <p className="text-sm text-gray-700">✅ KI-Assistent (GPT-4, Claude)</p>
                        <p className="text-sm text-gray-700">✅ Automatische Kurserstellung</p>
                        <p className="text-sm text-gray-700">✅ LangGraph Workflows</p>
                        <p className="text-sm text-gray-700">✅ CrewAI Teams</p>
                      </>
                    )}
                    {currentPlan === 'basis' && (
                      <>
                        <p className="text-sm text-gray-700">✅ Eigene Subdomain</p>
                        <p className="text-sm text-gray-700">✅ Unbegrenzte Kurse</p>
                        <p className="text-sm text-gray-700">✅ Bis zu 100 Teilnehmer</p>
                        <p className="text-sm text-gray-700">❌ KI-Assistent</p>
                      </>
                    )}
                    {currentPlan === 'free' && (
                      <>
                        <p className="text-sm text-gray-700">✅ Basis-Features</p>
                        <p className="text-sm text-gray-700">❌ Eigene Subdomain</p>
                        <p className="text-sm text-gray-700">❌ KI-Assistent</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {currentPlan === 'pro' ? '€49' :
                     currentPlan === 'basis' ? '€19' :
                     '€0'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentPlan !== 'free' ? 'pro Monat' : 'Kostenlos'}
                  </div>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      currentPlan === 'pro' ? 'bg-yellow-100 text-yellow-800' :
                      currentPlan === 'basis' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Aktiv
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method - Only for paid plans */}
        {currentPlan !== 'free' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Zahlungsart</h3>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-12 h-8 bg-orange-500 rounded flex items-center justify-center mr-4">
                  <span className="text-white text-xs font-bold">PP</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">PayPal</p>
                  <p className="text-sm text-gray-500">Zahlung per PayPal</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ändern
              </button>
            </div>
          </div>
        )}

        {/* Next Billing - Only for paid plans */}
        {currentPlan !== 'free' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Nächste Abrechnung</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}
                  </h4>
                  <p className="text-blue-700 text-sm mt-1">
                    {currentPlan === 'pro' ? 'Pro Plan' : 'Basis Plan'} Verlängerung
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-900">
                    €{currentPlan === 'pro' ? '49,00' : '19,00'}
                  </div>
                  <div className="text-sm text-blue-700">inkl. 19% MwSt.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage & Limits - Only for Pro plan */}
        {currentPlan === 'pro' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Nutzung diesen Monat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">KI-Generierungen</span>
                  <span className="text-sm text-gray-500">0 / unbegrenzt</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">API Calls</span>
                  <span className="text-sm text-gray-500">0 / unbegrenzt</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Free Plan Upgrade CTA */}
        {currentPlan === 'free' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bereit für mehr Features?</h3>
              <p className="text-gray-600 mb-4">
                Upgraden Sie jetzt und erhalten Sie Ihre eigene Academy-Domain plus alle Pro-Features!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/dashboard/billing/upgrade?plan=basis"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Basis Plan - €19/Monat
                </a>
                <a
                  href="/dashboard/billing/upgrade?plan=pro"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  👑 Pro Plan - €49/Monat
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Plan Comparison */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Plan ändern</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold">Basis Plan</h4>
              <div className="text-2xl font-bold text-blue-600 my-2">€19<span className="text-lg text-gray-500">/Monat</span></div>
              <ul className="space-y-2 text-sm mb-4">
                <li>✅ Eigene Subdomain</li>
                <li>✅ Royal Academy Branding</li>
                <li>✅ Standard Kurse</li>
                <li>✅ E-Mail Support</li>
                <li>❌ KI-Assistent</li>
              </ul>
              {currentPlan === 'free' ? (
                <a
                  href="/dashboard/billing/upgrade?plan=basis"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-center font-medium inline-block"
                >
                  Jetzt upgraden
                </a>
              ) : currentPlan === 'basis' ? (
                <button
                  onClick={() => setShowDowngradeDialog(true)}
                  className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Zu Free downgraden
                </button>
              ) : (
                <button
                  onClick={() => setShowDowngradeDialog(true)}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Zu Basis downgraden
                </button>
              )}
            </div>

            <div className={`border-2 rounded-lg p-4 relative ${
              currentPlan === 'pro' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
            }`}>
              {currentPlan === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                    AKTUELL
                  </span>
                </div>
              )}
              <h4 className="text-lg font-semibold">Pro Plan</h4>
              <div className="text-2xl font-bold text-blue-600 my-2">€49<span className="text-lg text-gray-500">/Monat</span></div>
              <ul className="space-y-2 text-sm mb-4">
                <li>✅ Alles aus Basis Plan</li>
                <li>✅ KI-Assistent (GPT-4, Claude)</li>
                <li>✅ Automatische Kurserstellung</li>
                <li>✅ LangGraph Workflows</li>
                <li>✅ CrewAI Teams</li>
              </ul>
              {currentPlan === 'pro' ? (
                <button className="w-full bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold">
                  Aktueller Plan
                </button>
              ) : (
                <a
                  href="/dashboard/billing/upgrade?plan=pro"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded-lg text-center font-semibold inline-block"
                >
                  Auf Pro upgraden
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Navigation */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Rechnungen & Zahlungshistorie</h3>
          <p className="text-gray-600 mb-4">
            Verwalten Sie Ihre Rechnungen und sehen Sie eine detaillierte Übersicht aller Zahlungen.
          </p>
          <a
            href="/dashboard/billing/history"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block"
          >
            Rechnungshistorie anzeigen →
          </a>
        </div>

        {/* Downgrade Dialog */}
        {showDowngradeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plan downgraden bestätigen
              </h3>
              <p className="text-gray-600 mb-4">
                Möchten Sie Ihren Plan von <strong>{currentPlan.toUpperCase()}</strong> zu <strong>{currentPlan === 'pro' ? 'BASIS' : 'FREE'}</strong> downgraden?
              </p>
              {currentPlan === 'basis' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-orange-800">
                    ⚠️ <strong>Wichtig:</strong> Beim Downgrade zu FREE wird Ihre Subdomain zum Ende des Abrechnungszeitraums deaktiviert.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-6">
                Die Änderung wird zum Ende Ihres aktuellen Abrechnungszeitraums wirksam.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDowngradeDialog(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium"
                  disabled={downgradeLoading}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDowngrade}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                  disabled={downgradeLoading}
                >
                  {downgradeLoading ? 'Wird bearbeitet...' : 'Downgrade bestätigen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  )
}