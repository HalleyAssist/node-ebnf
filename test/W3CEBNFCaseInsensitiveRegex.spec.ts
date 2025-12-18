declare var describe, it, require;

import { Grammars, Parser } from '../dist';
import { findRuleByName } from '../dist/Parser';
import { testParseToken } from './TestHelpers';

let inspect = require('util').inspect;
let expect = require('expect');

let grammar = `
Document          ||= Keyword [a-z]+
Keyword           ||= 'SELECT' | 'FROM'
`;

describe('W3CEBNF Case Insensitive with Regex', () => {
  describe('Grammars.W3C handles case insensitive regex patterns', function() {
    let RULES = Grammars.W3C.getRules(grammar);
    console.log('RULES:\n' + inspect(RULES, false, 20, true));
    let parser = new Parser(RULES, {});

    it('case insensitive char class should have i flag', () => {
      let subRule = parser.grammarRules.find(r => r.name.startsWith('%Document'));
      console.log('SubRule:', inspect(subRule, false, 20, true));
      
      // The [a-z] should become a case-insensitive regex with 'i' flag
      expect(subRule).toBeTruthy();
      expect(subRule.bnf[0][0]).toBeInstanceOf(RegExp);
      expect((subRule.bnf[0][0] as RegExp).flags).toContain('i');
    });

    it('should parse "SELECT" with lowercase letters', () => {
      let ast = parser.getAST('SELECTtest');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "select" in lowercase', () => {
      let ast = parser.getAST('selecttest');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse "SeLeCt" in mixed case', () => {
      let ast = parser.getAST('SeLeCtest');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse with uppercase letters after keyword due to i flag', () => {
      let ast = parser.getAST('SELECTTEST');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });
  });
});
