# header diagnostics

header syntax errors describe the construct when it can be identified
these messages share the `header.syntax` code

- repeated `!`: only one breaking marker is allowed
- type after `!`: the type must come before the breaking marker
- second type: only one type is allowed
- extra `)`: unexpected closing parenthesis
- whitespace before `:`: unexpected whitespace before the header marker
- other content: include the unexpected value in double quotes

extra consecutive breaking markers produce one diagnostic
the span covers the extra markers, leaving the first `!` out
parsing continues to find independent header and spacing errors

missing scope segments produce a scope error without a second header error
unterminated types include a note that `)` is expected
exclamation marks in descriptions, references, and bodies are ordinary text
