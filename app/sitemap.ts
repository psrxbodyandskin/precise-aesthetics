import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pico",
    "/system",
    "/system/pih-prevention",
    "/system/protocol-library",
    "/system/treatment-kits",
    "/system/data-intelligence",
    "/protocols",
    "/about",
    "/launch",
    "/demo",
    "/resources",
    "/contact",
    "/press",
    "/privacy",
    "/terms",
    "/hipaa-notice",
  ];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
