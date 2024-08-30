import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  const engineURL = process.env.ENGINE_URL;
  const nftDropContractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS;
  const chainID = process.env.NEXT_PUBLIC_CHAIN;
  const engingAccessToken = process.env.ENGINE_ACCESS_TOKEN;

  try {
    const response = await fetch(
        `${engineURL}contract/${chainID}/${nftDropContractAddress}/erc1155/get-owned?walletAddress=${address}`,
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
    return NextResponse.json(data);
  } catch (error:any) {
    console.error('Gated Check Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}