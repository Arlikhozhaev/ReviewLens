export function buildDashboardShareUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/dashboard/${slug}`;
}

export function buildShareMailtoUrl(
  shareUrl: string,
  reportTitle?: string | null
): string {
  const subject = reportTitle
    ? `ReviewLens report: ${reportTitle}`
    : "ReviewLens analysis report";
  const body = [
    "Here's the review analysis report:",
    "",
    shareUrl,
    "",
    "Open the link to view themes, sentiment breakdown, and executive summary.",
  ].join("\n");

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
