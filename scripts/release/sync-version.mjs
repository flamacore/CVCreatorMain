import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];

if (!version) {
  throw new Error("Expected a semantic version argument.");
}

execFileSync("npm", ["version", version, "--no-git-tag-version", "--allow-same-version"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

const desktopPackagePath = new URL("../../apps/desktop/package.json", import.meta.url);
const tauriConfigPath = new URL("../../apps/desktop/src-tauri/tauri.conf.json", import.meta.url);
const cargoTomlPath = new URL("../../apps/desktop/src-tauri/Cargo.toml", import.meta.url);
const packageLockPath = new URL("../../package-lock.json", import.meta.url);

const desktopPackage = JSON.parse(readFileSync(desktopPackagePath, "utf8"));
desktopPackage.version = version;
writeFileSync(desktopPackagePath, `${JSON.stringify(desktopPackage, null, 2)}\n`);

const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf8"));
tauriConfig.version = version;
writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);

const cargoToml = readFileSync(cargoTomlPath, "utf8");
const cargoVersionPattern = /^version = ".*"$/m;

if (!cargoVersionPattern.test(cargoToml)) {
  throw new Error("Failed to locate version in apps/desktop/src-tauri/Cargo.toml.");
}

writeFileSync(cargoTomlPath, cargoToml.replace(cargoVersionPattern, `version = "${version}"`));

const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8"));

if (packageLock.packages?.["apps/desktop"]) {
  packageLock.packages["apps/desktop"].version = version;
}

writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);