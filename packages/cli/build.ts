import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const directory = join(import.meta.dir, "../../dist")
const binary = join(directory, process.platform === "win32" ? "skate.exe" : "skate")
await mkdir(directory, { recursive: true })
process.chdir(directory)

await Bun.build({
    entrypoints: [join(import.meta.dir, "src/index.ts")],
    compile: { outfile: binary, autoloadDotenv: false, autoloadBunfig: false },
    minify: true,
    define: { SKATE_VERSION: JSON.stringify(process.env.SKATE_VERSION ?? "dev") },
})

console.log(binary)
