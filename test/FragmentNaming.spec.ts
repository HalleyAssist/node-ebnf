declare var describe, it, require;

import * as expect from 'expect';
import { Grammars } from '../src';

describe('Fragment naming', () => {
  it('should use simple sequential indices for W3C EBNF fragments', () => {
    const grammar = `
      Rule ::= (A | B) (C | D)
      A ::= "a"
      B ::= "b"
      C ::= "c"
      D ::= "d"
    `;

    const parser = new Grammars.W3C.Parser(grammar);
    const rules = parser.grammarRules;

    // Find fragment rules - they should be named with simple sequential indices
    const fragmentRules = rules.filter(r => r.fragment && r.name.startsWith('%Rule'));
    
    expect(fragmentRules.length).toBeGreaterThan(0);
    
    // Check that fragment names follow the pattern %RuleName[index]
    fragmentRules.forEach(rule => {
      expect(rule.name).toMatch(/^%Rule\[\d+\]$/);
    });

    // Verify specific fragment names exist
    const fragmentNames = fragmentRules.map(r => r.name);
    expect(fragmentNames).toContain('%Rule[1]'); // First SubItem
    expect(fragmentNames).toContain('%Rule[2]'); // Second SubItem
  });

  it('should use global sequential counter across all options', () => {
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
    
    // Second option should have [2] (not reset, continues counting)
    expect(fragmentNames).toContain('%Rule[2]');
  });

  it('should handle nested subitems with sequential numbering', () => {
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
    expect(fragmentNames.some(name => /^%Rule\[\d+\]$/.test(name))).toBe(true);
    
    // Nested fragments should have nested naming starting from parent
    // The outer SubItem gets %Rule[1], the inner SubItems get %% prefix (nested in parent)
    expect(fragmentNames.some(name => name.startsWith('%%Rule[1]'))).toBe(true);
  });

  it('should use simple sequential indices for Custom grammar fragments', () => {
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
    
    // Check that fragment names follow the pattern %RuleName[index]
    fragmentRules.forEach(rule => {
      expect(rule.name).toMatch(/^%Rule\[\d+\]$/);
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
});
