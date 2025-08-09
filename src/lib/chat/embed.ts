interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
}

const embeddingCache = new Map<string, EmbeddingCache>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;

async function embedQuery(query: string): Promise<number[]> {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (embeddingCache.has(normalizedQuery)) {
        const cached = embeddingCache.get(normalizedQuery)!;
        
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log("Using cached embedding for:", normalizedQuery);
            return cached.embedding;
        } else {
            // Remove expired cache entry
            embeddingCache.delete(normalizedQuery);
        }
    }

    console.log("Fetching new embedding for:", normalizedQuery);
    
    const EMBED_API = process.env.EMBED_API!;
    
    try {
        const res = await fetch(EMBED_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.HF_API_KEY}`
            },
            body: JSON.stringify({ text: normalizedQuery }),
        });

        if (!res.ok) {
            throw new Error(`Embedding API error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        const embedding = json.embedding;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error("Invalid embedding response");
        }

        cacheEmbedding(normalizedQuery, embedding);

        return embedding;
        
    } catch (error) {
        console.error("Error fetching embedding:", error);
        throw error;
    }
}

function cacheEmbedding(query: string, embedding: number[]): void {
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
        const oldestEntries = Array.from(embeddingCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, Math.floor(MAX_CACHE_SIZE * 0.1)); // Remove 10% of oldest entries
        
        oldestEntries.forEach(([key]) => embeddingCache.delete(key));
    }

    embeddingCache.set(query, {
        embedding,
        timestamp: Date.now()
    });
}

export function warmUpEmbeddingCache(commonQueries: string[]): Promise<(void | number[])[]> {
    console.log("Warming up embedding cache with common queries");
    return Promise.all(
        commonQueries.map(query => 
            embedQuery(query).catch(error => {
                console.error(`Failed to warm up cache for "${query}":`, error);
            })
        )
    );
}

export function cleanupEmbeddingCache(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of embeddingCache.entries()) {
        if (now - cached.timestamp > CACHE_DURATION) {
            embeddingCache.delete(key);
            cleaned++;
        }
    }
    
    console.log(`Cleaned up ${cleaned} expired embedding cache entries`);
    return cleaned;
}

export function getEmbeddingCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const cached of embeddingCache.values()) {
        if (now - cached.timestamp < CACHE_DURATION) {
            validEntries++;
        } else {
            expiredEntries++;
        }
    }
    
    return {
        totalEntries: embeddingCache.size,
        validEntries,
        expiredEntries,
        cacheDurationMs: CACHE_DURATION,
        maxCacheSize: MAX_CACHE_SIZE
    };
}

export function clearEmbeddingCache(): void {
    embeddingCache.clear();
    console.log("Embedding cache cleared");
}

export function setupEmbeddingCacheCleanup(): NodeJS.Timeout {
    return setInterval(() => {
        cleanupEmbeddingCache();
    }, 30 * 60 * 1000); // Clean up every 30 minutes
}

export default embedQuery;