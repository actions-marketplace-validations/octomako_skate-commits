# github action

validate a message using the core parser
run from the root `action.yml` as a composite action
Bun is set up by the action; dependencies do not need installing

use a nonempty `message` input or a `message-file` path
providing both is an error
without either input, validate the pull request title from the event payload
an explicit empty message can be supplied as an empty file
other events require explicit input
file paths are relative to the caller's working directory

emit native error and warning annotations
keep workflow command escaping in this package
never interpolate message text into shell code
errors fail the step; warnings do not
input failures exit with status 2
