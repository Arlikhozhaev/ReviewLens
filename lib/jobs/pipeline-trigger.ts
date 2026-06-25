import { waitUntil } from "@vercel/functions";
import { isInngestConfigured } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { inngest } from "@/inngest/client";
import { runAnalysisPipeline } from "@/features/analysis";

export interface TriggerPipelineOptions {
  sessionId: string;
  requestId?: string;
}

export type PipelineTriggerMode = "inngest" | "waitUntil";

/**
 * Inngest only actually executes jobs when the Inngest service is running and
 * synced with this app (Inngest Cloud in production, or `inngest-cli dev`
 * locally). If we queued to Inngest without a running worker, the job would sit
 * forever and the session would be stuck PROCESSING.
 *
 * So: queue to Inngest in production when configured; otherwise run the pipeline
 * in-process so local dev always completes. To exercise the Inngest path
 * locally, run `inngest-cli dev` and set INNGEST_RUN_IN_DEV=1.
 */
function shouldQueueWithInngest(): boolean {
  if (!isInngestConfigured()) return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.INNGEST_RUN_IN_DEV === "1";
}

export async function triggerAnalysisPipeline(
  options: TriggerPipelineOptions
): Promise<PipelineTriggerMode> {
  const log = createLogger({
    sessionId: options.sessionId,
    requestId: options.requestId,
    component: "pipeline-trigger",
  });

  if (shouldQueueWithInngest()) {
    await inngest.send({
      name: "analysis/run",
      data: {
        sessionId: options.sessionId,
        requestId: options.requestId,
      },
    });
    log.info("Pipeline queued via Inngest");
    return "inngest";
  }

  // Run in-process. The promise is already executing; waitUntil keeps the
  // serverless invocation alive on Vercel. In local dev the long-running Node
  // process keeps it alive regardless, so a waitUntil no-op/throw is harmless.
  const pipeline = runAnalysisPipeline(options.sessionId, {
    requestId: options.requestId,
  }).catch((error: unknown) => {
    log.error("Pipeline failed in background", { error: String(error) });
  });

  try {
    waitUntil(pipeline);
  } catch {
    // Not in a Vercel runtime (e.g. local dev) — the promise still runs.
  }

  log.info("Pipeline started in-process");
  return "waitUntil";
}
