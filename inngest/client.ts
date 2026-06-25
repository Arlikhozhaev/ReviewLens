import { Inngest } from "inngest";
import { env } from "@/lib/env";

export const inngest = new Inngest({
  id: "reviewlens",
  eventKey: env.INNGEST_EVENT_KEY,
});

export type AnalysisRunEvent = {
  name: "analysis/run";
  data: {
    sessionId: string;
    requestId?: string;
  };
};
