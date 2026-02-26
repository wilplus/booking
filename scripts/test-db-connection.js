/**
 * Run with: node scripts/test-db-connection.js
 * Requires DATABASE_URL in .env (or pass as env when running).
 * Use this to verify Supabase is reachable before prisma db push / seed.
 */
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || "";
  const hostPart = url.replace(/:[^:@]+@/, ":****@").split("@")[1]?.split("/")[0] || "(not set)";
  const userMatch = url.match(/^postgres(?:ql)?:\/\/([^:]+):/);
  const user = userMatch ? userMatch[1] : "(could not parse)";
  console.log("Testing database connection...");
  console.log("URL user:", user);
  console.log("URL host:", hostPart);
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("OK – database is reachable.");
  } catch (e) {
    console.error("Connection failed:");
    console.error(e.message);
    if (e.message?.includes("Can't reach")) {
      console.error("\n→ Use the Session pooler URL from Supabase (Connect → Session mode), not the direct connection.");
      console.error("  Session format: postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
