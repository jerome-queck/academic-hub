import { execSync } from 'child_process';
import path from 'path';

/**
 * Strip extended attributes from the packaged app to prevent
 * codesign errors ("resource fork, Finder information, or similar detritus").
 */
export default async function afterPack(context) {
  if (process.platform !== 'darwin') return;

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`
  );

  console.log(`  • stripping extended attributes from ${appPath}`);
  try {
    execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('  • warning: failed to strip extended attributes:', e.message);
  }
}
