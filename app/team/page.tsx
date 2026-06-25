import type { Metadata } from "next";
import { TeamPageClient } from "./team-page-client";

export const metadata: Metadata = {
  title: "Team workspace",
  description: "Shared analyses and team members",
};

export default function TeamPage() {
  return <TeamPageClient />;
}
