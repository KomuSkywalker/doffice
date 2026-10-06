"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { makeKey, monthCells, parseKey, shiftKey, shiftMonth } from "@/lib/dates";
import { indexRange, searchEvents } from "@/lib/occurrences";
import { dayItems, indexRangeWithRoutines } from "@/lib/routines";
import { subscribeToday, todaySnapshot } from "@/lib/client-clock";
import type {
  Appointment,
  AppNotification,
  Availability,
  DofficeEvent,
  EventDraft,
  Routine,
  RoutineDraft,
  ShareLink,
} from "@/lib/types";
import { DashboardView } from "./DashboardView";
import { DayPanel } from "./DayPanel";
import { MonthView } from "./MonthView";
import { NotificationsView } from "./NotificationsView";
import { SettingsDialog } from "./SettingsDialog";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
import { YearSummary } from "./YearSummary";
import { YearView } from "./YearView";

type Props = {
  initialEvents: DofficeEvent[];
  initialRoutines: Routine[];
  initialAvailability: Availability;
  initialNotifications: AppNotification[];
  initialAppointments: Appointment[];
  initialLinks: ShareLink[];
  serverToday: string;
};

type Toast = { tone: "ok" | "err"; text: string } | null;

type WriteCall = {
  path: string;
  init: RequestInit;
  onDone: (payload: unknown) => void;
};

export function Doffice({
  initialEvents,
  initialRoutines,
  initialAvailability,
  initialNotifications,
  initialAppointments,
  initialLinks,
  serverToday,
}: Props) {
  const today = useSyncExternalStore(
    subscribeToday,
    todaySnapshot,
    () => serverToday,
  );

  const [events, setEvents] = useState(initialEvents);
  const [routines, setRoutines] = useState(initialRoutines);
  const [availability, setAvailability] = useState(initialAvailability);
  const [links, setLinks] = useState(initialLinks);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [unread, setUnread] = useState(
    () => initialNotifications.filter((row) => !row.readAt).length,
  );
  const [view, setView] = useState<ViewId>("panel");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const parsed = parseKey(serverToday);
    return { year: parsed.year, month: parsed.month };
  });
  const [selected, setSelected] = useState(serverToday);
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/bildirim", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      notifications: AppNotification[];
      appointments: Appointment[];
    };
    setNotifications(data.notifications);
    setAppointments(data.appointments);
    setUnread(data.notifications.filter((row) => !row.readAt).length);
  }, []);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    const timer = window.setInterval(check, 60_000);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [loadNotifications]);

  const runWrite = useCallback(async (call: WriteCall) => {
    setPending(true);
    try {
      const response = await fetch(call.path, {
        ...call.init,
        headers: { "content-type": "application/json" },
      });

      if (response.status === 401) {
        window.location.reload();
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
          const created = (payload as { event: DofficeEvent }).event;
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
          const updated = (payload as { event: DofficeEvent }).event;
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
          const data = payload as {
            events: DofficeEvent[];
            routines: Routine[] | null;
            imported: number;
          };
          setEvents(data.events);
          if (data.routines) setRoutines(data.routines);
          setToast({ tone: "ok", text: `${data.imported} kayıt yüklendi.` });
        },
      });
    },
    [runWrite],
  );

  const saveAvailability = useCallback(
    (value: Availability) =>
      runWrite({
        path: "/api/ayarlar",
        init: { method: "PUT", body: JSON.stringify(value) },
        onDone: (payload) => {
          const data = payload as { availability: Availability };
          setAvailability(data.availability);
          setToast({ tone: "ok", text: "Çalışma düzeni kaydedildi." });
        },
      }),
    [runWrite],
  );

  const createLink = useCallback(
    (label: string, lifetimeDays: number) =>
      runWrite({
        path: "/api/baglanti",
        init: { method: "POST", body: JSON.stringify({ label, lifetimeDays }) },
        onDone: (payload) => {
          const link = (payload as { link: ShareLink }).link;
          setLinks((current) => [link, ...current]);
          setToast({ tone: "ok", text: "Bağlantı oluşturuldu." });
        },
      }),
    [runWrite],
  );

  const revokeLink = useCallback(
    (id: string) => {
      void runWrite({
        path: `/api/baglanti/${id}`,
        init: { method: "DELETE" },
        onDone: (payload) => {
          const link = (payload as { link: ShareLink }).link;
          setLinks((current) =>
            current.map((row) => (row.id === id ? link : row)),
          );
          setToast({ tone: "ok", text: "Bağlantı kapatıldı." });
        },
      });
    },
    [runWrite],
  );

  const createRoutine = useCallback(
    (draft: RoutineDraft) =>
      runWrite({
        path: "/api/rutin",
        init: { method: "POST", body: JSON.stringify(draft) },
        onDone: (payload) => {
          const routine = (payload as { routine: Routine }).routine;
          setRoutines((current) => [...current, routine]);
          setToast({ tone: "ok", text: "Rutin eklendi." });
        },
      }),
    [runWrite],
  );

  const updateRoutine = useCallback(
    (id: string, draft: Partial<RoutineDraft>) =>
      runWrite({
        path: `/api/rutin/${id}`,
        init: { method: "PATCH", body: JSON.stringify(draft) },
        onDone: (payload) => {
          const routine = (payload as { routine: Routine }).routine;
          setRoutines((current) =>
            current.map((row) => (row.id === id ? routine : row)),
          );
          setToast({ tone: "ok", text: "Rutin güncellendi." });
        },
      }),
    [runWrite],
  );

  const removeRoutine = useCallback(
    (id: string) =>
      runWrite({
        path: `/api/rutin/${id}`,
        init: { method: "DELETE" },
        onDone: () => {
          setRoutines((current) => current.filter((row) => row.id !== id));
          setToast({ tone: "ok", text: "Rutin silindi." });
        },
      }),
    [runWrite],
  );

  const decideAppointment = useCallback(
    (id: string, approve: boolean) => {
      void runWrite({
        path: `/api/randevu/${id}`,
        init: {
          method: "POST",
          body: JSON.stringify({ karar: approve ? "onayla" : "reddet" }),
        },
        onDone: () => {
          setToast({
            tone: "ok",
            text: approve ? "Randevu onaylandı." : "Randevu reddedildi.",
          });
        },
      }).then(async (saved) => {
        if (!saved) return;
        await loadNotifications();
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { events: DofficeEvent[] };
        setEvents(data.events);
      });
    },
    [loadNotifications, runWrite],
  );

  const toggleDone = useCallback(
    (event: DofficeEvent) => {
      if (event.routineId) return;
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

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.reload();
  }, []);

  const rangeIndex = useMemo(() => {
    if (view === "yil") {
      return indexRange(events, makeKey(cursor.year, 0, 1), makeKey(cursor.year, 11, 31));
    }
    const cells = monthCells(cursor.year, cursor.month);
    return indexRangeWithRoutines(
      events,
      routines,
      cells[0].key,
      cells[cells.length - 1].key,
    );
  }, [events, routines, view, cursor]);

  const results = useMemo(() => searchEvents(events, query), [events, query]);
  const dayEvents = useMemo(
    () => dayItems(events, routines, selected),
    [events, routines, selected],
  );

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
    if (view === "panel" || view === "bildirim") {
      setSelected(today);
      const parsed = parseKey(today);
      setCursor({ year: parsed.year, month: parsed.month });
    }
    setPanelOpen(true);
  }, [today, view]);

  const pickView = useCallback(
    (next: ViewId) => {
      setView(next);
      setSettingsOpen(false);
      if (next === "bildirim" && unread > 0) {
        void fetch("/api/bildirim", { method: "POST" }).then(() => {
          setUnread(0);
          setNotifications((current) =>
            current.map((row) =>
              row.readAt ? row : { ...row, readAt: new Date().toISOString() },
            ),
          );
        });
      }
    },
    [unread],
  );

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

      if (panelOpen || settingsOpen) return;

      if (event.key === "p") pickView("panel");
      else if (event.key === "a") pickView("ay");
      else if (event.key === "y") pickView("yil");
      else if (event.key === "b") pickView("bildirim");
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
    moveSelection,
    panelOpen,
    pickView,
    query,
    settingsOpen,
    startNewRecord,
    view,
  ]);

  return (
    <div className="relative min-h-screen">
      <Sidebar
        view={view}
        unread={unread}
        onSelect={pickView}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
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

      <div className="pl-[76px]">
        <div className="mx-auto w-full max-w-[1520px] px-4 pb-10 pt-6 sm:px-8 sm:py-8">
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
          />

          <div key={view} className="anim-view">
            {view === "panel" ? (
              <DashboardView
                events={events}
                routines={routines}
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

            {view === "bildirim" ? (
              <NotificationsView
                notifications={notifications}
                appointments={appointments}
                today={today}
                pending={pending}
                onDecide={decideAppointment}
                onSelectDay={openDay}
              />
            ) : null}
          </div>

          <p className="no-print mt-6 hidden text-xs font-medium leading-relaxed text-ink/60 lg:block">
            Kısayollar: p ana sayfa, a ajanda, y almanak, b bildirimler, t bugün,
            n yeni kayıt, eğik çizgi arama. Ajandada ok tuşlarıyla gün gezer,
            Enter ile günü açarsın.
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

      {settingsOpen ? (
        <SettingsDialog
          availability={availability}
          links={links}
          routines={routines}
          total={events.length}
          pending={pending}
          onClose={() => setSettingsOpen(false)}
          onPickFile={() => fileRef.current?.click()}
          onSave={saveAvailability}
          onCreateLink={createLink}
          onRevokeLink={revokeLink}
          onCreateRoutine={createRoutine}
          onUpdateRoutine={updateRoutine}
          onDeleteRoutine={removeRoutine}
          onLogout={() => void logout()}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className={`anim-rise no-print nb fixed bottom-6 left-6 z-50 rounded-md px-4 py-2.5 text-sm font-bold shadow-nb ${
            toast.tone === "ok" ? "bg-gold text-ink" : "bg-coral text-ink"
          }`}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
