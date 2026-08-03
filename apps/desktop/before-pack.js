import fs from "node:fs"
import path from "node:path"

/**
 * beforePack hook — copies workspace-hoisted native modules (e.g. @libsql/win32-x64-msvc)
 * into the app's node_modules so electron-builder can pack them into the asar.
 *
 * Bun workspaces hoist platform-specific packages to the workspace root, but
 * electron-builder resolves from the app directory and misses them.
 */
export default async function beforePack(context) {
  const appDir = context.packager.appDir
  const projectDir = context.packager.projectDir

  const packages = [
    "@libsql/win32-x64-msvc",
    "@libsql/linux-x64-gnu",
    "@libsql/darwin-arm64",
  ]

  for (const pkg of packages) {
    const sourceDir = path.join(projectDir, "node_modules", pkg)
    const targetDir = path.join(appDir, "node_modules", pkg)

    if (fs.existsSync(sourceDir) && !fs.existsSync(targetDir)) {
      console.log(`  • copying ${pkg} into app node_modules`)
      fs.mkdirSync(path.dirname(targetDir), { recursive: true })
      fs.cpSync(sourceDir, targetDir, { recursive: true })
    }
  }
}
