import { expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readMessage } from "../src/input"

test("selects explicit input, files or PR titles and rejects missing input", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skate-action-"))
    try {
        const event = join(directory, "event.json")
        const messageFile = join(directory, "message.txt")
        await writeFile(event, JSON.stringify({ pull_request: { title: "core: update" } }))
        await writeFile(messageFile, "")
        expect(await readMessage({ eventPath: event })).toBe("core: update")
        expect(await readMessage({ message: "explicit", eventPath: event })).toBe("explicit")
        expect(await readMessage({ file: messageFile })).toBe("")
        await expect(readMessage({ message: "x", file: messageFile })).rejects.toThrow("either")
        await writeFile(event, "{}")
        await expect(readMessage({ eventPath: event })).rejects.toThrow("no pull request title")
        await expect(readMessage({})).rejects.toThrow("outside pull requests")
        await expect(readMessage({ file: join(directory, "missing") })).rejects.toThrow()
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
})
