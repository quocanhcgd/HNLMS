import "./load-env";
import { createDatabase, databaseConfigFromEnv } from "./client";
import { demoCompetencyProfiles } from "../modules/assessment-english/demo-competency-profiles";
import { developmentCompetencyProfiles, upsertCompetencyProfiles } from "./seeds/competency-profiles";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("development_competency_seed_forbidden_in_production");
  const { db, pool } = createDatabase(databaseConfigFromEnv());
  try {
    const result = await upsertCompetencyProfiles(db, developmentCompetencyProfiles(demoCompetencyProfiles));
    console.log(JSON.stringify(result));
    if (result.skipped.length) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
