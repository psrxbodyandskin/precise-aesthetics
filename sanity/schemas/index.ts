import type { SchemaTypeDefinition } from "sanity";
import { indication } from "./indication";
import { protocol } from "./protocol";
import { caseStudy } from "./caseStudy";
import { event } from "./event";
import { pressItem } from "./pressItem";
import { siteSettings } from "./siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  event,
  indication,
  protocol,
  caseStudy,
  pressItem,
];
