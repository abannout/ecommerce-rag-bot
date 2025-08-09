import { translateGermanToEnglish } from './queryProcessor';

const expansionCache = new Map<string, string>();
const queryCache = new Map<string, string[]>();

export function expandFashionQuery(query: string): string {

  if (expansionCache.has(query)) {
    return expansionCache.get(query)!;
  }

  const fashionSynonyms: Record<string, string[]> = {
    // Gender terms (English + German)
    'man': ['men', 'male', 'masculine', 'gentleman', 'männer', 'herr'],
    'männer': ['men', 'male', 'man', 'masculine'],
    'woman': ['women', 'female', 'feminine', 'lady', 'frauen', 'dame'],
    'frauen': ['women', 'female', 'woman', 'lady'],
    
    // Formal wear (English + German)
    'wedding': ['bridal', 'ceremony', 'formal', 'special occasion', 'hochzeit', 'zeremonie'],
    'hochzeit': ['wedding', 'bridal', 'ceremony', 'formal'],
    'formal': ['dress up', 'elegant', 'sophisticated', 'classy', 'formell', 'elegant'],
    'suit': ['formal wear', 'business attire', 'tailored', 'anzug'],
    'anzug': ['suit', 'formal wear', 'business attire'],
    'dress': ['gown', 'frock', 'outfit', 'kleid'],
    'kleid': ['dress', 'gown', 'outfit'],
    
    // Casual wear (English + German)
    'casual': ['relaxed', 'everyday', 'comfortable', 'laid-back', 'lässig', 'bequem'],
    'lässig': ['casual', 'relaxed', 'comfortable'],
    'jeans': ['denim', 'pants', 'trousers'],
    'shirt': ['top', 'blouse', 'tee', 'hemd'],
    'hemd': ['shirt', 'top', 'blouse'],
    
    // Footwear (English + German)
    'shoes': ['footwear', 'sneakers', 'boots', 'loafers', 'schuhe'],
    'schuhe': ['shoes', 'footwear', 'sneakers', 'boots'],
    'sneakers': ['trainers', 'athletic shoes', 'running shoes', 'sneaker'],
    'heels': ['high heels', 'pumps', 'stilettos', 'absätze'],
    
    // Colors (English + German)
    'black': ['dark', 'charcoal', 'ebony', 'schwarz'],
    'schwarz': ['black', 'dark'],
    'white': ['cream', 'ivory', 'off-white', 'weiß'],
    'weiß': ['white', 'cream', 'ivory'],
    'blue': ['navy', 'azure', 'cobalt', 'blau'],
    'blau': ['blue', 'navy'],
    'red': ['crimson', 'scarlet', 'burgundy', 'rot'],
    'rot': ['red', 'crimson'],
    
    // Occasions (English + German)
    'work': ['office', 'business', 'professional', 'arbeit', 'büro'],
    'arbeit': ['work', 'office', 'business', 'professional'],
    'party': ['celebration', 'festive', 'night out', 'club', 'feier'],
    'feier': ['party', 'celebration', 'festive'],
    'beach': ['vacation', 'resort', 'summer', 'strand', 'urlaub'],
    'strand': ['beach', 'vacation', 'summer'],
    'gym': ['workout', 'athletic', 'sport', 'fitness', 'training']
  };

  let expandedQuery = query.toLowerCase();
  
  // Add synonyms for key terms found in the query
  for (const [term, synonyms] of Object.entries(fashionSynonyms)) {
    if (expandedQuery.includes(term)) {
      // Add relevant synonyms to expand the semantic space
      const relevantSynonyms = synonyms.slice(0, 2); // Limit to avoid query explosion
      expandedQuery += ' ' + relevantSynonyms.join(' ');
    }
  }
  
  // Cache the result
  expansionCache.set(query, expandedQuery);
  
  return expandedQuery;
}

export function createMultipleSearchQueries(originalQuery: string): string[] {
  // Check cache first
  if (queryCache.has(originalQuery)) {
    return queryCache.get(originalQuery)!;
  }

  const queries = [originalQuery];
  
  // Add translated query (German to English)
  const translatedQuery = translateGermanToEnglish(originalQuery);
  if (translatedQuery !== originalQuery.toLowerCase()) {
    queries.push(translatedQuery);
  }
  
  // Add expanded query
  queries.push(expandFashionQuery(originalQuery));
  
  // Add simplified query (remove common words in both languages)
  const stopWords = [
    // English
    'for', 'a', 'an', 'the', 'i', 'want', 'need', 'looking', 'find', 'show', 'me',
    // German
    'für', 'ein', 'eine', 'der', 'die', 'das', 'ich', 'will', 'brauche', 'suche', 'zeig', 'mir'
  ];
  
  const simplified = originalQuery
    .toLowerCase()
    .split(' ')
    .filter(word => !stopWords.includes(word) && word.length > 2)
    .join(' ');
  
  if (simplified !== originalQuery.toLowerCase() && simplified.length > 0) {
    queries.push(simplified);
  }
  
  const fashionNouns = [
    // English
    'dress', 'suit', 'shirt', 'pants', 'shoes', 'jacket', 'coat', 'skirt',
    'top', 'blouse', 'jeans', 'shorts', 'boots', 'sneakers', 'heels',
    'accessories', 'bag', 'watch', 'jewelry', 'belt', 'hat',
    // German
    'kleid', 'anzug', 'hemd', 'hose', 'schuhe', 'jacke', 'mantel', 'rock',
    'shirt', 'bluse', 'jeans', 'shorts', 'stiefel', 'sneaker', 'absätze',
    'tasche', 'uhr', 'schmuck', 'gürtel', 'hut'
  ];
  
  const extractedNouns = originalQuery
    .toLowerCase()
    .split(' ')
    .filter(word => fashionNouns.includes(word));
  
  if (extractedNouns.length > 0) {
    queries.push(extractedNouns.join(' '));
    
    const translationPairs = extractedNouns.map(noun => ({
      original: noun,
      translated: translateGermanToEnglish(noun)
    }));
    
    const uniqueTranslations = translationPairs
      .filter(pair => pair.translated !== pair.original)
      .map(pair => pair.translated);
    
    if (uniqueTranslations.length > 0) {
      queries.push(uniqueTranslations.join(' '));
    }
  }
  
  const uniqueQueries = [...new Set(queries)]; // Remove duplicates
  
  // Cache the result
  queryCache.set(originalQuery, uniqueQueries);
  
  return uniqueQueries;
}

// Clear cache periodically to prevent memory leaks
export function clearQueryCache() {
  expansionCache.clear();
  queryCache.clear();
}