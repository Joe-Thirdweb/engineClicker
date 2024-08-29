"use client";
import { ConnectButton, MediaRenderer, useActiveAccount } from "thirdweb/react";

import { createThirdwebClient } from "thirdweb";
import { useDebugValue, useEffect, useState } from "react";

import { generateSignature } from "../lib/webhookhelper";

export default function Home() {
  const clientKey = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  });
  const account = useActiveAccount();
  const chainID = process.env.NEXT_PUBLIC_CHAIN!;
  const nftDropContractAddress =
    process.env.NEXT_PUBLIC_NFT_DRROP_CONTRACT_ADDRESS!;
  const tokenAddress = process.env.NEXT_PUBLIC_ERC_20_TOKEN_ADDRESS;
  const backendWalletAddress = process.env.NEXT_PUBLIC_ENGINE_BACKEND_WALLET!;
  const engingAccessToken = process.env.NEXT_PUBLIC_ENGINE_ACCESS_TOKEN!;
  const engineURL = process.env.NEXT_PUBLIC_ENGINE_URL!;
  const webhook = process.env.NEXT_PUBLIC_WEBHOOK_SECRET!;

  const [numClicked, setNumClicked] = useState(0);
  const [owned, setOwned] = useState(false);
  const [nft, setNFT] = useState();
  const [erc20Tokens, setERC20Tokens] = useState();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const increment = () => {
    let num = numClicked;
    num++;
    setNumClicked(num);

    fetch(`${engineURL}contract/${chainID}/${tokenAddress}/erc20/claim-to`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${engingAccessToken}`,
        "x-backend-wallet-address": backendWalletAddress,
      },
      body: JSON.stringify({
        recipient: account?.address!,
        amount: "1",
      }),
    });
  };

  const fetchGatedBalance = async () => {
    const resp = await fetch(
      `${engineURL}contract/${chainID}/${nftDropContractAddress}/erc1155/get-owned?walletAddress=${account?.address}`,
      {
        headers: {
          authorization: `Bearer ${engingAccessToken}`,
        },
      }
    );

    const { result } = await resp.json();
    if (result && result.length > 0) {
      setOwned(true);
      setNFT(result[0].metadata.image);
    } else {
      console.log("undefined");
    }
  };

  const getERC20TokenBalence = async () => {
    const resp = await fetch(
      `${engineURL}contract/${chainID}/${tokenAddress}/erc20/balance-of?wallet_address=${account?.address}`,
      {
        headers: {
          authorization: `Bearer ${engingAccessToken}`,
        },
      }
    );
    const { result } = await resp.json();

    if (result) {
      setERC20Tokens(result.displayValue);
    }
  };

  const mint = async () => {
    const resp = await fetch(
      `${engineURL}contract/${chainID}/${nftDropContractAddress}/erc1155/claim-to`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${engingAccessToken}`,
          "x-backend-wallet-address": `${backendWalletAddress}`,
        },
        body: JSON.stringify({
          receiver: account?.address!,
          tokenId: "0",
          quantity: "1",
        }),
      }
    );
  };

  useEffect(() => {
    const fetchWebhookData = async () => {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = await generateSignature(
          "",
          timestamp.toString(),
          webhook
        );
        console.log(signature)
        const response = await fetch("/api/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-engine-signature": signature,
            "x-engine-timestamp": timestamp.toString(),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const result = await response.json();
        console.log("This is the result: ", result);
        console.log(result);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    };

    // Fetch data every 10 seconds
    const intervalId = setInterval(fetchWebhookData, 10000);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (account) {
      fetchGatedBalance();
    }
  });

  useEffect(() => {
    if (account) {
      getERC20TokenBalence();
    }
  }, [numClicked]);
  return (
    <div>
      <ConnectButton client={clientKey} />

      {owned ? (
        <div>
          <div>Tokens Owned: {erc20Tokens}</div>
          <div
            className="flex-row pt-20 bg-slate-600"
            onClick={() => increment()}
          >
            <div>
              <MediaRenderer client={clientKey} src={nft}></MediaRenderer>
            </div>

            {/* <button onClick={()=>increment()}>Click Me</button> */}
            <div>Number of times clicked:{numClicked}</div>
          </div>
          <div>
            <div>
              <button
                onClick={() => {
                  getERC20TokenBalence();
                  setNumClicked(0);
                }}
              >
                Reset Count
              </button>
            </div>

            <div>
              <button>Redeem</button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => mint()}>Mint your pass</button>
        </div>
      )}
    </div>
  );
}
