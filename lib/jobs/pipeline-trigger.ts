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

export async function triggerAnalysisPipeline(
  options: TriggerPipelineOptions
): Promise<PipelineTriggerMode> {
  const log = createLogger({
    sessionId: options.sessionId,
    requestId: options.requestId,
    component: "pipeline-trigger",
  });

  if (isInngestConfigured()) {
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

  const pipeline = runAnalysisPipeline(options.sessionId, {
    requestId: options.requestId,
  }).catch((error: unknown) => {
    log.error("Pipeline failed in waitUntil", { error: String(error) });
  });

  waitUntil(pipeline);
  log.info("Pipeline started via waitUntil");
  return "waitUntil";
}
