import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runAnalysisJob } from "@/inngest/functions/analysis";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAnalysisJob],
});
