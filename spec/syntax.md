# syntax

```text
[scope[.scope][(type)][!]: ]description[ | reference reference]
```

brackets mark optional parts
see [grammar.ebnf](grammar.ebnf) for the grammar

## header

scope segments contain letters, numbers, `_`, or `-`
uppercase letters are not allowed
segments are separated by dots

types are `fix`, `migrate`, `optimize`, `refactor`, and `revert`
one optional `!` follows the scope or type and marks a breaking change
one space follows `:`

## description and references

a description is required, even without a header
references follow ` | ` and are separated by spaces
there can be only one `:` and one `|` on the first line
`:` must come before `|`

## body

only the first line is structured
everything after the first newline is kept as the body

```text
update readme
core(fix): handle empty types
api!: remove endpoint | APP-12
```
