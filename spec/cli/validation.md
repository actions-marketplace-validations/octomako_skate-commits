# cli validation

validate one commit message from an argument, file, or stdin
requires Bun for now

## input

- `<message>`: one message argument
- `--message <message>`: one message argument, including values beginning with `-`
- `--file <path>`: read a UTF-8 file
- `--stdin`: read stdin until it ends
- no arguments: read stdin when piped, otherwise show usage
- `--help` or `-h`: show help

input modes cannot be combined
missing values and extra arguments are usage errors
input is passed to the parser unchanged
file comments and trailing newlines are not removed

## output

diagnostics go to stderr, one per line
warnings are shown even when parsing succeeds
valid messages without diagnostics produce no output
help goes to stdout; usage and input errors go to stderr

- `0`: valid message or help
- `1`: message has errors
- `2`: usage error or unreadable input

## scope

this command validates a message
hook setup and reading commit history belong in separate features
