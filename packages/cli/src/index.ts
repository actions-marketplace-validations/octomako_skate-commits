#!/usr/bin/env bun
import { Parser, formatDiagnostics } from "../../core/src/index"

declare const SKATE_VERSION: string

const version = typeof SKATE_VERSION === "string" ? SKATE_VERSION : "dev"

const usage = `usage: skate <message>
       skate --message <message>
       skate --file <path>
       skate --stdin

validate a commit message
with no arguments, read stdin when piped

--message <message>  pass a message beginning with "-"
--file <path>        read a UTF-8 message file
--stdin              read a message from stdin
-h, --help           show this help
-v, --version        show the version
`

type Input = { kind: "message" | "file"; value: string } | { kind: "stdin" }

function parseInput(args: string[]): Input | null {
    if (args.length === 0 && !process.stdin.isTTY) return { kind: "stdin" }
    if (args.length === 1) {
        const value = args[0]!
        if (value === "--stdin") return { kind: "stdin" }
        if (!value.startsWith("-")) return { kind: "message", value }
    }
    if (args.length === 2) {
        if (args[0] === "--file") return { kind: "file", value: args[1]! }
        if (args[0] === "--message") return { kind: "message", value: args[1]! }
    }
    return null
}

export async function run(args: string[]): Promise<number> {
    if (args.length === 1 && (args[0] === "--version" || args[0] === "-v")) {
        process.stdout.write(`skate ${version}\n`)
        return 0
    }

    if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
        process.stdout.write(usage)
        return 0
    }

    const input = parseInput(args)
    if (input === null) {
        process.stderr.write(usage)
        return 2
    }

    let source: string
    try {
        switch (input.kind) {
            case "message":
                source = input.value
                break
            case "file":
                source = await Bun.file(input.value).text()
                break
            case "stdin":
                source = await Bun.stdin.text()
                break
        }
    } catch {
        const target = input.kind === "file" ? `file ${JSON.stringify(input.value)}` : "stdin"
        process.stderr.write(`skate: could not read ${target}\n`)
        return 2
    }

    const parser = new Parser(source)
    parser.parse()
    const output = formatDiagnostics(parser.diagnostics.all)
    if (output) process.stderr.write(`${output}\n`)
    return parser.diagnostics.hasErrors ? 1 : 0
}

if (import.meta.main) {
    process.exitCode = await run(process.argv.slice(2))
}
