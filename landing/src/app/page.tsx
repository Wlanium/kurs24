'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'basis' | 'pro'>('basis')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subdomain: '',
    academy: ''
  })
  const [step, setStep] = useState(1)
  const [subdomainStatus, setSubdomainStatus] = useState({
    ready: false,
    dns_ready: false,
    https_ready: false,
    checking: false
  })

  const plans = {
    basis: {
      name: 'Basis Plan',
      price: 19,
      features: [
        '✅ Eigene Academy Subdomain',
        '✅ Unbegrenzte Kurse',
        '✅ 100 Teilnehmer',
        '✅ Royal Branding',
        '✅ SSL Zertifikat',
        '❌ KI Features'
      ]
    },
    pro: {
      name: 'Pro Plan',
      price: 49,
      features: [
        '✅ Alles aus Basis',
        '✅ 1000 Teilnehmer',
        '✅ KI Kurs-Generator',
        '✅ LangGraph Integration',
        '✅ CrewAI Teams',
        '✅ Priority Support'
      ]
    }
  }

  const checkSubdomain = async () => {
    try {
      const response = await fetch(`https://api.kurs24.io/api/v1/check-subdomain?subdomain=${formData.subdomain}`)
      const data = await response.json()
      return data.available
    } catch (error) {
      console.error('Subdomain check failed:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const available = await checkSubdomain()
    if (!available) {
      alert('Diese Subdomain ist bereits vergeben!')
      return
    }

    setStep(3) // Go to payment
  }

  const createOrder = async () => {
    const price = plans[selectedPlan].price

    // Store order data for later
    localStorage.setItem('pendingOrder', JSON.stringify({
      ...formData,
      plan: selectedPlan,
      price
    }))

    // PayPal order
    return fetch('https://api.kurs24.io/api/v1/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: selectedPlan,
        price,
        subdomain: formData.subdomain,
        email: formData.email
      })
    })
    .then(res => res.json())
    .then(data => data.id)
  }

  const checkSubdomainStatus = async () => {
    if (!formData.subdomain) return

    setSubdomainStatus(prev => ({ ...prev, checking: true }))

    try {
      const response = await fetch(`https://api.kurs24.io/api/v1/check-subdomain-status?subdomain=${formData.subdomain}`)
      const status = await response.json()

      setSubdomainStatus({
        ready: status.ready,
        dns_ready: status.dns_ready,
        https_ready: status.https_ready,
        checking: false
      })

      return status.ready
    } catch (error) {
      console.error('Status check failed:', error)
      setSubdomainStatus(prev => ({ ...prev, checking: false }))
      return false
    }
  }

  const onApprove = async (data: any) => {
    // Capture payment
    const response = await fetch('https://api.kurs24.io/api/v1/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderID: data.orderID,
        ...formData,
        plan: selectedPlan
      })
    })

    const result = await response.json()

    if (result.success) {
      setStep(4) // Success page - now with status checking

      // Start checking subdomain status immediately
      const checkInterval = setInterval(async () => {
        const isReady = await checkSubdomainStatus()
        if (isReady) {
          clearInterval(checkInterval)
          // Show "Ready" state for 3 seconds before redirect
          setTimeout(() => {
            window.location.href = `https://${formData.subdomain}.kurs24.io`
          }, 3000)
        }
      }, 5000) // Check every 5 seconds

      // Stop checking after 5 minutes max
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 300000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 text-white">
      {/* Header */}
      <header className="p-6 text-center">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-4xl font-bold">Royal Academy</h1>
        <p className="text-xl mt-2">K.I. Training Platform für Dozenten</p>
      </header>

      {/* Step 1: Choose Plan */}
      {step === 1 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Wähle deinen Plan</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 cursor-pointer transition-all ${
                  selectedPlan === key ? 'ring-4 ring-yellow-400 scale-105' : ''
                }`}
                onClick={() => setSelectedPlan(key as 'basis' | 'pro')}
              >
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <div className="text-4xl font-bold mb-6">{plan.price}€<span className="text-lg">/Monat</span></div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-lg">{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setStep(2)}
              className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition"
            >
              Weiter zur Registrierung →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Registration */}
      {step === 2 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Erstelle deine Academy</h2>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <div className="mb-6">
              <label className="block mb-2 text-lg">Dein Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-lg">E-Mail</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-lg">Academy Name</label>
              <input
                type="text"
                required
                placeholder="z.B. Digital Skills Academy"
                className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur"
                value={formData.academy}
                onChange={(e) => setFormData({...formData, academy: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-lg">Gewünschte Subdomain</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="meine-academy"
                  className="flex-1 px-4 py-3 rounded-l-lg bg-white/20 backdrop-blur"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                />
                <span className="bg-white/30 px-4 py-3 rounded-r-lg">.kurs24.io</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 text-purple-900 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition"
            >
              Weiter zur Zahlung →
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Zahlung abschließen</h2>

          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <div className="mb-8 text-center">
              <p className="text-2xl mb-2">{plans[selectedPlan].name}</p>
              <p className="text-4xl font-bold">{plans[selectedPlan].price}€/Monat</p>
              <p className="mt-4">Subdomain: {formData.subdomain}.kurs24.io</p>
            </div>

            <PayPalScriptProvider options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
              currency: "EUR"
            }}>
              <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                style={{ layout: "vertical" }}
              />
            </PayPalScriptProvider>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-8">🎉</div>
            <h2 className="text-4xl font-bold mb-4">Zahlung erfolgreich!</h2>
            <p className="text-xl mb-8">Deine Royal Academy wird jetzt eingerichtet...</p>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6">Setup Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <span className="text-lg">💳 Zahlung</span>
                  <span className="text-green-400 font-bold">✅ Abgeschlossen</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <span className="text-lg">🌐 DNS Setup</span>
                  <span className={`font-bold ${subdomainStatus.dns_ready ? 'text-green-400' : subdomainStatus.checking ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {subdomainStatus.dns_ready ? '✅ Bereit' : subdomainStatus.checking ? '⏳ Prüfe...' : '⏸️ Ausstehend'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <span className="text-lg">🔒 SSL Zertifikat</span>
                  <span className={`font-bold ${subdomainStatus.https_ready ? 'text-green-400' : subdomainStatus.checking ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {subdomainStatus.https_ready ? '✅ Bereit' : subdomainStatus.checking ? '⏳ Prüfe...' : '⏸️ Ausstehend'}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-lg mb-4">Deine Academy URL:</p>
                <div className="text-2xl font-bold bg-white/10 p-4 rounded-lg">
                  https://{formData.subdomain}.kurs24.io
                </div>

                {subdomainStatus.ready ? (
                  <div className="mt-6">
                    <div className="text-green-400 text-xl mb-4">🚀 Alles bereit! Weiterleitung in 3 Sekunden...</div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="text-yellow-400 mb-4">⏱️ Setup läuft... Bitte haben Sie Geduld</div>
                    <div className="text-sm text-gray-300">
                      Die Einrichtung dauert normalerweise 1-3 Minuten.<br/>
                      DNS Propagation und SSL Zertifikat werden automatisch konfiguriert.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}