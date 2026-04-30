import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "./lib/sanity/client";

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: "precise-aesthetics",
  autoUpdates: true,
});
