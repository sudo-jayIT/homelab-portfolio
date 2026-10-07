/**
 * Experience (spec 08 section 8, badge styles from spec 05), from the resume.
 * Read by the terminal (`experience`) and the room badge panel. Entries render
 * in data order; the ticket counter reads "No. 01 / 02".
 */

import type { ExperienceEntry } from "./types";

export const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "DevSecOps Intern",
    company: "Traffic by Intent",
    location: "Remote",
    period: "Mar 2026 to Present",
    type: "Internship",
    bullets: [
      "Build and maintain CI/CD pipelines on GCP (Cloud Run jobs, Cloud Scheduler) and secure the environment through IAM and service account management.",
      "Run AI security risk assessments aligned to SOC 2, covering sensitive data exposure, leakage and improper data use.",
      "Perform automated and manual QA testing across custom LLM MCP servers and scripts.",
      "Develop Python and JavaScript code with agentic AI workflows to speed up delivery.",
      "Research ways to optimize AI workflows, batch outputs and model reasoning.",
    ],
    badge: { band: "#134e4a", org: "TRAFFIC BY INTENT", tab: "Traffic by Intent" },
  },
  {
    role: "Interim President",
    company: "University of Richmond Cybersecurity Club",
    location: "Richmond, VA",
    period: "Aug 2026 to Present",
    type: "Leadership",
    bullets: [
      "Lead members through TryHackMe CTF practice rooms and cybersecurity workshops.",
      "Facilitated a workshop that helped members prepare for industry certifications and interviews.",
    ],
    badge: { band: "#312e81", org: "UR CYBERSECURITY CLUB", tab: "UR Cyber Club" },
  },
];
