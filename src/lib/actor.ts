const LS_ACTOR = "office_actor_name_v1";

export function readActorName(): string {
  try {
    return localStorage.getItem(LS_ACTOR)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeActorName(name: string) {
  try {
    localStorage.setItem(LS_ACTOR, name.trim());
  } catch {
    /* ignore */
  }
}
