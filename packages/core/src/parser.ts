import { Diagnostics, type Span } from "./diagnostics"
import { COMMIT_TYPES, type Commit, type CommitType } from "./types"

const scopeCharacter = /[\p{L}\p{N}_-]/u
const uppercaseCharacter = /\p{Lu}/u

type Markers = {
    lineEnd: number
    header: number | null
    references: number | null
}

function isCommitType(value: string): value is CommitType {
    return (COMMIT_TYPES as readonly string[]).includes(value)
}

function isWhitespace(character: string | null): boolean {
    return character === " " || character === "\t"
}

export class Parser {
    private cursor = 0

    public readonly diagnostics: Diagnostics

    constructor(
        private source: string,
        diagnostics?: Diagnostics,
    ) {
        this.diagnostics = diagnostics ?? new Diagnostics()
    }

    public parse(): Commit | null {
        const commit: Commit = {
            scope: [],
            breaking: false,
            description: "",
            references: [],
        }

        const markers = this.scanMarkers()

        if (this.diagnostics.hasErrors) {
            return null
        }

        if (markers.header !== null) {
            this.cursor = 0
            this.parseHeader(commit, markers.header)

            this.cursor = markers.header + 1
            this.parseHeaderSpacing()
        } else {
            this.cursor = 0
            this.checkMissingHeaderMarker(markers.references ?? markers.lineEnd)
        }

        this.parseDescription(
            commit,
            markers.references ?? markers.lineEnd,
            markers.references !== null,
        )

        if (markers.references !== null) {
            this.cursor = markers.references + 1

            this.parseReferenceSpacing(markers.lineEnd)
            this.parseReferences(commit, markers.lineEnd)
        }

        this.parseBody(commit, markers.lineEnd)

        if (this.diagnostics.hasErrors) {
            return null
        }

        return commit
    }

    // ':' and '|' are unique first line markers
    // the body is opaque and is never scanned
    private scanMarkers(): Markers {
        const lineEnd = this.source.indexOf("\n")
        const end = lineEnd === -1 ? this.source.length : lineEnd

        let header: number | null = null
        let references: number | null = null

        for (let i = 0; i < end; i += 1) {
            const character = this.source[i]

            if (character === ":") {
                if (header !== null) {
                    this.diagnostics.error({ key: "marker.header" }, this.span(i, i + 1), {
                        code: "marker.header",
                        labels: [
                            { span: this.span(i, i + 1), message: { key: "marker.header.label" } },
                        ],
                    })
                } else {
                    header = i
                }
            }

            if (character === "|") {
                if (references !== null) {
                    this.diagnostics.error({ key: "marker.references" }, this.span(i, i + 1), {
                        code: "marker.references",
                        labels: [
                            {
                                span: this.span(i, i + 1),
                                message: { key: "marker.references.label" },
                            },
                        ],
                    })
                } else {
                    references = i
                }
            }
        }

        if (header !== null && references !== null && header > references) {
            this.diagnostics.error({ key: "marker.order" }, this.span(header, header + 1), {
                code: "marker.order",
            })
        }

        return {
            lineEnd: end,
            header,
            references,
        }
    }

    // a typed, breaking prefix can also be a description, so only warn
    private checkMissingHeaderMarker(end: number) {
        const firstLine = this.source.slice(0, end)
        const match = /^[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\([^()\s]+\)!(?=[ \t]|$)/u.exec(
            firstLine,
        )
        if (match) {
            this.diagnostics.warning(
                { key: "header.marker_missing" },
                this.point(match[0].length),
                {
                    code: "header.marker_missing",
                },
            )
        }
    }

    // header = scope [ type ] [ breaking ]
    private parseHeader(commit: Commit, end: number) {
        if (!this.parseScope(commit, end)) {
            this.cursor = end
            return
        }

        if (this.cursor < end && this.peek() === "(") {
            this.parseType(commit, end)
        }

        if (this.cursor < end && this.consume("!")) {
            commit.breaking = true

            const start = this.cursor
            while (this.cursor < end && this.consume("!")) {}
            if (this.cursor > start) {
                this.diagnostics.error(
                    { key: "header.breaking_repeated" },
                    this.span(start, this.cursor),
                    {
                        code: "header.syntax",
                    },
                )
            }
        }

        if (this.cursor < end) {
            const start = this.cursor
            let key = "header.unexpected"
            if (this.peek() === "(") {
                key = commit.breaking ? "header.type_after_breaking" : "header.type_repeated"
            } else if (this.peek() === ")") {
                key = "header.parenthesis_unexpected"
            } else if ([...this.source.slice(start, end)].every(isWhitespace)) {
                key = "header.space_before_marker"
            }
            this.diagnostics.error(
                { key, args: { value: this.source.slice(start, end) } },
                this.span(start, end),
                { code: "header.syntax" },
            )
            this.cursor = end
        }
    }

    // scope = identifier { '.' identifier }
    private parseScope(commit: Commit, end: number): boolean {
        const first = this.parseScopeSegment(end)

        if (first === null) {
            this.diagnostics.error({ key: "scope.expected" }, this.point(), {
                code: "scope.expected",
            })

            return false
        }

        commit.scope.push(first)

        while (this.cursor < end && this.consume(".")) {
            const dot = this.cursor - 1
            const scope = this.parseScopeSegment(end)

            if (scope === null) {
                this.diagnostics.error({ key: "scope.after_dot" }, this.span(dot, this.cursor), {
                    code: "scope.expected",
                })

                return false
            }

            commit.scope.push(scope)
        }
        return true
    }

    private parseScopeSegment(end: number): string | null {
        const start = this.cursor

        while (this.cursor < end && this.isScopeCharacter(this.peek())) {
            this.advance()
        }

        if (this.cursor === start) {
            return null
        }

        const value = this.source.slice(start, this.cursor)

        if (uppercaseCharacter.test(value)) {
            this.diagnostics.error({ key: "scope.case" }, this.span(start, this.cursor), {
                code: "scope.case",
            })
        }

        return value
    }

    // type = '(' modifier ')'
    private parseType(commit: Commit, end: number) {
        const open = this.cursor
        this.advance()

        const start = this.cursor

        while (this.cursor < end && this.peek() !== ")") {
            this.advance()
        }

        if (this.cursor >= end) {
            this.diagnostics.error({ key: "type.unterminated" }, this.span(open, end), {
                code: "type.unterminated",
                labels: [{ span: this.point(end), message: { key: "type.unterminated.label" } }],
                notes: [{ key: "type.unterminated.label" }],
            })

            return
        }

        const value = this.source.slice(start, this.cursor)
        const span = this.span(start, this.cursor)

        this.advance()

        if (value.length === 0) {
            this.diagnostics.error({ key: "type.empty" }, this.span(open, this.cursor), {
                code: "type.empty",
            })
            return
        }

        if (!isCommitType(value)) {
            this.diagnostics.error({ key: "type.unknown", args: { value } }, span, {
                code: "type.unknown",
                notes: [{ key: "type.allowed", args: { types: COMMIT_TYPES } }],
            })

            return
        }

        commit.type = value
    }

    // ': ' is required
    // extra whitespace is accepted but isn't canonical
    private parseHeaderSpacing() {
        const start = this.cursor

        while (isWhitespace(this.peek())) {
            this.advance()
        }

        const whitespace = this.source.slice(start, this.cursor)

        if (whitespace.length === 0) {
            this.diagnostics.error({ key: "header.space_missing" }, this.point(start), {
                code: "header.spacing",
            })

            return
        }

        if (whitespace !== " ") {
            this.diagnostics.warning({ key: "header.space_extra" }, this.span(start, this.cursor), {
                code: "header.spacing",
            })
        }
    }

    private parseDescription(commit: Commit, end: number, hasReferences: boolean) {
        const start = this.cursor
        let textEnd = end

        if (hasReferences) {
            while (textEnd > start && isWhitespace(this.source[textEnd - 1] ?? null)) {
                textEnd -= 1
            }

            const whitespace = this.source.slice(textEnd, end)

            if (whitespace !== " ") {
                this.diagnostics.warning(
                    { key: "references.space_before" },
                    this.span(textEnd, end),
                    {
                        code: "references.spacing",
                    },
                )
            }
        }

        const description = this.source.slice(start, textEnd)

        if (description.length === 0) {
            this.diagnostics.error({ key: "description.expected" }, this.point(start), {
                code: "description.expected",
            })

            return
        }

        if ([...description].every((character) => isWhitespace(character))) {
            this.diagnostics.error({ key: "description.empty" }, this.span(start, textEnd), {
                code: "description.expected",
            })

            return
        }

        commit.description = description
        this.cursor = end
    }

    // ' | ' is required
    private parseReferenceSpacing(lineEnd: number) {
        if (this.cursor >= lineEnd) {
            return
        }

        if (!isWhitespace(this.peek())) {
            this.diagnostics.error({ key: "references.space_missing" }, this.point(), {
                code: "references.spacing",
            })

            return
        }

        const start = this.cursor

        while (this.cursor < lineEnd && isWhitespace(this.peek())) {
            this.advance()
        }

        const whitespace = this.source.slice(start, this.cursor)

        if (whitespace !== " ") {
            this.diagnostics.warning(
                { key: "references.space_extra" },
                this.span(start, this.cursor),
                {
                    code: "references.spacing",
                },
            )
        }
    }

    // references = reference { ' ' reference }
    private parseReferences(commit: Commit, lineEnd: number) {
        if (this.cursor >= lineEnd) {
            this.diagnostics.error({ key: "reference.expected" }, this.point(), {
                code: "reference.expected",
            })

            return
        }

        while (this.cursor < lineEnd) {
            const start = this.cursor

            while (this.cursor < lineEnd && !isWhitespace(this.peek())) {
                this.advance()
            }

            commit.references.push(this.source.slice(start, this.cursor))

            if (this.cursor >= lineEnd) {
                break
            }

            const whitespaceStart = this.cursor

            while (this.cursor < lineEnd && isWhitespace(this.peek())) {
                this.advance()
            }

            if (this.cursor >= lineEnd) {
                break
            }

            const whitespace = this.source.slice(whitespaceStart, this.cursor)

            if (whitespace !== " ") {
                this.diagnostics.warning(
                    { key: "references.space_between" },
                    this.span(whitespaceStart, this.cursor),
                    {
                        code: "references.spacing",
                    },
                )
            }
        }
    }

    // everything after the first newline is untouched
    private parseBody(commit: Commit, lineEnd: number) {
        if (lineEnd === this.source.length) {
            return
        }

        commit.body = this.source.slice(lineEnd + 1)
        this.cursor = this.source.length
    }

    private isScopeCharacter(character: string | null): boolean {
        if (character === null) {
            return false
        }

        return scopeCharacter.test(character)
    }

    private span(start: number, end: number): Span {
        return { start, end }
    }

    private point(at = this.cursor): Span {
        return {
            start: at,
            end: at,
        }
    }

    private peek(): string | null {
        if (this.eof()) {
            return null
        }

        return this.source[this.cursor]!
    }

    private advance(): string | null {
        const current = this.peek()

        if (current === null) {
            return null
        }

        this.cursor += 1
        return current
    }

    private consume(character: string): boolean {
        if (this.peek() !== character) {
            return false
        }

        this.advance()
        return true
    }

    private eof(): boolean {
        return this.cursor >= this.source.length
    }
}
