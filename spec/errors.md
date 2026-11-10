# errors

- `marker.header`: more than one `:` on the first line
- `marker.references`: more than one `|` on the first line
- `marker.order`: `:` appears after `|`
- `header.syntax`: repeated `!`, misplaced or repeated type, extra `)`, whitespace before `:`, or unexpected content
- `scope.expected`: missing scope or scope segment after `.`
- `scope.case`: uppercase scope
- `type.empty`: empty `()`
- `type.unknown`: unrecognized commit type
- `type.unterminated`: missing `)`
- `header.spacing`: missing space after `:`
- `description.expected`: missing or whitespace-only description
- `references.spacing`: missing space after `|`
- `reference.expected`: missing reference after `|`

## warnings

- `header.marker_missing`: typed breaking prefix looks like a header missing `:`
- `header.spacing`: more than one space or a tab after `:`
- `references.spacing`: spacing before or after `|`, or between references, is not one space

errors prevent a parsed result; warnings do not
positions are one-based UTF-16 offsets
