export type Input = {
    message?: string
    file?: string
    eventPath?: string
}

export async function readMessage({ message, file, eventPath }: Input): Promise<string> {
    if (message && file) {
        throw new Error("provide either message or message-file")
    }

    if (message) return message
    if (file) return Bun.file(file).text()

    if (!eventPath) {
        throw new Error("provide a message or message-file outside pull requests")
    }

    const event = await Bun.file(eventPath).json()
    const title = event?.pull_request?.title
    if (typeof title !== "string") {
        throw new Error("this event has no pull request title; provide a message or message-file")
    }

    return title
}
