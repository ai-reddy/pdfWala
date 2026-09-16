// Configuration-driven templates (spec section 5.4) — all single-column and
// Latin-font-safe by design, which keeps them ATS-friendly out of the box.
export interface ResumeTemplate {
  id: string;
  name: string;
  group: "ATS" | "Professional" | "Creative";
  accentColor: [number, number, number]; // rgb 0-1
  nameSize: number;
  headingSize: number;
  bodySize: number;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic-ats",
    name: "Classic (ATS)",
    group: "ATS",
    accentColor: [0.15, 0.15, 0.15],
    nameSize: 22,
    headingSize: 12,
    bodySize: 10.5,
  },
  {
    id: "modern-professional",
    name: "Modern Professional",
    group: "Professional",
    accentColor: [0.09, 0.32, 0.55],
    nameSize: 24,
    headingSize: 12.5,
    bodySize: 10.5,
  },
  {
    id: "minimal-creative",
    name: "Minimal Creative",
    group: "Creative",
    accentColor: [0.45, 0.2, 0.55],
    nameSize: 26,
    headingSize: 11.5,
    bodySize: 10,
  },
];

export function getTemplate(id: string): ResumeTemplate {
  return RESUME_TEMPLATES.find((t) => t.id === id) ?? RESUME_TEMPLATES[0];
}
