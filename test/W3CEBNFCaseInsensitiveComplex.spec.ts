declare var describe, it, require;

import { Grammars, Parser } from '../dist';

let expect = require('expect');

// Test complex case insensitive patterns with decorations
let grammar = `
Document          ||= Keyword+ [0-9]+
Keyword           ||= 'IF' | 'THEN' | 'ELSE'
`;

describe('W3CEBNF Case Insensitive Complex Patterns', () => {
  describe('Complex patterns with decorations', function() {
    let RULES = Grammars.W3C.getRules(grammar);
    let parser = new Parser(RULES, {});

    it('should parse multiple keywords in uppercase', () => {
      let ast = parser.getAST('IFTHENELSE123');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse multiple keywords in lowercase', () => {
      let ast = parser.getAST('ifthenelse123');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse multiple keywords in mixed case', () => {
      let ast = parser.getAST('IfThEnElSe456');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse single keyword followed by numbers', () => {
      let ast = parser.getAST('IF999');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should handle repeating keywords', () => {
      let ast = parser.getAST('IFIFIF789');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });
  });
});

// Test case insensitive with SubItems (nested patterns)
let grammar2 = `
Document          ||= 'BEGIN' WS* (Statement WS*)+ 'END'
Statement         ||= 'PRINT' | 'READ'
WS                ::= [ #x09#x0A#x0D]
`;

describe('W3CEBNF Case Insensitive with SubItems', () => {
  describe('SubItems inherit case insensitivity', function() {
    let RULES = Grammars.W3C.getRules(grammar2);
    let parser = new Parser(RULES, {});

    it('should parse with uppercase keywords', () => {
      let ast = parser.getAST('BEGIN PRINT END');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse with lowercase keywords', () => {
      let ast = parser.getAST('begin print end');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse with mixed case keywords', () => {
      let ast = parser.getAST('BeGiN pRiNt EnD');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse with multiple statements', () => {
      let ast = parser.getAST('BEGIN PRINT READ PRINT END');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });

    it('should parse multiple statements in mixed case', () => {
      let ast = parser.getAST('begin print read PRINT end');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Document');
    });
  });
});
