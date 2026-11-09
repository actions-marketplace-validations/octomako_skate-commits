import { expect, test } from "bun:test"
import { Parser } from "../src/parser"
import { formatDiagnostics, formatMessage } from "../src/formatter"

function parse(source: string) {
    const parser = new Parser(source)
    const commit = parser.parse()
    return {
        commit,
        diagnostics: parser.diagnostics,
        output: formatDiagnostics(parser.diagnostics.all),
    }
}

test("parses valid messages and preserves the body", () => {
    expect(parse("core.parser(fix)!: update | A B\nbody: | text").commit).toEqual({
        scope: ["core", "parser"],
        type: "fix",
        breaking: true,
        description: "update",
        references: ["A", "B"],
        body: "body: | text",
    })
})

test("formats empty, unknown and unterminated types", () => {
    expect(parse("core(): update").output).toBe("error[type.empty]:5 - expected a commit type")
    expect(parse("core(feature): update").output).toBe(
        'error[type.unknown]:6 - unknown commit type "feature". expected one of: fix, migrate, optimize, refactor, revert',
    )
    expect(parse("core(fix: update").output).toBe(
        'error[type.unterminated]:5 - unterminated commit type. expected ")"',
    )
})

test("keeps diagnostic order, severity, spans and labels", () => {
    const { diagnostics, output } = parse("Core():  update |REF")
    expect(diagnostics.hasErrors).toBe(true)
    expect(diagnostics.all.map((d) => d.severity)).toEqual(["error", "error", "warning", "error"])
    expect(output).toBe(
        'error[scope.case]:1 - scope must be lowercase\nerror[type.empty]:5 - expected a commit type\nwarning[header.spacing]:8 - expected one space after ":"\nerror[references.spacing]:18 - expected a space after "|"',
    )
    expect(parse("core(fix: update").diagnostics.all[0]?.labels?.[0]?.span).toEqual({
        start: 8,
        end: 8,
    })
    expect(parse("é(💥): update").diagnostics.all[0]?.span).toEqual({ start: 2, end: 4 })
})

test("formats arguments, fallback, notes and unsafe values", () => {
    const locale = { language: "en", messages: { custom: "hello {name}" } }
    expect(formatMessage({ key: "custom", args: { name: "there" } }, locale)).toBe("hello there")
    expect(formatMessage({ key: "type.empty" }, locale)).toBe("expected a commit type")
    expect(parse('core(a"b): update').output).toBe(
        'error[type.unknown]:6 - unknown commit type "a\\"b". expected one of: fix, migrate, optimize, refactor, revert',
    )
    const { output } = parse("core(\u001b): update")
    expect(output).toContain('"\\u001b"')
    expect(output.split("\n")).toHaveLength(1)
})

test("reports header, scope, spacing, reference and marker problems", () => {
    const cases: [string, string][] = [
        ["core!!!: update", 'error[header.syntax]:6 - only one "!" is allowed in the header'],
        [": update", "error[scope.expected]:1 - expected a scope"],
        ["Core: update", "error[scope.case]:1 - scope must be lowercase"],
        ["core:update", 'error[header.spacing]:6 - expected a space after ":"'],
        ["update |", 'error[reference.expected]:9 - expected a reference after "|"'],
        [
            "a: b: c | A | B",
            "error[marker.header]:5 - multiple header markers\nerror[marker.references]:13 - multiple reference markers",
        ],
    ]
    for (const [source, output] of cases) expect(parse(source).output).toBe(output)
})

test("warns about a likely missing colon without rejecting descriptions", () => {
    const result = parse("core.api(refactor)! v2")
    expect(result.output).toBe(
        'warning[header.marker_missing]:20 - possible missing ":" after header',
    )
    expect(result.commit?.description).toBe("core.api(refactor)! v2")
    expect(result.diagnostics.hasErrors).toBe(false)
    for (const source of [
        "update readme",
        "fix parser (refactor)!",
        "core.api(refactor): v2",
        "core.api(refactor) v2",
    ]) {
        expect(parse(source).output).toBe("")
    }
})
