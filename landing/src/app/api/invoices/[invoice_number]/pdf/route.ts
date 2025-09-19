import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(
  request: NextRequest,
  { params }: { params: { invoice_number: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://kurs24-api:8000'
    const response = await fetch(`${backendUrl}/api/v1/invoices/${params.invoice_number}/pdf`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Backend API error' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('PDF API error:', error)

    // Return mock response as fallback
    return NextResponse.json({
      status: "success",
      message: "PDF-Generation noch nicht verfügbar (Development Mode)",
      invoice_number: params.invoice_number,
      download_available: false
    })
  }
}