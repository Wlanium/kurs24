'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const FREE_AVATARS = [
  '👤', '👨', '👩', '🧑', '👶', '👵', '👴', '🧒', '👦', '👧',
  '🤵', '👰', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎓', '👩‍🎓',
  '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍🏫', '👨‍🏫', '👩‍🏫',
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🐱', '🐶', '🐺', '🦊',
  '🚀', '⭐', '🌟', '💫', '🌙', '☀️', '🌈', '🔥', '💎', '👑',
  '🎯', '🎪', '🎨', '🎭', '🎪', '🎸', '🎹', '🎤', '🎧', '📚'
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('👤')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Load user stats including avatar
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/user/stats')
        if (response.ok) {
          const statsData = await response.json()
          setStats(statsData)
          setSelectedAvatar(statsData.avatar || '👤')
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }

    if (session?.user) {
      loadStats()
    }
  }, [session])

  const handleAvatarUpdate = async (avatar: string) => {
    if (!session?.user?.email) return

    setLoading(true)
    try {
      const response = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          avatar: avatar
        })
      })

      if (response.ok) {
        setSelectedAvatar(avatar)
        setShowAvatarSelector(false)
        // Refresh stats to get updated avatar
        const statsResponse = await fetch('/api/user/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } else {
        alert('❌ Fehler beim Aktualisieren des Profilbilds')
      }
    } catch (error) {
      console.error('Avatar update error:', error)
      alert('❌ Fehler beim Aktualisieren des Profilbilds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Einstellungen"
      description="Account & Profil verwalten"
    >
      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Profil</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl border-2 border-gray-200">
                {selectedAvatar}
              </div>
              <div>
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? 'Wird gespeichert...' : 'Profilbild ändern'}
                </button>
                <p className="text-xs text-gray-500 mt-1">Kostenlose Icons verfügbar</p>
              </div>
            </div>

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
          </div>
        </div>

        {/* Academy Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏫 Academy Einstellungen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academy Name</label>
              <input
                type="text"
                value="Mustermann Training Academy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                rows={3}
                value="Professionelle IT-Trainings und Weiterbildungen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Benachrichtigungen</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">E-Mail Benachrichtigungen</h4>
                <p className="text-sm text-gray-500">Erhalten Sie Updates über neue Teilnehmer</p>
              </div>
              <input type="checkbox" checked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Rechnungs-Erinnerungen</h4>
                <p className="text-sm text-gray-500">Benachrichtigung vor Abbuchungen</p>
              </div>
              <input type="checkbox" checked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Sicherheit</h3>
          <div className="space-y-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-left">
              Passwort ändern
            </button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-left">
              Account löschen
            </button>
          </div>
        </div>

        {/* Avatar Selector Modal */}
        {showAvatarSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎨 Profilbild auswählen
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Wählen Sie ein kostenloses Icon als Ihr Profilbild:
              </p>
              <div className="grid grid-cols-6 gap-3 mb-6">
                {FREE_AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarUpdate(avatar)}
                    disabled={loading}
                    className={`w-12 h-12 rounded-full bg-gray-100 border-2 flex items-center justify-center text-xl hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                      selectedAvatar === avatar ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium"
                  disabled={loading}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}