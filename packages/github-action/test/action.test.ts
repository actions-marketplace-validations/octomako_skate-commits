import { expect, test } from "bun:test"

const entry = new URL("../src/index.ts", import.meta.url).pathname

async function run(message: string) {
    const proc = Bun.spawn([process.execPath, entry], {
        env: {
            ...process.env,
            SKATE_MESSAGE: message,
            SKATE_MESSAGE_FILE: "",
            GITHUB_EVENT_PATH: "",
        },
        stdout: "pipe",
        stderr: "pipe",
    })
    const [code, output] = await Promise.all([proc.exited, new Response(proc.stdout).text()])
    return { code, output }
}

test("uses the shared parser and renders native annotations", async () => {
    expect(await run("core: update")).toEqual({ code: 0, output: "" })
    expect(await run("core(): update")).toEqual({
        code: 1,
        output: "::error title=type.empty::error[type.empty]:5 - expected a commit type\n",
    })
    expect(await run("core:  update")).toEqual({
        code: 0,
        output: '::warning title=header.spacing::warning[header.spacing]:6 - expected one space after ":"\n',
    })
    expect((await run("$(echo hello)")).code).toBe(0)
})
