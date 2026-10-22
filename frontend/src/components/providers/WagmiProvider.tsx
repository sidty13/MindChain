import { createConfig, http, WagmiProvider } from "wagmi";
import { base, optimism } from "wagmi/chains";
import { baseAccount, injected, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
  chains: [base, optimism],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
  },
  connectors: [
    // Farcaster MiniApp (for Farcaster users)
    farcasterMiniApp(),

    // Injected connector (for MetaMask, Rabby, etc.)
    injected({
      target: "metaMask",
    }),

    // Coinbase Wallet
    coinbaseWallet({
      appName: "IsYourDayOk",
      preference: "all", // tries both extension and web/mobile SDK
    }),

    // Base Account (Smart Wallet)
    baseAccount({
      appName: "IsYourDayOk",
      appLogoUrl: "/icons/IsYourDayOkfinal.png",
    }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
