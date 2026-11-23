// Collect notices from the exact installed versions, including build/test tools.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
const sections = []
const inventory = []
const missing = []
for (const [path, metadata] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/')) continue
  let pkg
  try { pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8')) } catch { continue } // platform-specific optional package not installed
  const names = (await readdir(path)).filter(name => /^(licen[cs]e|copying|notice)([.-].*)?$/i.test(name)).sort()
  const texts = []
  for (const name of names) {
    try { texts.push(name + '\n' + await readFile(join(path, name), 'utf8')) } catch { /* directories are listed separately below */ }
  }
  // Some packages distribute the license in a LICENSE directory.
  if (!texts.length && names.includes('LICENSE')) {
    try { for (const name of await readdir(join(path, 'LICENSE'))) texts.push('LICENSE/' + name + '\n' + await readFile(join(path, 'LICENSE', name), 'utf8')) } catch { /* recorded as missing below */ }
  }
  const license = typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? pkg.licenses ?? 'UNDECLARED')
  inventory.push({ name: pkg.name, version: pkg.version, license, files: texts.length, development: !!metadata.dev })
  if (!texts.length) missing.push(pkg.name + '@' + pkg.version)
  sections.push('='.repeat(72) + '\n' + pkg.name + '@' + pkg.version + '\nDeclared license: ' + license + '\nInstalled at: ' + path + '\n' + (texts.join('\n\n') || 'No standalone license file in this installed package; see package metadata and license inventory.'))
}
await writeFile('public/THIRD_PARTY_NOTICES.txt', 'WEB STUDY 14 — Installed dependency notices\nGenerated from package-lock.json and the installed package license/notice files.\nIncludes development tools as well as browser runtime dependencies.\nThe mascot is a separate user-provided asset, not licensed by these notices.\n\n' + sections.join('\n\n') + '\n')
await writeFile('docs/licenses.json', JSON.stringify({ checkedAt: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date()), packages: inventory, noStandaloneLicenseFile: missing }, null, 2) + '\n')
console.log(JSON.stringify({ installedPackages: inventory.length, noticesBytes: (await readFile('public/THIRD_PARTY_NOTICES.txt')).length, noStandaloneLicenseFile: missing, runtime: inventory.filter(item => !item.development) }, null, 2))
