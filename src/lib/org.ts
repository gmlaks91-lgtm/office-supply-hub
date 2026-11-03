import type { Organization } from "./types";

const LS_ORG = "office_org_v1";
const LS_ORGS = "office_orgs_v1";

export function makeJoinCode(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export function orgStorageKeys(orgId: string) {
  return {
    inv: `office_inventory_v7_${orgId}`,
    spots: `office_storage_spots_v8_${orgId}`,
    layout: `office_layout_id_v1_${orgId}`,
    activity: `office_activity_v4_${orgId}`,
    requests: `office_requests_v4_${orgId}`,
    demo: `office_demo_seeded_v6_${orgId}`,
  };
}

/** 레거시(회사 구분 전) 키 → 첫 회사로 이전할 때 사용 */
export const LEGACY_KEYS = {
  inv: "office_inventory_v3",
  spots: "office_storage_spots_v5",
  layout: "office_layout_id_v1",
  activity: "office_activity_v1",
  requests: "office_requests_v1",
  demo: "office_demo_seeded_v1",
} as const;

export function readOrgs(): Organization[] {
  try {
    const raw = localStorage.getItem(LS_ORGS);
    return raw ? (JSON.parse(raw) as Organization[]) : [];
  } catch {
    return [];
  }
}

export function writeOrgs(orgs: Organization[]) {
  localStorage.setItem(LS_ORGS, JSON.stringify(orgs));
}

export function readCurrentOrg(): Organization | null {
  try {
    const raw = localStorage.getItem(LS_ORG);
    return raw ? (JSON.parse(raw) as Organization) : null;
  } catch {
    return null;
  }
}

export function writeCurrentOrg(org: Organization) {
  localStorage.setItem(LS_ORG, JSON.stringify(org));
}

function isRetiredDemoBranch(o: Organization): boolean {
  return (
    o.id === "demo-branch-seoul" ||
    o.id === "demo-branch-busan" ||
    o.name === "서울지점" ||
    o.name === "부산지점"
  );
}

export function ensureDefaultOrg(): Organization {
  let orgs = readOrgs();
  const cleaned = orgs.filter((o) => !isRetiredDemoBranch(o));
  if (cleaned.length !== orgs.length) {
    orgs = cleaned;
    writeOrgs(orgs);
  }

  let current = readCurrentOrg();
  if (current && isRetiredDemoBranch(current)) {
    current = null;
  }
  if (current && orgs.some((o) => o.id === current!.id)) return current;

  if (orgs.length === 0) {
    const org: Organization = {
      id: crypto.randomUUID(),
      name: "우리 회사",
      join_code: makeJoinCode(),
      created_at: new Date().toISOString(),
    };
    orgs = [org];
    writeOrgs(orgs);

    // 레거시 데이터 이전
    const keys = orgStorageKeys(org.id);
    for (const [k, legacy] of Object.entries(LEGACY_KEYS) as [
      keyof typeof LEGACY_KEYS,
      string,
    ][]) {
      const scoped = keys[k];
      if (!localStorage.getItem(scoped) && localStorage.getItem(legacy)) {
        localStorage.setItem(scoped, localStorage.getItem(legacy)!);
      }
    }
    writeCurrentOrg(org);
    return org;
  }

  current = orgs[0]!;
  writeCurrentOrg(current);
  return current;
}

export function createLocalOrg(name: string): Organization {
  const org: Organization = {
    id: crypto.randomUUID(),
    name: name.trim() || "새 회사",
    join_code: makeJoinCode(),
    created_at: new Date().toISOString(),
  };
  const orgs = [...readOrgs(), org];
  writeOrgs(orgs);
  writeCurrentOrg(org);
  return org;
}

export function joinLocalOrg(code: string): Organization | null {
  const normalized = code.trim().toUpperCase();
  const found = readOrgs().find((o) => o.join_code.toUpperCase() === normalized);
  if (!found) return null;
  writeCurrentOrg(found);
  return found;
}
