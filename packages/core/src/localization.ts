export type Locale = {
    language: string
    messages: Readonly<Record<string, string>>
}

export const en: Locale = {
    language: "en",
    messages: {
        "marker.header": "multiple header markers",
        "marker.header.label": 'only one ":" is allowed',
        "marker.references": "multiple reference markers",
        "marker.references.label": 'only one "|" is allowed',
        "marker.order": "header marker must come before references",
        "header.marker_missing": 'possible missing ":" after header',
        "header.breaking_repeated": 'only one "!" is allowed in the header',
        "header.type_after_breaking": 'commit type must come before "!"',
        "header.type_repeated": "only one commit type is allowed",
        "header.parenthesis_unexpected": 'unexpected ")" in header',
        "header.space_before_marker": 'unexpected whitespace before ":"',
        "header.unexpected": "unexpected content {value:quote} in header",
        "scope.expected": "expected a scope",
        "scope.after_dot": 'expected a scope after "."',
        "scope.case": "scope must be lowercase",
        "type.empty": "expected a commit type",
        "type.unknown": "unknown commit type {value:quote}",
        "type.allowed": "expected one of: {types}",
        "type.unterminated": "unterminated commit type",
        "type.unterminated.label": 'expected ")"',
        "header.space_missing": 'expected a space after ":"',
        "header.space_extra": 'expected one space after ":"',
        "references.space_before": 'expected one space before "|"',
        "references.space_missing": 'expected a space after "|"',
        "references.space_extra": 'expected one space after "|"',
        "references.space_between": "expected one space between references",
        "reference.expected": 'expected a reference after "|"',
        "description.expected": "expected a description",
        "description.empty": "description cannot be empty",
    },
}
