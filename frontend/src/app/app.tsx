"use client";

import dynamic from "next/dynamic";

const MentalHealth = dynamic(() => import("~/components/MentalHealth").then(mod => ({ default: mod.MentalHealth })), {
  ssr: false,
});

export default function App() {
  return <MentalHealth />;
}
