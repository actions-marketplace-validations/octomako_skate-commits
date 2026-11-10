# standalone cli

build with `bun run --cwd packages/cli build`
write `dist/skate` inside the cli package, or `dist/skate.exe` on Windows
bundle the runtime so the executable does not require Bun
build for the current machine's operating system and architecture

embed `SKATE_VERSION` from the build environment, defaulting to `dev`
`--version` and `-v` print `skate <version>` and exit successfully
source runs report `dev`

do not load local dotenv or bunfig files in the compiled program
run the same cli tests against the executable through `SKATE_TEST_BINARY`
