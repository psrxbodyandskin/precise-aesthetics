import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";
import { apiVersion, dataset, projectId } from "./lib/sanity/client";

const SINGLETON_TYPES = new Set(["siteSettings"]);

export default defineConfig({
  name: "precise-aesthetics",
  title: "Precise Aesthetics — Sanity Studio",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
    // Hide singletons from "Create new" menus
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },
  document: {
    // Disable "delete" / "duplicate" actions for singletons
    actions: (input, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? input.filter(
            ({ action }) =>
              action && !["delete", "duplicate", "unpublish"].includes(action),
          )
        : input,
    // Hide "New document" button for singletons in document lists
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter(
            (templateItem) => !SINGLETON_TYPES.has(templateItem.templateId),
          )
        : prev,
  },
});
