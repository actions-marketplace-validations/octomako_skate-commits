import { Parser } from "../../core/src/index"
import { formatAnnotation, formatError } from "./formatter"
import { readMessage } from "./input"

async function main(): Promise<number> {
    let message: string
    try {
        message = await readMessage({
            message: process.env.SKATE_MESSAGE,
            file: process.env.SKATE_MESSAGE_FILE,
            eventPath: process.env.GITHUB_EVENT_PATH,
        })
    } catch (error) {
        console.log(formatError(error))
        return 2
    }

    const parser = new Parser(message)
    parser.parse()

    for (const diagnostic of parser.diagnostics.all) {
        console.log(formatAnnotation(diagnostic))
    }

    return parser.diagnostics.hasErrors ? 1 : 0
}

process.exitCode = await main()
