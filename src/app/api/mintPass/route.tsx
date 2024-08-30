import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  const engineURL = process.env.ENGINE_URL;
  const nftDropContractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS;
  const chainID = process.env.NEXT_PUBLIC_CHAIN;
  const engingAccessToken = process.env.ENGINE_ACCESS_TOKEN;
  const backendWalletAddress = process.env.NEXT_PUBLIC_ENGINE_BACKEND_WALLET;


  try {
    const response = await fetch(
        `${engineURL}contract/${chainID}/${nftDropContractAddress}/erc1155/claim-to`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${engingAccessToken}`,
            "x-backend-wallet-address": `${backendWalletAddress}`,
          },
          body: JSON.stringify({
            receiver: address,
            tokenId: "0",
            quantity: "1",
          }),
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