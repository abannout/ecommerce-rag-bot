
import { clearEmbeddingCache, cleanupEmbeddingCache, getEmbeddingCacheStats, warmUpEmbeddingCache } from '../chat/embed';
import { clearQueryCache } from '../querySearch/queryExpansion';
import { clearProcessorCache } from '../querySearch/queryProcessor';
import { clearSearchCache } from '../querySearch/enhancedSearch';

const COMMON_FASHION_QUERIES = [
    // English queries
    'wedding dress for women',
    'wedding suit for men',
    'casual shirt for men',
    'black shoes for work',
    'formal dress for women',
    'sports shoes for men',
    'summer dress for women',
    'business suit for men',
    'running shoes',
    'evening gown',
    
    // German queries
    'hochzeitskleid für frauen',
    'hochzeitsanzug für männer',
    'lässiges hemd für männer',
    'schwarze schuhe für die arbeit',
    'formelles kleid für frauen',
    'sportschuhe für männer',
    'sommerkleid für frauen',
    'business anzug für männer',
    'laufschuhe',
    'abendkleid',
    
    // Mixed common terms
    'black dress',
    'white shirt',
    'blue jeans',
    'leather jacket',
    'formal shoes',
    'casual wear',
    'party dress',
    'work outfit'
];

export class CacheManager {
    private cleanupInterval: NodeJS.Timeout | null = null;
    private _isInitialized: boolean = false;

    // Check if cache manager has been initialized
    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    // Initialize cache system
    public async initialize(): Promise<void> {
        if (this._isInitialized) {
            console.log('🔄 Cache manager already initialized');
            return;
        }

        console.log('🚀 Initializing cache management system...');
        
        // Set up periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.performMaintenance();
        }, 30 * 60 * 1000); // Every 30 minutes

        // Warm up cache with common queries
        try {
            await this.warmUpCache();
        } catch (error) {
            console.error('⚠️ Error warming up cache (continuing anyway):', error);
        }

        this._isInitialized = true;
        console.log('✅ Cache management system initialized');
    }

    // Warm up caches with common queries
    public async warmUpCache(): Promise<void> {
        try {
            console.log('🔥 Warming up cache with common fashion queries...');
            await warmUpEmbeddingCache(COMMON_FASHION_QUERIES);
            console.log('✅ Cache warm-up completed successfully');
        } catch (error) {
            console.error('❌ Error during cache warm-up:', error);
            throw error;
        }
    }

    // Perform cache maintenance
    public performMaintenance(): void {
        console.log('🧹 Performing cache maintenance...');
        
        try {
            // Clean up expired embeddings
            const cleanedCount = cleanupEmbeddingCache();
            
            // Log cache statistics
            if (cleanedCount > 0) {
                const stats = this.getCacheStatistics();
                console.log('📊 Cache maintenance completed. Stats:', stats);
            }
            
        } catch (error) {
            console.error('❌ Error during cache maintenance:', error);
        }
    }

    // Clear all caches
    public clearAllCaches(): void {
        console.log('🗑️ Clearing all caches...');
        
        clearEmbeddingCache();
        clearQueryCache();
        clearProcessorCache();
        clearSearchCache();
        
        console.log('✅ All caches cleared');
    }

    // Get comprehensive cache statistics
    public getCacheStatistics() {
        return {
            embedding: getEmbeddingCacheStats(),
            initialized: this._isInitialized,
            timestamp: new Date().toISOString()
        };
    }

    // Cleanup resources
    public cleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this._isInitialized = false;
        console.log('🧽 Cache manager cleanup completed');
    }

    // Preload cache for specific queries (useful for anticipated searches)
    public async preloadQueries(queries: string[]): Promise<void> {
        console.log(`🎯 Preloading ${queries.length} queries into cache...`);
        
        try {
            await warmUpEmbeddingCache(queries);
            console.log('✅ Query preloading completed');
        } catch (error) {
            console.error('❌ Error preloading queries:', error);
            throw error;
        }
    }

    // Get cache hit rate (useful for monitoring)
    public getCacheHitRate(): { embeddings: number } {
        const embeddingStats = getEmbeddingCacheStats();
        
        return {
            embeddings: embeddingStats.validEntries / Math.max(embeddingStats.totalEntries, 1)
        };
    }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Auto-initialize in server environment only
/*
if (typeof window === 'undefined') { // Server-side only
    // Don't block module loading - initialize in background
    setTimeout(() => {
        cacheManager.initialize().catch(error => {
            console.error('❌ Failed to auto-initialize cache manager:', error);
        });
    }, 100);
}
*/
// Export for manual control
export {
    clearEmbeddingCache,
    cleanupEmbeddingCache,
    getEmbeddingCacheStats,
    warmUpEmbeddingCache,
    clearQueryCache,
    clearProcessorCache,
    clearSearchCache,
    COMMON_FASHION_QUERIES
};