import embedQuery from "../chat/embed";
import supabase from "@/db/supabase";
import { extractQueryAttributes } from "./queryProcessor";
import { createMultipleSearchQueries } from "./queryExpansion";
import { cacheManager } from "../cache/cacheManager";

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  source_query?: string;
  extracted_attributes?: any;
}

const searchCache = new Map<string, SearchResult[]>();
const attributeExtractionCache = new Map<string, any>();

export async function performEnhancedSearch(
  originalQuery: string,
  maxResults: number = 5
): Promise<SearchResult[]> {

     if (!cacheManager.isInitialized) {
    await cacheManager.initialize();
  }
  
  const cacheKey = `${originalQuery}_${maxResults}`;
  if (searchCache.has(cacheKey)) {
    console.log("Returning cached search results");
    return searchCache.get(cacheKey)!;
  }

  const attributes = extractQueryAttributes(originalQuery);
  const searchQueries = createMultipleSearchQueries(originalQuery);
  
  console.log("Search queries:", searchQueries);
  console.log("Extracted attributes:", attributes);

  // 2. Perform multiple searches and combine results
  const allResults: SearchResult[] = [];
  
  for (const query of searchQueries) {
    try {
      const embedding = await embedQuery(query);
      
      // Use your actual Supabase function
      const { data: results } = await supabase.rpc("match_product_chunks_cleaned", {
        query_embedding: embedding,
        match_threshold: 0.7, // Lower threshold for broader search
        match_count: 8,
      });
      
      if (results) {
        // Add source query information and extract attributes from content
        results.forEach((result: any) => {
          allResults.push({
            ...result,
            source_query: query,
            extracted_attributes: extractAttributesFromContent(result.content)
          });
        });
      }
      
    } catch (error) {
      console.error(`Error searching for query: ${query}`, error);
    }
  }

  // 3. Remove duplicates and rank results
  const uniqueResults = removeDuplicates(allResults);
  const filteredResults = contentBasedFilter(uniqueResults, attributes);
  const rankedResults = rankResults(filteredResults, attributes, originalQuery);
  
  const finalResults = rankedResults.slice(0, maxResults);
  
  // Cache the results (limit cache size to prevent memory issues)
  if (searchCache.size > 100) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey!);
  }
  searchCache.set(cacheKey, finalResults);
  
  return finalResults;
}

function extractAttributesFromContent(content: string): any {
  if (attributeExtractionCache.has(content)) {
    return attributeExtractionCache.get(content)!;
  }

  const lowerContent = content.toLowerCase();
  
  const attributes: any = {};
  
  // Extract gender from content
  const maleKeywords = ['men', 'man', 'male', 'masculine', 'gentleman', 'mens'];
  const femaleKeywords = ['women', 'woman', 'female', 'feminine', 'lady', 'womens', 'ladies'];
  
  const hasMaleKeywords = maleKeywords.some(keyword => lowerContent.includes(keyword));
  const hasFemaleKeywords = femaleKeywords.some(keyword => lowerContent.includes(keyword));
  
  if (hasMaleKeywords && !hasFemaleKeywords) {
    attributes.gender = 'male';
  } else if (hasFemaleKeywords && !hasMaleKeywords) {
    attributes.gender = 'female';
  } else {
    attributes.gender = 'unisex';
  }
  
  // Extract category from content
  if (lowerContent.includes('formal') || lowerContent.includes('wedding') || 
      lowerContent.includes('ceremony') || lowerContent.includes('suit') ||
      lowerContent.includes('dress') || lowerContent.includes('gown')) {
    attributes.category = 'formal wear';
  } else if (lowerContent.includes('casual') || lowerContent.includes('everyday') ||
             lowerContent.includes('jeans') || lowerContent.includes('t-shirt')) {
    attributes.category = 'casual wear';
  } else if (lowerContent.includes('sport') || lowerContent.includes('athletic') ||
             lowerContent.includes('gym') || lowerContent.includes('running')) {
    attributes.category = 'activewear';
  } else if (lowerContent.includes('jacket') || lowerContent.includes('coat') ||
             lowerContent.includes('blazer') || lowerContent.includes('hoodie')) {
    attributes.category = 'outerwear';
  } else if (lowerContent.includes('shoes') || lowerContent.includes('boots') ||
             lowerContent.includes('sneakers') || lowerContent.includes('heels')) {
    attributes.category = 'footwear';
  }
  
  // Cache the result (limit cache size)
  if (attributeExtractionCache.size > 500) {
    const firstKey = attributeExtractionCache.keys().next().value;
    attributeExtractionCache.delete(firstKey!);
  }
  attributeExtractionCache.set(content, attributes);
  
  return attributes;
}

function contentBasedFilter(results: SearchResult[], queryAttributes: any): SearchResult[] {
  if (!queryAttributes.gender?.length) {
    return results;
  }
  
  return results.filter(result => {
    const contentAttrs = result.extracted_attributes;
    
    if (queryAttributes.gender.includes('male') && contentAttrs.gender === 'female') {
      return false;
    }
    if (queryAttributes.gender.includes('female') && contentAttrs.gender === 'male') {
      return false;
    }
    
    return true;
  });
}

function removeDuplicates(results: SearchResult[]): SearchResult[] {
  const seen = new Set();
  return results.filter(result => {
    const key = result.id || result.content.substring(0, 100);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function rankResults(
  results: SearchResult[], 
  attributes: any, 
  originalQuery: string
): SearchResult[] {
  return results
    .map(result => ({
      ...result,
      finalScore: calculateFinalScore(result, attributes, originalQuery)
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}

function calculateFinalScore(
  result: SearchResult, 
  attributes: any, 
  originalQuery: string
): number {
  let score = result.similarity || 0;
  
  const contentAttrs = result.extracted_attributes;
  
  if (contentAttrs) {
    // Gender matching
    if (attributes.gender?.includes(contentAttrs.gender)) {
      score += 0.4;
    }
    
    // Category matching
    if (attributes.category?.includes(contentAttrs.category)) {
      score += 0.3;
    }
    
    // Strong penalty for wrong gender (especially important)
    if (attributes.gender?.length && contentAttrs.gender) {
      if ((attributes.gender.includes('male') && contentAttrs.gender === 'female') ||
          (attributes.gender.includes('female') && contentAttrs.gender === 'male')) {
        score -= 0.8; // Very strong penalty
      }
    }
  }
  
  // Boost for results from the original query
  if (result.source_query === originalQuery) {
    score += 0.1;
  }
  
  // Boost for exact keyword matches in content
  const lowerContent = result.content.toLowerCase();
  const queryWords = originalQuery.toLowerCase().split(' ').filter(w => w.length > 2);
  const matchCount = queryWords.filter(word => 
    lowerContent.includes(word)
  ).length;
  
  score += (matchCount / Math.max(queryWords.length, 1)) * 0.2;
  
  // Boost for high-quality content (longer descriptions usually better)
  if (result.content.length > 200) {
    score += 0.05;
  }
  
  return score;
}

export function clearSearchCache() {
  searchCache.clear();
  attributeExtractionCache.clear();
}