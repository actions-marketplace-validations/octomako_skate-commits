import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const hook = fileURLToPath(new URL("../commit-msg", import.meta.url))
const cli = fileURLToPath(new URL("../../cli/src/index.ts", import.meta.url))

describe.skipIf(process.platform === "win32")("commit-msg hook", () => {
    let directory: string
    let executable: string
    let messageFile: string

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), "skate-hook-"))
        executable = join(directory, "skate cli")
        messageFile = join(directory, "commit message")
        await writeFile(executable, '#!/bin/sh\nexec "$BUN_EXE" "$SKATE_CLI" "$@"\n', {
            mode: 0o755,
        })
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
    })

    async function run(args: string[], binary = executable) {
        const proc = Bun.spawn(["sh", hook, ...args], {
            env: {
                ...process.env,
                SKATE_BIN: binary,
                BUN_EXE: process.execPath,
                SKATE_CLI: cli,
            },
            stdout: "pipe",
            stderr: "pipe",
        })
        const [code, stdout, stderr] = await Promise.all([
            proc.exited,
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
        ])
        return { code, stdout, stderr }
    }

    test("preserves validation status and leaves the message unchanged", async () => {
        for (const [message, code] of [
            ["core: update", 0],
            ["core:  update", 0],
            ["core!!: update", 1],
        ] as const) {
            await writeFile(messageFile, message)
            expect((await run([messageFile])).code).toBe(code)
            expect(await Bun.file(messageFile).text()).toBe(message)
        }
    })

    test("rejects missing arguments and unreadable message files", async () => {
        expect((await run([])).code).toBe(2)
        expect((await run([join(directory, "missing")])).code).toBe(2)
    })

    test("explains when the cli cannot be found", async () => {
        const result = await run([messageFile], join(directory, "missing"))
        expect(result.code).toBe(2)
        expect(result.stderr).toBe(
            "skate: cli not found; install skate or set SKATE_BIN to its path\n",
        )
    })
})
