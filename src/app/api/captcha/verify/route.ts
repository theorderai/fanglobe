import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ success: false })

  const secret = process.env.HCAPTCHA_SECRET_KEY
  if (!secret) return NextResponse.json({ success: true }) // dev mode bypass

  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await res.json()
  return NextResponse.json({ success: data.success === true })
}