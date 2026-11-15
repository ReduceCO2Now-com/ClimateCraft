import { ZipArchive } from "archiver";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const sourcePack = join(projectRoot, "packs", "behavior_pack");
const outputDirectory = join(projectRoot, "dist");

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (!tag) {
  throw new Error("A release tag is required, e.g. v0.1.0-alpha.1");
}

const versionMatch = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.exec(tag);

if (!versionMatch) {
  throw new Error(`Invalid release tag: ${tag}`);
}

const version = versionMatch.slice(1, 4).map(Number);

const temporaryDirectory = await mkdtemp(join(tmpdir(), "climatecraft-release-"));

const stagingPack = join(temporaryDirectory, "pack");
const outputFile = join(outputDirectory, `ClimateCraft-${tag}.mcpack`);

try {
  await access(join(sourcePack, "manifest.json"));

  await mkdir(stagingPack, { recursive: true });
  await mkdir(outputDirectory, { recursive: true });

  // Copy the complete behavior pack into a temporary directory.
  await cp(sourcePack, stagingPack, { recursive: true });

  // Apply the Git tag version to the packaged manifest only.
  const manifestPath = join(stagingPack, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  manifest.header.version = version;

  for (const module of manifest.modules ?? []) {
    module.version = version;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // A .mcpack is a ZIP archive whose root contains manifest.json.
  await new Promise((resolveArchive, rejectArchive) => {
    const output = createWriteStream(outputFile);
    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    output.on("close", resolveArchive);
    output.on("error", rejectArchive);
    archive.on("error", rejectArchive);

    archive.pipe(output);
    archive.directory(stagingPack, false);
    archive.finalize().catch(rejectArchive);
  });

  console.log(`Release package created: ${outputFile}`);
} finally {
  await rm(temporaryDirectory, {
    recursive: true,
    force: true,
  });
}
