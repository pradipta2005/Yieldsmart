import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | YieldSmart",
  description: "View real-time farm metrics, hyper-local weather intelligence, and personalized crop recommendations.",
  openGraph: {
    title: "YieldSmart Dashboard",
    description: "Real-time farm metrics, weather, and AI crop recommendations.",
  }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
