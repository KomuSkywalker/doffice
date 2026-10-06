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
  { id: "genel", label: "Genel", color: "#d9cfc2" },
  { id: "is", label: "İş", color: "#5b93f7" },
  { id: "kisisel", label: "Kişisel", color: "#3b9b63" },
  { id: "gorusme", label: "Görüşme", color: "#9f85e8" },
  { id: "odeme", label: "Ödeme", color: "#e884ad" },
  { id: "onemli", label: "Önemli", color: "#e3562f" },
  { id: "kutlama", label: "Kutlama", color: "#f7e34f" },
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
