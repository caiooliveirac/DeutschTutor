import type { SchreibenTask } from "./ai/prompts";

export const SCHREIBEN_TASKS: SchreibenTask[] = [
  {
    id: "einladung",
    title: "Einladung zur Feier",
    instruction: "Schreiben Sie eine E-Mail an Ihren Freund / Ihre Freundin.",
    situation: "Sie möchten Ihren Geburtstag feiern und Ihren Freund / Ihre Freundin einladen.",
    points: [
      "Warum schreiben Sie?",
      "Wann und wo ist die Feier?",
      "Was soll er/sie mitbringen?",
      "Wie kommt man dorthin?",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "informal",
  },
  {
    id: "beschwerde-internet",
    title: "Beschwerde: Internetanschluss",
    instruction: "Schreiben Sie eine E-Mail an den Kundenservice.",
    situation: "Ihr Internetanschluss funktioniert seit einer Woche nicht richtig.",
    points: [
      "Warum schreiben Sie?",
      "Beschreiben Sie das Problem genau.",
      "Seit wann besteht das Problem?",
      "Was erwarten Sie (Lösung/Entschädigung)?",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "formal",
  },
  {
    id: "urlaub-empfehlung",
    title: "Urlaubsempfehlung",
    instruction: "Schreiben Sie eine E-Mail an Ihren Freund.",
    situation: "Ihr Freund möchte in Ihrer Stadt/Region Urlaub machen und bittet um Tipps.",
    points: [
      "Warum schreiben Sie?",
      "Was kann man in Ihrer Stadt sehen/machen?",
      "Wo kann man gut essen?",
      "Wie ist das Wetter zu dieser Jahreszeit?",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "informal",
  },
  {
    id: "sprachkurs",
    title: "Anmeldung Sprachkurs",
    instruction: "Schreiben Sie eine E-Mail an eine Sprachschule.",
    situation: "Sie möchten einen Deutschkurs besuchen und brauchen Informationen.",
    points: [
      "Warum schreiben Sie?",
      "Fragen Sie nach Kurszeiten und Preisen.",
      "Fragen Sie nach einem Einstufungstest.",
      "Fragen Sie nach Unterrichtsmaterialien.",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "formal",
  },
  {
    id: "reparatur",
    title: "Reparatur in der Wohnung",
    instruction: "Schreiben Sie eine E-Mail an Ihren Vermieter.",
    situation: "In Ihrer Wohnung ist etwas kaputt (Heizung, Wasserhahn, Fenster).",
    points: [
      "Warum schreiben Sie?",
      "Beschreiben Sie das Problem.",
      "Seit wann besteht das Problem?",
      "Bitten Sie um einen Termin für die Reparatur.",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "formal",
  },
  {
    id: "neue-arbeit",
    title: "Neuer Job",
    instruction: "Schreiben Sie eine E-Mail an einen Freund.",
    situation: "Sie haben eine neue Arbeitsstelle gefunden und möchten davon erzählen.",
    points: [
      "Was ist Ihre neue Arbeit?",
      "Wie haben Sie die Stelle gefunden?",
      "Was gefällt Ihnen an der neuen Arbeit?",
      "Was vermissen Sie an der alten Arbeit?",
    ],
    wordCount: { min: 80, target: 120, max: 160 },
    register: "informal",
  },
];

export function getSchreibenTaskById(id: string): SchreibenTask | undefined {
  return SCHREIBEN_TASKS.find((t) => t.id === id);
}
