# github action

use the root action at a release tag or commit
replace `owner/skate` with this repository's name

```yaml
name: commit message
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions:
  contents: read
jobs:
  title:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/skate@v0.1.0
```

the action checks the PR title, which is useful for squash merges
it does not check every commit in the PR

pass `message` to check another value:

```yaml
- uses: owner/skate@v0.1.0
  with:
    message: ${{ github.event.head_commit.message }}
```

for a file, check out the caller's repository first and pass `message-file`
there is no checkout requirement when checking a PR title or message input
warnings appear as annotations without failing the step
see the [spec](../../spec/github-action/validation.md)
