import { expect, test } from "bun:test"
import { formatAnnotation, formatError } from "../src/formatter"

test("escapes workflow commands and never emits a second annotation from a value", () => {
    expect(
        formatAnnotation({
            severity: "error",
            code: "x,:%\n",
            span: { start: 0, end: 0 },
            message: { key: "bad%\n::warning::value" },
        }),
    ).toBe("::error title=x%2C%3A%25%0A::error[x,:%25\\n]:1 - bad%25\\n::warning::value")
})

test("escapes input errors", () => {
    expect(formatError(new Error("bad%\ninput"))).toBe("::error::skate: bad%25%0Ainput")
})
