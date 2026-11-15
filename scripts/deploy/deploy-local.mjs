import { cp, access, rm, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const sourcePack = join(projectRoot, "packs", "behavior_pack");

// GitHub Actions and other CI environments should build artifacts,
// not deploy into a developer's local Minecraft installation.
if (process.env.CI === "true") {
  console.log("CI environment detected. Skipping local Minecraft deployment.");
  process.exit(0);
}

const appData = process.env.APPDATA;

if (!appData) {
  console.log("Minecraft local deployment skipped: APPDATA is unavailable.");
  process.exit(0);
}

const developmentPacks = join(
  appData,
  "Minecraft Bedrock",
  "users",
  "shared",
  "games",
  "com.mojang",
  "development_behavior_packs"
);

const destinationPack = join(developmentPacks, "ClimateCraft");

try {
  await access(join(sourcePack, "manifest.json"));
} catch {
  console.error("Behavior pack manifest not found. Run the build first.");
  process.exit(1);
}

await mkdir(developmentPacks, { recursive: true });

// Replace the previous deployed copy with the latest build.
await rm(destinationPack, { recursive: true, force: true });

await cp(sourcePack, destinationPack, { recursive: true });

console.log("ClimateCraft deployed successfully!");
console.log(`Destination: ${destinationPack}`);
