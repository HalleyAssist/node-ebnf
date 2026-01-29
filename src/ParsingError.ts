export interface IParsingErrorPosition {
  offset: number;
  line: number;
  column: number;
}

export interface IFailureTreeNode {
  rule: string;
  children?: IFailureTreeNode[];
}

export class ParsingError extends Error {
  public readonly position: IParsingErrorPosition;
  public readonly expected: string[];
  public readonly found: string;
  public readonly failureTree?: IFailureTreeNode[];

  constructor(message: string, position: IParsingErrorPosition, expected: string[], found: string, failureTree?: IFailureTreeNode[]) {
    super(message);
    this.name = 'ParsingError';
    this.position = position;
    this.expected = expected;
    this.found = found;
    this.failureTree = failureTree;
    
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ParsingError.prototype);
  }

  toString(): string {
    const { line, column, offset } = this.position;
    let msg = `${this.name}: ${this.message}\n`;
    msg += `  at line ${line}, column ${column} (offset ${offset})\n`;
    msg += `  Expected: ${this.expected.join(', ')}\n`;
    msg += `  Found: ${this.found}`;
    return msg;
  }
}
