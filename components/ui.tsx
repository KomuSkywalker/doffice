"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { LABEL_LIMIT, PALETTE } from "@/lib/types";

type Tone = "primary" | "plain" | "ink" | "danger" | "quiet";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  children: ReactNode;
};

const toneClass: Record<Tone, string> = {
  primary: "bg-gold text-ink nb shadow-nb-sm press-sm",
  plain: "bg-card text-ink nb shadow-nb-sm press-sm",
  ink: "bg-ink text-paper nb shadow-nb-sm press-sm",
  danger: "bg-coral nb shadow-nb-sm press-sm",
  quiet: "bg-transparent text-ink hover:bg-ink/10 border-[3px] border-transparent",
};

export function Button({ tone = "plain", className = "", ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[tone]} ${className}`}
      {...rest}
    />
  );
}

export function SquareButton({
  label,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`nb press-sm inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-card text-xl font-bold leading-none shadow-nb-sm ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Dot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full border-2 border-ink"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

export function Chip({ label, color }: { label: string | null; color: string }) {
  if (!label) return null;
  return (
    <span
      className="nb-thin inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export function MarkerPicker({
  label,
  color,
  onLabel,
  onColor,
}: {
  label: string;
  color: string;
  onLabel: (value: string) => void;
  onColor: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        className={inputClass}
        value={label}
        maxLength={LABEL_LIMIT}
        placeholder="Etiket adı, boş olabilir"
        onChange={(event) => onLabel(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((option) => {
          const active = option.color === color.toLowerCase();
          return (
            <button
              key={option.color}
              type="button"
              title={option.name}
              aria-label={option.name}
              aria-pressed={active}
              onClick={() => onColor(option.color)}
              className={`chip-pop h-7 w-7 rounded-sm border-2 border-ink ${
                active ? "shadow-nb-xs" : "opacity-55 hover:opacity-100"
              }`}
              style={{ backgroundColor: option.color }}
            />
          );
        })}
        <label className="nb-thin chip-pop flex cursor-pointer items-center gap-1.5 rounded-sm bg-card px-2 py-1 text-[11px] font-bold">
          <span
            aria-hidden
            className="h-4 w-4 rounded-sm border-2 border-ink"
            style={{ backgroundColor: color }}
          />
          Özel renk
          <input
            type="color"
            value={color}
            aria-label="Özel renk"
            className="h-0 w-0 opacity-0"
            onChange={(event) => onColor(event.target.value)}
          />
        </label>
      </div>
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
      <span className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
        {hint ? <span className="normal-case tracking-normal">{hint}</span> : null}
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
      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function Card({
  title,
  accent = "bg-card",
  action,
  children,
  className = "",
  style,
}: {
  title?: string;
  accent?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      style={style}
      className={`nb overflow-hidden rounded-lg bg-card shadow-nb ${className}`}
    >
      {title ? (
        <header
          className={`flex items-center justify-between gap-3 border-b-[3px] border-ink px-4 py-2.5 ${accent}`}
        >
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export const inputClass =
  "nb-thin w-full rounded-md bg-card px-3 py-2 text-sm font-medium text-ink placeholder:text-muted focus:outline-none focus:ring-0 focus:border-sky";
