export interface IParsingErrorPosition {
    offset: number;
    line: number;
    column: number;
}
export interface IFailureTreeNode {
    name: string;
    expected?: string | RegExp;
    children?: IFailureTreeNode[];
}
export declare class ParsingError extends Error {
    readonly position: IParsingErrorPosition;
    readonly expected: string[];
    readonly found: string;
    readonly failureTree?: IFailureTreeNode[];
    constructor(message: string, position: IParsingErrorPosition, expected: string[], found: string, failureTree?: IFailureTreeNode[]);
    toString(): string;
}
