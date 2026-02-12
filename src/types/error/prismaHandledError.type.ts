import type { ErrorDetails } from "./errorDetails.type"

export type PrismaHandledError = {
    statusCode : number
    message: string
    errors?: ErrorDetails
}