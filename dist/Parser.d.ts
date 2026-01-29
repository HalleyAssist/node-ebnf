import { TokenError } from './TokenError';
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
export declare function readToken(txt: string, expr: RegExp): IToken;
export declare function escapeRegExp(str: any): any;
export declare function parseRuleName(name: string): {
    raw: string;
    name: string;
    isOptional: boolean;
    allowRepetition: boolean;
    atLeastOne: boolean;
    lookupPositive: boolean;
    lookupNegative: boolean;
    pinned: boolean;
    lookup: boolean;
    isLiteral: boolean;
};
export declare function findRuleByName(name: string, parser: Parser): IRule;
export interface IDictionary<T> {
    [s: string]: T;
}
export interface IParserOptions {
    keepUpperRules: boolean;
    debug: boolean;
}
export declare class Parser {
    grammarRules: IRule[];
    options?: Partial<IParserOptions>;
    private readonly debug;
    private furthestFailure;
    private originalInput;
    private parseStack;
    cachedRules: IDictionary<IRule>;
    constructor(grammarRules: IRule[], options?: Partial<IParserOptions>);
    getAST(txt: string, target?: string): IToken;
    emitSource(): string;
    private calculatePosition;
    private recordFailure;
    private recordParentChildRelationship;
    private extractParentMostRules;
    /**
     * Determines if a rule name represents a terminal/literal rather than a non-terminal rule.
     * Heuristics:
     * - Starts with " or ' (string literal like "true" or '"')
     * - Contains '[' or '#x' (regex pattern like [0-9] or #x20)
     */
    private isLiteralOrTerminal;
    /**
     * Extracts the expected value from a terminal/literal rule name.
     * - For string literals (quoted), removes the quotes and returns the content
     * - For regex patterns, returns as-is
     */
    private extractExpectedValue;
    private buildFailureTree;
    parse(txt: string, target: string, recursion?: number, offset?: number): IToken;
    private parseRecovery;
}
export default Parser;
