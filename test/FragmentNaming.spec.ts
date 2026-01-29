declare var describe, it, require;

import * as expect from 'expect';
import { Grammars } from '../src';

describe('Fragment naming', () => {
  it('should use hierarchical indices for W3C EBNF fragments', () => {
    const grammar = `
      Rule ::= (A | B) (C | D)
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    // Find fragment rules - they should be named with hierarchical indices
    const fragmentRules = rules.filter(r => r.fragment && r.name.startsWith('%Rule'));
    
    expect(fragmentRules.length).toBeGreaterThan(0);
    
    // Check that fragment names follow the pattern %RuleName[optionIndex][subitemIndex]
    fragmentRules.forEach(rule => {
      expect(rule.name).toMatch(/^%Rule\[\d+\]\[\d+\]$/);
    });

    // Verify specific fragment names exist
    const fragmentNames = fragmentRules.map(r => r.name);
    expect(fragmentNames).toContain('%Rule[1][1]'); // First SubItem in first option
    expect(fragmentNames).toContain('%Rule[1][2]'); // Second SubItem in first option
  });

  it('should reset subitem indices for each option', () => {
    const grammar = `
      Rule ::= (A B) | (C D)
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment && r.name.startsWith('%Rule'));
    const fragmentNames = fragmentRules.map(r => r.name);

    // First option should have [1][1]
    expect(fragmentNames).toContain('%Rule[1][1]');
    
    // Second option should have [2][1] (reset subitem index)
    expect(fragmentNames).toContain('%Rule[2][1]');
  });

  it('should handle nested subitems correctly', () => {
    const grammar = `
      Rule ::= ((A B) | (C D))
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment);
    const fragmentNames = fragmentRules.map(r => r.name);

    // Transparent SubItems (containing only other SubItems) should use single-index naming
    expect(fragmentRules.length).toBe(2);
    expect(fragmentNames).toContain('%Rule[1]'); // (A B)
    expect(fragmentNames).toContain('%Rule[2]'); // (C D)
    
    // Should NOT have %% prefix or complex nested indices
    fragmentRules.forEach(rule => {
      expect(rule.name.startsWith('%%')).toBe(false);
      expect(rule.name.split('[').length).toBeLessThanOrEqual(2); // Only %Rule[N] format
    });
  });

  it('should use hierarchical indices for Custom grammar fragments', () => {
    const grammar = `
      Rule ::= (A | B) (C | D)
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.Custom.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment && r.name.startsWith('%Rule'));
    
    expect(fragmentRules.length).toBeGreaterThan(0);
    
    // Check that fragment names follow the pattern
    fragmentRules.forEach(rule => {
      expect(rule.name).toMatch(/^%Rule\[\d+\]\[\d+\]$/);
    });

    const fragmentNames = fragmentRules.map(r => r.name);
    expect(fragmentNames).toContain('%Rule[1][1]');
    expect(fragmentNames).toContain('%Rule[1][2]');
  });

  it('should maintain parsability with new fragment names', () => {
    const grammar = `
      Expression ::= (Term (("+" | "-") Term)*)
      Term ::= "x" | "y"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    
    // This should parse successfully with the new fragment naming
    const ast = parser.getAST('x+y-x');
    expect(ast).toBeTruthy();
    expect(ast.type).toBe('Expression');
    expect(ast.errors.length).toBe(0);
  });

  it('should not create fragments with old format (no brackets)', () => {
    const grammar = `
      Rule ::= (A B) | (C D)
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment);
    const fragmentNames = fragmentRules.map(r => r.name);

    // Check that no old-style fragment names exist (without brackets)
    fragmentNames.forEach(name => {
      // If it starts with %, it should have brackets
      if (name.startsWith('%') && !name.includes('_')) {
        expect(name).toMatch(/\[\d+\]/); // Should contain at least one bracketed index
      }
    });
  });

  it('should handle nesting correctly', () => {
    const grammar = `
      Rule ::= ("a" | "b") | ("c" | "d")
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    console.log(require('util').inspect(rules, {depth: null}))

    const fragmentRules = rules.filter(r => r.fragment);
    const fragmentNames = fragmentRules.map(r => r.name);

    // Check that no old-style fragment names exist (without brackets)
    fragmentNames.forEach(name => {
      // If it starts with %, it should have brackets
      if (name.startsWith('%') && !name.includes('_')) {
        expect(name).toMatch(/\[\d+\]/); // Should contain at least one bracketed index
      }
    });
  });
});
