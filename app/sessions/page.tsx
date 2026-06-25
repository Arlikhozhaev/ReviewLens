import { Suspense } from "react";
import type { Metadata } from "next";
import { SessionsPageClient } from "./sessions-page-client";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Your past ReviewLens analyses",
};

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsPageClient />
    </Suspense>
  );
}
