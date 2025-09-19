'use client'
import Link from 'next/link'
import JsonLd from '../components/JsonLd'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/logo-royal-academy.svg"
                alt="Royal Academy K.I."
                className="h-10 w-auto mr-3"
                onError={(e) => {
                  // Try PNG, then JPG, then crown emoji
                  if (e.currentTarget.src.includes('.svg')) {
                    e.currentTarget.src = '/logo-royal-academy.png'
                  } else if (e.currentTarget.src.includes('.png')) {
                    e.currentTarget.src = '/logo-royal-academy.jpg'
                  } else {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }
                }}
              />
              <div className="h-8 w-8 bg-yellow-400 rounded-full items-center justify-center mr-3" style={{display: 'none'}}>
                <span className="text-lg">👑</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Royal Academy K.I.</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Anmelden
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Kostenlos starten
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img
              src="/logo-royal-academy.svg"
              alt="Royal Academy K.I."
              className="h-32 w-auto mx-auto mb-8"
              onError={(e) => {
                // Try PNG, then JPG, then crown emoji
                if (e.currentTarget.src.includes('.svg')) {
                  e.currentTarget.src = '/logo-royal-academy.png'
                } else if (e.currentTarget.src.includes('.png')) {
                  e.currentTarget.src = '/logo-royal-academy.jpg'
                } else {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'block'
                }
              }}
            />
            <div className="text-8xl mb-8" style={{display: 'none'}}>👑</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Ihre eigene<br/>
              <span className="text-yellow-400">KI-Training Academy</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Erstellen Sie professionelle Online-Trainings mit KI-Unterstützung.
              Von der Kurserstellung bis zur Teilnehmerverwaltung - alles auf Ihrer eigenen Domain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-lg text-lg font-bold transition-colors"
              >
                🚀 Jetzt kostenlos starten
              </Link>
              <Link
                href="#features"
                className="border-2 border-white hover:bg-white hover:text-blue-900 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
              >
                Features entdecken
              </Link>
            </div>

            <p className="text-sm text-blue-200 mt-4">
              ✅ Kostenlos testen • ✅ Keine Kreditkarte erforderlich • ✅ Sofort einsatzbereit
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Alles was Sie für erfolgreiche Online-Trainings brauchen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Von der ersten Idee bis zum fertigen Kurs - unsere KI-gestützte Plattform macht Sie zum erfolgreichen Online-Trainer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Eigene Academy-Domain</h3>
              <p className="text-gray-600 mb-4">
                Ihre professionelle Training-Academy unter ihrer-name.kurs24.io
                mit SSL-Zertifikat und blitzschneller Performance.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ Sofortige Einrichtung</li>
                <li>✓ Professionelles Branding</li>
                <li>✓ Mobile-optimiert</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">KI-Kurs Generator</h3>
              <p className="text-gray-600 mb-4">
                Erstellen Sie komplette Kurse in Minuten. Unsere KI generiert
                Inhalte, Übungen und Quizzes basierend auf Ihrem Fachgebiet.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ GPT-4 & Claude Integration</li>
                <li>✓ Automatische Quiz-Erstellung</li>
                <li>✓ Mehrsprachiger Content</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Teilnehmer-Management</h3>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Ihre Teilnehmer, verfolgen Sie Fortschritte
                und erstellen Sie detaillierte Berichte über den Lernerfolg.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ Automatische Zertifikate</li>
                <li>✓ Fortschritts-Tracking</li>
                <li>✓ E-Mail Benachrichtigungen</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600 mb-4">
                Verstehen Sie Ihre Teilnehmer besser mit detaillierten
                Analytics über Engagement, Completion-Raten und mehr.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ Real-time Dashboard</li>
                <li>✓ Engagement Metrics</li>
                <li>✓ ROI Tracking</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">LangGraph Workflows</h3>
              <p className="text-gray-600 mb-4">
                Automatisieren Sie komplexe Trainingsprozesse mit
                intelligenten Workflows und personalisierten Lernpfaden.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ Automatische Personalisierung</li>
                <li>✓ Adaptive Schwierigkeit</li>
                <li>✓ Smart Recommendations</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">CrewAI Teams</h3>
              <p className="text-gray-600 mb-4">
                Multi-Agent KI-Teams arbeiten zusammen, um optimale
                Lernergebnisse und personalisierte Betreuung zu gewährleisten.
              </p>
              <ul className="text-sm text-gray-500">
                <li>✓ 24/7 KI-Assistenten</li>
                <li>✓ Personalized Tutoring</li>
                <li>✓ Automatic Content Updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing für jeden Bedarf
            </h2>
            <p className="text-xl text-gray-600">
              Starten Sie kostenlos und skalieren Sie mit Ihrem Erfolg
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Kostenlos</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">€0</div>
                <p className="text-gray-600 mb-6">Perfekt zum Ausprobieren</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>1 Kurs erstellen</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Bis zu 10 Teilnehmer</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Royal Academy Branding</span>
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-3">✗</span>
                  <span className="text-gray-400">Eigene Subdomain</span>
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-3">✗</span>
                  <span className="text-gray-400">KI-Features</span>
                </li>
              </ul>

              <Link
                href="/auth/register"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-medium text-center block transition-colors"
              >
                Kostenlos starten
              </Link>
            </div>

            {/* Basis Plan */}
            <div className="bg-white rounded-xl p-8 border-2 border-blue-200 hover:border-blue-300 transition-colors relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basis Plan</h3>
                <div className="text-4xl font-bold text-blue-600 mb-1">€19</div>
                <div className="text-gray-500 mb-4">/Monat</div>
                <p className="text-gray-600 mb-6">Für kleine Trainings</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Eigene Subdomain</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Unbegrenzte Kurse</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Bis zu 100 Teilnehmer</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>E-Mail Support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-3">✗</span>
                  <span className="text-gray-400">KI-Features</span>
                </li>
              </ul>

              <Link
                href="/auth/register"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium text-center block transition-colors"
              >
                Basis Plan wählen
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-xl p-8 border-2 border-yellow-400 hover:border-yellow-500 transition-colors relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold">
                  👑 BELIEBT
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold text-yellow-600 mb-1">€49</div>
                <div className="text-gray-500 mb-4">/Monat</div>
                <p className="text-gray-600 mb-6">Für professionelle Trainer</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="font-medium">Alles aus Basis Plan</span>
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-3">🤖</span>
                  <span>KI-Kurs Generator</span>
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
                  <span className="text-yellow-500 mr-3">⚡</span>
                  <span>Priority Support</span>
                </li>
              </ul>

              <Link
                href="/auth/register"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-6 rounded-lg font-bold text-center block transition-colors"
              >
                Pro Plan wählen
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              Alle Pläne inklusive: SSL-Zertifikat, 99,9% Uptime, Mobile Apps, API Zugang
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Das sagen unsere Kunden
            </h2>
            <p className="text-xl text-gray-600">
              Über 1.000 Trainer vertrauen bereits auf Royal Academy K.I.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Die KI-gestützte Kurserstellung hat mein Business revolutioniert.
                Ich erstelle jetzt 10x schneller professionelle Trainings!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  SM
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Müller</div>
                  <div className="text-gray-500">Digital Marketing Trainerin</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Endlich eine Plattform, die alles kann! Von der Kurserstellung
                bis zur Teilnehmerverwaltung - einfach perfekt."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  TK
                </div>
                <div>
                  <div className="font-bold text-gray-900">Thomas Klein</div>
                  <div className="text-gray-500">IT-Security Experte</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Die CrewAI Teams betreuen meine Teilnehmer rund um die Uhr.
                Mein Umsatz hat sich verdoppelt seit ich Royal Academy nutze!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  LW
                </div>
                <div>
                  <div className="font-bold text-gray-900">Lisa Weber</div>
                  <div className="text-gray-500">Business Coach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Bereit für Ihre eigene KI-Training Academy?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Starten Sie noch heute und erstellen Sie in wenigen Minuten
            Ihre professionelle Online-Training Plattform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-lg text-lg font-bold transition-colors"
            >
              🚀 Jetzt kostenlos starten
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white hover:bg-white hover:text-blue-900 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
            >
              Bereits Kunde? Anmelden
            </Link>
          </div>

          <p className="text-sm text-blue-200 mt-6">
            🔒 100% sicher • 💰 14 Tage Geld-zurück-Garantie • 🚫 Keine versteckten Kosten
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img
                  src="/logo-royal-academy.svg"
                  alt="Royal Academy K.I."
                  className="h-10 w-auto mr-3"
                  onError={(e) => {
                    // Try PNG, then JPG, then crown emoji
                    if (e.currentTarget.src.includes('.svg')) {
                      e.currentTarget.src = '/logo-royal-academy.png'
                    } else if (e.currentTarget.src.includes('.png')) {
                      e.currentTarget.src = '/logo-royal-academy.jpg'
                    } else {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }
                  }}
                />
                <div className="h-8 w-8 bg-yellow-400 rounded-full items-center justify-center mr-3" style={{display: 'none'}}>
                  <span className="text-lg">👑</span>
                </div>
                <h3 className="text-xl font-bold">Royal Academy K.I.</h3>
              </div>
              <p className="text-gray-400">
                Die führende KI-gestützte Plattform für professionelle Online-Trainings.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Preise</a></li>
                <li><a href="/auth/register" className="hover:text-white">Kostenlos testen</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white">Hilfe Center</a></li>
                <li><a href="/contact" className="hover:text-white">Kontakt</a></li>
                <li><a href="/status" className="hover:text-white">System Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Unternehmen</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">Über uns</a></li>
                <li><a href="/privacy" className="hover:text-white">Datenschutz</a></li>
                <li><a href="/terms" className="hover:text-white">AGB</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Royal Academy K.I. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}