"use client";

import { useState } from "react";
import {
  DEFAULT_COLOR,
  PROJECT_STATUSES,
  projectProgress,
  siteName,
  statusLabel,
  type Project,
  type ProjectDraft,
  type ProjectFile,
  type ProjectStatus,
  type ProjectStep,
} from "@/lib/types";
import { Button, Card, ColorRow, Dot, Field, FieldGroup, inputClass } from "./ui";

type Props = {
  projects: Project[];
  pending: boolean;
  onCreate: (draft: ProjectDraft) => Promise<boolean>;
  onUpdate: (id: string, draft: Partial<ProjectDraft>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

type FileRow = { id: string; label: string; url: string };
type StepRow = { id: string; title: string; done: boolean };

function Progress({ project }: { project: Project }) {
  const { total, done, current, percent } = projectProgress(project);
  if (total === 0) {
    return (
      <p className="text-[11px] font-medium text-muted">Aşama tanımlanmadı</p>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-bold">
          {current ? `Sırada: ${current}` : "Bütün aşamalar bitti"}
        </span>
        <span className="tabular shrink-0 text-[11px] font-bold text-muted">
          {done}/{total}
        </span>
      </div>
      <span className="nb-thin block h-3 overflow-hidden rounded-sm bg-cream">
        <span
          className="block h-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: project.color }}
        />
      </span>
    </div>
  );
}

const STATUS_ACCENT: Record<ProjectStatus, string> = {
  aktif: "bg-mint",
  beklemede: "bg-apricot",
  bitti: "bg-tint",
};

export function ProjectsView({
  projects,
  pending,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("aktif");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [stepTitle, setStepTitle] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [fileLabel, setFileLabel] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProjectStatus | "hepsi">("hepsi");

  const reset = () => {
    setOpen(false);
    setEditingId(null);
    setName("");
    setNote("");
    setStatus("aktif");
    setColor(DEFAULT_COLOR);
    setSteps([]);
    setStepTitle("");
    setFiles([]);
    setFileLabel("");
    setFileUrl("");
    setError(null);
  };

  const startEdit = (project: Project) => {
    setOpen(true);
    setEditingId(project.id);
    setName(project.name);
    setNote(project.note ?? "");
    setStatus(project.status);
    setColor(project.color);
    setSteps(project.steps.map((step) => ({ ...step })));
    setStepTitle("");
    setFiles(project.files.map((file) => ({ ...file })));
    setFileLabel("");
    setFileUrl("");
    setError(null);
    setConfirming(null);
  };

  const addStep = () => {
    if (stepTitle.trim().length === 0) {
      setError("Aşama adı gerekli.");
      return;
    }
    setSteps((current) => [
      ...current,
      { id: "", title: stepTitle.trim(), done: false },
    ]);
    setStepTitle("");
    setError(null);
  };

  const toggleStep = (project: Project, stepId: string) => {
    const next = project.steps.map((step) =>
      step.id === stepId ? { ...step, done: !step.done } : step,
    );
    void onUpdate(project.id, { steps: next });
  };

  const addFile = () => {
    if (fileUrl.trim().length === 0) {
      setError("Dosya adresi gerekli.");
      return;
    }
    setFiles((current) => [
      ...current,
      { id: "", label: fileLabel.trim(), url: fileUrl.trim() },
    ]);
    setFileLabel("");
    setFileUrl("");
    setError(null);
  };

  const submit = async () => {
    if (name.trim().length === 0) {
      setError("Proje adı gerekli.");
      return;
    }
    const draft: ProjectDraft = {
      name: name.trim(),
      note: note.trim().length === 0 ? null : note.trim(),
      status,
      color,
      steps: steps as ProjectStep[],
      files: files as ProjectFile[],
    };
    const ok = editingId
      ? await onUpdate(editingId, draft)
      : await onCreate(draft);
    if (ok) reset();
    else setError("Kaydedilemedi, adresleri kontrol et.");
  };

  const shown =
    filter === "hepsi"
      ? projects
      : projects.filter((project) => project.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[{ id: "hepsi" as const, label: "Hepsi" }, ...PROJECT_STATUSES].map(
            (option) => {
              const active = option.id === filter;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={`chip-pop nb-thin rounded-sm px-2.5 py-1 text-xs font-bold ${
                    active ? "bg-lilac shadow-nb-xs" : "bg-card hover:bg-cream"
                  }`}
                >
                  {option.label}
                </button>
              );
            },
          )}
        </div>
        <Button
          tone="primary"
          onClick={() => {
            if (open) reset();
            else {
              reset();
              setOpen(true);
            }
          }}
        >
          {open ? "Vazgeç" : "Yeni proje"}
        </Button>
      </div>

      {open ? (
        <Card title={editingId ? "Projeyi düzenle" : "Yeni proje"} accent="bg-lilac">
          <div className="space-y-3.5 px-4 py-4">
            <Field label="Proje adı">
              <input
                className={inputClass}
                value={name}
                maxLength={80}
                placeholder="Örnek: Kadıköy dosyası"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Durum">
                <select
                  className={inputClass}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ProjectStatus)
                  }
                >
                  {PROJECT_STATUSES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <FieldGroup label="Renk">
                <ColorRow color={color} onColor={setColor} />
              </FieldGroup>
            </div>

            <Field label="Not" hint="boş olabilir">
              <textarea
                className={`${inputClass} min-h-[70px] resize-y`}
                value={note}
                maxLength={600}
                placeholder="Nerede kaldın, sıradaki adım"
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            <FieldGroup label="Aşamalar">
              {steps.length > 0 ? (
                <ul className="mb-2 space-y-1.5">
                  {steps.map((step, position) => (
                    <li
                      key={`${step.title}-${position}`}
                      className="nb-thin flex items-center gap-2 rounded-sm bg-cream px-2.5 py-1.5"
                    >
                      <span className="tabular shrink-0 text-[11px] font-bold text-muted">
                        {position + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">
                        {step.title}
                      </span>
                      <button
                        type="button"
                        aria-label="Aşamayı çıkar"
                        onClick={() =>
                          setSteps((current) =>
                            current.filter((_, index) => index !== position),
                          )
                        }
                        className="chip-pop rounded-sm px-1 text-xs font-bold text-muted hover:bg-coral hover:text-ink"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  className={inputClass}
                  value={stepTitle}
                  maxLength={80}
                  placeholder="Örnek: Tapu çıkışı"
                  onChange={(event) => setStepTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addStep();
                    }
                  }}
                />
                <Button tone="plain" onClick={addStep}>
                  Aşama ekle
                </Button>
              </div>
            </FieldGroup>

            <FieldGroup label="Dosyalar ve bağlantılar">
              {files.length > 0 ? (
                <ul className="mb-2 space-y-1.5">
                  {files.map((file, position) => (
                    <li
                      key={`${file.url}-${position}`}
                      className="nb-thin flex items-center gap-2 rounded-sm bg-cream px-2.5 py-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">
                        {file.label.length > 0 ? file.label : siteName(file.url)}
                      </span>
                      <button
                        type="button"
                        aria-label="Bağlantıyı çıkar"
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((_, index) => index !== position),
                          )
                        }
                        className="chip-pop rounded-sm px-1 text-xs font-bold text-muted hover:bg-coral hover:text-ink"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
                <input
                  className={inputClass}
                  value={fileLabel}
                  maxLength={80}
                  placeholder="Ad"
                  onChange={(event) => setFileLabel(event.target.value)}
                />
                <input
                  className={inputClass}
                  value={fileUrl}
                  maxLength={500}
                  placeholder="drive.google.com/..."
                  onChange={(event) => setFileUrl(event.target.value)}
                />
                <Button tone="plain" onClick={addFile}>
                  Ekle
                </Button>
              </div>
            </FieldGroup>

            {error ? (
              <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button tone="primary" disabled={pending} onClick={() => void submit()}>
                {editingId ? "Projeyi güncelle" : "Projeyi oluştur"}
              </Button>
              <Button tone="plain" onClick={reset}>
                Vazgeç
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {shown.length === 0 ? (
        <p className="nb rounded-lg border-dashed bg-card/70 px-4 py-10 text-center text-sm font-bold">
          Proje yok.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((project, position) => (
            <Card
              key={project.id}
              title={project.name}
              accent={STATUS_ACCENT[project.status]}
              className="anim-rise lift min-w-0"
              style={{ animationDelay: `${Math.min(position, 10) * 40}ms` }}
              action={
                <span className="nb-thin shrink-0 rounded-sm bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase">
                  {statusLabel(project.status)}
                </span>
              }
            >
              <div className="space-y-3 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Dot color={project.color} size={10} />
                  <span className="text-[11px] font-medium text-muted">
                    {project.files.length} dosya
                  </span>
                </div>

                <Progress project={project} />

                {project.steps.length > 0 ? (
                  <ul className="space-y-1">
                    {project.steps.map((step) => (
                      <li key={step.id}>
                        <label className="row-slide flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 hover:bg-tint">
                          <input
                            type="checkbox"
                            checked={step.done}
                            disabled={pending}
                            onChange={() => toggleStep(project, step.id)}
                            className="h-4 w-4 shrink-0 accent-[var(--color-ink)]"
                          />
                          <span
                            className={`min-w-0 flex-1 truncate text-[13px] font-bold ${
                              step.done ? "text-muted line-through" : ""
                            }`}
                          >
                            {step.title}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {project.note ? (
                  <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-ink-soft">
                    {project.note}
                  </p>
                ) : null}

                {project.files.length > 0 ? (
                  <ul className="space-y-1.5">
                    {project.files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="row-slide nb-thin flex items-center gap-2 rounded-sm bg-cream px-2.5 py-1.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs font-bold">
                            {file.label}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium text-muted">
                            {siteName(file.url)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="flex items-center justify-end gap-2 border-t-2 border-ink/10 pt-2.5">
                  <button
                    type="button"
                    onClick={() => startEdit(project)}
                    className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                  >
                    Düzenle
                  </button>
                  {confirming === project.id ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        void onDelete(project.id).then(() => {
                          setConfirming(null);
                          if (editingId === project.id) reset();
                        });
                      }}
                      className="chip-pop nb-thin rounded-sm bg-coral px-2.5 py-1 text-xs font-bold"
                    >
                      Sil, eminim
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(project.id)}
                      className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
