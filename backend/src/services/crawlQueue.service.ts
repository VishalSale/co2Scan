import { extractLinks } from "../utils/linkExtractor"
import { getUrlsFromSitemap } from "../utils/sitemapParser"

export const discoverPages = async (rootUrl: string, limit = 100): Promise<string[]> => {
    const normalizeDiscovered = (u: string) => u.trim().replace(/\/$/, "") || u

    // Try sitemap first
    const sitemapUrls = await getUrlsFromSitemap(rootUrl, limit)
    console.log(`[discoverPages] sitemap found ${sitemapUrls.length} URLs for ${rootUrl}`)

    if (sitemapUrls.length > 0) {
        const filtered = sitemapUrls
            .filter((u: string) => {
                try { return new URL(u).hostname === new URL(rootUrl).hostname }
                catch { return false }
            })
            .map(normalizeDiscovered)
        const unique = [...new Set(filtered)].slice(0, limit)
        console.log(`[discoverPages] using ${unique.length} sitemap URLs after filter`)
        if (unique.length > 0) return unique
    }

    // Fallback: BFS link crawling
    console.log(`[discoverPages] no sitemap, falling back to BFS crawl`)
    const normalizedRoot = normalizeDiscovered(rootUrl)
    const queue = [normalizedRoot]
    const visited = new Set<string>()

    while (queue.length > 0 && visited.size < limit) {
        const url = queue.shift()!
        const normalizedUrl = normalizeDiscovered(url)
        if (visited.has(normalizedUrl)) continue
        visited.add(normalizedUrl)
        try {
            const res = await fetch(normalizedUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; CarbonBot/1.0)" },
                signal: AbortSignal.timeout(10000),
            })
            const finalUrl = res.url || normalizedUrl
            const html = await res.text()
            const hrefCount = (html.match(/href=/gi) || []).length
            console.log(`[discoverPages] fetched ${normalizedUrl} → finalUrl: ${finalUrl}, html length: ${html.length}, raw hrefs: ${hrefCount}`)
            const links = extractLinks(html, finalUrl, rootUrl)
            console.log(`[discoverPages] ${normalizedUrl} → found ${links.length} links after extract`)
            for (const link of links) {
                const normalizedLink = normalizeDiscovered(link)
                if (!visited.has(normalizedLink)) queue.push(normalizedLink)
            }
        } catch (e: any) {
            console.log(`[discoverPages] fetch failed for ${normalizedUrl}: ${e?.message}`)
        }
    }

    console.log(`[discoverPages] BFS done, total pages: ${visited.size}`)
    return Array.from(visited)
}
