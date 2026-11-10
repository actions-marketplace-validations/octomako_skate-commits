import { fileURLToPath } from "node:url"
import { expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url))

async function run(args: string[], input = "") {
    const command = process.env.SKATE_TEST_BINARY
        ? [process.env.SKATE_TEST_BINARY]
        : [process.execPath, entry]
    const proc = Bun.spawn([...command, ...args], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
    })
    proc.stdin.write(input)
    proc.stdin.end()
    const [code, stdout, stderr] = await Promise.all([
        proc.exited,
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
    ])
    return { code, stdout, stderr }
}

test("valid messages are silent and errors fail", async () => {
    expect(await run(["core(fix): update"])).toEqual({ code: 0, stdout: "", stderr: "" })
    expect(await run(["core!!: update"])).toEqual({
        code: 1,
        stdout: "",
        stderr: 'error[header.syntax]:6 - only one "!" is allowed in the header\n',
    })
    expect(await run(["core(): update"])).toEqual({
        code: 1,
        stdout: "",
        stderr: "error[type.empty]:5 - expected a commit type\n",
    })
})

test("warnings are shown without failing", async () => {
    expect(await run(["core:  update"])).toEqual({
        code: 0,
        stdout: "",
        stderr: 'warning[header.spacing]:6 - expected one space after ":"\n',
    })
    expect((await run(["core.api(refactor)! v2"])).stderr).toContain(
        "warning[header.marker_missing]",
    )
})

test("reads explicit and piped stdin, including body and empty input", async () => {
    expect(await run(["--stdin"], "core: update\nbody!!: | text")).toEqual({
        code: 0,
        stdout: "",
        stderr: "",
    })
    expect(await run([], "core: update")).toEqual({ code: 0, stdout: "", stderr: "" })
    expect(await run(["--stdin"])).toEqual({
        code: 1,
        stdout: "",
        stderr: "error[description.expected]:1 - expected a description\n",
    })
})

test("reads file paths with spaces and reports read errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skate-cli-"))
    try {
        const path = join(directory, "commit message.txt")
        await writeFile(path, "core(fix): update\n\nbody")
        expect(await run(["--file", path])).toEqual({ code: 0, stdout: "", stderr: "" })
        await writeFile(path, "core(): update")
        expect((await run(["--file", path])).code).toBe(1)
        const missing = join(directory, "missing")
        expect(await run(["--file", missing])).toEqual({
            code: 2,
            stdout: "",
            stderr: `skate: could not read file ${JSON.stringify(missing)}\n`,
        })
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})

test("literal arguments and usage errors are handled", async () => {
    expect(await run(["--message", "--help"])).toEqual({ code: 0, stdout: "", stderr: "" })
    expect((await run(["--message", ""])).code).toBe(1)
    for (const args of [
        ["--file"],
        ["--message"],
        ["--unknown"],
        ["one", "two"],
        ["--stdin", "extra"],
    ]) {
        const result = await run(args)
        expect(result.code).toBe(2)
        expect(result.stdout).toBe("")
        expect(result.stderr).toStartWith("usage: skate")
    }
    for (const help of ["--help", "-h"]) {
        const result = await run([help])
        expect(result.code).toBe(0)
        expect(result.stdout).toStartWith("usage: skate")
        expect(result.stderr).toBe("")
    }
})

test("shows a version without validating a message", async () => {
    for (const flag of ["--version", "-v"]) {
        const result = await run([flag])
        expect(result.code).toBe(0)
        expect(result.stderr).toBe("")
        expect(result.stdout).toBe(`skate ${process.env.SKATE_EXPECT_VERSION ?? "dev"}\n`)
    }
})
