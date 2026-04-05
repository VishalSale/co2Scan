import crypto from "crypto"
import { Request } from "express"

export function generateFingerprint(request: Request): string {
  const userAgent = request.headers["user-agent"] || ""
  const acceptLanguage = request.headers["accept-language"] || ""
  const acceptEncoding = request.headers["accept-encoding"] || ""
  const accept = request.headers["accept"] || ""

  // Combine multiple headers to create fingerprint
  const fingerprintData = [userAgent, acceptLanguage, acceptEncoding, accept].join("|")

  // Hash it to create a consistent identifier
  const fingerprint = crypto.createHash("sha256").update(fingerprintData).digest("hex")

  return fingerprint
}

export function generateCompositeId(ip: string, fingerprint: string): string {
  return crypto.createHash("sha256").update(`${ip}:${fingerprint}`).digest("hex")
}
