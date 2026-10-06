"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TAGS, tagOf, type TagId } from "@/lib/types";

type ButtonTone = "ghost" | "solid" | "quiet" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  children: ReactNode;
};

const toneClass: Record<ButtonTone, string> = {
  solid:
    "bg-ink text-paper hover:bg-ink-soft disabled:bg-line-strong disabled:text-surface",
  ghost:
    "bg-surface text-ink border border-line hover:border-line-strong hover:bg-sunk",
  quiet: "bg-transparent text-muted hover:text-ink hover:bg-sunk",
  danger:
    "bg-transparent text-accent-ink hover:bg-accent-soft border border-transparent hover:border-accent-soft",
};

export function Button({ tone = "ghost", className = "", ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${toneClass[tone]} ${className}`}
      {...rest}
    />
  );
}

export function TagDot({ tag, size = 7 }: { tag: TagId; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: tagOf(tag).color,
      }}
    />
  );
}

export function TagChip({ tag }: { tag: TagId }) {
  const found = tagOf(tag);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color: found.color, backgroundColor: `${found.color}14` }}
    >
      <TagDot tag={tag} size={6} />
      {found.label}
    </span>
  );
}

export function TagPicker({
  value,
  onChange,
}: {
  value: TagId;
  onChange: (tag: TagId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAGS.map((tag) => {
        const active = tag.id === value;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onChange(tag.id)}
            aria-pressed={active}
            className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: active ? tag.color : "var(--color-line)",
              backgroundColor: active ? `${tag.color}14` : "transparent",
              color: active ? tag.color : "var(--color-muted)",
            }}
          >
            <TagDot tag={tag.id} size={6} />
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-xs font-medium tracking-wide text-muted">
        {label}
        {hint ? <span className="font-normal text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="space-y-1.5">
      <span className="block text-xs font-medium tracking-wide text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none";
