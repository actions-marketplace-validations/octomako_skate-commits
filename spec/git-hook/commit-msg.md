# commit-msg hook

run the installed cli with `--file` and the message path supplied by Git
use `skate` from PATH, or the executable path in `SKATE_BIN`
the executable path is one value, not a shell command

preserve the cli exit status
warnings allow the commit; validation errors stop it
missing arguments and a missing cli exit with status 2
leave the message file unchanged

installation is manual and does not replace existing hooks automatically
Git chooses the hooks directory, including any configured `core.hooksPath`
the hook requires a POSIX shell; Git for Windows supplies one
