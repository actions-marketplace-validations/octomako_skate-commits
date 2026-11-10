import { formatDiagnostic, type Diagnostic } from "../../core/src/index"

function escapeData(value: string): string {
    return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")
}

function escapeProperty(value: string): string {
    return escapeData(value).replaceAll(":", "%3A").replaceAll(",", "%2C")
}

export function formatAnnotation(diagnostic: Diagnostic): string {
    const title = escapeProperty(diagnostic.code)
    const message = escapeData(formatDiagnostic(diagnostic))
    return `::${diagnostic.severity} title=${title}::${message}`
}

export function formatError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error)
    return `::error::${escapeData(`skate: ${message}`)}`
}
