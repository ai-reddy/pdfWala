import type { ResumeData } from "./types";

export interface AtsIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

export interface AtsReport {
  score: number;
  issues: AtsIssue[];
}

// WinAnsi (the encoding used by the built-in PDF fonts here) only reliably
// covers Latin-1. Anything past U+00FF risks not rendering — flag it instead
// of silently corrupting the export (spec section 5.5 "Unicode issues").
function hasNonLatin1(text: string): boolean {
  return Array.from(text).some((ch) => ch.codePointAt(0)! > 255);
}

// Deterministic, non-employer-specific checks (spec section 5.5). The score
// is a heuristic signal, not a guarantee of ATS compatibility.
export function runAtsCheck(data: ResumeData): AtsReport {
  const issues: AtsIssue[] = [];

  if (!data.personal.fullName.trim()) {
    issues.push({ severity: "error", code: "MISSING_NAME", message: "Full name is missing." });
  }
  if (!data.personal.email.trim() && !data.personal.phone.trim()) {
    issues.push({
      severity: "error",
      code: "MISSING_CONTACT_INFO",
      message: "Add at least an email or phone number so recruiters can reach you.",
    });
  }
  if (!data.summary.trim()) {
    issues.push({
      severity: "warning",
      code: "EMPTY_SUMMARY",
      message: "A short professional summary helps ATS keyword matching.",
    });
  }
  if (!data.experience.length) {
    issues.push({
      severity: "warning",
      code: "NO_EXPERIENCE",
      message: "No work experience entries were added.",
    });
  }
  if (data.skills.length > 30) {
    issues.push({
      severity: "warning",
      code: "TOO_MANY_SKILLS",
      message: "Over 30 skills listed; consider keeping the most relevant ones.",
    });
  }
  for (const exp of data.experience) {
    for (const a of exp.achievements) {
      if (a.length > 220) {
        issues.push({
          severity: "info",
          code: "LONG_BULLET",
          message: `An achievement bullet under "${exp.position || exp.company}" is very long; shorter bullets scan better.`,
        });
        break;
      }
    }
  }

  const allText = [
    data.personal.fullName,
    data.personal.headline,
    data.summary,
    ...data.experience.flatMap((e) => [e.company, e.position, e.description, ...e.achievements]),
    ...data.education.map((e) => `${e.school} ${e.degree} ${e.field}`),
    ...data.skills,
    ...data.projects.map((p) => `${p.name} ${p.description}`),
    ...data.certifications,
    ...data.languages,
    ...data.customSections.map((c) => `${c.title} ${c.content}`),
  ].join(" ");

  if (hasNonLatin1(allText)) {
    issues.push({
      severity: "warning",
      code: "UNICODE_ISSUES",
      message: "Some characters may not render correctly with the current export font.",
    });
  }

  // Rough one-page capacity heuristic: ~3800 characters fits an A4 page at
  // this template's body size with normal margins.
  if (allText.length > 3800) {
    issues.push({
      severity: "info",
      code: "MULTI_PAGE",
      message: "Content is long enough that the export will likely span more than one page.",
    });
  }
  if (!data.personal.location.trim()) {
    issues.push({
      severity: "info",
      code: "MISSING_LOCATION",
      message: "Adding a location (city, country) is common on ATS-friendly resumes.",
    });
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === "error" ? 15 : issue.severity === "warning" ? 8 : 3;
  }
  score = Math.max(0, Math.min(100, score));

  return { score, issues };
}
