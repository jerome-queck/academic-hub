import { existsSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const releaseDir = path.join(repoRoot, 'release');

// Keep release artifacts clean between feature builds. This only touches
// project build output and never user data directories.
if (existsSync(releaseDir)) {
  try {
    rmSync(releaseDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Fallback for occasional macOS ENOTEMPTY race conditions.
    execSync(`rm -rf "${releaseDir}"`, { stdio: 'inherit' });
  }
}
mkdirSync(releaseDir, { recursive: true });

console.log(`Cleaned release output directory: ${releaseDir}`);
