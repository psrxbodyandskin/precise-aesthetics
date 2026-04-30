import { defineArrayMember, defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  description:
    "Public event. The Aug 8, 2026 launch lives here. No speakers field — the system, not personalities, is the subject.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "eventType",
      title: "Event type",
      type: "string",
      options: {
        list: [
          { title: "Launch", value: "launch" },
          { title: "Webinar", value: "webinar" },
          { title: "Conference", value: "conference" },
          { title: "Training", value: "training" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startsAt",
      title: "Starts at",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endsAt",
      title: "Ends at",
      type: "datetime",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "object",
      fields: [
        defineField({ name: "venueName", title: "Venue", type: "string" }),
        defineField({ name: "address", title: "Address", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "virtualLink", title: "Virtual link", type: "url" }),
      ],
    }),
    defineField({
      name: "isHybrid",
      title: "Hybrid (in-person + virtual)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "agenda",
      title: "Agenda",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "agendaItem",
          fields: [
            defineField({ name: "time", title: "Time", type: "string" }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
          ],
          preview: {
            select: { title: "title", subtitle: "time" },
          },
        }),
      ],
    }),
    defineField({
      name: "capacity",
      title: "Capacity",
      type: "number",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "rsvpEnabled",
      title: "RSVP enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Upcoming", value: "upcoming" },
          { title: "Live", value: "live" },
          { title: "Past", value: "past" },
        ],
        layout: "radio",
      },
      initialValue: "upcoming",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", startsAt: "startsAt", status: "status", eventType: "eventType" },
    prepare({ title, startsAt, status, eventType }) {
      const date = startsAt ? new Date(startsAt).toLocaleDateString() : "—";
      return { title, subtitle: `${eventType} · ${date} · ${status}` };
    },
  },
});
