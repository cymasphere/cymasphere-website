 import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check for admin auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const awsEnv = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.slice(0, 8)}...` : 'NOT_SET',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.slice(0, 8)}...` : 'NOT_SET',
    AWS_REGION: process.env.AWS_REGION || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
    CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'NOT_SET'
  }

  return NextResponse.json({ 
    message: 'AWS Environment Variables Check',
    environment: awsEnv
  })
} 