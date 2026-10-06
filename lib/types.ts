export type TagId =
  | "genel"
  | "is"
  | "kisisel"
  | "gorusme"
  | "odeme"
  | "onemli"
  | "kutlama";

export type Repeat = "yok" | "haftalik" | "aylik" | "yillik";

export type DofficeEvent = {
  id: string;
  date: string;
  time: string | null;
  title: string;
  note: string | null;
  tag: TagId;
  repeat: Repeat;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventDraft = {
  date: string;
  time?: string | null;
  title: string;
  note?: string | null;
  tag?: TagId;
  repeat?: Repeat;
  done?: boolean;
};

export const TAGS: { id: TagId; label: string; color: string }[] = [
  { id: "genel", label: "Genel", color: "#ddd5c4" },
  { id: "is", label: "İş", color: "#b9cfe8" },
  { id: "kisisel", label: "Kişisel", color: "#c9ded0" },
  { id: "gorusme", label: "Görüşme", color: "#e6b8ec" },
  { id: "odeme", label: "Ödeme", color: "#f0c8a8" },
  { id: "onemli", label: "Önemli", color: "#e8857a" },
  { id: "kutlama", label: "Kutlama", color: "#eec14b" },
];

export const TAG_IDS = TAGS.map((tag) => tag.id);

export const REPEATS: { id: Repeat; label: string }[] = [
  { id: "yok", label: "Tekrar yok" },
  { id: "haftalik", label: "Her hafta" },
  { id: "aylik", label: "Her ay" },
  { id: "yillik", label: "Her yıl" },
];

export const REPEAT_IDS = REPEATS.map((repeat) => repeat.id);

export function tagOf(id: TagId) {
  return TAGS.find((tag) => tag.id === id) ?? TAGS[0];
}

export function repeatLabel(id: Repeat) {
  return REPEATS.find((repeat) => repeat.id === id)?.label ?? "Tekrar yok";
}
