"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  MONTH_NAMES,
  makeKey,
  monthCells,
  parseKey,
  shiftKey,
  shiftMonth,
} from "@/lib/dates";
import { eventsOn, indexRange, searchEvents } from "@/lib/occurrences";
import {
  hasWriteKeyServerSnapshot,
  hasWriteKeySnapshot,
  saveWriteKey,
  subscribeToday,
  subscribeWriteKey,
  todaySnapshot,
  writeKeyHeader,
} from "@/lib/client-store";
import type { AlmanakEvent, EventDraft } from "@/lib/types";
import { DayPanel } from "./DayPanel";
import { KeyPrompt } from "./KeyPrompt";
import { MonthView } from "./MonthView";
import { TopBar, type ViewMode } from "./TopBar";
import { UpcomingRail } from "./UpcomingRail";
import { YearSummary } from "./YearSummary";
import { YearView } from "./YearView";

type Props = {
  initialEvents: AlmanakEvent[];
  locked: boolean;
  serverToday: string;
};

type Toast = { tone: "ok" | "err"; text: string } | null;

type WriteCall = {
  path: string;
  init: RequestInit;
  onDone: (payload: unknown) => void;
};

export function Almanak({ initialEvents, locked, serverToday }: Props) {
  const today = useSyncExternalStore(
    subscribeToday,
    todaySnapshot,
    () => serverToday,
  );
  const hasKey = useSyncExternalStore(
    subscribeWriteKey,
    hasWriteKeySnapshot,
    hasWriteKeyServerSnapshot,
  );

  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<ViewMode>("ay");
  const [cursor, setCursor] = useState(() => {
    const parsed = parseKey(serverToday);
    return { year: parsed.year, month: parsed.month };
  });
  const [selected, setSelected] = useState(serverToday);
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [keyPromptOpen, setKeyPromptOpen] = useState(false);
  const retryRef = useRef<WriteCall | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/events", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { events: AlmanakEvent[] };
    setEvents(data.events);
  }, []);

  const runWrite = useCallback(async (call: WriteCall) => {
    setPending(true);
    try {
      const response = await fetch(call.path, {
        ...call.init,
        headers: {
          "content-type": "application/json",
          ...writeKeyHeader(),
        },
      });

      if (response.status === 401) {
        retryRef.current = call;
        setKeyPromptOpen(true);
        setToast({ tone: "err", text: "Yazma için anahtar gerekli." });
        return false;
      }

      const payload: unknown = await response
        .json()
        .catch(() => ({ error: "Yanıt okunamadı." }));

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "İşlem tamamlanamadı.";
        setToast({ tone: "err", text: message });
        return false;
      }

      call.onDone(payload);
      return true;
    } catch {
      setToast({ tone: "err", text: "Sunucuya ulaşılamadı." });
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const createEvent = useCallback(
    (draft: EventDraft) =>
      runWrite({
        path: "/api/events",
        init: { method: "POST", body: JSON.stringify(draft) },
        onDone: (payload) => {
          const created = (payload as { event: AlmanakEvent }).event;
          setEvents((current) => [...current, created]);
          setToast({ tone: "ok", text: "Kayıt eklendi." });
        },
      }),
    [runWrite],
  );

  const updateEvent = useCallback(
    (id: string, draft: Partial<EventDraft>) =>
      runWrite({
        path: `/api/events/${id}`,
        init: { method: "PATCH", body: JSON.stringify(draft) },
        onDone: (payload) => {
          const updated = (payload as { event: AlmanakEvent }).event;
          setEvents((current) =>
            current.map((event) => (event.id === id ? updated : event)),
          );
          setToast({ tone: "ok", text: "Kayıt güncellendi." });
        },
      }),
    [runWrite],
  );

  const removeEvent = useCallback(
    (id: string) =>
      runWrite({
        path: `/api/events/${id}`,
        init: { method: "DELETE" },
        onDone: () => {
          setEvents((current) => current.filter((event) => event.id !== id));
          setToast({ tone: "ok", text: "Kayıt silindi." });
        },
      }),
    [runWrite],
  );

  const importBackup = useCallback(
    (text: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setToast({ tone: "err", text: "Dosya geçerli JSON değil." });
        return Promise.resolve(false);
      }
      return runWrite({
        path: "/api/backup",
        init: { method: "PUT", body: JSON.stringify(parsed) },
        onDone: (payload) => {
          const data = payload as { events: AlmanakEvent[]; imported: number };
          setEvents(data.events);
          setToast({ tone: "ok", text: `${data.imported} kayıt yüklendi.` });
        },
      });
    },
    [runWrite],
  );

  const toggleDone = useCallback(
    (event: AlmanakEvent) => {
      const next = !event.done;
      const flip = (value: boolean) =>
        setEvents((current) =>
          current.map((row) =>
            row.id === event.id ? { ...row, done: value } : row,
          ),
        );
      flip(next);
      void updateEvent(event.id, { done: next }).then((saved) => {
        if (!saved) flip(event.done);
      });
    },
    [updateEvent],
  );

  const rangeIndex = useMemo(() => {
    if (view === "yil") {
      return indexRange(
        events,
        makeKey(cursor.year, 0, 1),
        makeKey(cursor.year, 11, 31),
      );
    }
    const cells = monthCells(cursor.year, cursor.month);
    return indexRange(events, cells[0].key, cells[cells.length - 1].key);
  }, [events, view, cursor]);

  const results = useMemo(() => searchEvents(events, query), [events, query]);
  const dayEvents = useMemo(() => eventsOn(events, selected), [events, selected]);

  const openDay = useCallback((key: string) => {
    const parsed = parseKey(key);
    setCursor({ year: parsed.year, month: parsed.month });
    setSelected(key);
    setPanelOpen(true);
    setQuery("");
  }, []);

  const goToday = useCallback(() => {
    const parsed = parseKey(today);
    setCursor({ year: parsed.year, month: parsed.month });
    setSelected(today);
  }, [today]);

  const step = useCallback(
    (delta: number) => {
      if (view === "yil") {
        setCursor((current) => ({ ...current, year: current.year + delta }));
        return;
      }
      setCursor((current) => shiftMonth(current.year, current.month, delta));
    },
    [view],
  );

  const moveSelection = useCallback((days: number) => {
    setSelected((current) => {
      const next = shiftKey(current, days);
      const parsed = parseKey(next);
      setCursor({ year: parsed.year, month: parsed.month });
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (event.key === "Escape") {
        if (query.length > 0) setQuery("");
        if (typing) target?.blur();
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (panelOpen || keyPromptOpen) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-7);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(7);
      } else if (event.key === "Enter" || event.key === "n") {
        event.preventDefault();
        setPanelOpen(true);
      } else if (event.key === "t") {
        goToday();
      } else if (event.key === "y") {
        setView("yil");
      } else if (event.key === "m") {
        setView("ay");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToday, keyPromptOpen, moveSelection, panelOpen, query]);

  const lockedNow = locked && !hasKey;
  const todayParts = parseKey(today);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        view={view}
        year={cursor.year}
        month={cursor.month}
        query={query}
        results={results}
        locked={lockedNow}
        total={events.length}
        searchRef={searchRef}
        onViewChange={setView}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onToday={goToday}
        onQueryChange={setQuery}
        onPickResult={openDay}
        onUnlock={() => setKeyPromptOpen(true)}
        onImport={(text) => void importBackup(text)}
      />

      <main className="mx-auto w-full max-w-[1680px] flex-1 px-3 pb-24 pt-4 sm:px-5 sm:py-6">
        <div
          className={
            view === "ay"
              ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"
              : "grid gap-5"
          }
        >
          <div className="min-w-0">
            {view === "ay" ? (
              <MonthView
                year={cursor.year}
                month={cursor.month}
                index={rangeIndex}
                today={today}
                selected={selected}
                onSelect={openDay}
              />
            ) : (
              <div className="space-y-4">
                <YearView
                  year={cursor.year}
                  index={rangeIndex}
                  today={today}
                  selected={selected}
                  onSelectDay={openDay}
                  onOpenMonth={(month) => {
                    setCursor((current) => ({ ...current, month }));
                    setView("ay");
                  }}
                />
                <YearSummary
                  year={cursor.year}
                  events={events}
                  today={today}
                  onSelect={openDay}
                />
              </div>
            )}

            <p className="mt-3 hidden text-[11px] leading-relaxed text-muted lg:block">
              Kısayollar: ok tuşlarıyla gün gez, Enter ile günü aç, n yeni kayıt,
              t bugün, m ay görünümü, y yıl görünümü, eğik çizgi ile arama.
            </p>
          </div>

          {view === "ay" ? (
            <UpcomingRail events={events} today={today} onSelect={openDay} />
          ) : null}
        </div>
      </main>

      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="no-print fixed bottom-5 right-5 z-20 rounded-full bg-ink px-5 py-3 font-display text-sm font-semibold text-paper shadow-raised transition-transform hover:-translate-y-0.5 xl:hidden"
      >
        Güne ekle
      </button>

      {panelOpen ? (
        <DayPanel
          key={selected}
          dateKey={selected}
          today={today}
          events={dayEvents}
          pending={pending}
          onClose={() => setPanelOpen(false)}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={removeEvent}
          onToggleDone={toggleDone}
        />
      ) : null}

      {keyPromptOpen ? (
        <KeyPrompt
          onClose={() => {
            setKeyPromptOpen(false);
            retryRef.current = null;
          }}
          onSubmit={(value) => {
            saveWriteKey(value);
            setKeyPromptOpen(false);
            const retry = retryRef.current;
            retryRef.current = null;
            if (retry) void runWrite(retry);
            else void refresh();
          }}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className={`anim-rise no-print fixed bottom-5 left-5 z-50 rounded-md px-3 py-2 text-sm shadow-raised ${
            toast.tone === "ok" ? "bg-ink text-paper" : "bg-accent text-surface"
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      <footer className="no-print border-t border-line px-3 py-4 text-center text-[11px] text-muted sm:px-5">
        Almanak, {MONTH_NAMES[todayParts.month]} {todayParts.year} sürümü.
        Veriler bu bilgisayardaki JSON dosyasında tutulur.
      </footer>
    </div>
  );
}
