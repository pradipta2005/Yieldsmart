import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yield Forecast | YieldSmart",
  description: "Calculate expected crop yields using AI, soil analytics, and local weather patterns.",
  openGraph: {
    title: "Yield Forecast | YieldSmart",
    description: "Plan your harvest. Calculate expected crop yields with AI-powered analytics.",
  }
};

export default function PredictLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
