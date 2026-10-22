"use client";

import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next";
import FrameProvider from "~/components/providers/FrameProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

const ErudaProvider = dynamic(
  () => import("~/components/providers/ErudaProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        {/* <Analytics /> */}
        {children}
      </FrameProvider>
    </WagmiProvider>
  );
}
