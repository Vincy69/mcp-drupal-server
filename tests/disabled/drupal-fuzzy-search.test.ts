import { DrupalFuzzySearch } from '../drupal-fuzzy-search.js';

describe('DrupalFuzzySearch', () => {
  let fuzzySearch: DrupalFuzzySearch;
  
  beforeEach(() => {
    fuzzySearch = new DrupalFuzzySearch();
  });
  
  describe('Levenshtein distance', () => {
    it('should calculate correct distance for identical strings', async () => {
      const items = ['entity_manager'];
      const result = await fuzzySearch.search(
        'entity_manager',
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.exactMatches).toHaveLength(1);
      expect(result.exactMatches[0]).toBe('entity_manager');
    });
    
    it('should find fuzzy matches with typos', async () => {
      const items = ['entity_manager', 'entity_type_manager', 'field_manager'];
      const result = await fuzzySearch.search(
        'entitiy_managr', // typos
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.fuzzyMatches).toHaveLength(1);
      expect(result.fuzzyMatches[0].item).toBe('entity_manager');
      expect(result.fuzzyMatches[0].distance).toBeLessThan(5);
    });
    
    it('should suggest corrections for common typos', async () => {
      const items = ['drupal_set_message', 'drupal_get_message'];
      const result = await fuzzySearch.search(
        'drupal_set_mesage', // missing 's'
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.corrections).toContain('drupal_set_message');
    });
  });
  
  describe('Abbreviation expansion', () => {
    it('should expand common Drupal abbreviations', async () => {
      const items = ['Drupal 10 migration guide', 'Drupal 11 features'];
      const result = await fuzzySearch.search(
        'D10',
        items,
        (item, term) => item.toLowerCase().includes(term.toLowerCase()),
        item => item
      );
      
      expect(result.fuzzyMatches.some(m => m.item.includes('Drupal 10'))).toBeTruthy();
    });
    
    it('should handle multiple abbreviations', async () => {
      const items = ['Entity Query API', 'Database API', 'Form API'];
      const result = await fuzzySearch.search(
        'EQ API',
        items,
        (item, term) => item.toLowerCase().includes(term.toLowerCase()),
        item => item
      );
      
      // Should find Entity Query API
      expect(result.fuzzyMatches.length).toBeGreaterThan(0);
    });
  });
  
  describe('Synonym matching', () => {
    it('should match synonyms for common terms', async () => {
      const items = ['node_view', 'content_display', 'entity_render'];
      const result = await fuzzySearch.search(
        'content', // synonym for node
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      // Should find related items
      expect(result.exactMatches.length + result.fuzzyMatches.length).toBeGreaterThan(0);
    });
  });
  
  describe('Soundex matching', () => {
    it('should find phonetically similar matches', async () => {
      const items = ['cache_clear', 'cash_clear', 'catch_clear'];
      const result = await fuzzySearch.search(
        'kash_clear', // phonetically similar to cache/cash
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.fuzzyMatches.length).toBeGreaterThan(0);
    });
  });
  
  describe('Smart suggestions', () => {
    it('should provide did you mean suggestions', async () => {
      const items = [
        'entity_type.manager',
        'entity_field.manager',
        'entity_display.repository'
      ];
      
      const result = await fuzzySearch.search(
        'entity.managr', // typo
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.suggestions).toContain('Did you mean: entity_type.manager?');
    });
    
    it('should suggest similar patterns', async () => {
      const items = [
        'hook_entity_view',
        'hook_entity_presave',
        'hook_entity_delete'
      ];
      
      const result = await fuzzySearch.search(
        'hook_entity_sav', // incomplete
        items,
        (item, term) => item.includes(term),
        item => item
      );
      
      expect(result.suggestions.some(s => s.includes('presave'))).toBeTruthy();
    });
  });
  
  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => `function_${i}`);
      
      const startTime = Date.now();
      const result = await fuzzySearch.search(
        'function_500',
        items,
        (item, term) => item.includes(term),
        item => item
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.exactMatches).toHaveLength(1);
    });
  });
});