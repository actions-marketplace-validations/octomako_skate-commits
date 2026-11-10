import { copyFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const platforms: Partial<Record<NodeJS.Platform, string>> = {
    linux: "linux",
    darwin: "macos",
    win32: "windows",
}
const platform = platforms[process.platform]
if (!platform) throw new Error(`unsupported platform: ${process.platform}`)

const directory = join(root, "dist")
const binary = process.platform === "win32" ? "skate.exe" : "skate"
if (!(await Bun.file(join(directory, binary)).exists())) {
    throw new Error("build the cli before packaging it")
}

const output = join(root, "dist/releases")
await mkdir(output, { recursive: true })
await copyFile(join(root, "packages/git-hook/commit-msg"), join(directory, "commit-msg"))

const archive = join(output, `skate-${platform}-${process.arch}.tar.gz`)
const result = Bun.spawn(["tar", "-czf", archive, "-C", directory, binary, "commit-msg"], {
    stdout: "inherit",
    stderr: "inherit",
})
if ((await result.exited) !== 0) throw new Error("could not package the cli")
console.log(archive)
