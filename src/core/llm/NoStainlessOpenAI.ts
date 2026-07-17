import OpenAI from 'openai'
import { FinalRequestOptions } from 'openai/core'

const stripStainlessHeaders = (
  headers: RequestInit['headers'],
): RequestInit['headers'] => {
  if (!headers) return headers
  const shouldKeep = (key: string) =>
    !key.toLowerCase().startsWith('x-stainless')

  if (headers instanceof Headers) {
    const next = new Headers()
    headers.forEach((value, key) => {
      if (shouldKeep(key)) {
        next.append(key, value)
      }
    })
    return next
  }

  if (Array.isArray(headers)) {
    return headers.filter(([key]) => shouldKeep(key))
  }

  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => shouldKeep(key)),
  )
}

export class NoStainlessOpenAI extends OpenAI {
  override buildRequest<Req>(
    options: FinalRequestOptions<Req>,
    { retryCount = 0 }: { retryCount?: number } = {},
  ): { req: RequestInit; url: string; timeout: number } {
    const req = super.buildRequest(options, { retryCount })
    req.req.headers = stripStainlessHeaders(req.req.headers)

    return req
  }
}
