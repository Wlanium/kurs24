'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'

interface BillingRecord {
  id: number
  customer_email: string
  customer_name: string
  plan: string
  amount: number
  currency: string
  payment_method: string
  payment_id: string
  subdomain: string
  status: string
  invoice_number: string
  created_at: string
  billing_date: string
}

interface Invoice {
  invoice_number: string
  customer_email: string
  customer_name: string
  plan: string
  amount: number
  currency: string
  payment_date: string
  payment_method: string
  subdomain: string
  status: string
  pdf_url: string
}

export default function BillingHistoryPage() {
  const { data: session } = useSession()
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user?.email) {
      loadBillingData()
    }
  }, [session])

  const loadBillingData = async () => {
    try {
      setIsLoading(true)

      // Load billing history using the new user billing API
      const billingResponse = await fetch('/api/user/billing')
      if (billingResponse.ok) {
        const billingData = await billingResponse.json()
        setBillingHistory(billingData.billing_history || [])
      }

      // Load invoices using the new user-based invoice API
      const invoiceResponse = await fetch('/api/user/invoices')
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json()
        setInvoices(invoiceData.invoices || [])
      }

    } catch (error) {
      console.error('Failed to load billing data:', error)
      setError('Fehler beim Laden der Rechnungsdaten')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'basis': return 'Basis Plan'
      case 'pro': return 'Pro Plan'
      case 'free': return 'Kostenlos'
      default: return plan
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Bezahlt</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ Ausstehend</span>
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">❌ Fehlgeschlagen</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Rechnungshistorie" description="Ihre Zahlungen und Rechnungen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Rechnungsdaten...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Rechnungshistorie" description="Ihre Zahlungen und Rechnungen">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Gesamtumsatz</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatAmount(
                billingHistory.reduce((sum, record) => sum + record.amount, 0),
                'EUR'
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Rechnungen</h3>
            <p className="text-3xl font-bold text-green-600">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🏆 Aktuelle Pläne</h3>
            <p className="text-sm text-gray-600">
              {Array.from(new Set(billingHistory.map(r => r.plan))).map(getPlanDisplayName).join(', ') || 'Keine aktiven Pläne'}
            </p>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📄 Rechnungen</h2>
            <p className="text-sm text-gray-600 mt-1">Alle Ihre Rechnungen zum Download</p>
          </div>
          <div className="p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Rechnungen vorhanden</h3>
                <p className="text-gray-600">Sobald Sie einen Plan buchen, erscheinen hier Ihre Rechnungen.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rechnungsnummer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.invoice_number} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                          <div className="text-sm text-gray-500">{invoice.subdomain}.kurs24.io</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {getPlanDisplayName(invoice.plan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/api/invoices/${invoice.invoice_number}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            📥 PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Billing History Section */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">💳 Zahlungshistorie</h2>
            <p className="text-sm text-gray-600 mt-1">Detaillierte Übersicht aller Transaktionen</p>
          </div>
          <div className="p-6">
            {billingHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Zahlungen vorhanden</h3>
                <p className="text-gray-600">Ihre Zahlungshistorie wird hier angezeigt, sobald Sie einen Plan buchen.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaktions-ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zahlungsart
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {billingHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.payment_id}</div>
                          <div className="text-sm text-gray-500">{record.invoice_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.billing_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {getPlanDisplayName(record.plan)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{record.subdomain}.kurs24.io</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatAmount(record.amount, record.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            {record.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(record.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}