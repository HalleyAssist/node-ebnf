"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findChildrenByType = findChildrenByType;
/**
 * Finds all the direct childs of a specifyed type
 */
function findChildrenByType(token, type) {
    return token.children ? token.children.filter(x => x.type == type) : [];
}
//# sourceMappingURL=SemanticHelpers.js.map