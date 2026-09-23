import { Parser } from "./parser"

const source = "engine(fix)!: abc | hello world!"
const parser = new Parser(source)

if (parser.diagnostics.hasErrors) {
    console.log(parser.diagnostics.all)
} else {
    console.log(parser.parse())
}
