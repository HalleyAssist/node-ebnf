export interface IParsingErrorPosition {
  offset: number;
  line: number;
  column: number;
}

export class ParsingError extends Error {
  public readonly position: IParsingErrorPosition;
  public readonly expected: string[];
  public readonly found: string;

  constructor(message: string, position: IParsingErrorPosition, expected: string[], found: string) {
    super(message);
    this.name = 'ParsingError';
    this.position = position;
    this.expected = expected;
    this.found = found;
    
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
