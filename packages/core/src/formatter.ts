import type { Diagnostic, Message } from "./diagnostics"
import { en, type Locale } from "./localization"

export function formatMessage(message: Message, locale: Locale = en): string {
    const catalog = Object.hasOwn(locale.messages, message.key) ? locale : en
    const template = Object.hasOwn(catalog.messages, message.key)
        ? catalog.messages[message.key]!
        : message.key

    return template.replace(/\{(\w+)(:quote)?\}/g, (placeholder, name, quote) => {
        const value = message.args?.[name]
        if (value === undefined) return placeholder
        if (quote) return JSON.stringify(String(value))
        if (Array.isArray(value)) {
            return new Intl.ListFormat(catalog.language, { type: "unit", style: "short" }).format(
                value,
            )
        }
        return String(value)
    })
}

function singleLine(value: string): string {
    return value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, (character) => {
        const escaped = JSON.stringify(character).slice(1, -1)
        return escaped === character
            ? `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
            : escaped
    })
}

export function formatDiagnostic(diagnostic: Diagnostic, locale: Locale = en): string {
    const message = [diagnostic.message, ...(diagnostic.notes ?? [])]
        .map((message) => formatMessage(message, locale))
        .join(". ")
    return singleLine(
        `${diagnostic.severity}[${diagnostic.code}]:${diagnostic.span.start + 1} - ${message}`,
    )
}

export function formatDiagnostics(diagnostics: readonly Diagnostic[], locale: Locale = en): string {
    return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, locale)).join("\n")
}
