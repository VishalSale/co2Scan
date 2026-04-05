import axios from "axios"
import xml2js from "xml2js"

const parser = new xml2js.Parser()

const fetchXml = async (url: string) => {
    const res = await axios.get(url, { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0 (compatible; CarbonBot/1.0)" } })
    return parser.parseStringPromise(res.data)
}

const extractFromSitemap = async (url: string, collected: string[], limit: number): Promise<void> => {
    if (collected.length >= limit) return
    try {
        const result = await fetchXml(url)

        // Sitemap index — recurse into child sitemaps
        if (result.sitemapindex?.sitemap) {
            const childUrls: string[] = result.sitemapindex.sitemap.map((s: any) => s.loc[0])
            for (const childUrl of childUrls) {
                if (collected.length >= limit) break
                await extractFromSitemap(childUrl, collected, limit)
            }
            return
        }

        // Standard urlset
        if (result.urlset?.url) {
            const urls: string[] = result.urlset.url.map((u: any) => u.loc[0])
            for (const u of urls) {
                if (collected.length >= limit) break
                collected.push(u)
            }
        }
    } catch { }
}

export const getUrlsFromSitemap = async (rootUrl: string, limit = 100): Promise<string[]> => {
    const collected: string[] = []

    // Try common sitemap locations
    const candidates = [
        `${rootUrl}/sitemap.xml`,
        `${rootUrl}/sitemap_index.xml`,
        `${rootUrl}/sitemap/sitemap.xml`,
    ]

    for (const candidate of candidates) {
        if (collected.length >= limit) break
        await extractFromSitemap(candidate, collected, limit)
    }

    // Filter to same hostname
    const hostname = new URL(rootUrl).hostname
    return collected.filter(u => {
        try { return new URL(u).hostname === hostname }
        catch { return false }
    }).slice(0, limit)
}
