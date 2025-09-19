import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, avatar } = await request.json()

    if (!email || !avatar) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user can only update their own avatar
    if (session.user.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate avatar is from allowed list
    const FREE_AVATARS = [
      '👤', '👨', '👩', '🧑', '👶', '👵', '👴', '🧒', '👦', '👧',
      '🤵', '👰', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎓', '👩‍🎓',
      '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍🏫', '👨‍🏫', '👩‍🏫',
      '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🐱', '🐶', '🐺', '🦊',
      '🚀', '⭐', '🌟', '💫', '🌙', '☀️', '🌈', '🔥', '💎', '👑',
      '🎯', '🎪', '🎨', '🎭', '🎪', '🎸', '🎹', '🎤', '🎧', '📚'
    ]

    if (!FREE_AVATARS.includes(avatar)) {
      return NextResponse.json({ error: 'Invalid avatar selection' }, { status: 400 })
    }

    // Call backend API to update user avatar
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'
      console.log('🎨 Updating avatar for:', email, 'to:', avatar)

      // Use user ID directly from session if available
      const userId = (session.user as any).dbUserId
      let finalUserId: number

      if (!userId) {
        // Fallback to email lookup for older sessions
        const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(email)}/id`)
        if (!userIdResponse.ok) {
          throw new Error(`Failed to get user ID: ${userIdResponse.status}`)
        }
        const userIdData = await userIdResponse.json()
        finalUserId = userIdData.user_id
        console.log('🎨 Using user ID from fallback:', finalUserId)
      } else {
        finalUserId = userId
        console.log('🎨 Using user ID from session:', finalUserId)
      }

      const response = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: avatar
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend avatar update error:', errorData)
        return NextResponse.json({
          error: errorData.detail || 'Avatar update failed'
        }, { status: response.status })
      }

      const result = await response.json()
      console.log('✅ Avatar updated:', result)

      return NextResponse.json({
        success: true,
        message: 'Profilbild wurde erfolgreich aktualisiert',
        avatar: avatar
      })

    } catch (error) {
      console.error('💥 Backend avatar update call failed:', error)
      return NextResponse.json({
        error: 'Backend service unavailable'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Avatar update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    )
  }
}