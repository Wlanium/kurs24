'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    plan: 'free', // 'free', 'basis' or 'pro'
    subdomain: '' // Only for paid plans
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGoogleRegister = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      setError('Google Registrierung fehlgeschlagen')
      setIsLoading(false)
    }
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setIsLoading(false)
      return
    }

    try {
      // TODO: Call registration API
      console.log('🔐 Registration data:', formData)

      // Show success message based on plan
      if (formData.plan === 'free') {
        // Free plan - direct login
        router.push('/auth/login?message=registration-success-free')
      } else {
        // Paid plan - redirect to payment after login
        router.push(`/dashboard/billing/upgrade?plan=${formData.plan}&subdomain=${formData.subdomain}&from=registration`)
      }
    } catch (error) {
      setError('Registrierung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const getMaxSteps = () => {
    return formData.plan !== 'free' ? 4 : 3
  }

  const nextStep = () => {
    if (step < getMaxSteps()) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-center">
            <img
              src="/logo-royal-academy.png"
              alt="Royal Academy K.I."
              className="h-16 w-auto mx-auto mb-4"
              onError={(e) => {
                // Fallback to crown emoji if logo not found
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="mx-auto h-16 w-16 bg-yellow-400 rounded-full items-center justify-center mb-4" style={{display: 'none'}}>
              <span className="text-3xl">👑</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Willkommen bei Royal Academy K.I.
            </h1>
            <p className="text-blue-100 mt-2">Erstellen Sie Ihr kostenloses Konto</p>

            {/* Progress Steps */}
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {(formData.plan !== 'free' ? [1, 2, 3, 4] : [1, 2, 3]).map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`w-3 h-3 rounded-full ${
                      step >= stepNum ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Schritt 1: Persönliche Daten</h3>

                {/* Google Registration */}
                <button
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                  className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center space-x-3 transition-colors mb-4 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Schnell registrieren mit Google</span>
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-600">oder mit E-Mail</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Max"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mustermann"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail Adresse</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="max@mustermann.de"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmen (optional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mustermann Training GmbH"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Schritt 2: Account-Sicherheit</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mindestens 8 Zeichen"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort bestätigen</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Passwort wiederholen"
                    required
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🔒 Sicherheitshinweise:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Mindestens 8 Zeichen</li>
                    <li>• Groß- und Kleinbuchstaben</li>
                    <li>• Mindestens eine Zahl</li>
                    <li>• Mindestens ein Sonderzeichen</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Schritt 3: Plan auswählen</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* FREE Plan */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.plan === 'free' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => handleInputChange('plan', 'free')}
                  >
                    <h4 className="text-lg font-semibold">Kostenlos</h4>
                    <div className="text-3xl font-bold text-green-600 my-2">€0<span className="text-lg text-gray-500">/Monat</span></div>
                    <ul className="space-y-2 text-sm">
                      <li>✅ 1 Kurs erstellen</li>
                      <li>✅ Bis zu 10 Teilnehmer</li>
                      <li>✅ Royal Academy Branding</li>
                      <li>❌ Eigene Subdomain</li>
                      <li>❌ KI-Features</li>
                    </ul>
                  </div>

                  {/* BASIS Plan */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.plan === 'basis' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleInputChange('plan', 'basis')}
                  >
                    <h4 className="text-lg font-semibold">Basis Plan</h4>
                    <div className="text-3xl font-bold text-blue-600 my-2">€19<span className="text-lg text-gray-500">/Monat</span></div>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Eigene Subdomain</li>
                      <li>✅ Royal Academy Branding</li>
                      <li>✅ Standard Kurse</li>
                      <li>✅ E-Mail Support</li>
                      <li>❌ KI-Assistent</li>
                      <li>❌ Automatische Kurserstellung</li>
                    </ul>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors relative ${
                      formData.plan === 'pro' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                    }`}
                    onClick={() => handleInputChange('plan', 'pro')}
                  >
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                        👑 EMPFOHLEN
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold">Pro Plan</h4>
                    <div className="text-3xl font-bold text-blue-600 my-2">€49<span className="text-lg text-gray-500">/Monat</span></div>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Alles aus Basis Plan</li>
                      <li>✅ KI-Assistent (GPT-4, Claude)</li>
                      <li>✅ Automatische Kurserstellung</li>
                      <li>✅ LangGraph Workflows</li>
                      <li>✅ CrewAI Teams</li>
                      <li>✅ Priority Support</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && formData.plan !== 'free' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Schritt 4: Ihre Academy-Domain</h3>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🌐 Ihre persönliche Academy-URL</h4>
                  <p className="text-sm text-blue-800">
                    Wählen Sie einen einzigartigen Namen für Ihre Training Academy. Ihre Teilnehmer erreichen Sie unter dieser Adresse.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academy-Name</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ihre-academy"
                      pattern="[a-z0-9-]+"
                      required
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm">
                      .kurs24.io
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt
                  </p>
                </div>

                {formData.subdomain && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-green-800 text-sm">
                      ✅ Ihre Academy wird erreichbar unter: <strong>https://{formData.subdomain}.kurs24.io</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Zurück
                </button>
              )}
              <div className="flex-1" />
              {step < getMaxSteps() ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={handleEmailRegister}
                  disabled={isLoading || (formData.plan !== 'free' && !formData.subdomain)}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Erstelle Account...' : 'Account erstellen & Bezahlen'}
                </button>
              )}
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">
                Bereits ein Account? Hier anmelden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}