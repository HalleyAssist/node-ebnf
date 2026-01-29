export interface IParsingErrorPosition {
    offset: number;
    line: number;
    column: number;
}
export declare class ParsingError extends Error {
    readonly position: IParsingErrorPosition;
    readonly expected: string[];
    readonly found: string;
    constructor(message: string, position: IParsingErrorPosition, expected: string[], found: string);
    toString(): string;
}
