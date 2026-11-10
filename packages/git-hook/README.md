# commit hook

install the release cli as `skate` on PATH first
copy `commit-msg` from this package to your repository's active hooks directory
make the copy executable

check the hooks directory with `git rev-parse --git-path hooks`
for a normal repository it is `.git/hooks`
if a commit-msg hook already exists, add the skate command to it instead:

```sh
skate --file "$1" || exit "$?"
```

use `SKATE_BIN=/path/to/skate` when skate is not on PATH
the path may contain spaces

errors block the commit; warnings are printed and allow it
this hook does not remove comments or edit the message
see the [spec](../../spec/git-hook/commit-msg.md)
