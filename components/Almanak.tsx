"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
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
import { DashboardView } from "./DashboardView";
import { DayPanel } from "./DayPanel";
import { Decorations } from "./Decorations";
import { KeyPrompt } from "./KeyPrompt";
import { ListView } from "./ListView";
import { MonthView } from "./MonthView";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
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
  const today = useSyncExternalStore(subscribeToday, todaySnapshot, () => serverToday);
  const hasKey = useSyncExternalStore(
    subscribeWriteKey,
    hasWriteKeySnapshot,
    hasWriteKeyServerSnapshot,
  );

  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<ViewId>("panel");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const fileRef = useRef<HTMLInputElement>(null);

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
        headers: { "content-type": "application/json", ...writeKeyHeader() },
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
          current.map((row) => (row.id === event.id ? { ...row, done: value } : row)),
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
      return indexRange(events, makeKey(cursor.year, 0, 1), makeKey(cursor.year, 11, 31));
    }
    const cells = monthCells(cursor.year, cursor.month);
    return indexRange(events, cells[0].key, cells[cells.length - 1].key);
  }, [events, view, cursor]);

  const results = useMemo(() => searchEvents(events, query), [events, query]);
  const dayEvents = useMemo(() => eventsOn(events, selected), [events, selected]);

  const counts = useMemo(() => {
    const todayList = eventsOn(events, today);
    const overdue = events.filter(
      (event) => event.repeat === "yok" && !event.done && event.date < today,
    );
    return {
      bugun: todayList.length,
      geciken: overdue.length,
      toplam: events.length,
    };
  }, [events, today]);

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

  const startNewRecord = useCallback(() => {
    if (view === "panel" || view === "liste") {
      setSelected(today);
      const parsed = parseKey(today);
      setCursor({ year: parsed.year, month: parsed.month });
    }
    setPanelOpen(true);
  }, [today, view]);

  const pickView = useCallback((next: ViewId) => {
    setView(next);
    setMenuOpen(false);
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
        if (menuOpen) setMenuOpen(false);
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

      if (event.key === "p") setView("panel");
      else if (event.key === "m") setView("ay");
      else if (event.key === "y") setView("yil");
      else if (event.key === "l") setView("liste");
      else if (event.key === "t") goToday();
      else if (event.key === "n") {
        event.preventDefault();
        startNewRecord();
      } else if (view === "ay" || view === "yil") {
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
        } else if (event.key === "Enter") {
          event.preventDefault();
          setPanelOpen(true);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    goToday,
    keyPromptOpen,
    menuOpen,
    moveSelection,
    panelOpen,
    query,
    startNewRecord,
    view,
  ]);

  return (
    <div className="relative min-h-screen">
      <Decorations />

      <Sidebar
        view={view}
        counts={counts}
        locked={locked && !hasKey}
        open={menuOpen}
        onSelect={pickView}
        onClose={() => setMenuOpen(false)}
        onUnlock={() => setKeyPromptOpen(true)}
        onImport={(text) => void importBackup(text)}
        onPickFile={() => fileRef.current?.click()}
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          void importBackup(text);
          event.target.value = "";
        }}
      />

      <div className="lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-8 sm:py-8">
          <Topbar
            view={view}
            year={cursor.year}
            month={cursor.month}
            today={today}
            query={query}
            results={results}
            searchRef={searchRef}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onToday={goToday}
            onQueryChange={setQuery}
            onPickResult={openDay}
            onNew={startNewRecord}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <div key={view} className="anim-view">
            {view === "panel" ? (
              <DashboardView
                events={events}
                today={today}
                onSelect={openDay}
                onToggleDone={toggleDone}
              />
            ) : null}

            {view === "ay" ? (
              <MonthView
                year={cursor.year}
                month={cursor.month}
                index={rangeIndex}
                today={today}
                selected={selected}
                onSelect={openDay}
              />
            ) : null}

            {view === "yil" ? (
              <div className="space-y-5">
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
          ) : null}

            {view === "liste" ? (
              <ListView events={events} today={today} onSelect={openDay} />
            ) : null}
          </div>

          <p className="no-print mt-6 hidden text-xs font-medium leading-relaxed text-ink/60 lg:block">
            Kısayollar: p panel, m takvim, y yıl, l kayıtlar, t bugün, n yeni
            kayıt, eğik çizgi arama. Takvimde ok tuşlarıyla gün gezer, Enter ile
            günü açarsın.
          </p>
        </div>
      </div>

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
          className={`anim-rise no-print nb fixed bottom-6 left-6 z-50 rounded-md px-4 py-2.5 text-sm font-bold shadow-nb ${
            toast.tone === "ok" ? "bg-yellow text-ink" : "bg-orange"
          }`}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
