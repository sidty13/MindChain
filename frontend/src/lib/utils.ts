import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const METADATA = {
  name: "IsYourDayOk",
  tagline: "Track your mood and earn NFTs for building mental wellness habits",
  subtitle: "Your Daily Mental Wellness Companion on Base",
  description:
    "Track your mood and earn NFTs for building mental wellness habits",
  ogDescription:
    "Track your mood and earn NFTs for building mental wellness habits",
  longDescription:
    "IsYourDayOk helps you build lasting wellness habits through daily mood tracking, journaling, and meditation. Earn points for each activity and unlock achievement NFTs when you hit 7-day and 30-day streaks. Built on Base blockchain, your achievements are yours forever.",
  marketingTaglines: {
    primary: "Track your mood and earn NFTs for building mental wellness habits",
    alternative: [
      "Building better days, one check-in at a time",
      "Your mental wellness journey, rewarded on Base",
      "Daily habits. Lifetime achievements.",
    ],
  },
  features: [
    "Daily mood tracking with visual analytics",
    "Private journaling with streak rewards",
    "Guided meditation sessions",
    "Achievement NFTs for consistency milestones",
    "Points-based gamification system",
    "Community support through chat",
    "Social wallet integration for seamless onboarding",
  ],
  bannerImageUrl: `${
    process.env.NEXT_PUBLIC_URL ?? "https://is-your-day-ok.vercel.app"
  }/icons/og_image.png`,
  iconImageUrl: `${
    process.env.NEXT_PUBLIC_URL ?? "https://is-your-day-ok.vercel.app"
  }/icons/IsYourDayOkfinal.png`,
  homeUrl: process.env.NEXT_PUBLIC_URL ?? "https://is-your-day-ok.vercel.app",
  splashBackgroundColor: "#ffffff",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
