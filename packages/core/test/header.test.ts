import { expect, test } from "bun:test"
import { Parser } from "../src/parser"
import { formatDiagnostics } from "../src/formatter"

const cases: [string, string][] = [
    ["core!!: update", 'error[header.syntax]:6 - only one "!" is allowed in the header'],
    ["core!!!!: update", 'error[header.syntax]:6 - only one "!" is allowed in the header'],
    ["core(fix)!!: update", 'error[header.syntax]:11 - only one "!" is allowed in the header'],
    ["core!(fix): update", 'error[header.syntax]:6 - commit type must come before "!"'],
    ["core(fix)(revert): update", "error[header.syntax]:10 - only one commit type is allowed"],
    ["core(fix)): update", 'error[header.syntax]:10 - unexpected ")" in header'],
    ["core): update", 'error[header.syntax]:5 - unexpected ")" in header'],
    ["core : update", 'error[header.syntax]:5 - unexpected whitespace before ":"'],
    ["core(fix)!\t: update", 'error[header.syntax]:11 - unexpected whitespace before ":"'],
    ["core? : update", 'error[header.syntax]:5 - unexpected content "? " in header'],
    ["core..api: update", 'error[scope.expected]:5 - expected a scope after "."'],
    ["core.: update", 'error[scope.expected]:5 - expected a scope after "."'],
    [".core: update", "error[scope.expected]:1 - expected a scope"],
    ["(fix): update", "error[scope.expected]:1 - expected a scope"],
    ["!: update", "error[scope.expected]:1 - expected a scope"],
    ["core(: update", 'error[type.unterminated]:5 - unterminated commit type. expected ")"'],
    ["core(fix!: update", 'error[type.unterminated]:5 - unterminated commit type. expected ")"'],
    [
        "core( ): update",
        'error[type.unknown]:6 - unknown commit type " ". expected one of: fix, migrate, optimize, refactor, revert',
    ],
    ["core:\tupdate", 'warning[header.spacing]:6 - expected one space after ":"'],
    [
        "core:",
        'error[header.spacing]:6 - expected a space after ":"\nerror[description.expected]:6 - expected a description',
    ],
    ["core: ", "error[description.expected]:7 - expected a description"],
    [
        "update|REF",
        'warning[references.spacing]:7 - expected one space before "|"\nerror[references.spacing]:8 - expected a space after "|"',
    ],
    [
        "update |\t",
        'warning[references.spacing]:9 - expected one space after "|"\nerror[reference.expected]:10 - expected a reference after "|"',
    ],
    ["update | A\tB", "warning[references.spacing]:11 - expected one space between references"],
    [
        "a: b: c: d",
        "error[marker.header]:5 - multiple header markers\nerror[marker.header]:8 - multiple header markers",
    ],
    [
        "a | B | C | D",
        "error[marker.references]:7 - multiple reference markers\nerror[marker.references]:11 - multiple reference markers",
    ],
    ["update | A: B", "error[marker.order]:11 - header marker must come before references"],
]

for (const [source, output] of cases) {
    test(`diagnostics for ${JSON.stringify(source)}`, () => {
        const parser = new Parser(source)
        const result = parser.parse()
        expect(formatDiagnostics(parser.diagnostics.all)).toBe(output)
        expect(parser.diagnostics.hasErrors).toBe(output.includes("error["))
        expect(result === null).toBe(parser.diagnostics.hasErrors)
    })
}

test("repeated breaking markers span only the extra markers and recover", () => {
    const parser = new Parser("Core(fix)!!!:  update |REF")
    expect(parser.parse()).toBeNull()
    expect(parser.diagnostics.all.map((d) => [d.code, d.severity, d.span])).toEqual([
        ["scope.case", "error", { start: 0, end: 4 }],
        ["header.syntax", "error", { start: 10, end: 12 }],
        ["header.spacing", "warning", { start: 13, end: 15 }],
        ["references.spacing", "error", { start: 23, end: 23 }],
    ])
})

test("exclamation marks in descriptions, references and bodies remain ordinary text", () => {
    for (const source of [
        "update!!",
        "core: update!! | REF!",
        "core(fix)!: update\nbody!!!: |",
        "core!: update",
    ]) {
        const parser = new Parser(source)
        expect(parser.parse()).not.toBeNull()
        expect(parser.diagnostics.all).toEqual([])
    }
})
