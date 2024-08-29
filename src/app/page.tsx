"use client";
import { ConnectButton, MediaRenderer, useActiveAccount } from "thirdweb/react";

import { createThirdwebClient } from "thirdweb";
import { useDebugValue, useEffect, useRef, useState } from "react";

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

  const [data, setData] = useState<object[]>([]);
  const firstRunRef = useRef(true);
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

  const isNewData = (existingData: any[], newData: { queueId: any; status: any }) => {
    return !existingData.some((item) => 
      item.queueId === newData.queueId && item.status === newData.status
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
        const response = await fetch("/api/webhook", {
          method: "GET",
          // headers: {
          //   "Content-Type": "application/json",
          //   "x-engine-signature": signature,
          //   "x-engine-timestamp": timestamp.toString(),
          // },
        });
        const result = await response.json();

        if (result) {
          setData((prevData) => {
            if (firstRunRef.current) {
              console.log("first run");
              firstRunRef.current = false;
              return [result];
            } else {
              console.log("checking for new data");
              if (isNewData(prevData, result)) {
                console.log("new data found, appending");
                return [...prevData, result];
              } else {
                console.log("data already exists, not appending");
                return prevData;
              }
            }
          });
        }
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

      <div>Transactions</div>
      {data.length > 0 ? <TwoColumnTable data={data} /> : <div></div>}
    </div>
  );
}

const TwoColumnTable = (data: any) => {
  console.log(data);
  console.log(typeof data);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full ">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">Queue ID</th>
          </tr>
        </thead>
        <tbody>
          {data.data &&
            data.data.map((item: any, index: number) => (
              <tr key={item.queueId || index}>
                <td className="py-2 px-4 border-b">{item.status || "N/A"}</td>
                <td className="py-2 px-4 border-b">{item.queueId || "N/A"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
