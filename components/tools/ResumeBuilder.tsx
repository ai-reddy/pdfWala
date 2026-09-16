"use client";

import { useEffect, useState } from "react";
import {
  emptyResume,
  newId,
  type ResumeData,
  type ExperienceEntry,
  type EducationEntry,
  type ProjectEntry,
  type CustomSection,
} from "@/lib/resume/types";
import { RESUME_TEMPLATES, getTemplate } from "@/lib/resume/templates";
import { renderResumePdf } from "@/lib/resume/pdf";
import { runAtsCheck, type AtsReport } from "@/lib/resume/ats";

const STORAGE_KEY = "pdfwala:resume-builder:v1";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

export function ResumeBuilder() {
  const [data, setData] = useState<ResumeData>(emptyResume());
  const [templateId, setTemplateId] = useState(RESUME_TEMPLATES[0].id);
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data) setData(parsed.data);
        if (parsed.templateId) setTemplateId(parsed.templateId);
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, templateId }));
    }, 400);
    return () => clearTimeout(t);
  }, [data, templateId, loaded]);

  const set = (patch: Partial<ResumeData>) => setData((prev) => ({ ...prev, ...patch }));
  const setPersonal = (patch: Partial<ResumeData["personal"]>) =>
    setData((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }));

  const addExperience = () =>
    set({
      experience: [
        ...data.experience,
        {
          id: newId(),
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
          achievements: [],
        },
      ],
    });
  const updateExperience = (id: string, patch: Partial<ExperienceEntry>) =>
    set({ experience: data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const removeExperience = (id: string) =>
    set({ experience: data.experience.filter((e) => e.id !== id) });

  const addEducation = () =>
    set({
      education: [
        ...data.education,
        { id: newId(), school: "", degree: "", field: "", startDate: "", endDate: "", description: "" },
      ],
    });
  const updateEducation = (id: string, patch: Partial<EducationEntry>) =>
    set({ education: data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const removeEducation = (id: string) => set({ education: data.education.filter((e) => e.id !== id) });

  const addProject = () =>
    set({ projects: [...data.projects, { id: newId(), name: "", description: "", link: "" }] });
  const updateProject = (id: string, patch: Partial<ProjectEntry>) =>
    set({ projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const removeProject = (id: string) => set({ projects: data.projects.filter((p) => p.id !== id) });

  const addCustomSection = () =>
    set({ customSections: [...data.customSections, { id: newId(), title: "", content: "" }] });
  const updateCustomSection = (id: string, patch: Partial<CustomSection>) =>
    set({ customSections: data.customSections.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeCustomSection = (id: string) =>
    set({ customSections: data.customSections.filter((c) => c.id !== id) });

  const exportPdf = async () => {
    const bytes = await renderResumePdf(data, templateId);
    download(
      new Blob([bytes], { type: "application/pdf" }),
      `${data.personal.fullName.trim().replace(/\s+/g, "_") || "resume"}.pdf`
    );
  };

  const template = getTemplate(templateId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Resume/CV PDF Builder</h1>
      <p className="mt-2 text-center text-slate-600">
        Fill in your details, pick a template, run an ATS check, and export a PDF. Autosaved in
        this browser.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Section title="Template">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESUME_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`rounded-lg border p-3 text-left text-sm hover:border-brand-400 ${
                    t.id === templateId ? "border-brand-500 bg-brand-50" : ""
                  }`}
                >
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.group}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Personal information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Text label="Full name" value={data.personal.fullName} onChange={(v) => setPersonal({ fullName: v })} />
              <Text label="Headline" value={data.personal.headline} onChange={(v) => setPersonal({ headline: v })} />
              <Text label="Email" value={data.personal.email} onChange={(v) => setPersonal({ email: v })} />
              <Text label="Phone" value={data.personal.phone} onChange={(v) => setPersonal({ phone: v })} />
              <Text label="Location" value={data.personal.location} onChange={(v) => setPersonal({ location: v })} />
              <Text label="Website" value={data.personal.website} onChange={(v) => setPersonal({ website: v })} />
              <Text label="LinkedIn" value={data.personal.linkedin} onChange={(v) => setPersonal({ linkedin: v })} />
            </div>
          </Section>

          <Section title="Summary">
            <TextArea label="Professional summary" value={data.summary} onChange={(v) => set({ summary: v })} />
          </Section>

          <Section title="Experience">
            {data.experience.map((exp) => (
              <div key={exp.id} className="rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Text label="Position" value={exp.position} onChange={(v) => updateExperience(exp.id, { position: v })} />
                  <Text label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, { company: v })} />
                  <Text label="Location" value={exp.location} onChange={(v) => updateExperience(exp.id, { location: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Text label="Start" value={exp.startDate} onChange={(v) => updateExperience(exp.id, { startDate: v })} />
                    <Text label="End" value={exp.endDate} onChange={(v) => updateExperience(exp.id, { endDate: v })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, { current: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Current role
                </label>
                <TextArea
                  label="Description"
                  value={exp.description}
                  onChange={(v) => updateExperience(exp.id, { description: v })}
                />
                <TextArea
                  label="Achievements (one per line)"
                  value={exp.achievements.join("\n")}
                  onChange={(v) => updateExperience(exp.id, { achievements: v.split("\n") })}
                  rows={3}
                />
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addExperience} className="text-sm font-medium text-brand-600 hover:underline">
              + Add experience
            </button>
          </Section>

          <Section title="Education">
            {data.education.map((ed) => (
              <div key={ed.id} className="rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Text label="School" value={ed.school} onChange={(v) => updateEducation(ed.id, { school: v })} />
                  <Text label="Degree" value={ed.degree} onChange={(v) => updateEducation(ed.id, { degree: v })} />
                  <Text label="Field of study" value={ed.field} onChange={(v) => updateEducation(ed.id, { field: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Text label="Start" value={ed.startDate} onChange={(v) => updateEducation(ed.id, { startDate: v })} />
                    <Text label="End" value={ed.endDate} onChange={(v) => updateEducation(ed.id, { endDate: v })} />
                  </div>
                </div>
                <TextArea
                  label="Description"
                  value={ed.description}
                  onChange={(v) => updateEducation(ed.id, { description: v })}
                  rows={2}
                />
                <button
                  onClick={() => removeEducation(ed.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addEducation} className="text-sm font-medium text-brand-600 hover:underline">
              + Add education
            </button>
          </Section>

          <Section title="Skills, certifications & languages">
            <TextArea
              label="Skills (comma-separated)"
              value={data.skills.join(", ")}
              onChange={(v) => set({ skills: v.split(",").map((s) => s.trim()).filter(Boolean) })}
              rows={2}
            />
            <TextArea
              label="Certifications (comma-separated)"
              value={data.certifications.join(", ")}
              onChange={(v) => set({ certifications: v.split(",").map((s) => s.trim()).filter(Boolean) })}
              rows={2}
            />
            <TextArea
              label="Languages (comma-separated)"
              value={data.languages.join(", ")}
              onChange={(v) => set({ languages: v.split(",").map((s) => s.trim()).filter(Boolean) })}
              rows={2}
            />
          </Section>

          <Section title="Projects">
            {data.projects.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 space-y-3">
                <Text label="Name" value={p.name} onChange={(v) => updateProject(p.id, { name: v })} />
                <TextArea
                  label="Description"
                  value={p.description}
                  onChange={(v) => updateProject(p.id, { description: v })}
                  rows={2}
                />
                <Text label="Link" value={p.link} onChange={(v) => updateProject(p.id, { link: v })} />
                <button
                  onClick={() => removeProject(p.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addProject} className="text-sm font-medium text-brand-600 hover:underline">
              + Add project
            </button>
          </Section>

          <Section title="Custom sections">
            {data.customSections.map((c) => (
              <div key={c.id} className="rounded-lg border p-4 space-y-3">
                <Text label="Title" value={c.title} onChange={(v) => updateCustomSection(c.id, { title: v })} />
                <TextArea
                  label="Content"
                  value={c.content}
                  onChange={(v) => updateCustomSection(c.id, { content: v })}
                  rows={2}
                />
                <button
                  onClick={() => removeCustomSection(c.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addCustomSection} className="text-sm font-medium text-brand-600 hover:underline">
              + Add custom section
            </button>
          </Section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div
            className="rounded-xl border bg-white p-5 text-xs leading-snug"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            <p
              className="text-lg font-bold"
              style={{ color: `rgb(${template.accentColor.map((c) => c * 255).join(",")})` }}
            >
              {data.personal.fullName || "Your Name"}
            </p>
            {data.personal.headline && <p className="italic text-slate-500">{data.personal.headline}</p>}
            <p className="mt-1 text-slate-500">
              {[data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(" | ")}
            </p>
            {data.summary && <p className="mt-3 text-slate-700">{data.summary}</p>}
            {data.experience.length > 0 && (
              <p className="mt-3 font-semibold uppercase text-slate-400">Experience ({data.experience.length})</p>
            )}
            {data.education.length > 0 && (
              <p className="mt-1 font-semibold uppercase text-slate-400">Education ({data.education.length})</p>
            )}
            {data.skills.length > 0 && (
              <p className="mt-1 font-semibold uppercase text-slate-400">Skills ({data.skills.length})</p>
            )}
            <p className="mt-3 text-slate-400">Full formatted layout is produced in the exported PDF.</p>
          </div>

          <div className="rounded-xl border bg-white p-5 space-y-3">
            <button
              onClick={() => setAtsReport(runAtsCheck(data))}
              className="w-full rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Run ATS check
            </button>
            {atsReport && (
              <div className="space-y-2 text-sm">
                <p className="font-semibold">
                  Score: <span className="text-brand-600">{atsReport.score}</span>/100
                </p>
                {atsReport.issues.length === 0 ? (
                  <p className="text-green-600">No issues found.</p>
                ) : (
                  <ul className="space-y-1">
                    {atsReport.issues.map((issue, i) => (
                      <li
                        key={i}
                        className={
                          issue.severity === "error"
                            ? "text-red-600"
                            : issue.severity === "warning"
                              ? "text-amber-600"
                              : "text-slate-500"
                        }
                      >
                        • {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-400">
                  This score is a heuristic signal, not a guarantee of compatibility with any
                  specific employer&apos;s ATS.
                </p>
              </div>
            )}
            <button
              onClick={exportPdf}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
