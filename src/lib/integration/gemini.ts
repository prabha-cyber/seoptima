export async function suggestKeywords(url: string) {
    const res = await fetch("/api/integration/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "keywords", url }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to suggest keywords");
    }

    return res.json();
}

export async function suggestOptimizedContent(
    title: string,
    content: string,
    keywords: string[]
) {
    const res = await fetch("/api/integration/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "optimize",
            title,
            content,
            keywords,
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to suggest optimization");
    }

    return res.json();
}
