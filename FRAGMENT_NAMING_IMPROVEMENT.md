# Fragment Naming Improvement - Examples and Verification

This document demonstrates the improved fragment naming system implemented in this PR.

## Problem Statement

Previously, fragments were named using a global counter that never reset:
- Format: `%ruleName0`, `%ruleName1`, `%ruleName2`, ...
- Issue: Numbers could grow to unparseable strings like `%betweenNumber1213`
- Meaning: The numbers had no semantic meaning about the fragment's position

## Solution

Implemented hierarchical indexing with format: `%ruleName[optionIndex][subitemIndex]`

Where:
- **optionIndex**: 1-based index of the alternative/choice in the rule (separated by `|`)
- **subitemIndex**: 1-based index of the SubItem within that alternative (resets per option)

## Examples

### Example 1: Simple SubItems in a Single Sequence
```ebnf
BetweenNumber ::= ("0" | "1") ("0" | "1")
```

**Generated fragments:**
- `%BetweenNumber[1][1]` - First SubItem in the sequence
- `%BetweenNumber[1][2]` - Second SubItem in the sequence

### Example 2: Multiple Alternatives
```ebnf
Rule ::= (X Y) | (Z W)
```

**Generated fragments:**
- `%Rule[1][1]` - SubItem in first alternative
- `%Rule[2][1]` - SubItem in second alternative (subitemIndex resets)

### Example 3: Multiple Rules
```ebnf
RuleA ::= (X Y) | (Z W)
RuleB ::= (P Q) | (R S)
```

**Generated fragments:**
- `%RuleA[1][1]` - RuleA, first alternative
- `%RuleA[2][1]` - RuleA, second alternative
- `%RuleB[1][1]` - RuleB, first alternative
- `%RuleB[2][1]` - RuleB, second alternative

### Example 4: Nested SubItems
```ebnf
Nested ::= ((A B) | (C D))
```

**Generated fragments:**
- `%Nested[1][1]` - Outer SubItem
- `%Nested[1][1][1][1]` - First inner SubItem (nested within outer)
- `%Nested[1][1][2][1]` - Second inner SubItem (nested within outer)

## Benefits

1. **Parseable**: Format is consistent and can be parsed to extract hierarchy information
2. **Meaningful**: Indices indicate the fragment's position in the rule structure
3. **Predictable**: Indices reset at each level, making names shorter and more readable
4. **Hierarchical**: Nested SubItems naturally extend the naming with more bracket pairs

## Testing

Added comprehensive tests in `test/FragmentNaming.spec.ts`:
- ✅ Hierarchical indices for W3C EBNF
- ✅ Index reset for each option
- ✅ Nested subitem handling
- ✅ Hierarchical indices for Custom grammar
- ✅ Parsability with new names
- ✅ No old-format fragments created

All 305 tests pass (299 existing + 6 new).
