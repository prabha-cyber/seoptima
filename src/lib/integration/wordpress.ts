export interface WPConfig {
    url: string;
    username?: string;
    appPassword?: string;
    cookie?: string;
    connectionMethod: "rest" | "bridge" | "js";
    bridgeSecret: string;
}

export async function getWPPosts(config: WPConfig) {
    if (config.connectionMethod === "js") {
        const res = await fetch("/api/integration/wordpress/js/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bridgeSecret: config.bridgeSecret }),
        });
        if (!res.ok) throw new Error("Failed to fetch posts via JS Snippet");
        return res.json();
    }

    const endpoint =
        config.connectionMethod === "bridge"
            ? "/api/integration/wordpress/bridge"
            : "/api/integration/wordpress/posts";

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            url: config.url,
            username: config.username,
            appPassword: config.appPassword,
            cookie: config.cookie,
            bridgeSecret: config.bridgeSecret,
            action: "posts",
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch WordPress posts");
    }

    return res.json();
}

export async function updateWPPost(
    config: WPConfig,
    postId: number,
    data: any,
    postType: string = "posts"
) {
    if (config.connectionMethod === "js") {
        const res = await fetch("/api/integration/js/get-optimizations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                siteId: config.bridgeSecret,
                url: data.url, // JS snippet needs the URL
                data: data,
            }),
        });
        if (!res.ok) throw new Error("Failed to update via JS Snippet");
        return res.json();
    }

    const endpoint =
        config.connectionMethod === "bridge"
            ? "/api/integration/wordpress/bridge"
            : "/api/integration/wordpress/update";

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            url: config.url,
            username: config.username,
            appPassword: config.appPassword,
            cookie: config.cookie,
            bridgeSecret: config.bridgeSecret,
            postId,
            postType,
            action: "update",
            data,
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update WordPress post");
    }

    return res.json();
}
