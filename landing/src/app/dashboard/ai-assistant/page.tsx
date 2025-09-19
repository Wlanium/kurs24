'use client'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

export default function AIAssistantPage() {
  return (
    <DashboardLayout
      title="KI-Assistent"
      description="GPT-4 & Claude Integration für automatische Kurserstellung"
    >
      <div className="space-y-6">
        {/* AI Models Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🤖 Verfügbare KI-Modelle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-900">GPT-4 Turbo</h4>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Aktiv</span>
              </div>
              <p className="text-sm text-green-700 mb-2">Neuestes OpenAI Modell für komplexe Aufgaben</p>
              <div className="text-xs text-green-600">
                Verwendet: 89 Requests diesen Monat
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-900">Claude 3.5 Sonnet</h4>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Aktiv</span>
              </div>
              <p className="text-sm text-blue-700 mb-2">Anthropic's neuestes Modell für Analyse & Code</p>
              <div className="text-xs text-blue-600">
                Verwendet: 45 Requests diesen Monat
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Schnellaktionen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left transition-colors">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-semibold">Kurs erstellen</h4>
              <p className="text-sm opacity-90 mt-1">Automatisch mit KI generieren</p>
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-left transition-colors">
              <div className="text-2xl mb-2">✨</div>
              <h4 className="font-semibold">Content optimieren</h4>
              <p className="text-sm opacity-90 mt-1">Bestehende Inhalte verbessern</p>
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left transition-colors">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold">Quiz generieren</h4>
              <p className="text-sm opacity-90 mt-1">Automatische Wissensprüfung</p>
            </button>
          </div>
        </div>

        {/* Recent AI Activities */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Letzte KI-Aktivitäten</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Kurs "Python für Anfänger" erstellt</h4>
                <p className="text-sm text-gray-600 mt-1">
                  GPT-4 hat einen vollständigen Python-Grundkurs mit 12 Lektionen generiert
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs text-gray-500">vor 2 Stunden</span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Kurs anzeigen</button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">✨</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Quiz für "JavaScript Basics" optimiert</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Claude hat 15 neue Fragen generiert und bestehende verbessert
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs text-gray-500">vor 1 Tag</span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Quiz anzeigen</button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">📊</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Lernfortschritt-Analyse erstellt</h4>
                <p className="text-sm text-gray-600 mt-1">
                  KI hat Teilnehmer-Performance analysiert und Verbesserungsvorschläge gemacht
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-xs text-gray-500">vor 3 Tagen</span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Bericht anzeigen</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ KI-Einstellungen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard KI-Modell für Kurserstellung
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="gpt-4">GPT-4 Turbo (empfohlen)</option>
                <option value="claude">Claude 3.5 Sonnet</option>
                <option value="auto">Automatisch auswählen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kreativitäts-Level
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value="70"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Konservativ</span>
                <span>Ausgewogen</span>
                <span>Kreativ</span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-improve"
                checked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-improve" className="ml-2 block text-sm text-gray-700">
                Automatische Inhalts-Optimierung aktivieren
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="multilingual"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="multilingual" className="ml-2 block text-sm text-gray-700">
                Mehrsprachige Kurse unterstützen
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Einstellungen speichern
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}