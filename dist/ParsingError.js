"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingError = void 0;
class ParsingError extends Error {
    constructor(message, position, expected, found, failureTree) {
        super(message);
        this.name = 'ParsingError';
        this.position = position;
        this.expected = expected;
        this.found = found;
        this.failureTree = failureTree;
        // Maintain proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, ParsingError.prototype);
    }
    toString() {
        const { line, column, offset } = this.position;
        let msg = `${this.name}: ${this.message}\n`;
        msg += `  at line ${line}, column ${column} (offset ${offset})\n`;
        msg += `  Expected: ${this.expected.join(', ')}\n`;
        msg += `  Found: ${this.found}`;
        return msg;
    }
}
exports.ParsingError = ParsingError;
//# sourceMappingURL=ParsingError.js.map