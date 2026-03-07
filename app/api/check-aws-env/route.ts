 import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'Server configuration error: CRON_SECRET not set' },
      { status: 500 }
    )
  }
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const awsEnv = {
    AWS_ACCESS_KEY_ID_SET: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY_SET: !!process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
    CRON_SECRET_SET: !!process.env.CRON_SECRET
  }

  return NextResponse.json({ 
    message: 'AWS Environment Variables Check',
    environment: awsEnv
  })
} 