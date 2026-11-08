export type Span = {
    start: number
    end: number
}

export type Severity = "error" | "warning"

export type Message = {
    key: string
    args?: Record<string, string | readonly string[]>
}

export type Diagnostic = {
    severity: Severity
    message: Message
    span: Span
} & DiagnosticOptions

export type DiagnosticOptions = {
    code: string
    labels?: { span: Span; message: Message }[]
    notes?: Message[]
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

    public error(message: Message, span: Span, options: DiagnosticOptions) {
        this.push({
            severity: "error",
            message,
            span,
            ...options,
        })
    }

    public warning(message: Message, span: Span, options: DiagnosticOptions) {
        this.push({
            severity: "warning",
            message,
            span,
            ...options,
        })
    }
}
