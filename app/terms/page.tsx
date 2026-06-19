import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of ReviewLens.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container max-w-2xl flex-1 py-16 md:py-20">
        <h1 className="text-report-h1">Terms of Service</h1>

        <p className="mt-2 text-xs text-muted-foreground">
          Last updated June 17, 2026
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-sm font-semibold">Agreement</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              By accessing or using ReviewLens, you agree to these Terms of
              Service. If you do not agree with these terms, please do not use
              the service.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              What ReviewLens does
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              ReviewLens analyzes customer review data provided through CSV
              uploads and generates AI-powered sentiment analysis, theme
              clustering, summaries, and insights. Results are intended to
              assist decision-making and should not be treated as guaranteed
              facts or professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Your data</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You are responsible for any content you upload. Do not upload
              data that you do not have permission to use, or content that is
              unlawful, harmful, abusive, or infringes on the rights of
              others. You retain ownership of your uploaded data.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              Accuracy of results
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              AI-generated outputs may be inaccurate, incomplete, biased, or
              misleading. ReviewLens does not guarantee the correctness of any
              analysis, summary, classification, or recommendation.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              Acceptable use
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You may not misuse, disrupt, overload, reverse engineer, or
              attempt unauthorized access to ReviewLens. Automated abuse,
              scraping, or attempts to interfere with service operation are
              prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              No warranty
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              ReviewLens is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis,
              without warranties of any kind, express or implied, including
              availability, reliability, accuracy, or fitness for a particular
              purpose.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              Limitation of liability
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To the fullest extent permitted by law, ReviewLens and its
              creators shall not be liable for any direct, indirect,
              incidental, consequential, or special damages arising from use
              of the service or reliance on its outputs.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Changes</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These terms may be updated from time to time as the product
              evolves. Continued use of ReviewLens after updates constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Contact</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If you have questions regarding these terms, please contact the
              ReviewLens team.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
