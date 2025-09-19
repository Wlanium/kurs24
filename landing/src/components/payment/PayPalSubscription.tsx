'use client'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useState } from 'react'

interface PayPalSubscriptionProps {
  planId: 'basis' | 'pro'
  onSuccess?: (subscription: any) => void
  onError?: (error: any) => void
  onCancel?: () => void
}

const PLAN_PRICES = {
  basis: '19.00',
  pro: '49.00'
}

const PLAN_NAMES = {
  basis: 'Basis Plan',
  pro: 'Pro Plan'
}

export default function PayPalSubscription({
  planId,
  onSuccess,
  onError,
  onCancel
}: PayPalSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const createOrder = (data: any, actions: any) => {
    setIsLoading(true)

    // For now, use single payments instead of subscriptions for sandbox testing
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: PLAN_PRICES[planId]
        },
        description: `${PLAN_NAMES[planId]} - Monatliche Zahlung`,
        custom_id: `user_payment_${planId}_${Date.now()}`
      }],
      application_context: {
        brand_name: 'Royal Academy K.I.',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    })
  }

  const onApprove = async (data: any, actions: any) => {
    try {
      // Capture the order
      const order = await actions.order.capture()

      // Call backend API to save payment details
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: data.orderID,
          planId: planId,
          status: order.status,
          amount: PLAN_PRICES[planId],
          currency: 'EUR',
          paypalData: order
        })
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess?.(result)
      } else {
        throw new Error('Failed to save payment')
      }
    } catch (error) {
      console.error('Payment approval error:', error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  const onPayPalError = (error: any) => {
    console.error('PayPal error:', error)
    setIsLoading(false)
    onError?.(error)
  }

  const onPayPalCancel = (data: any) => {
    console.log('PayPal cancelled:', data)
    setIsLoading(false)
    onCancel?.()
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {PLAN_NAMES[planId]} abonnieren
          </h3>
          <div className="text-3xl font-bold text-blue-600">
            €{PLAN_PRICES[planId]}
            <span className="text-lg text-gray-500">/Monat</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Automatische monatliche Verlängerung • Jederzeit kündbar
          </p>
        </div>

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb',
            intent: 'capture',
            currency: 'EUR'
          }}
        >
          <div className="paypal-container">
            <PayPalButtons
              style={{
                shape: 'rect',
                color: 'blue',
                layout: 'vertical',
                label: 'pay'
              }}
              disabled={isLoading}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onPayPalError}
              onCancel={onPayPalCancel}
            />
          </div>
        </PayPalScriptProvider>

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Abonnement wird verarbeitet...</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            Durch das Abonnieren stimmen Sie unseren{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Nutzungsbedingungen
            </a>{' '}
            und{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Datenschutzrichtlinien
            </a>{' '}
            zu.
          </p>
        </div>
      </div>
    </div>
  )
}