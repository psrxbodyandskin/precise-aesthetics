import { buildLegacyTheme, defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";
import { StudioLogo } from "./sanity/components/StudioLogo";
import { WorkspaceIcon } from "./sanity/components/WorkspaceIcon";
import { apiVersion, dataset, projectId } from "./lib/sanity/client";

const SINGLETON_TYPES = new Set(["siteSettings"]);

// Brand tokens — mirror design-system/MASTER.md
const PA_MIDNIGHT_500 = "#1F2F4F";
const PA_MIDNIGHT_800 = "#0C1426";
const PA_CREAM_50 = "#FDFCF9";
const PA_CREAM_100 = "#F4F0E8";

const preciseTheme = buildLegacyTheme({
  "--black": PA_MIDNIGHT_800,
  "--white": PA_CREAM_50,

  "--gray": "#7B8AA3",
  "--gray-base": "#7B8AA3",

  "--component-bg": PA_MIDNIGHT_800,
  "--component-text-color": PA_CREAM_50,

  "--brand-primary": PA_MIDNIGHT_500,

  "--default-button-color": "#666",
  "--default-button-primary-color": PA_MIDNIGHT_500,
  "--default-button-success-color": "#43d675",
  "--default-button-warning-color": "#fb8c2b",
  "--default-button-danger-color": "#db4d56",

  "--state-info-color": PA_MIDNIGHT_500,
  "--state-success-color": "#43d675",
  "--state-warning-color": "#fb8c2b",
  "--state-danger-color": "#db4d56",

  "--main-navigation-color": PA_MIDNIGHT_800,
  "--main-navigation-color--inverted": PA_CREAM_100,

  "--focus-color": PA_MIDNIGHT_500,
});

export default defineConfig({
  name: "precise-aesthetics",
  title: "Precise Aesthetics — Content Studio",
  icon: WorkspaceIcon,
  basePath: "/studio",
  projectId,
  dataset,
  theme: preciseTheme,
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
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
