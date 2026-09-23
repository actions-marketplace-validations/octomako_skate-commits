// prettier-ignore
export const COMMIT_TYPES = [
    "fix",
    "migrate",
    "optimize",
    "refactor",
    "revert",
] as const

export type CommitType = (typeof COMMIT_TYPES)[number]

export type Commit = {
    scope: string[]
    type?: CommitType
    breaking: boolean

    description: string
    references: string[]
    body?: string
}
