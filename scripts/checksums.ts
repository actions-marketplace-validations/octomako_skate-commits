import { readdir } from "node:fs/promises"
import { join, resolve } from "node:path"

const directory = resolve(process.argv[2] ?? "dist/releases")
const files = (await readdir(directory)).filter((file) => file.endsWith(".tar.gz")).sort()
if (files.length === 0) throw new Error("no release archives found")

const lines: string[] = []
for (const file of files) {
    const hash = new Bun.CryptoHasher("sha256")
    hash.update(await Bun.file(join(directory, file)).arrayBuffer())
    lines.push(`${hash.digest("hex")}  ${file}`)
}
await Bun.write(join(directory, "SHA256SUMS"), `${lines.join("\n")}\n`)
