'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

export default function SupportPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('contact')

  return (
    <DashboardLayout
      title="Support & Hilfe"
      description="Wir helfen Ihnen gerne weiter"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📧 Kontakt
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faq'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ❓ FAQ
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'docs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📚 Dokumentation
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontaktieren Sie uns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-900 mb-2">📧 E-Mail Support</h4>
                      <p className="text-blue-700 text-sm mb-4">
                        Für allgemeine Fragen und technischen Support
                      </p>
                      <a
                        href="mailto:support@kurs24.io"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block"
                      >
                        support@kurs24.io
                      </a>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h4 className="font-semibold text-green-900 mb-2">💰 Billing Support</h4>
                      <p className="text-green-700 text-sm mb-4">
                        Für Fragen zu Rechnungen und Abonnements
                      </p>
                      <a
                        href="mailto:billing@kurs24.io"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block"
                      >
                        billing@kurs24.io
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📝 Support-Ticket erstellen</h4>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={session?.user?.name || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                        <input
                          type="email"
                          value={session?.user?.email || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Kurze Beschreibung Ihres Anliegens"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Beschreiben Sie Ihr Problem oder Ihre Frage detailliert..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Ticket senden
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Häufig gestellte Fragen</h3>

                <div className="space-y-4">
                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      🌐 Wie erstelle ich eine Subdomain?
                    </summary>
                    <div className="mt-3 text-gray-600 text-sm">
                      Gehen Sie zu "Subdomains" im Dashboard und klicken Sie auf "Subdomain erstellen".
                      Wählen Sie einen Namen und bestätigen Sie. Die Einrichtung dauert 5-10 Minuten.
                    </div>
                  </details>

                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      💳 Wie kann ich meinen Plan ändern?
                    </summary>
                    <div className="mt-3 text-gray-600 text-sm">
                      Gehen Sie zu "Billing" im Dashboard und wählen Sie den gewünschten Plan.
                      Plan-Upgrades sind sofort aktiv, Downgrades zum nächsten Abrechnungszyklus.
                    </div>
                  </details>

                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      🤖 Wie funktioniert der KI-Assistent?
                    </summary>
                    <div className="mt-3 text-gray-600 text-sm">
                      Der KI-Assistent (Pro Plan) hilft bei der automatischen Kurserstellung,
                      Content-Optimierung und Quiz-Generierung. Aktivieren Sie ihn in den KI-Einstellungen.
                    </div>
                  </details>

                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      📄 Wo finde ich meine Rechnungen?
                    </summary>
                    <div className="mt-3 text-gray-600 text-sm">
                      Alle Rechnungen finden Sie unter "Billing" → "Rechnungshistorie".
                      Sie können PDFs herunterladen und Zahlungsdetails einsehen.
                    </div>
                  </details>

                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      🔒 Ist meine Academy SSL-verschlüsselt?
                    </summary>
                    <div className="mt-3 text-gray-600 text-sm">
                      Ja, alle kurs24.io Subdomains erhalten automatisch ein kostenloses SSL-Zertifikat.
                      Die Verschlüsselung ist innerhalb von 5-10 Minuten nach Erstellung aktiv.
                    </div>
                  </details>
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumentation</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">🚀 Erste Schritte</h4>
                    <p className="text-blue-700 text-sm mb-4">
                      Lernen Sie, wie Sie Ihre erste Academy erstellen
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Account einrichten</li>
                      <li>• Plan auswählen</li>
                      <li>• Subdomain erstellen</li>
                      <li>• Erste Kurse anlegen</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">🎨 Design & Anpassung</h4>
                    <p className="text-green-700 text-sm mb-4">
                      Personalisieren Sie Ihre Academy
                    </p>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• Logo hochladen</li>
                      <li>• Farben anpassen</li>
                      <li>• Custom Domain (Pro)</li>
                      <li>• Branding-Optionen</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">🤖 KI-Features</h4>
                    <p className="text-purple-700 text-sm mb-4">
                      Nutzen Sie KI für bessere Kurse
                    </p>
                    <ul className="text-sm text-purple-600 space-y-1">
                      <li>• Automatische Kurserstellung</li>
                      <li>• Content-Optimierung</li>
                      <li>• Quiz-Generierung</li>
                      <li>• LangGraph Workflows</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h4 className="font-semibold text-orange-900 mb-2">📊 Analytics & Reports</h4>
                    <p className="text-orange-700 text-sm mb-4">
                      Verfolgen Sie den Lernerfolg
                    </p>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>• Teilnehmer-Statistiken</li>
                      <li>• Lernfortschritt</li>
                      <li>• Completion Rates</li>
                      <li>• Export-Funktionen</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}