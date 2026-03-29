/** Shape stored in JourneyMilestone.workspaceData when workspaceType === CHECKLIST */

export type ChecklistItem = { id: string; label: string; done: boolean };

export type ChecklistWorkspaceData = { items: ChecklistItem[] };

export function emptyChecklistData(): ChecklistWorkspaceData {
  return { items: [] };
}

export function parseChecklistWorkspaceData(data: unknown): ChecklistWorkspaceData {
  if (!data || typeof data !== "object") return { items: [] };
  const raw = data as { items?: unknown };
  if (!Array.isArray(raw.items)) return { items: [] };
  const items: ChecklistItem[] = raw.items.map((row, i) => {
    if (!row || typeof row !== "object") {
      return { id: `item-${i}`, label: "", done: false };
    }
    const o = row as Record<string, unknown>;
    return {
      id: typeof o.id === "string" ? o.id : `item-${i}`,
      label: typeof o.label === "string" ? o.label : "",
      done: Boolean(o.done),
    };
  });
  return { items };
}
