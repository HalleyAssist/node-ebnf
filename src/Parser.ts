// https://www.ics.uci.edu/~pattis/ICS-33/lectures/ebnf.pdf

const UPPER_SNAKE_RE = /^[A-Z0-9_]+$/;
const decorationRE = /(\?|\+|\*)$/;
const preDecorationRE = /^(@|&|!)/;
const WS_RULE = 'WS';

import { TokenError } from './TokenError';
import { ParsingError, IParsingErrorPosition, IFailureTreeNode } from './ParsingError';

export type RulePrimary = string | RegExp;

export interface IRule {
  name: string;
  bnf: RulePrimary[][];
  recover?: string;
  fragment?: boolean;
  pinned?: number;
  implicitWs?: boolean;
  simplifyWhenOneChildren?: boolean;
}

export interface IToken {
  type: string;
  text: string;
  start: number;
  end: number;
  children: IToken[];
  parent: IToken;
  fullText: string;
  errors: TokenError[];
  rest: string;
  fragment?: boolean;
  lookup?: boolean;
}

export function readToken(txt: string, expr: RegExp): IToken {
  let result = expr.exec(txt);

  if (result && result.index == 0) {
    if (result[0].length == 0 && expr.source.length > 0) return null;
    return {
      type: null,
      text: result[0],
      rest: txt.substr(result[0].length),
      start: 0,
      end: result[0].length - 1,
      fullText: result[0],
      errors: [],
      children: [],
      parent: null
    };
  }

  return null;
}

export function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function fixRest(token: IToken) {
  token.rest = '';
  if (token.children) {
    for (const c of token.children) {
      fixRest(c);
    }
  }
}

function fixPositions(token: IToken, start: number) {
  token.start += start;
  token.end += start;
  if (token.children) {
    for (const c of token.children) {
      fixPositions(c, token.start);
    }
  }
}

function agregateErrors(errors: any[], token: IToken) {
  if (token.errors && token.errors.length) {
    for (const err of token.errors) {
      errors.push(err);
    }
  }

  if (token.children) {
    for (const tok of token.children) {
      agregateErrors(errors, tok);
    }
  }
}
export function parseRuleName(name: string) {
  let postDecoration = decorationRE.exec(name);
  let preDecoration = preDecorationRE.exec(name);

  let postDecorationText = (postDecoration && postDecoration[0]) || '';
  let preDecorationText = (preDecoration && preDecoration[0]) || '';

  let out = {
    raw: name,
    name: name.replace(decorationRE, '').replace(preDecorationRE, ''),
    isOptional: postDecorationText == '?' || postDecorationText == '*',
    allowRepetition: postDecorationText == '+' || postDecorationText == '*',
    atLeastOne: postDecorationText == '+',
    lookupPositive: preDecorationText == '&',
    lookupNegative: preDecorationText == '!',
    pinned: preDecorationText == '@',
    lookup: false,
    isLiteral: false
  };

  out.isLiteral = out.name[0] == "'" || out.name[0] == '"';
  out.lookup = out.lookupNegative || out.lookupPositive;

  return out;
}

export function findRuleByName(name: string, parser: Parser): IRule {
  let parsed = parseRuleName(name);

  return parser.cachedRules[parsed.name] || null;
}

/// Removes all the nodes starting with 'RULE_'
function stripRules(token: IToken, re: RegExp) {
  if (token.children) {
    let localRules = token.children.filter(x => x.type && re.test(x.type));
    for (let i = 0; i < localRules.length; i++) {
      let indexOnChildren = token.children.indexOf(localRules[i]);
      if (indexOnChildren != -1) {
        token.children.splice(indexOnChildren, 1);
      }
    }

    for (const c of token.children) {
      stripRules(c, re);
    }
  }
}

export interface IDictionary<T> {
  [s: string]: T;
}
export interface IParserOptions {
  keepUpperRules: boolean;
  debug: boolean;
}

interface IFailureInfo {
  offset: number;
  expected: Set<string>;
  found: string;
  tree: Map<string, Set<string>>; // parent -> children that failed
}

const ignoreMissingRules = ['EOF'];

export class Parser {
  private readonly debug;
  private furthestFailure: IFailureInfo | null = null;
  private originalInput: string = '';
  private parseStack: string[] = []; // Track parsing context

  cachedRules: IDictionary<IRule> = {};
  constructor(public grammarRules: IRule[], public options?: Partial<IParserOptions>) {
    this.debug = options ? options.debug === true : false;
    let errors = [];

    let neededRules: string[] = [];

    for (const rule of grammarRules) {
      let parsedName = parseRuleName(rule.name);

      if (parsedName.name in this.cachedRules) {
        errors.push('Duplicated rule ' + parsedName.name);
        continue;
      } else {
        this.cachedRules[parsedName.name] = rule;
      }

      if (!rule.bnf || !rule.bnf.length) {
        let error = 'Missing rule content, rule: ' + rule.name;

        if (errors.indexOf(error) == -1) errors.push(error);
      } else {
        for (const options of rule.bnf) {
          if (typeof options[0] === 'string') {
            let parsed = parseRuleName(options[0] as string);
            if (parsed.name == rule.name) {
              let error = 'Left recursion is not allowed, rule: ' + rule.name;

              if (errors.indexOf(error) == -1) errors.push(error);
            }
          }

          for (const option of options) {
            if (typeof option == 'string') {
              let name = parseRuleName(option);
              if (
                !name.isLiteral &&
                neededRules.indexOf(name.name) == -1 &&
                ignoreMissingRules.indexOf(name.name) == -1
              )
                neededRules.push(name.name);
            }
          }
        }
      }

      if (WS_RULE == rule.name) rule.implicitWs = false;

      if (rule.implicitWs) {
        if (neededRules.indexOf(WS_RULE) == -1) neededRules.push(WS_RULE);
      }

      if (rule.recover) {
        if (neededRules.indexOf(rule.recover) == -1) neededRules.push(rule.recover);
      }
    }

    for (const ruleName of neededRules) {
      if (!(ruleName in this.cachedRules)) {
        errors.push('Missing rule ' + ruleName);
      }
    }

    if (errors.length) throw new Error(errors.join('\n'));
  }

  getAST(txt: string, target?: string) {
    if (!target) {
      target = this.grammarRules.filter(x => !x.fragment && x.name.indexOf('%') != 0)[0].name;
    }

    // Reset failure tracking for each new parse
    this.furthestFailure = null;
    this.originalInput = txt;
    this.parseStack = [];

    let result = this.parse(txt, target, 0, 0);

    if (result) {
      agregateErrors(result.errors, result);
      fixPositions(result, 0);

      // REMOVE ALL THE TAGS MATCHING /^%/
      stripRules(result, /^%/);

      if (!this.options || !this.options.keepUpperRules) stripRules(result, UPPER_SNAKE_RE);

      let rest = result.rest;

      if (rest) {
        new TokenError('Unexpected end of input: \n' + rest, result);
      }

      fixRest(result);

      result.rest = rest;
    } else {
      // Parsing failed completely - throw ParsingError
      if (this.furthestFailure) {
        const position = this.calculatePosition(this.originalInput, this.furthestFailure.offset);
        const found = this.furthestFailure.found;
        
        // Build failure tree and extract parent-most rules
        const failureTree = this.buildFailureTree(this.furthestFailure.tree);
        const parentMostRules = this.extractParentMostRules(this.furthestFailure.tree);
        
        throw new ParsingError(
          'Failed to parse input',
          position,
          parentMostRules,
          found,
          failureTree
        );
      } else {
        // Fallback if no failure was tracked
        throw new ParsingError(
          'Failed to parse input',
          { offset: 0, line: 1, column: 1 },
          [target],
          txt.length > 0 ? txt.charAt(0) : 'end of input'
        );
      }
    }

    return result;
  }

  emitSource(): string {
    return 'CANNOT EMIT SOURCE FROM BASE Parser';
  }

  private calculatePosition(txt: string, offset: number): IParsingErrorPosition {
    let line = 1;
    let column = 1;
    for (let i = 0; i < offset && i < txt.length; i++) {
      // Handle \r\n as a single line ending
      if (txt[i] === '\r' && i + 1 < txt.length && txt[i + 1] === '\n') {
        line++;
        column = 1;
        i++; // Skip the \n
      } else if (txt[i] === '\n' || txt[i] === '\r') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { offset, line, column };
  }

  private recordFailure(offset: number, expected: string) {
    if (!this.furthestFailure || offset > this.furthestFailure.offset) {
      // This is a new furthest failure
      const found = offset < this.originalInput.length 
        ? this.originalInput.charAt(offset)
        : 'end of input';
      
      this.furthestFailure = {
        offset,
        expected: new Set([expected]),
        found,
        tree: new Map()
      };
      
      this.recordParentChildRelationship(expected);
      this.furthestFailure.expected.add(expected);
    } else if (offset === this.furthestFailure.offset) {
      // Same position, add to expected set
      this.furthestFailure.expected.add(expected);
      this.recordParentChildRelationship(expected);
    }
  }

  private recordParentChildRelationship(expected: string) {
    if (!this.furthestFailure) return;
    
    if (this.parseStack.length > 0) {
      const parent = this.parseStack[this.parseStack.length - 1];
      if (!this.furthestFailure.tree.has(parent)) {
        this.furthestFailure.tree.set(parent, new Set());
      }
      this.furthestFailure.tree.get(parent)!.add(expected);
    } else {
      // No parent, this is a top-level failure
      if (!this.furthestFailure.tree.has('__ROOT__')) {
        this.furthestFailure.tree.set('__ROOT__', new Set());
      }
      this.furthestFailure.tree.get('__ROOT__')!.add(expected);
    }
  }

  private extractParentMostRules(tree: Map<string, Set<string>>): string[] {
    // The "parent most failing option" is the rule we were trying to match
    // when all its alternatives failed. In the tree structure, this is typically
    // the direct child of the top-most parent that has alternatives.
    
    // If we have __ROOT__, find its direct children that have alternatives
    if (tree.has('__ROOT__')) {
      const rootChildren = Array.from(tree.get('__ROOT__')!);
      // Return root children that have their own children (alternatives)
      const result = rootChildren.filter(child => tree.has(child) && tree.get(child)!.size > 0);
      if (result.length > 0) {
        return result;
      }
      // If none have children, return the root children themselves
      return rootChildren;
    }
    
    // Find the top-most parent (not a child of any other parent)
    const allChildren = new Set<string>();
    const allParents = new Set<string>();
    
    for (const [parent, children] of tree.entries()) {
      allParents.add(parent);
      for (const child of children) {
        allChildren.add(child);
      }
    }
    
    const topMostParents = Array.from(allParents).filter(parent => !allChildren.has(parent));
    
    // For each top-most parent, get its direct children that have alternatives
    const result: string[] = [];
    for (const parent of topMostParents) {
      if (tree.has(parent)) {
        const children = Array.from(tree.get(parent)!);
        for (const child of children) {
          if (tree.has(child) && tree.get(child)!.size > 0) {
            result.push(child);
          }
        }
      }
    }
    
    if (result.length > 0) {
      return result;
    }
    
    // Fallback: return top-most parents
    if (topMostParents.length > 0) {
      return topMostParents;
    }
    
    // Last fallback: return all unique rules
    return Array.from(new Set([...allParents, ...allChildren]));
  }

  private buildFailureTree(tree: Map<string, Set<string>>): IFailureTreeNode[] {
    const buildNode = (ruleName: string): IFailureTreeNode => {
      const node: IFailureTreeNode = { rule: ruleName };
      if (tree.has(ruleName)) {
        const children = Array.from(tree.get(ruleName)!);
        if (children.length > 0) {
          node.children = children.map(child => buildNode(child));
        }
      }
      return node;
    };
    
    // Start from root if it exists, otherwise from parent-most rules
    if (tree.has('__ROOT__')) {
      const rootChildren = Array.from(tree.get('__ROOT__')!);
      return rootChildren.map(child => buildNode(child));
    }
    
    // Find parent-most rules (rules that are not children of other rules)
    const allChildren = new Set<string>();
    for (const children of tree.values()) {
      for (const child of children) {
        allChildren.add(child);
      }
    }
    
    const parentMost = Array.from(tree.keys()).filter(parent => !allChildren.has(parent));
    return parentMost.map(parent => buildNode(parent));
  }

  parse(txt: string, target: string, recursion = 0, offset = 0): IToken {
    let out: IToken = null;

    let type = parseRuleName(target);

    let expr: RegExp;

    let printable = this.debug && /*!isLiteral &*/ !UPPER_SNAKE_RE.test(type.name);

    printable &&
      console.log(
        new Array(recursion).join('│  ') + 'Trying to get ' + target + ' from ' + JSON.stringify(txt.split('\n')[0])
      );

    let realType = type.name;

    let targetLex = findRuleByName(type.name, this);

    if (type.name == 'EOF') {
      if (txt.length) {
        this.recordFailure(offset, 'EOF');
        return null;
      } else if (txt.length == 0) {
        return {
          type: 'EOF',
          text: '',
          rest: '',
          start: 0,
          end: 0,
          fullText: '',
          errors: [],
          children: [],
          parent: null
        };
      }
    }

    try {
      if (!targetLex && type.isLiteral) {
        
        
        let src: string = type.name.trim();

        if (src.startsWith('"')) {
          src = JSON.parse(src);
        } else if (src.startsWith("'")) {
          src = src.replace(/^'(.+)'$/, '$1').replace(/\\'/g, "'");
        }

        if (src === '') {
          return {
            type: '%%EMPTY%%',
            text: '',
            rest: txt,
            start: 0,
            end: 0,
            fullText: '',
            errors: [],
            children: [],
            parent: null
          };
        }

        expr = new RegExp(escapeRegExp(src));
        realType = null;
      }
    } catch (e) {
      if (e instanceof ReferenceError) {
        console.error(e);
      }
      this.recordFailure(offset, target);
      return null;
    }

    if (expr) {
      let result = readToken(txt, expr);

      if (result) {
        result.type = realType;
        return result;
      } else {
        // Literal or regex match failed
        this.recordFailure(offset, type.isLiteral ? type.name : target);
      }
    } else {
      let options = targetLex.bnf;

      if (options instanceof Array) {
        // Push this rule onto the parse stack
        this.parseStack.push(type.name);
        
        optionsLoop: for (const phases of options) {
          if (out) break;

          let pinned: IToken = null;

          let tmp: IToken = {
            type: type.name,
            text: '',
            children: [],
            end: 0,
            errors: [],
            fullText: '',
            parent: null,
            start: 0,
            rest: txt
          };

          if (targetLex.fragment) tmp.fragment = true;

          let tmpTxt = txt;
          let position = 0;

          let allOptional = phases.length > 0;
          let foundSomething = false;

          for (let i = 0; i < phases.length; i++) {
            if (typeof phases[i] == 'string') {
              let localTarget = parseRuleName(phases[i] as string);

              allOptional = allOptional && localTarget.isOptional;

              let got: IToken;

              let foundAtLeastOne = false;

              do {
                got = null;

                if (targetLex.implicitWs) {
                  got = this.parse(tmpTxt, localTarget.name, recursion + 1, offset + position);

                  if (!got) {
                    let WS: IToken;

                    do {
                      WS = this.parse(tmpTxt, WS_RULE, recursion + 1, offset + position);

                      if (WS) {
                        tmp.text = tmp.text + WS.text;
                        tmp.end = tmp.text.length;

                        WS.parent = tmp;
                        tmp.children.push(WS);

                        tmpTxt = tmpTxt.substr(WS.text.length);
                        position += WS.text.length;
                      } else {
                        break;
                      }
                    } while (WS && WS.text.length);
                  }
                }

                got = got || this.parse(tmpTxt, localTarget.name, recursion + 1, offset + position);

                // rule ::= "true" ![a-zA-Z]
                // negative lookup, if it does not match, we should continue
                if (localTarget.lookupNegative) {
                  if (got) continue optionsLoop; /* cancel this path */
                  break;
                }

                if (localTarget.lookupPositive) {
                  if (!got) continue optionsLoop;
                }

                if (!got) {
                  if (localTarget.isOptional) break;
                  if (localTarget.atLeastOne && foundAtLeastOne) break;
                  // Record this failure for error reporting
                  this.recordFailure(offset + position, localTarget.name);
                }

                if (got && targetLex.pinned == i + 1) {
                  pinned = got;
                  printable && console.log(new Array(recursion + 1).join('│  ') + '└─ ' + got.type + ' PINNED');
                }

                if (!got) got = this.parseRecovery(targetLex, tmpTxt, recursion + 1, offset + position);

                if (!got) {
                  if (pinned) {
                    out = tmp;
                    got = {
                      type: 'SyntaxError',
                      text: tmpTxt,
                      children: [],
                      end: tmpTxt.length,
                      errors: [],
                      fullText: '',
                      parent: null,
                      start: 0,
                      rest: ''
                    };
                    if (tmpTxt.length) {
                      new TokenError(`Unexpected end of input. Expecting ${localTarget.name} Got: ${tmpTxt}`, got);
                    } else {
                      new TokenError(`Unexpected end of input. Missing ${localTarget.name}`, got);
                    }
                    printable &&
                      console.log(
                        new Array(recursion + 1).join('│  ') + '└─ ' + got.type + ' ' + JSON.stringify(got.text)
                      );
                  } else {
                    continue optionsLoop;
                  }
                }

                foundAtLeastOne = true;
                foundSomething = true;

                if (got.type == '%%EMPTY%%') {
                  break;
                }

                got.start += position;
                got.end += position;

                if (!localTarget.lookupPositive && got.type) {
                  if (got.fragment) {
                    if (got.children) {
                      for (const x of got.children) {
                        x.start += position;
                        x.end += position;
                        x.parent = tmp;
                        tmp.children.push(x);
                      }
                    }
                  } else {
                    got.parent = tmp;
                    tmp.children.push(got);
                  }
                }

                if (localTarget.lookup) got.lookup = true;

                printable &&
                  console.log(new Array(recursion + 1).join('│  ') + '└─ ' + got.type + ' ' + JSON.stringify(got.text));

                // Eat it from the input stream, only if it is not a lookup
                if (!localTarget.lookup && !got.lookup) {
                  tmp.text = tmp.text + got.text;
                  tmp.end = tmp.text.length;

                  tmpTxt = tmpTxt.substr(got.text.length);
                  position += got.text.length;
                }

                tmp.rest = tmpTxt;
              } while (got && localTarget.allowRepetition && tmpTxt.length && !got.lookup);
            } /* IS A REGEXP */ else {
              let got = readToken(tmpTxt, phases[i] as RegExp);

              if (!got) {
                this.recordFailure(offset + position, (phases[i] as RegExp).source);
                continue optionsLoop;
              }

              printable &&
                console.log(
                  new Array(recursion + 1).join('│  ') + '└> ' + JSON.stringify(got.text) + (phases[i] as RegExp).source
                );

              foundSomething = true;

              got.start += position;
              got.end += position;

              tmp.text = tmp.text + got.text;
              tmp.end = tmp.text.length;

              tmpTxt = tmpTxt.substr(got.text.length);
              position += got.text.length;

              tmp.rest = tmpTxt;
            }
          }

          if (foundSomething) {
            out = tmp;

            printable &&
              console.log(
                new Array(recursion).join('│  ') + '├<─┴< PUSHING ' + out.type + ' ' + JSON.stringify(out.text)
              );
          }
        }
        
        // Pop this rule from the parse stack
        this.parseStack.pop();
      }

      if (out && targetLex.simplifyWhenOneChildren && out.children.length == 1) {
        out = out.children[0];
      }
    }

    if (!out) {
      printable && console.log(target + ' NOT RESOLVED FROM ' + txt);
    }

    return out;
  }

  private parseRecovery(recoverableToken: IRule, tmpTxt: string, recursion: number, offset: number): IToken {
    if (recoverableToken.recover && tmpTxt.length) {
      let printable = this.debug;

      printable &&
        console.log(
          new Array(recursion + 1).join('│  ') +
            'Trying to recover until token ' +
            recoverableToken.recover +
            ' from ' +
            JSON.stringify(tmpTxt.split('\n')[0] + tmpTxt.split('\n')[1])
        );

      let tmp: IToken = {
        type: 'SyntaxError',
        text: '',
        children: [],
        end: 0,
        errors: [],
        fullText: '',
        parent: null,
        start: 0,
        rest: ''
      };

      let got: IToken;
      let currentOffset = offset;

      do {
        got = this.parse(tmpTxt, recoverableToken.recover, recursion + 1, currentOffset);

        if (got) {
          new TokenError('Unexpected input: "' + tmp.text + `" Expecting: ${recoverableToken.name}`, tmp);
          break;
        } else {
          tmp.text = tmp.text + tmpTxt[0];
          tmp.end = tmp.text.length;
          tmpTxt = tmpTxt.substr(1);
          currentOffset++;
        }
      } while (!got && tmpTxt.length > 0);

      if (tmp.text.length > 0 && got) {
        printable && console.log(new Array(recursion + 1).join('│  ') + 'Recovered text: ' + JSON.stringify(tmp.text));
        return tmp;
      }
    }
    return null;
  }
}

export default Parser;
