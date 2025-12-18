declare var describe, it, require;

import { Grammars, Parser } from '../dist';
import { testParseToken } from './TestHelpers';

let inspect = require('util').inspect;
let expect = require('expect');

// Example: SQL-like grammar with case insensitive keywords
let grammar = `
Statement         ||= SelectStatement | InsertStatement
SelectStatement   ||= 'SELECT' WS+ ColumnList WS+ 'FROM' WS+ Identifier
InsertStatement   ||= 'INSERT' WS+ 'INTO' WS+ Identifier
ColumnList        ::= Identifier (WS* ',' WS* Identifier)*
Identifier        ::= [a-zA-Z][a-zA-Z0-9_]*
WS                ::= [ #x09#x0A#x0D]+
`;

describe('W3CEBNF Case Insensitive SQL Example', () => {
  describe('SQL-like grammar with case insensitive keywords', function() {
    let RULES = Grammars.W3C.getRules(grammar);
    console.log('SQL RULES:\n' + inspect(RULES, false, 20, true));
    let parser = new Parser(RULES, {});

    it('should parse SELECT statement in uppercase', () => {
      let ast = parser.getAST('SELECT name FROM users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse SELECT statement in lowercase', () => {
      let ast = parser.getAST('select name from users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse SELECT statement in mixed case', () => {
      let ast = parser.getAST('SeLeCt name FrOm users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse SELECT with multiple columns', () => {
      let ast = parser.getAST('SELECT id, name, email FROM users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse INSERT statement in uppercase', () => {
      let ast = parser.getAST('INSERT INTO users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse INSERT statement in lowercase', () => {
      let ast = parser.getAST('insert into users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });

    it('should parse INSERT statement in mixed case', () => {
      let ast = parser.getAST('InSeRt InTo users');
      expect(ast).toBeTruthy();
      expect(ast.type).toEqual('Statement');
    });
    
    it('identifiers should remain case sensitive', () => {
      let ast1 = parser.getAST('SELECT name FROM users');
      let ast2 = parser.getAST('SELECT NAME FROM USERS');
      
      // Both should parse successfully
      expect(ast1).toBeTruthy();
      expect(ast2).toBeTruthy();
      
      // But the identifier text should preserve case
      const getAllIdentifiers = (ast) => {
        const result = [];
        const walk = (node) => {
          if (node.type === 'Identifier') {
            result.push(node.text);
          }
          if (node.children) {
            node.children.forEach(walk);
          }
        };
        walk(ast);
        return result;
      };
      
      const identifiers1 = getAllIdentifiers(ast1);
      const identifiers2 = getAllIdentifiers(ast2);
      
      // Check that identifiers preserve their case
      expect(identifiers1).toContain('name');
      expect(identifiers1).toContain('users');
      expect(identifiers2).toContain('NAME');
      expect(identifiers2).toContain('USERS');
    });
  });
});
