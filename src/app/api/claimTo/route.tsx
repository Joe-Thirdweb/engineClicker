import { NextResponse } from 'next/server';

export async function POST(req: { json: () => PromiseLike<{ address: any; }> | { address: any; }; }) {
  const { address } = await req.json();

  const engineURL = process.env.ENGINE_URL;
  const tokenAddress = process.env.NEXT_PUBLIC_ERC_20_TOKEN_ADDRESS;
  const chainID = process.env.NEXT_PUBLIC_CHAIN;
  const engingAccessToken = process.env.ENGINE_ACCESS_TOKEN;

  try {
    const response = await fetch(
      `${engineURL}contract/${chainID}/${tokenAddress}/erc20/balance-of?wallet_address=${address}`,
      {
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