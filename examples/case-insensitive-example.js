#!/usr/bin/env node

/**
 * Example demonstrating case insensitive matching in W3CEBNF
 * 
 * Using ||= instead of ::= makes the production case insensitive
 */

const { Grammars, Parser } = require('../dist');

// Define a simple SQL-like grammar with case insensitive keywords
const grammar = `
Statement         ||= SelectStatement | UpdateStatement
SelectStatement   ||= 'SELECT' WS+ ColumnList WS+ 'FROM' WS+ Table
UpdateStatement   ||= 'UPDATE' WS+ Table WS+ 'SET' WS+ Assignment
ColumnList        ::= Column (WS* ',' WS* Column)*
Column            ::= [a-zA-Z][a-zA-Z0-9_]*
Table             ::= [a-zA-Z][a-zA-Z0-9_]*
Assignment        ::= Column WS* '=' WS* Value
Value             ::= [a-zA-Z0-9]+
WS                ::= [ #x09#x0A#x0D]+
`;

console.log('='.repeat(70));
console.log('W3CEBNF Case Insensitive Example');
console.log('='.repeat(70));
console.log();
console.log('Grammar:');
console.log(grammar);
console.log();

// Create parser from the grammar
const rules = Grammars.W3C.getRules(grammar);
const parser = new Parser(rules, {});

// Test cases
const testCases = [
  'SELECT id FROM users',
  'select id from users',
  'SeLeCt id FrOm users',
  'UPDATE users SET name=John',
  'update users set name=John',
  'UpDaTe users SeT name=John'
];

console.log('Test Cases:');
console.log('-'.repeat(70));

testCases.forEach(testCase => {
  const ast = parser.getAST(testCase);
  const status = ast ? '✓ PASS' : '✗ FAIL';
  const astType = ast ? ` (${ast.type})` : '';
  console.log(`${status} "${testCase}"${astType}`);
});

console.log();
console.log('='.repeat(70));
console.log('Key Features:');
console.log('  • Rules with ||= are case insensitive');
console.log('  • String literals in case insensitive rules match any case');
console.log('  • Regex patterns in case insensitive rules get "i" flag');
console.log('  • Rules with ::= remain case sensitive');
console.log('='.repeat(70));
