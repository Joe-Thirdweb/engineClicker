// pages/api/webhook.js

import { isValidSignature, isExpired } from "../../../lib/webhookhelper"; // Adjust the import path as necessary
import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_WEBHOOK_SECRET!;



export async function POST(req:NextRequest, res:NextResponse) {
  const body = await req.text();
  console.log("Body: ", body)

  if (req.method !== 'POST') {
    return NextResponse.json({message:"Method Not Allowed", status:405});
  }

  const signatureFromHeader = req.headers.get('x-engine-signature')
  const timestampFromHeader = req.headers.get('x-engine-timestamp');

  if (!signatureFromHeader) {
    return NextResponse.json({message:"Missing signature" + signatureFromHeader,status:401})
  }

  if (!timestampFromHeader) {
    return NextResponse.json({message:"Missing timestamp",status:401})
  }

  if (
    !isValidSignature(
      body,
      timestampFromHeader,
      signatureFromHeader,
      WEBHOOK_SECRET
    )
  ) {
    return NextResponse.json({message:"Invalid signature", status:401})
  }

  if (isExpired(timestampFromHeader, 300)) {
    // Assuming expiration time is 5 minutes (300 seconds)
    return NextResponse.json({message:"Request has expired"}, {status:401})
  }

  // Process the request
  return NextResponse.json({ message: 'Webhook received!' }, { status: 200 });

}
