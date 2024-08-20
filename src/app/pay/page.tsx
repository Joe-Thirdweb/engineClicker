'use client'
import Image from "next/image";
import { ConnectButton, PayEmbed, useActiveAccount } from "thirdweb/react";
import { client } from "../client";


import { deployPublishedContract } from "thirdweb/deploys";
import { createThirdwebClient, getContract } from "thirdweb";
import { base, polygonAmoy, sepolia } from "thirdweb/chains";
import { useDebugValue, useEffect, useState } from "react";
import { claimTo } from "thirdweb/extensions/erc721";



export default function Home() {

  const client = createThirdwebClient({ clientId: "f13af0ca11d29075adf9b8358ce875ed" })
  const account = useActiveAccount()

  const contract = getContract({
    client:client,
    chain:polygonAmoy,
    address:"0x94A2dD0a0BD2F420f3734Ed8498CBd61f12A6262"
  })



  return (
    <div className="flex min-w-full justify-center space-x-5 pt-10">
            <ConnectButton client={client}/>

      <div>
        <PayEmbed
          client={client}
          payOptions={{
            mode: "fund_wallet",
          }}
        />
      </div>

      <div>
        <PayEmbed
          client={client}
          payOptions={{
            mode: "direct_payment",
            paymentInfo: {
              sellerAddress: "0x121B384A56C715E9F7E6C0f9E3321BDB0d711D0D",
              chain: base,
              amount: "0.1",
            },
            metadata: {
              name: "Black Hoodie (Size L) - Direct Payment",
              image: "https://example.com/image.png",
            },
          }}
        />
        <code>
        {` client={client}
          payOptions={{
            mode: "direct_payment",
            paymentInfo: {
              sellerAddress: "0x121B384A56C715E9F7E6C0f9E3321BDB0d711D0D",
              chain: base,
              amount: "0.1",
            },
            metadata: {
              name: "Black Hoodie (Size L) - Direct Payment",
              image: "https://example.com/image.png",
            },
          }}`
         
        }
        </code>
      </div>

      <div>
        <PayEmbed
          client={client}
          payOptions={{
            mode: "transaction",
            transaction: claimTo({
              contract:contract,
              to: account?.address!,
              quantity:1n
            }),
            metadata: {
              name: "Buy me a coffee",
              image: "https://example.com/image.png",
            },
          }}
        />
      </div>
    </div>
  )
}

