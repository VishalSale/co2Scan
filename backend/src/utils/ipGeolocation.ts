import axios from "axios"

interface GeolocationResult {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  source: string
}

/**
 * Get geolocation data from IP address
 * Uses free APIs with fallbacks
 */
export async function getGeolocationFromIp(ip: string): Promise<GeolocationResult> {
  // Skip localhost/private IPs
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return {
      ip: ip || "unknown",
      country: "Unknown",
      countryCode: "GLOBAL",
      region: "Unknown",
      city: "Unknown",
      source: "localhost",
    }
  }

  // Try ip-api.com (free, no key, 45 req/min)
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: { fields: "status,country,countryCode,regionName,city" },
      timeout: 2000,
    })

    if (response.data?.status === "success") {
      return {
        ip,
        country: response.data.country || "Unknown",
        countryCode: response.data.countryCode || "GLOBAL",
        region: response.data.regionName || "Unknown",
        city: response.data.city || "Unknown",
        source: "ip-api.com",
      }
    }
  } catch {
    console.log(`ip-api.com failed for ${ip}, trying fallback`)
  }

  // Fallback: ipapi.co (free, 1000/day, no key)
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 2000,
    })

    if (response.data?.country_code) {
      return {
        ip,
        country: response.data.country_name || "Unknown",
        countryCode: response.data.country_code || "GLOBAL",
        region: response.data.region || "Unknown",
        city: response.data.city || "Unknown",
        source: "ipapi.co",
      }
    }
  } catch {
    console.log(`ipapi.co failed for ${ip}`)
  }

  // Final fallback
  return {
    ip,
    country: "Unknown",
    countryCode: "GLOBAL",
    region: "Unknown",
    city: "Unknown",
    source: "fallback",
  }
}

/**
 * Get server IP from URL
 */
export async function getServerIpFromUrl(url: string): Promise<string | null> {
  try {
    const { hostname } = new URL(url)
    const dns = await import("dns").then((m) => m.promises)
    const addresses = await dns.resolve4(hostname)
    return addresses[0] || null
  } catch (error) {
    console.log(`Failed to resolve IP for ${url}:`, error)
    return null
  }
}
