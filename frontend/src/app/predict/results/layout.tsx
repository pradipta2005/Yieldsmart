import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forecast Results | YieldSmart",
  description: "View your personalized crop yield forecast and environmental drivers.",
  openGraph: {
    title: "Forecast Results | YieldSmart",
    description: "Personalized AI crop yield forecast based on soil and weather data.",
  }
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
