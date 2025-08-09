interface QueryAttributes {
  gender?: string[];
  category?: string[];
  occasion?: string[];
  color?: string[];
  brand?: string[];
  keywords: string[];
  translatedQuery?: string;
}

const attributeCache = new Map<string, QueryAttributes>();
const translationCache = new Map<string, string>();

function extractQueryAttributes(query: string): QueryAttributes {
  if (attributeCache.has(query)) {
    return attributeCache.get(query)!;
  }

  const lowerQuery = query.toLowerCase();
  
  // German + English keywords
  const genderKeywords = {
    male: [
      // English
      'man', 'men', 'mens', 'male', 'guy', 'boy', 'masculine', 'groom', 'gentleman',
      // German
      'mann', 'männer', 'männlich', 'herr', 'herren', 'junge', 'bräutigam', 'männliche'
    ],
    female: [
      // English
      'woman', 'women', 'womens', 'female', 'girl', 'feminine', 'bride', 'lady', 'ladies',
      // German
      'frau', 'frauen', 'weiblich', 'dame', 'damen', 'mädchen', 'braut', 'weibliche'
    ],
    unisex: [
      // English
      'unisex', 'gender neutral',
      // German
      'unisex', 'geschlechtsneutral'
    ]
  };

  const categoryKeywords = {
    'formal wear': [
      // English
      'wedding', 'formal', 'ceremony', 'black tie', 'tuxedo', 'gown', 'evening', 'suit', 'dress',
      // German
      'hochzeit', 'formell', 'zeremonie', 'smoking', 'anzug', 'kleid', 'abend', 'festlich', 'elegant'
    ],
    'casual wear': [
      // English
      'casual', 'everyday', 'street', 'relaxed', 'comfortable', 'jeans', 'shirt', 't-shirt',
      // German
      'lässig', 'alltäglich', 'bequem', 'entspannt', 'casual', 'jeans', 'hemd', 'shirt'
    ],
    'activewear': [
      // English
      'gym', 'workout', 'sport', 'athletic', 'running', 'yoga', 'fitness', 'training',
      // German
      'sport', 'training', 'fitness', 'laufen', 'yoga', 'athletisch', 'sportlich'
    ],
    'outerwear': [
      // English
      'jacket', 'coat', 'blazer', 'hoodie', 'cardigan', 'sweater',
      // German
      'jacke', 'mantel', 'blazer', 'hoodie', 'strickjacke', 'pullover'
    ],
    'footwear': [
      // English
      'shoes', 'boots', 'sneakers', 'heels', 'sandals', 'flats', 'loafers',
      // German
      'schuhe', 'stiefel', 'sneaker', 'absätze', 'sandalen', 'flache', 'slipper'
    ],
    'accessories': [
      // English
      'bag', 'watch', 'jewelry', 'belt', 'hat', 'scarf', 'sunglasses',
      // German
      'tasche', 'uhr', 'schmuck', 'gürtel', 'hut', 'schal', 'sonnenbrille'
    ]
  };

  const occasionKeywords = {
    wedding: [
      // English
      'wedding', 'ceremony', 'reception', 'bridal', 'marriage',
      // German
      'hochzeit', 'zeremonie', 'empfang', 'braut', 'heirat', 'trauung'
    ],
    work: [
      // English
      'office', 'business', 'professional', 'work', 'corporate',
      // German
      'büro', 'geschäft', 'professionell', 'arbeit', 'beruflich'
    ],
    party: [
      // English
      'party', 'celebration', 'night out', 'club', 'festive',
      // German
      'party', 'feier', 'ausgehen', 'club', 'festlich'
    ],
    beach: [
      // English
      'beach', 'vacation', 'summer', 'resort', 'holiday',
      // German
      'strand', 'urlaub', 'sommer', 'resort', 'ferien'
    ]
  };

  const colorKeywords = {
    black: ['black', 'schwarz'],
    white: ['white', 'cream', 'ivory', 'weiß', 'creme'],
    blue: ['blue', 'navy', 'blau', 'marine'],
    red: ['red', 'crimson', 'rot'],
    green: ['green', 'grün'],
    yellow: ['yellow', 'gelb'],
    brown: ['brown', 'braun'],
    gray: ['gray', 'grey', 'grau'],
    pink: ['pink', 'rosa'],
    purple: ['purple', 'violet', 'lila', 'violett']
  };

  const result: QueryAttributes = {
    keywords: query.split(' ').filter(word => word.length > 2),
    translatedQuery: translateGermanToEnglish(query)
  };

  // Extract gender
  for (const [gender, keywords] of Object.entries(genderKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.gender = result.gender || [];
      result.gender.push(gender);
    }
  }

  // Extract categories
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.category = result.category || [];
      result.category.push(category);
    }
  }

  // Extract occasions
  for (const [occasion, keywords] of Object.entries(occasionKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.occasion = result.occasion || [];
      result.occasion.push(occasion);
    }
  }

  // Extract colors
  for (const [color, keywords] of Object.entries(colorKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      result.color = result.color || [];
      result.color.push(color);
    }
  }

  // Cache the result
  attributeCache.set(query, result);

  return result;
}

function translateGermanToEnglish(query: string): string {
  // Check cache first
  if (translationCache.has(query)) {
    return translationCache.get(query)!;
  }

  const germanToEnglish: Record<string, string> = {
    // Gender
    'mann': 'man', 'männer': 'men', 'herr': 'man', 'herren': 'men',
    'frau': 'woman', 'frauen': 'women', 'dame': 'lady', 'damen': 'ladies',
    
    // Clothing items
    'kleid': 'dress', 'anzug': 'suit', 'hemd': 'shirt', 'hose': 'pants',
    'jacke': 'jacket', 'mantel': 'coat', 'schuhe': 'shoes', 'stiefel': 'boots',
    'pullover': 'sweater', 'jeans': 'jeans', 'rock': 'skirt',
    
    // Occasions
    'hochzeit': 'wedding', 'arbeit': 'work', 'büro': 'office',
    'party': 'party', 'feier': 'celebration', 'strand': 'beach',
    'urlaub': 'vacation', 'sport': 'sport',
    
    // Colors
    'schwarz': 'black', 'weiß': 'white', 'blau': 'blue', 'rot': 'red',
    'grün': 'green', 'gelb': 'yellow', 'braun': 'brown', 'grau': 'gray',
    
    // Adjectives
    'schön': 'beautiful', 'elegant': 'elegant', 'casual': 'casual',
    'formell': 'formal', 'sportlich': 'sporty', 'bequem': 'comfortable',
    
    // Common words
    'für': 'for', 'mit': 'with', 'und': 'and', 'oder': 'or',
    'ich': 'i', 'suche': 'looking for', 'brauche': 'need'
  };

  let translatedQuery = query.toLowerCase();
  
  for (const [german, english] of Object.entries(germanToEnglish)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${german}\\b`, 'gi');
    translatedQuery = translatedQuery.replace(regex, english);
  }
  
  // Cache the result
  translationCache.set(query, translatedQuery);
  
  return translatedQuery;
}

export function clearProcessorCache() {
  attributeCache.clear();
  translationCache.clear();
}

export { extractQueryAttributes, translateGermanToEnglish };