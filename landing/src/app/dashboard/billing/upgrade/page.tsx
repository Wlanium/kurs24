'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'
import PayPalSubscription from '../../../../components/payment/PayPalSubscription'

function UpgradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetPlan = (searchParams.get('plan') as 'basis' | 'pro') || 'pro'
  const subdomain = searchParams.get('subdomain')
  const fromRegistration = searchParams.get('from') === 'registration'
  const [selectedPlan, setSelectedPlan] = useState<'basis' | 'pro'>(targetPlan)
  const [showPayment, setShowPayment] = useState(fromRegistration) // Only auto-show payment from registration flow

  const handleSubscriptionSuccess = async (subscription: any) => {
    // If coming from registration and subdomain was provided, create it
    if (fromRegistration && subdomain) {
      try {
        const response = await fetch('/api/subdomains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain: subdomain,
            planId: selectedPlan
          })
        })

        if (response.ok) {
          router.push('/dashboard/subdomains?created=true')
        } else {
          router.push('/dashboard?upgrade=success')
        }
      } catch (error) {
        console.error('Failed to create subdomain:', error)
        router.push('/dashboard?upgrade=success')
      }
    } else {
      // Redirect to dashboard with success message
      router.push('/dashboard?upgrade=success')
    }
  }

  const handleSubscriptionError = (error: any) => {
    console.error('Subscription error:', error)
    alert('Fehler beim Abonnement. Bitte versuchen Sie es erneut.')
  }

  const handleSubscriptionCancel = () => {
    setShowPayment(false)
  }

  if (showPayment) {
    return (
      <DashboardLayout
        title={fromRegistration ? "Registrierung abschließen" : "Plan Upgrade"}
        description={fromRegistration ? "Bezahlung für Ihren gewählten Plan" : "Ihr Abonnement abschließen"}
      >
        <div className="max-w-md mx-auto">
          {fromRegistration && subdomain && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🎉 Fast geschafft!</h3>
              <p className="text-sm text-blue-800 mb-2">
                Nach der Bezahlung wird Ihre Academy <strong>{subdomain}.kurs24.io</strong> automatisch erstellt.
              </p>
              <p className="text-xs text-blue-600">
                Plan: {selectedPlan === 'basis' ? 'Basis (€19/Monat)' : 'Pro (€49/Monat)'}
              </p>
            </div>
          )}

          {!fromRegistration && (
            <div className="mb-6">
              <button
                onClick={() => setShowPayment(false)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
              >
                ← Zurück zur Planauswahl
              </button>
            </div>
          )}

          <PayPalSubscription
            planId={selectedPlan}
            onSuccess={handleSubscriptionSuccess}
            onError={handleSubscriptionError}
            onCancel={handleSubscriptionCancel}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Plan Upgrade"
      description="Wählen Sie den passenden Plan für Ihre Academy"
    >
      <div className="max-w-4xl mx-auto">
        {/* Plan Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Basis Plan */}
          <div
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedPlan === 'basis'
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 hover:border-green-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedPlan('basis')}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Basis Plan</h3>
              <div className="text-4xl font-bold text-green-600 my-4">
                €19<span className="text-lg text-gray-500">/Monat</span>
              </div>
              <p className="text-gray-600">Perfekt für den Einstieg</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Eigene Subdomain (xyz.kurs24.io)</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Royal Academy Branding</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Standard Kurse & Lektionen</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Bis zu 100 Teilnehmer</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>E-Mail Support</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Basis Analytics</span>
              </li>
              <li className="flex items-center">
                <span className="text-red-500 mr-3">❌</span>
                <span className="text-gray-500">KI-Assistent</span>
              </li>
              <li className="flex items-center">
                <span className="text-red-500 mr-3">❌</span>
                <span className="text-gray-500">Automatische Kurserstellung</span>
              </li>
            </ul>

            {selectedPlan === 'basis' && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm font-medium">✓ Ausgewählt</p>
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all relative ${
              selectedPlan === 'pro'
                ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                : 'border-gray-200 hover:border-yellow-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedPlan('pro')}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold">
                👑 EMPFOHLEN
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Pro Plan</h3>
              <div className="text-4xl font-bold text-yellow-600 my-4">
                €49<span className="text-lg text-gray-500">/Monat</span>
              </div>
              <p className="text-gray-600">Für professionelle Akademien</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span className="font-medium">Alles aus Basis Plan</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">🤖</span>
                <span>KI-Assistent (GPT-4, Claude)</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">✨</span>
                <span>Automatische Kurserstellung</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">🔄</span>
                <span>LangGraph Workflows</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">👥</span>
                <span>CrewAI Teams</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">🚀</span>
                <span>API Zugang</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">🎯</span>
                <span>Custom Domain Support</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-3">⚡</span>
                <span>Priority Support</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✅</span>
                <span>Unbegrenzte Teilnehmer</span>
              </li>
            </ul>

            {selectedPlan === 'pro' && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm font-medium">✓ Ausgewählt</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => setShowPayment(true)}
            className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${
              selectedPlan === 'pro'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {selectedPlan === 'pro' ? '👑 Pro Plan für €49/Monat abonnieren' : '✅ Basis Plan für €19/Monat abonnieren'}
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Jederzeit kündbar • Keine Setup-Gebühren • 14 Tage Geld-zurück-Garantie
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Häufige Fragen</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Kann ich später upgraden?</h4>
              <p className="text-sm text-gray-600">Ja, Sie können jederzeit vom Basis zum Pro Plan upgraden.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Wie funktioniert die Kündigung?</h4>
              <p className="text-sm text-gray-600">Kündigen Sie jederzeit in Ihrem Dashboard. Ihr Plan läuft bis zum Ende der aktuellen Periode.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Welche Zahlungsmethoden werden akzeptiert?</h4>
              <p className="text-sm text-gray-600">Wir akzeptieren PayPal, Kreditkarten und Lastschrift über PayPal.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradeContent />
    </Suspense>
  )
}