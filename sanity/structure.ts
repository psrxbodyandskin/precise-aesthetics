import type { StructureResolver } from "sanity/structure";
import {
  CogIcon,
  LockIcon,
  CalendarIcon,
  TagIcon,
  EarthGlobeIcon,
} from "@sanity/icons";

const SINGLETON_TYPES = new Set(["siteSettings"]);
const HIDDEN_TYPES = new Set([...SINGLETON_TYPES]);

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Singleton: Site Settings
      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .child(
          S.editor()
            .id("siteSettings")
            .schemaType("siteSettings")
            .documentId("siteSettings"),
        ),

      S.divider(),

      // Public content
      S.listItem()
        .title("Events")
        .icon(CalendarIcon)
        .child(S.documentTypeList("event").title("Events")),

      S.listItem()
        .title("Indications")
        .icon(TagIcon)
        .child(S.documentTypeList("indication").title("Indications")),

      S.divider(),

      // Gated content
      S.listItem()
        .title("🔒 Protocols (Private — Portal only)")
        .icon(LockIcon)
        .child(S.documentTypeList("protocol").title("Protocols — Portal only")),

      S.listItem()
        .title("🔒 Case Studies (Private — Portal only)")
        .icon(LockIcon)
        .child(
          S.documentTypeList("caseStudy").title("Case Studies — Portal only"),
        ),

      S.divider(),

      S.listItem()
        .title("Press")
        .icon(EarthGlobeIcon)
        .child(S.documentTypeList("pressItem").title("Press Items")),

      // Filter out singletons + types already shown above to avoid duplicates
      ...S.documentTypeListItems().filter(
        (item) =>
          !HIDDEN_TYPES.has(item.getId() ?? "") &&
          !["event", "indication", "protocol", "caseStudy", "pressItem"].includes(
            item.getId() ?? "",
          ),
      ),
    ]);
