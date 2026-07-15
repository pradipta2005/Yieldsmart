import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaf Disease Scanner | YieldSmart",
  description: "Upload a photo of your crop to instantly diagnose plant diseases and get treatment recommendations.",
  openGraph: {
    title: "Leaf Disease Scanner | YieldSmart",
    description: "Instantly diagnose plant diseases and get treatment recommendations.",
  }
};

export default function DiseaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
