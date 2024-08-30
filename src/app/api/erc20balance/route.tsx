import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  const engineURL = process.env.ENGINE_URL;
  const tokenAddress = process.env.NEXT_PUBLIC_ERC_20_TOKEN_ADDRESS;
  const chainID = process.env.NEXT_PUBLIC_CHAIN;
  const engingAccessToken = process.env.ENGINE_ACCESS_TOKEN;

  try {
    const response = await fetch(
        `${engineURL}contract/${chainID}/${tokenAddress}/erc20/balance-of?wallet_address=${address}`,
        {
          method:"GET",
          headers: {
            authorization: `Bearer ${engingAccessToken}`,
          },
        }
      );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error:any) {
    console.error('Minting error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}