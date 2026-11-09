# cli

requires Bun
run from the repository root:

```sh
bun run packages/cli 'core(fix): handle empty types'
bun run packages/cli --message '- update readme'
bun run packages/cli --file message.txt
printf 'core: add parser' | bun run packages/cli
```

use `--stdin` to read stdin explicitly
use `--help` for usage

diagnostics go to stderr
errors exit with status 1; usage and read failures exit with status 2
warnings do not cause failure

see the [spec](../../spec/cli/validation.md) for the interface
