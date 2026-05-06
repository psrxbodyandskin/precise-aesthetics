"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CopyToClipboardButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
}

export function CopyToClipboardButton({
  text,
  label = "Copy",
  size = "sm",
  variant = "secondary",
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy.");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <Button type="button" size={size} variant={variant} onClick={copy}>
      <Icon className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden="true" />
      {copied ? "Copied" : label}
    </Button>
  );
}
