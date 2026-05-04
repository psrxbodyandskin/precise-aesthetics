import { defineArrayMember, defineField, defineType } from "sanity";
import { LockIcon } from "@sanity/icons";

// P4 — Protocol document type. Authoring lives here; Supabase
// `public.protocols` is a queryable mirror written by the Sanity
// webhook on publish/unpublish events.
//
// Status flow: draft → published → archived. The Studio status
// field is the source of truth for protocol state (sync mirrors
// it). Practitioners only see `published` rows in the portal,
// further filtered to devices their practice owns.
//
// Treatment logs (P6+) reference specific `protocol_versions`
// snapshots (immutable). Edit a published protocol → republish
// in Studio → webhook creates a new version snapshot. Old
// snapshots stay intact for treatment-log integrity.
export const protocol = defineType({
  name: "protocol",
  title: "Protocol",
  type: "document",
  icon: LockIcon,
  description:
    "GATED. Proprietary clinical IP. Renders only inside the practitioner portal behind authentication. Never indexed publicly.",
  groups: [
    { name: "core", title: "Core" },
    { name: "clinical", title: "Clinical" },
    { name: "treatment", title: "Treatment" },
    { name: "biologic", title: "Biologic control" },
    { name: "outcomes", title: "Outcomes" },
    { name: "meta", title: "Meta" },
  ],
  fields: [
    // ----- Identity -----
    defineField({
      name: "title",
      title: "Protocol title",
      type: "string",
      group: "core",
      description: 'e.g., "Melasma — Fitzpatrick IV–VI".',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      group: "core",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 3,
      group: "core",
      description:
        "Surfaced in protocol library list view. 1-2 sentences. Plain text.",
      validation: (rule) => rule.max(300),
    }),

    // ----- Classification -----
    defineField({
      name: "indication",
      title: "Indication",
      type: "reference",
      group: "core",
      to: [{ type: "indication" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "indicationTags",
      title: "Specific indications",
      type: "array",
      group: "clinical",
      of: [{ type: "string" }],
      description:
        "Optional fine-grained tags within the indication category. Used for protocol library filtering.",
      options: {
        list: [
          { title: "Post-Inflammatory Hyperpigmentation (PIH)", value: "pih" },
          { title: "Melasma", value: "melasma" },
          { title: "Lentigines", value: "lentigines" },
          { title: "Tattoo removal — black ink", value: "tattoo_black" },
          { title: "Tattoo removal — colored ink", value: "tattoo_color" },
          { title: "Café-au-lait macules", value: "cafe_au_lait" },
          { title: "Nevus of Ota", value: "nevus_ota" },
          { title: "Hori's nevus", value: "hori" },
          { title: "Becker's nevus", value: "becker" },
          { title: "Acne scars", value: "acne_scars" },
          { title: "Fine lines & rhytids", value: "rhytids" },
          { title: "Skin rejuvenation", value: "rejuvenation" },
          { title: "General pigment correction", value: "pigment_general" },
        ],
      },
    }),
    defineField({
      name: "fitzpatrickTypes",
      title: "Applicable Fitzpatrick types",
      type: "array",
      group: "clinical",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Type I", value: "I" },
          { title: "Type II", value: "II" },
          { title: "Type III", value: "III" },
          { title: "Type IV", value: "IV" },
          { title: "Type V", value: "V" },
          { title: "Type VI", value: "VI" },
        ],
      },
      validation: (rule) => rule.min(1),
    }),

    // ----- Clinical content -----
    defineField({
      name: "overview",
      title: "Clinical overview",
      type: "array",
      group: "clinical",
      of: [defineArrayMember({ type: "block" })],
      description:
        "Longform clinical description. Rich text supported. Shown at the top of the protocol detail page.",
    }),
    defineField({
      name: "parameterEnvelope",
      title: "Parameter envelope",
      type: "array",
      group: "treatment",
      of: [
        defineArrayMember({
          type: "object",
          name: "parameterRow",
          fields: [
            defineField({
              name: "wavelength",
              title: "Wavelength",
              type: "string",
              description: 'e.g., "1064 nm", "532 nm".',
            }),
            defineField({
              name: "fluenceMin",
              title: "Fluence min (J/cm²)",
              type: "number",
            }),
            defineField({
              name: "fluenceMax",
              title: "Fluence max (J/cm²)",
              type: "number",
            }),
            defineField({
              name: "pulseDuration",
              title: "Pulse duration (ps)",
              type: "number",
            }),
            defineField({
              name: "spotSize",
              title: "Spot size (mm)",
              type: "string",
              description: 'e.g., "4 mm", "3-5 mm".',
            }),
            defineField({
              name: "fitzpatrickAdjustment",
              title: "Fitzpatrick-specific notes",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { wavelength: "wavelength", fluenceMin: "fluenceMin", fluenceMax: "fluenceMax" },
            prepare({ wavelength, fluenceMin, fluenceMax }) {
              const fluence =
                fluenceMin !== undefined && fluenceMax !== undefined
                  ? `${fluenceMin}-${fluenceMax} J/cm²`
                  : "—";
              return {
                title: wavelength ?? "Parameter row",
                subtitle: fluence,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "sessionGuidance",
      title: "Session guidance",
      type: "object",
      group: "treatment",
      fields: [
        defineField({
          name: "expectedSessions",
          title: "Expected number of sessions",
          type: "string",
          description: 'e.g., "4-6", "3 minimum".',
        }),
        defineField({
          name: "spacingWeeks",
          title: "Recommended spacing (weeks)",
          type: "string",
          description: 'e.g., "4-6 weeks", "2 weeks".',
        }),
        defineField({
          name: "notes",
          title: "Notes",
          type: "array",
          of: [defineArrayMember({ type: "block" })],
        }),
      ],
    }),

    // ----- Biologic control -----
    defineField({
      name: "prepKitRequired",
      title: "Prep kit required",
      type: "boolean",
      group: "biologic",
      initialValue: true,
    }),
    defineField({
      name: "recoveryKitRequired",
      title: "Recovery kit required",
      type: "boolean",
      group: "biologic",
      initialValue: true,
    }),
    defineField({
      name: "maintenanceKitRecommended",
      title: "Maintenance kit recommended",
      type: "boolean",
      group: "biologic",
      initialValue: true,
    }),
    defineField({
      name: "biologicControlNotes",
      title: "Biologic control notes",
      type: "array",
      group: "biologic",
      of: [defineArrayMember({ type: "block" })],
    }),

    // ----- Contraindications + outcomes -----
    defineField({
      name: "contraindications",
      title: "Contraindications",
      type: "array",
      group: "clinical",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "expectedOutcomes",
      title: "Expected outcomes",
      type: "array",
      group: "outcomes",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "complications",
      title: "Complications",
      type: "array",
      group: "outcomes",
      of: [defineArrayMember({ type: "block" })],
    }),

    // ----- Supporting content -----
    defineField({
      name: "supportingDocuments",
      title: "Supporting documents",
      type: "array",
      group: "meta",
      of: [
        defineArrayMember({
          type: "file",
          options: { accept: "application/pdf" },
        }),
      ],
      description: "Optional PDF attachments (training, reference sheets).",
    }),
    defineField({
      name: "references",
      title: "Clinical references",
      type: "array",
      group: "meta",
      of: [
        defineArrayMember({
          type: "object",
          name: "clinicalReference",
          fields: [
            defineField({
              name: "citation",
              title: "Citation",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "url", title: "URL (optional)", type: "url" }),
          ],
          preview: { select: { title: "citation" } },
        }),
      ],
    }),
    defineField({
      name: "lastReviewed",
      title: "Last clinically reviewed",
      type: "date",
      group: "meta",
    }),

    // ----- Status -----
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      indication: "indication.title",
      status: "status",
    },
    prepare({ title, indication, status }) {
      return {
        title: title ?? "(untitled)",
        subtitle: `🔒 ${indication ?? "—"} · ${status ?? "draft"}`,
      };
    },
  },
});
