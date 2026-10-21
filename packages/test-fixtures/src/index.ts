export const DEVELOPMENT_SEED_KEY = "hnlms-development-v1";

export const PERSONA_ROLES = [
  "organization_admin",
  "branch_manager",
  "consultant",
  "admission_manager",
  "marketing_manager",
  "academic_manager",
  "academic_affairs",
  "content_reviewer",
  "support_staff",
  "finance_officer",
  "payroll_officer",
  "hr_officer",
  "executive",
  "teacher",
  "teaching_assistant",
  "student",
  "parent",
] as const;

export type PersonaRole = (typeof PERSONA_ROLES)[number];

export type SeedOrganization = {
  id: string;
  seedKey: string;
  name: string;
  code: string;
  timezone: "Asia/Ho_Chi_Minh";
  status: "active";
};

export type SeedBranch = {
  id: string;
  seedKey: string;
  organizationId: string;
  code: string;
  name: string;
  address: string;
  status: "active";
};

export type SeedPersona = {
  id: string;
  seedKey: string;
  organizationId: string;
  branchId: string | null;
  role: PersonaRole;
  email: string;
  displayName: string;
  status: "active";
  /** Student/parent links are explicit so delegated access can be exercised. */
  linkedStudentId: string | null;
};

export type SeedMedia = {
  id: string;
  seedKey: string;
  organizationId: string;
  branchId: string;
  objectKey: string;
  mimeType: "image/svg+xml";
  accessScope: "branch";
  malwareStatus: "ready";
  containsPersonalData: false;
};

export type DevelopmentSeed = {
  seedKey: string;
  organizations: readonly SeedOrganization[];
  branches: readonly SeedBranch[];
  personas: readonly SeedPersona[];
  media: readonly SeedMedia[];
};

function hash(input: string): string {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0");
}

/** Stable UUID-shaped identifiers are deterministic and safe to re-run. */
export function stableFixtureId(seed: string, kind: string, key: string): string {
  const source = `${seed}:${kind}:${key}`;
  const chunks = [hash(`${source}:a`), hash(`${source}:b`), hash(`${source}:c`), hash(`${source}:d`)].join("");
  return `${chunks.slice(0, 8)}-${chunks.slice(8, 12)}-4${chunks.slice(13, 16)}-8${chunks.slice(17, 20)}-${chunks.slice(20, 32)}`;
}

function branchRoles(): readonly PersonaRole[] {
  return [
    "branch_manager",
    "consultant",
    "admission_manager",
    "academic_affairs",
    "support_staff",
    "finance_officer",
    "hr_officer",
    "teacher",
    "teaching_assistant",
  ];
}

export function createDevelopmentSeed(seed = DEVELOPMENT_SEED_KEY): DevelopmentSeed {
  const organizations = ["HN", "HCM"].map((code, organizationIndex) => ({
    id: stableFixtureId(seed, "organization", code),
    seedKey: seed,
    name: organizationIndex === 0 ? "Hanoi Learning Demo" : "Saigon Learning Demo",
    code: `DEMO-${code}`,
    timezone: "Asia/Ho_Chi_Minh" as const,
    status: "active" as const,
  }));
  const branches = organizations.flatMap((organization, organizationIndex) =>
    ["NORTH", "SOUTH"].map((suffix, branchIndex) => ({
      id: stableFixtureId(seed, "branch", `${organization.code}:${suffix}`),
      seedKey: seed,
      organizationId: organization.id,
      code: `${organization.code}-${suffix}`,
      name: `${organization.name} ${branchIndex === 0 ? "Cơ sở trung tâm" : "Cơ sở vệ tinh"}`,
      address: `${organizationIndex === 0 ? "12" : "24"} Demo Street, ${organizationIndex === 0 ? "Hà Nội" : "TP HCM"}`,
      status: "active" as const,
    })),
  );
  const personas = organizations.flatMap((organization) => {
    const organizationBranches = branches.filter((branch) => branch.organizationId === organization.id);
    const organizationWideRoles = PERSONA_ROLES.filter((role) => !branchRoles().includes(role) && role !== "student" && role !== "parent");
    const wide = organizationWideRoles.map((role) => ({
      id: stableFixtureId(seed, "persona", `${organization.code}:${role}`),
      seedKey: seed,
      organizationId: organization.id,
      branchId: null,
      role,
      email: `${role}.${organization.code.toLowerCase()}@example.test`,
      displayName: `${role.replaceAll("_", " ")} ${organization.code}`,
      status: "active" as const,
      linkedStudentId: null,
    }));
    const branchPeople = organizationBranches.flatMap((branch) => {
      const staff = branchRoles().map((role) => ({
        id: stableFixtureId(seed, "persona", `${branch.code}:${role}`),
        seedKey: seed,
        organizationId: organization.id,
        branchId: branch.id,
        role,
        email: `${role}.${branch.code.toLowerCase()}@example.test`,
        displayName: `${role.replaceAll("_", " ")} ${branch.code}`,
        status: "active" as const,
        linkedStudentId: null,
      }));
      const studentId = stableFixtureId(seed, "persona", `${branch.code}:student`);
      const student = {
        id: studentId,
        seedKey: seed,
        organizationId: organization.id,
        branchId: branch.id,
        role: "student" as const,
        email: `student.${branch.code.toLowerCase()}@example.test`,
        displayName: `Học viên ${branch.code}`,
        status: "active" as const,
        linkedStudentId: null,
      };
      const parent = {
        id: stableFixtureId(seed, "persona", `${branch.code}:parent`),
        seedKey: seed,
        organizationId: organization.id,
        branchId: branch.id,
        role: "parent" as const,
        email: `parent.${branch.code.toLowerCase()}@example.test`,
        displayName: `Phụ huynh ${branch.code}`,
        status: "active" as const,
        linkedStudentId: studentId,
      };
      return [...staff, student, parent];
    });
    return [...wide, ...branchPeople];
  });
  const media = branches.map((branch) => ({
    id: stableFixtureId(seed, "media", branch.code),
    seedKey: seed,
    organizationId: branch.organizationId,
    branchId: branch.id,
    objectKey: `${seed}/${branch.code}/sample-logo.svg`,
    mimeType: "image/svg+xml" as const,
    accessScope: "branch" as const,
    malwareStatus: "ready" as const,
    containsPersonalData: false as const,
  }));
  return { seedKey: seed, organizations, branches, personas, media };
}

export function resetDevelopmentSeed(seed = DEVELOPMENT_SEED_KEY) {
  return { seedKey: seed, order: ["media", "personas", "branches", "organizations"] as const };
}
