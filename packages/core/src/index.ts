import { Parser } from "./parser"

const source = "engine()!!!: abc | hello world!"
const parser = new Parser(source)

const commit = parser.parse()

if (parser.diagnostics.hasErrors) {
    const source = parser.diagnostics.render()
    console.log(source)
} else {
    console.log(commit)
}
