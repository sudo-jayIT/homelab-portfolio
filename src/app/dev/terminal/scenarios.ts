/** Scenarios of the /dev/terminal harness (shared by the server page and the client lab). */

export const SCENARIOS = ["intro", "login", "reboot", "shell", "busy"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const SCENARIO_LABEL: Record<Scenario, string> = {
  intro: "first visit (autoplay)",
  login: "login screen",
  reboot: "login after reboot",
  shell: "room shell",
  busy: "busy",
};

export function isScenario(s: string): s is Scenario {
  return (SCENARIOS as readonly string[]).includes(s);
}
