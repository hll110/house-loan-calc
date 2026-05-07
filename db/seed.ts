import { getDb } from "../api/queries/connection";
import { cityPrices } from "./schema";

async function seed() {
  const db = getDb();
  await db.delete(cityPrices);
  console.log("Database seeded (empty)");
}

seed().catch(console.error);
