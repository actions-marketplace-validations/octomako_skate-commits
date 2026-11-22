# skate

![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)

lightweight commit message tooling

skate uses a small scope-first convention:

```text
[scope[.scope][(type)][!]: ]description[ | reference reference]
```

examples:

```text
update readme
core(fix): handle empty types
api!: remove endpoint | APP-12
compiler.parser(refactor): split inference logic
```

## why

skate keeps commit messages structured without making every change fit a mandatory type

- scopes identify where a change happened
- types are optional
- breaking changes use `!`
- references stay at the end
- unscoped commits are valid
- only the first line is structured

## types

skate supports five optional types:

- `fix` - correct broken or unintended behavior
- `migrate` - transition from one system, format, or interface to another
- `optimize` - improve performance or resource usage without changing behavior
- `refactor` - restructure internals without changing behavior
- `revert` - undo a previous change

normal additions and changes usually do not need a type:

```text
compiler.parser: support inferred generics
docs: explain configuration
```

## specification

- [syntax](spec/syntax.md)
- [errors](spec/errors.md)
- [grammar](spec/grammar.ebnf)

## development

```sh
bun install --frozen-lockfile
bun test
bun run typecheck
bun run packages/cli --help
```
