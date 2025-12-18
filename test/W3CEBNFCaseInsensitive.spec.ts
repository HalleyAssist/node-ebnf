declare var describe, it, require;

import { Grammars, Parser } from '../dist';
import { findRuleByName } from '../dist/Parser';
import { testParseToken } from './TestHelpers';

let inspect = require('util').inspect;
let expect = require('expect');

let grammar = `
Document          ||= Keyword1 | Keyword2
Keyword1          ::= 'And' | 'Or'
Keyword2          ||= 'Not' | 'Is'
`;

describe('W3CEBNF Case Insensitive', () => {
  describe('Parse W3CEBNF with case insensitive rules', () => {
    let parser: Parser;

    it('create parser', () => {
      parser = new Parser(Grammars.W3C.RULES, {});
      testParseToken(parser, grammar);
    });
  });

  describe('Grammars.W3C handles case insensitive productions', function() {
    let RULES = Grammars.W3C.getRules(grammar);
    console.log('RULES:\n' + inspect(RULES, false, 20, true));
    let parser = new Parser(RULES, {});

    it('case sensitive rule Keyword1 should use exact match', () => {
      let rule = findRuleByName("Keyword1", parser);
      console.log('Keyword1 rule:', inspect(rule, false, 20, true));
      
      // Check that case sensitive rules are still exact strings
      expect(rule.bnf[0][0]).toEqual("'And'");
      expect(rule.bnf[1][0]).toEqual("'Or'");
    });

    it('case insensitive rule Keyword2 should use regex with i flag', () => {
      let rule = findRuleByName("Keyword2", parser);
      console.log('Keyword2 rule:', inspect(rule, false, 20, true));
      
      // Check that case insensitive rules create character class patterns
      expect(rule.bnf[0][0]).toEqual(RegExp('[Nn]'));
      expect(rule.bnf[0][1]).toEqual(RegExp('[Oo]'));
      expect(rule.bnf[0][2]).toEqual(RegExp('[Tt]'));
      
      expect(rule.bnf[1][0]).toEqual(RegExp('[Ii]'));
      expect(rule.bnf[1][1]).toEqual(RegExp('[Ss]'));
    });

    it('should parse case sensitive "And"', () => {
      let ast = parser.getAST('And');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should not parse lowercase "and" for case sensitive rule', () => {
      let ast = parser.getAST('and');
      expect(ast).toEqual(null);
    });

    it('should parse "Not" in any case', () => {
      let ast = parser.getAST('Not');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "not" (lowercase)', () => {
      let ast = parser.getAST('not');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "NOT" (uppercase)', () => {
      let ast = parser.getAST('NOT');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "NoT" (mixed case)', () => {
      let ast = parser.getAST('NoT');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "is" in any case', () => {
      let ast = parser.getAST('is');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "IS" (uppercase)', () => {
      let ast = parser.getAST('IS');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });
  });
});
