# Examples

## Scoped

```text
compiler: add generic inference
compiler.parser: support inferred generics
runtime: reduce allocator overhead
docs: explain ownership rules
```

## Typed

```text
parser(fix): handle nested expressions
database(migrate): move users to UUIDs
allocator(optimize): reuse empty pages
compiler(refactor): split inference logic
parser(revert): restore old precedence rules
```

## Breaking

```text
api!: replace authentication interface
storage(migrate)!: replace legacy save format
```

## References

```text
parser(fix): handle recursive inference | PROJ-128
ui.inventory: add item search | PROJ-182
api.auth(migrate)!: replace token auth | PROJ-52 PROJ-53
```

## Choosing a scope

Use the smallest scope that clearly identifies where the change belongs.

```text
compiler: ...
compiler.parser: ...
ui: ...
ui.inventory: ...
```

Prefer `compiler.parser` over `compiler` when the change is specifically about parsing. Use the broader scope when the change affects the subsystem as a whole.
