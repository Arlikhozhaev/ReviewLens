import { redirect } from "next/navigation";

/** Team workspaces are deferred; collaboration is share-link first. */
export default function TeamPage() {
  redirect("/sessions");
}
