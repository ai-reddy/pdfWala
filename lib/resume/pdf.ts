"use client";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResumeData } from "./types";
import { getTemplate } from "./templates";

function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderResumePdf(data: ResumeData, templateId: string): Promise<Uint8Array> {
  const template = getTemplate(templateId);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const accent = rgb(...template.accentColor);
  const dark = rgb(0.12, 0.12, 0.12);
  const gray = rgb(0.4, 0.4, 0.4);

  let page: PDFPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawParagraph = (text: string, size: number, font: PDFFont, color = dark, lineMult = 1.35) => {
    for (const line of wrapLines(font, text, size, maxWidth)) {
      ensureSpace(size * lineMult);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size * lineMult;
    }
  };

  const drawBullet = (text: string, size: number) => {
    const bulletIndent = 14;
    const lines = wrapLines(regular, text, size, maxWidth - bulletIndent);
    lines.forEach((line, i) => {
      ensureSpace(size * 1.35);
      page.drawText(i === 0 ? `\u2022 ${line}` : `  ${line}`, {
        x: margin,
        y,
        size,
        font: regular,
        color: dark,
      });
      y -= size * 1.35;
    });
  };

  const sectionHeading = (title: string) => {
    ensureSpace(template.headingSize * 2.2);
    y -= 6;
    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: template.headingSize,
      font: bold,
      color: accent,
    });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.75,
      color: accent,
    });
    y -= template.headingSize * 0.9;
  };

  // Header
  const name = data.personal.fullName || "Your Name";
  ensureSpace(template.nameSize * 1.4);
  page.drawText(name, { x: margin, y, size: template.nameSize, font: bold, color: accent });
  y -= template.nameSize * 1.15;

  if (data.personal.headline) {
    drawParagraph(data.personal.headline, template.bodySize + 1, italic, gray);
  }

  const contactParts = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.website,
    data.personal.linkedin,
  ].filter(Boolean);
  if (contactParts.length) {
    drawParagraph(contactParts.join("   |   "), template.bodySize - 0.5, regular, gray);
  }
  y -= 4;

  if (data.summary.trim()) {
    sectionHeading("Summary");
    drawParagraph(data.summary, template.bodySize, regular);
  }

  if (data.experience.length) {
    sectionHeading("Experience");
    for (const exp of data.experience) {
      ensureSpace(template.bodySize * 1.5);
      const dateRange = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
      page.drawText(`${exp.position || "Role"} — ${exp.company || "Company"}`, {
        x: margin,
        y,
        size: template.bodySize + 0.5,
        font: bold,
        color: dark,
      });
      const dateWidth = regular.widthOfTextAtSize(dateRange, template.bodySize - 1);
      page.drawText(dateRange, {
        x: pageWidth - margin - dateWidth,
        y,
        size: template.bodySize - 1,
        font: regular,
        color: gray,
      });
      y -= template.bodySize * 1.4;
      if (exp.location) drawParagraph(exp.location, template.bodySize - 1, italic, gray);
      if (exp.description) drawParagraph(exp.description, template.bodySize, regular);
      for (const a of exp.achievements.filter(Boolean)) drawBullet(a, template.bodySize);
      y -= 6;
    }
  }

  if (data.education.length) {
    sectionHeading("Education");
    for (const ed of data.education) {
      ensureSpace(template.bodySize * 1.5);
      const dateRange = `${ed.startDate || ""} - ${ed.endDate || ""}`;
      const title = [ed.degree, ed.field].filter(Boolean).join(", ") || "Degree";
      page.drawText(title, { x: margin, y, size: template.bodySize + 0.5, font: bold, color: dark });
      const dateWidth = regular.widthOfTextAtSize(dateRange, template.bodySize - 1);
      page.drawText(dateRange, {
        x: pageWidth - margin - dateWidth,
        y,
        size: template.bodySize - 1,
        font: regular,
        color: gray,
      });
      y -= template.bodySize * 1.4;
      if (ed.school) drawParagraph(ed.school, template.bodySize, regular);
      if (ed.description) drawParagraph(ed.description, template.bodySize - 0.5, regular, gray);
      y -= 4;
    }
  }

  if (data.skills.length) {
    sectionHeading("Skills");
    drawParagraph(data.skills.join("  •  "), template.bodySize, regular);
  }

  if (data.projects.length) {
    sectionHeading("Projects");
    for (const p of data.projects) {
      ensureSpace(template.bodySize * 1.5);
      page.drawText(p.name || "Project", { x: margin, y, size: template.bodySize + 0.5, font: bold, color: dark });
      y -= template.bodySize * 1.4;
      if (p.description) drawParagraph(p.description, template.bodySize, regular);
      if (p.link) drawParagraph(p.link, template.bodySize - 1, italic, gray);
      y -= 4;
    }
  }

  if (data.certifications.length) {
    sectionHeading("Certifications");
    drawParagraph(data.certifications.join("  •  "), template.bodySize, regular);
  }

  if (data.languages.length) {
    sectionHeading("Languages");
    drawParagraph(data.languages.join("  •  "), template.bodySize, regular);
  }

  for (const section of data.customSections) {
    if (!section.title.trim() && !section.content.trim()) continue;
    sectionHeading(section.title || "Additional Information");
    drawParagraph(section.content, template.bodySize, regular);
  }

  return doc.save();
}
