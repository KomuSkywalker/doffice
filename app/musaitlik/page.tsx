import type { Metadata } from "next";
import { LinkNotice } from "@/components/LinkNotice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müsait saatler",
  robots: { index: false, follow: false },
};

export default function MusaitlikPage() {
  return <LinkNotice />;
}
