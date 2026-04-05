export const extractLinks = (html: string, finalUrl: string, rootUrl?: string): string[] => {
    const links = new Set<string>()
    const base = new URL(rootUrl || finalUrl)
    const rootHostname = base.hostname.replace(/^www\./, "")

    // Match href values — handle both single and double quotes, and unquoted
    const hrefRegex = /href=["']([^"'\s>]+)["']/gi
    let match: RegExpExecArray | null

    while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1].trim()
        if (!href) continue

        // Skip non-page links
        if (
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("data:")
        ) continue

        try {
            const resolved = new URL(href, finalUrl)

            // Strip www and compare root domains
            const resolvedRoot = resolved.hostname.replace(/^www\./, "")
            if (resolvedRoot !== rootHostname) continue

            // Skip non-HTML resources
            const ext = resolved.pathname.split(".").pop()?.toLowerCase() || ""
            if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "webm", "mp4", "mp3", "pdf", "zip", "css", "js", "woff", "woff2", "ttf", "eot"].includes(ext)) continue

            // Normalize: strip hash and trailing slash, keep query for uniqueness but strip for dedup
            const path = resolved.pathname.replace(/\/$/, "") || "/"
            const normalized = resolved.origin + path

            links.add(normalized)
        } catch { }
    }

    return Array.from(links)
}
