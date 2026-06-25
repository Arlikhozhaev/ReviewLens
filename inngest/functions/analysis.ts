import { inngest } from "@/inngest/client";
import { runAnalysisPipeline } from "@/features/analysis";

export const runAnalysisJob = inngest.createFunction(
  {
    id: "run-analysis-pipeline",
    name: "Run analysis pipeline",
    retries: 2,
    triggers: [{ event: "analysis/run" }],
  },
  async ({ event, step }) => {
    await step.run("pipeline", async () => {
      await runAnalysisPipeline(event.data.sessionId, {
        requestId: event.data.requestId,
      });
    });
  }
);
