export interface FuzzySearchResult<T> {
  exact_matches: T[];
  fuzzy_matches: Array<T & { similarity: number }>;
  suggestions: string[];
  did_you_mean?: string;
  confidence: number;
  searchTerm: string;
  correctedTerm?: string;
}

export class DrupalFuzzySearch {
  private synonyms: Map<string, string[]> = new Map([
    ['node', ['content', 'article', 'page', 'entity']],
    ['taxonomy', ['term', 'vocabulary', 'category', 'tag']],
    ['user', ['account', 'member', 'person', 'profile']],
    ['block', ['region', 'component', 'widget']],
    ['field', ['property', 'attribute', 'data']],
    ['view', ['listing', 'query', 'display']],
    ['form', ['input', 'submission', 'interface']],
    ['cache', ['storage', 'performance', 'speed']],
    ['entity', ['object', 'record', 'item']],
    ['hook', ['event', 'listener', 'alter']],
    ['service', ['container', 'dependency', 'injection']],
    ['config', ['configuration', 'settings', 'options']],
    ['theme', ['template', 'design', 'layout']],
    ['module', ['extension', 'plugin', 'addon']],
    ['route', ['path', 'url', 'endpoint']],
    ['permission', ['access', 'role', 'authorization']],
    ['render', ['display', 'output', 'presentation']],
    ['entity_type', ['content_type', 'bundle']],
    ['field_type', ['field_widget', 'field_formatter']],
    ['queue', ['job', 'task', 'background']]
  ]);

  private commonMisspellings: Map<string, string> = new Map([
    ['entitiy', 'entity'],
    ['taxanomy', 'taxonomy'],
    ['feild', 'field'],
    ['veiw', 'view'],
    ['from', 'form'],
    ['cashe', 'cache'],
    ['servise', 'service'],
    ['confg', 'config'],
    ['themme', 'theme'],
    ['modul', 'module'],
    ['rout', 'route'],
    ['permision', 'permission'],
    ['rendor', 'render'],
    ['entitiy_type', 'entity_type'],
    ['filed_type', 'field_type'],
    ['que', 'queue'],
    ['acces', 'access'],
    ['configration', 'configuration'],
    ['auhtentication', 'authentication'],
    ['authroization', 'authorization'],
    ['depedency', 'dependency'],
    ['injeciton', 'injection'],
    ['paramaeter', 'parameter'],
    ['responce', 'response'],
    ['reqeust', 'request']
  ]);

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity percentage between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return ((maxLength - distance) / maxLength) * 100;
  }

  /**
   * Check if query contains common Drupal abbreviations
   */
  private expandAbbreviations(query: string): string {
    const abbreviations: Record<string, string> = {
      'D7': 'Drupal 7',
      'D8': 'Drupal 8',
      'D9': 'Drupal 9',
      'D10': 'Drupal 10',
      'D11': 'Drupal 11',
      'DI': 'dependency injection',
      'CT': 'content type',
      'FT': 'field type',
      'FW': 'field widget',
      'FF': 'field formatter',
      'VBO': 'views bulk operations',
      'DS': 'display suite',
      'API': 'application programming interface',
      'UI': 'user interface',
      'UX': 'user experience',
      'DB': 'database',
      'SQL': 'structured query language',
      'REST': 'representational state transfer',
      'JSON': 'javascript object notation',
      'YAML': 'yet another markup language',
      'PHP': 'php hypertext preprocessor',
      'JS': 'javascript',
      'CSS': 'cascading style sheets'
    };

    let expanded = query;
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      expanded = expanded.replace(regex, full);
    });

    return expanded;
  }

  /**
   * Correct common misspellings
   */
  private correctSpelling(query: string): string {
    let corrected = query;
    
    // Check each word in the query
    const words = query.toLowerCase().split(/\s+/);
    const correctedWords = words.map(word => {
      // Check direct misspellings
      if (this.commonMisspellings.has(word)) {
        return this.commonMisspellings.get(word)!;
      }
      
      // Check for close matches (similarity > 80%)
      for (const [misspelling, correct] of this.commonMisspellings) {
        if (this.calculateSimilarity(word, misspelling) > 80) {
          return correct;
        }
      }
      
      return word;
    });
    
    return correctedWords.join(' ');
  }

  /**
   * Get synonyms for a term
   */
  private getSynonyms(term: string): string[] {
    const lowerTerm = term.toLowerCase();
    const synonymList: string[] = [];
    
    // Direct synonyms
    if (this.synonyms.has(lowerTerm)) {
      synonymList.push(...this.synonyms.get(lowerTerm)!);
    }
    
    // Reverse lookup
    for (const [key, values] of this.synonyms) {
      if (values.includes(lowerTerm)) {
        synonymList.push(key);
        synonymList.push(...values.filter(v => v !== lowerTerm));
      }
    }
    
    return [...new Set(synonymList)];
  }

  /**
   * Generate search suggestions based on query
   */
  private generateSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    
    // Add synonym-based suggestions
    words.forEach(word => {
      const synonyms = this.getSynonyms(word);
      synonyms.forEach(synonym => {
        suggestions.push(query.replace(new RegExp(`\\b${word}\\b`, 'i'), synonym));
      });
    });
    
    // Add common Drupal search patterns
    if (query.includes('how')) {
      suggestions.push(query.replace('how to', 'tutorial'));
      suggestions.push(query.replace('how do i', 'example'));
    }
    
    if (query.includes('create')) {
      suggestions.push(query.replace('create', 'generate'));
      suggestions.push(query.replace('create', 'build'));
    }
    
    if (query.includes('custom')) {
      suggestions.push(query + ' programmatically');
      suggestions.push(query + ' hook');
    }
    
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Main fuzzy search function
   */
  async search<T>(
    query: string,
    items: T[],
    searchFunction: (item: T, searchTerm: string) => boolean,
    getItemText: (item: T) => string
  ): Promise<FuzzySearchResult<T>> {
    // Preprocessing
    const expandedQuery = this.expandAbbreviations(query);
    const correctedQuery = this.correctSpelling(expandedQuery);
    const normalizedQuery = correctedQuery.toLowerCase().trim();
    
    // Exact matches
    const exactMatches = items.filter(item => 
      searchFunction(item, normalizedQuery)
    );
    
    // Fuzzy matches
    const fuzzyMatches: Array<T & { similarity: number }> = [];
    
    if (exactMatches.length === 0) {
      // Calculate similarity for all items
      items.forEach(item => {
        const itemText = getItemText(item).toLowerCase();
        const similarity = this.calculateSimilarity(normalizedQuery, itemText);
        
        // Include items with > 60% similarity
        if (similarity > 60) {
          fuzzyMatches.push({ ...item, similarity });
        }
      });
      
      // Sort by similarity
      fuzzyMatches.sort((a, b) => b.similarity - a.similarity);
    }
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(normalizedQuery);
    
    // Calculate confidence
    const confidence = exactMatches.length > 0 ? 100 :
                      fuzzyMatches.length > 0 ? Math.max(...fuzzyMatches.map(m => m.similarity)) :
                      0;
    
    // Determine "did you mean"
    let didYouMean: string | undefined;
    if (correctedQuery !== expandedQuery && confidence < 80) {
      didYouMean = correctedQuery;
    }
    
    return {
      exact_matches: exactMatches,
      fuzzy_matches: fuzzyMatches.slice(0, 10), // Limit to top 10
      suggestions,
      did_you_mean: didYouMean,
      confidence,
      searchTerm: query,
      correctedTerm: correctedQuery !== query ? correctedQuery : undefined
    };
  }

  /**
   * Search with context awareness
   */
  async searchWithContext<T>(
    query: string,
    items: T[],
    context: {
      previousSearches?: string[];
      currentFile?: string;
      projectType?: string;
    },
    searchFunction: (item: T, searchTerm: string) => boolean,
    getItemText: (item: T) => string
  ): Promise<FuzzySearchResult<T>> {
    // Enhance query based on context
    let enhancedQuery = query;
    
    // Add context from current file
    if (context.currentFile) {
      if (context.currentFile.includes('form')) {
        enhancedQuery += ' form';
      } else if (context.currentFile.includes('block')) {
        enhancedQuery += ' block';
      } else if (context.currentFile.includes('entity')) {
        enhancedQuery += ' entity';
      }
    }
    
    // Use previous searches to improve suggestions
    const baseResult = await this.search(query, items, searchFunction, getItemText);
    
    // Add context-aware suggestions
    if (context.previousSearches && context.previousSearches.length > 0) {
      const relatedSearches = context.previousSearches
        .filter(prev => this.calculateSimilarity(query, prev) > 50)
        .slice(0, 3);
      
      baseResult.suggestions.push(...relatedSearches);
      baseResult.suggestions = [...new Set(baseResult.suggestions)];
    }
    
    return baseResult;
  }

  /**
   * Phonetic search using Soundex algorithm
   */
  private soundex(str: string): string {
    const s = str.toUpperCase().split('');
    const firstLetter = s[0];
    
    // Replace consonants with digits
    const mapping: Record<string, string> = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6'
    };
    
    const encoded = s.map((char, i) => {
      if (i === 0) return char;
      return mapping[char] || '0';
    }).join('');
    
    // Remove consecutive duplicates and zeros
    const cleaned = encoded.replace(/(.)\1+/g, '$1').replace(/0/g, '');
    
    // Pad with zeros or truncate to length 4
    return (cleaned + '000').slice(0, 4);
  }

  /**
   * Search using phonetic matching
   */
  async phoneticSearch<T>(
    query: string,
    items: T[],
    getItemText: (item: T) => string
  ): Promise<T[]> {
    const querySoundex = this.soundex(query);
    
    return items.filter(item => {
      const itemText = getItemText(item);
      const words = itemText.split(/\s+/);
      
      return words.some(word => 
        this.soundex(word) === querySoundex
      );
    });
  }
}