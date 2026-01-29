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
    
    // Check that fragment names follow the pattern %RuleName[optionIndex] or %RuleName[optionIndex][subitemIndex]
    fragmentRules.forEach(rule => {
      expect(rule.name).toMatch(/^%Rule\[\d+\](\[\d+\])?$/);
    });

    // Verify specific fragment names exist
    const fragmentNames = fragmentRules.map(r => r.name);
    expect(fragmentNames).toContain('%Rule[1]'); // First SubItem (first option)
    expect(fragmentNames).toContain('%Rule[2]'); // Second SubItem (second option)
  });

  it('should use simple names for single SubItem per option', () => {
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

    // First option should have [1]
    expect(fragmentNames).toContain('%Rule[1]');
    
    // Second option should have [2]
    expect(fragmentNames).toContain('%Rule[2]');
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

    // Should have a top-level fragment for the outer SubItem
    expect(fragmentNames).toContain('%Rule[1]');
    
    // Nested fragments should have more bracket pairs (nested hierarchy)
    // The inner SubItems will be named relative to their parent fragment
    expect(fragmentNames.some(name => name.includes('[') && name.split('[').length > 2)).toBe(true);
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
      expect(rule.name).toMatch(/^%Rule\[\d+\](\[\d+\])?$/);
    });

    const fragmentNames = fragmentRules.map(r => r.name);
    expect(fragmentNames).toContain('%Rule[1]');
    expect(fragmentNames).toContain('%Rule[2]');
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

  it('should name fragments according to issue example 1', () => {
    const grammar = `
      Rule ::= ("a" "b") | ("c" ("d" | "e"))
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment);
    const fragmentNames = fragmentRules.map(r => r.name).sort();

    // Expected fragments: %Rule[1], %Rule[2], %Rule[2][2]
    expect(fragmentNames).toContain('%Rule[1]');
    expect(fragmentNames).toContain('%Rule[2]');
    expect(fragmentNames).toContain('%Rule[2][2]');
  });

  it('should name fragments according to issue example 2', () => {
    const grammar = `
      Rule ::= ("a" "b") | ("c" | "d")
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    const fragmentRules = rules.filter(r => r.fragment);
    const fragmentNames = fragmentRules.map(r => r.name).sort();

    // Expected fragments: %Rule[1], %Rule[2]
    expect(fragmentNames).toContain('%Rule[1]');
    expect(fragmentNames).toContain('%Rule[2]');
    expect(fragmentNames.length).toBe(2);
  });
});
