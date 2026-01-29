declare var describe, it, require;

import { Grammars, Parser, ParsingError } from '../dist';

const expect = require('expect');

describe('ParsingError', () => {
  describe('Basic ParsingError functionality', () => {
    const grammar = `
value ::= "true" | "false" | "null"
`;
    const RULES = Grammars.W3C.getRules(grammar);
    const parser = new Parser(RULES);

    it('should throw ParsingError on complete parsing failure', () => {
      expect(() => {
        parser.getAST('invalid');
      }).toThrow(ParsingError);
    });

    it('should capture position information (line, column, offset)', () => {
      try {
        parser.getAST('invalid');
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        expect(e.position).toBeDefined();
        expect(e.position.offset).toBe(0);
        expect(e.position.line).toBe(1);
        expect(e.position.column).toBe(1);
      }
    });

    it('should capture expected tokens', () => {
      try {
        parser.getAST('invalid');
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        expect(e.expected).toBeDefined();
        expect(Array.isArray(e.expected)).toBe(true);
        expect(e.expected.length).toBeGreaterThan(0);
        // Should expect one of the literals from the grammar
        expect(e.expected).toEqual(expect.arrayContaining([expect.stringMatching(/true|false|null/)]));
      }
    });

    it('should capture found token', () => {
      try {
        parser.getAST('invalid');
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        expect(e.found).toBeDefined();
        expect(e.found).toBe('i');
      }
    });

    it('should report "end of input" when input is exhausted', () => {
      try {
        parser.getAST('');
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        expect(e.found).toBe('end of input');
      }
    });

    it('should have a meaningful toString() representation', () => {
      try {
        parser.getAST('xyz');
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        const str = e.toString();
        expect(str).toContain('ParsingError');
        expect(str).toContain('line');
        expect(str).toContain('column');
        expect(str).toContain('Expected');
        expect(str).toContain('Found');
      }
    });
  });

  describe('ParsingError with multiline input', () => {
    const grammar = `
document ::= "start" WS+ "middle" WS+ "end"
WS ::= [#x20#x09#x0A#x0D]+
`;
    const RULES = Grammars.W3C.getRules(grammar);
    const parser = new Parser(RULES);

    it('should track line numbers correctly', () => {
      const input = 'start\nmiddle\nwrong';
      try {
        parser.getAST(input);
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        // The error should be at line 3 where "end" was expected
        expect(e.position.line).toBeGreaterThan(1);
      }
    });

    it('should track column numbers correctly', () => {
      const input = 'start middle wrong';
      try {
        parser.getAST(input);
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        // The error should be somewhere in the middle of the line
        expect(e.position.column).toBeGreaterThan(1);
      }
    });
  });

  describe('ParsingError with complex grammar', () => {
    const grammar = `
expr ::= term (("+" | "-") term)*
term ::= factor (("*" | "/") factor)*
factor ::= NUMBER | "(" expr ")"
NUMBER ::= [0-9]+
WS ::= [ ]+
`;
    const RULES = Grammars.W3C.getRules(grammar);
    const parser = new Parser(RULES);

    it('should collect multiple expected tokens at the same position', () => {
      const input = '+';
      try {
        parser.getAST(input);
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        // Should expect NUMBER or "("
        expect(e.expected.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Valid parse should not throw ParsingError', () => {
    const grammar = `
value ::= "true" | "false" | "null"
`;
    const RULES = Grammars.W3C.getRules(grammar);
    const parser = new Parser(RULES);

    it('should not throw ParsingError on valid input', () => {
      expect(() => {
        parser.getAST('true');
      }).not.toThrow(ParsingError);
    });

    it('should return valid result on valid input', () => {
      const result = parser.getAST('true');
      expect(result).toBeDefined();
      expect(result.type).toBe('value');
      expect(result.text).toBe('true');
    });
  });

  describe("ParsingError with realistic grammar (JSON)", () => {
    const grammar = `
    json ::= value
    value ::= object | array | string | number | "true" | "false" | "null"
    object ::= "{" (pair ("," pair)*)? "}"
    pair ::= string ":" value
    array ::= "[" (value ("," value)*)? "]"
    string ::= '"' [^"]* '"'
    number ::= [0-9]+
    WS ::= [ ]*
    `;

    const parser = new Parser(Grammars.W3C.getRules(grammar));

    it('should provide detailed error info for malformed JSON', () => {
      const input = '{"key": tru}';
      try {
        parser.getAST(input);
        throw new Error('Should have thrown ParsingError');
      } catch (e) {
        expect(e).toBeInstanceOf(ParsingError);
        expect(e.position).toBeDefined();
        expect(e.expected).toBeDefined();
        expect(e.expected).toBe(['value']);

        console.log(e)
      }
    });
  });
});
