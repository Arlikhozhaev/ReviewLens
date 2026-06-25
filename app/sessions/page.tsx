import type { Metadata } from "next";
import { SessionsPageClient } from "./sessions-page-client";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Your past ReviewLens analyses on this device",
};

export default function SessionsPage() {
  return <SessionsPageClient />;
}
