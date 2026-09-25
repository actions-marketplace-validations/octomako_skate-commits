export type Span = {
    start: number
    end: number
}

export type Severity = "error" | "warning"

export type Diagnostic = {
    severity: Severity
    message: string
    span: Span
} & DiagnosticOptions

export type DiagnosticOptions = {
    code?: string
    label?: string
    notes?: string[]
}

export class Diagnostics {
    private items: Diagnostic[] = []

    public get all(): readonly Diagnostic[] {
        return this.items
    }

    public get errorCount(): number {
        return this.items.filter((diagnostic) => diagnostic.severity === "error").length
    }

    public get warningCount(): number {
        return this.items.filter((diagnostic) => diagnostic.severity === "warning").length
    }

    public get hasErrors(): boolean {
        return this.errorCount > 0
    }

    public push(diagnostic: Diagnostic) {
        this.items.push(diagnostic)
    }

    public error(message: string, span: Span, options: DiagnosticOptions = {}) {
        this.push({
            severity: "error",
            message,
            span,
            ...options,
        })
    }

    public warning(message: string, span: Span, options: DiagnosticOptions = {}) {
        this.push({
            severity: "warning",
            message,
            span,
            ...options,
        })
    }

    public render(): string {
        return this.items.map((diagnostic) => this.renderDiagnostic(diagnostic)).join("\n\n")
    }

    private renderDiagnostic(diagnostic: Diagnostic): string {
        const code = diagnostic.code ? `[${diagnostic.code}]` : ""
        const column = diagnostic.span.start + 1

        const output = [`${diagnostic.severity}${code}:${column} ${diagnostic.message}`]

        if (diagnostic.notes?.length) {
            output.push(...diagnostic.notes.map((note) => `note: ${note}`))
        }

        return output.join("\n")
    }
}
