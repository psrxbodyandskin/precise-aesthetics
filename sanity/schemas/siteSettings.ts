import { defineArrayMember, defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  description: "Singleton. Global site configuration. Only one document of this type should exist.",
  fields: [
    defineField({
      name: "companyName",
      title: "Company name",
      type: "string",
      initialValue: "Precise Aesthetics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      initialValue: "Predictable outcomes across every skin type.",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "defaultMetaDescription",
      title: "Default meta description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "contactPhone",
      title: "Contact phone",
      type: "string",
    }),
    defineField({
      name: "pressEmail",
      title: "Press email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "Instagram", value: "instagram" },
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "X", value: "x" },
                  { title: "YouTube", value: "youtube" },
                  { title: "TikTok", value: "tiktok" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "footerNote",
      title: "Footer note",
      type: "array",
      description: "Legal copy / brand attribution. Portable Text.",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "launchEventReference",
      title: "Launch event reference",
      type: "reference",
      to: [{ type: "event" }],
      description: "Reference to the active launch event for global linking.",
    }),
  ],
  preview: {
    select: { title: "companyName", subtitle: "tagline" },
    prepare({ title, subtitle }) {
      return { title: title ?? "Site Settings", subtitle };
    },
  },
});
