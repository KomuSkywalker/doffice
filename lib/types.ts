export type TagId =
  | "genel"
  | "is"
  | "kisisel"
  | "gorusme"
  | "odeme"
  | "onemli"
  | "kutlama";

export type Repeat = "yok" | "haftalik" | "aylik" | "yillik";

export type AlmanakEvent = {
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
  { id: "genel", label: "Genel", color: "#7a7364" },
  { id: "is", label: "İş", color: "#2f5d8a" },
  { id: "kisisel", label: "Kişisel", color: "#2f7a5a" },
  { id: "gorusme", label: "Görüşme", color: "#9a6a1f" },
  { id: "odeme", label: "Ödeme", color: "#6b4a8a" },
  { id: "onemli", label: "Önemli", color: "#b4442a" },
  { id: "kutlama", label: "Kutlama", color: "#b03a70" },
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
