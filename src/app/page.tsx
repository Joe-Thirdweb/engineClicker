"use client";
import { ConnectButton, MediaRenderer, useActiveAccount } from "thirdweb/react";

import { createThirdwebClient } from "thirdweb";
import { useDebugValue, useEffect, useRef, useState } from "react";


export default function Home() {
  const clientKey = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  });
  const account = useActiveAccount();

  const backendWalletAddress = process.env.NEXT_PUBLIC_ENGINE_BACKEND_WALLET!;
  const engingAccessToken = process.env.ENGINE_ACCESS_TOKEN!;
  const tokenAddress = process.env.NEXT_PUBLIC_ERC_20_TOKEN_ADDRESS!;
  const nftDropContractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS!;


  const [numClicked, setNumClicked] = useState(0);
  const [owned, setOwned] = useState(false);
  const [nft, setNFT] = useState();
  const [erc20Tokens, setERC20Tokens] = useState();

  const [data, setData] = useState<object[]>([]);
  const firstRunRef = useRef(true);
  const [error, setError] = useState(null);

  const increment = async () => {
    let num = numClicked;
    num++;
    setNumClicked(num);

    const response = await fetch('/api/claimTo',{
      method:'POST',
      body: JSON.stringify({
        address:account!.address,
      })
    })

  };

  const fetchGatedBalance = async () => {
    const resp = await fetch(`/api/gatedBalance?address=${account!.address}`, {
      method: 'GET',
    })

    const data = await resp.json();
    const result = data.result

    if (result && result.length > 0) {
      setOwned(true);
      setNFT(result[0].metadata.image);
    } else {
      console.log("undefined");
    }
  };

  const getERC20TokenBalence = async () => {
    const resp = await fetch(`/api/erc20balance?address=${account!.address}`, {
      method: 'GET',
    })
    const {data} = await resp.json();

    const result = data.result
    if (result) {
      setERC20Tokens(result.displayValue);
    }
  };

  const mint = async () => {
    const resp = await fetch(`/api/mintPass`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${engingAccessToken}`,
          "x-backend-wallet-address": `${backendWalletAddress}`,
        },
        body: JSON.stringify({
          address:account!.address
        }),
      }
    );

    const {data} = await resp.json();
    const result = data.result

    if(result){
      fetchGatedBalance()
    }
  };

  const isNewData = (existingData: any[], newData: { queueId: any; status: any; fromAddress: string }): boolean => {
    // First, check if the fromAddress matches backendWalletAddress
    if (newData.fromAddress !== backendWalletAddress) {
      return false; // or true, depending on your requirements for non-matching addresses
    }
  
    // Then, check if there's any existing data with the same queueId and status
    const isDuplicate = existingData.some(
      (item) => item.queueId === newData.queueId && item.status === newData.status
    );
  
    // Return true if it's not a duplicate (i.e., it's new data)
    return !isDuplicate;
  };

  useEffect(() => {
    const fetchWebhookData = async () => {
      if (account) {
        try {

          // const timestamp = Math.floor(Date.now() / 1000);
          // const signature = await generateSignature(
          //   "",
          //   timestamp.toString(),
          //   webhook
          // ); 
          const response = await fetch("/api/webhook", {
            method: "GET",
            // headers: {
            //   "Content-Type": "application/json",
            //   "x-engine-signature": signature,
            //   "x-engine-timestamp": timestamp.toString(),
            // },
          });
          const result = await response.json();

          console.log(result)


          if (result && result.fromAddress.toLowerCase() == backendWalletAddress.toLowerCase() && (result.toAddress.toLowerCase() == tokenAddress.toLowerCase() || result.toAddress.toLowerCase() == nftDropContractAddress.toLowerCase())) {
            setData((prevData) => {
              if (firstRunRef.current) {
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
      }
    };

    fetchWebhookData()

    // Fetch data every 10 seconds
    const intervalId = setInterval(fetchWebhookData, 1000);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchGatedBalance();
      getERC20TokenBalence();
    }
  },[account]);

  return (
    <div className="flex-row pl-2 justify-center items-center min-w-full">
      <div className="flex justify-center pt-10">
        <ConnectButton client={clientKey} />
      </div>

      {account && (
        <div>
          {owned ? (
        <div className="">
          Click anywhere in the highlighted are to earn tokens!
          <div
            className="flex-row py-10 bg-slate-600"
            onClick={() => increment()}
          >
            <div>
              Here is your Access Pass!
              <MediaRenderer client={clientKey} src={nft}></MediaRenderer>
            </div>
          </div>
          <div>
            <div>
              <div>Tokens Owned: {erc20Tokens}</div>
              <div className="pt-12">Number of times clicked:{numClicked}</div>
              <button
                className=" bg-blue-600 rounded-md p-3"
                onClick={() => {
                  getERC20TokenBalence();
                  setNumClicked(0);
                }}
              >
                Reset/View Updated Tokens
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex pt-5 justify-center">
          <button className="bg-blue-600 rounded-md p-3" onClick={() => mint()}>
            Mint your pass
          </button>
        </div>
      )}

      <div className="pt-10 text-xl">
        Transactions List (Polls Every Second):{" "}
      </div>
      {data.length > 0 ? <TwoColumnTable data={data} /> : <div></div>}
        </div>
      )}
      
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
