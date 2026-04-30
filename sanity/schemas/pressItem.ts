import { defineField, defineType } from "sanity";

export const pressItem = defineType({
  name: "pressItem",
  title: "Press Item",
  type: "document",
  description: "External press coverage. Public.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "publication",
      title: "Publication",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publicationLogo",
      title: "Publication logo",
      type: "image",
      options: { hotspot: false },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(400),
    }),
    defineField({
      name: "displayOnPressPage",
      title: "Display on press page",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "publication", date: "publishedAt" },
    prepare({ title, subtitle, date }) {
      return { title, subtitle: `${subtitle}${date ? ` · ${date}` : ""}` };
    },
  },
});
