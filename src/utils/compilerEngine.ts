import {
  GrammarValidationResult,
  LeadingTrailingData,
  LeadingTrailingStep,
  PrecedenceMatrixData,
  PrecedenceCell,
  DerivationTraceItem,
  ParseStep,
  GrammarPreset,
  ParseTreeNode,
} from '../types';

export const PRESETS: GrammarPreset[] = [
  {
    id: 'valid_arithmetic',
    name: 'Valid Arithmetic (Standard Floyd)',
    grammar: 'E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id',
    description: 'Floyd 1963 axioms fully satisfied. Standard hierarchical arithmetic with distinct operator precedence.',
    defaultInput: 'id + id * id',
    category: 'valid',
  },
  {
    id: 'valid_ambiguous',
    name: 'Ambiguous Arithmetic (Produces Precedence Conflicts)',
    grammar: 'E -> E + E | E * E | id',
    description: 'Operator grammar with no adjacent non-terminals, but ambiguous precedence resulting in 4 shift/reduce conflicts.',
    defaultInput: 'id + id * id',
    category: 'conflict',
  },
  {
    id: 'invalid_adjacent',
    name: 'Invalid: Adjacent Non-Terminals',
    grammar: 'S -> A B\nA -> a\nB -> b',
    description: 'Violates Floyd Axiom 2: S -> AB has adjacent non-terminals without an intervening terminal token.',
    defaultInput: 'a b',
    category: 'invalid',
  },
  {
    id: 'invalid_epsilon',
    name: 'Invalid: Epsilon (ε) Null Production',
    grammar: 'S -> a S | ε',
    description: 'Violates Floyd Axiom 1: S -> ε contains empty derivation, preventing static boundary resolution.',
    defaultInput: 'a',
    category: 'invalid',
  },
  {
    id: 'logic_predicates',
    name: 'Valid: Logic Predicates & Equality',
    grammar: 'E -> E & T | T\nT -> T == F | F\nF -> ! F | bool',
    description: 'Operator grammar with Boolean conjunction and equality relations.',
    defaultInput: 'bool & bool == bool',
    category: 'valid',
  },
];

export function parseGrammarText(rawText: string): { lhs: string; rhsList: string[] }[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const prods: { lhs: string; rhsList: string[] }[] = [];

  for (const line of lines) {
    if (!line.includes('->')) continue;
    const parts = line.split('->');
    const lhs = parts[0].trim();
    if (!lhs) continue;
    const rhsParts = parts[1].split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    prods.push({ lhs, rhsList: rhsParts });
  }

  return prods;
}

export function validateGrammar(text: string): GrammarValidationResult {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const nonTerminals = new Set<string>();
  const terminals = new Set<string>();
  let syntaxValid = lines.length > 0;
  let hasEpsilon = false;
  let hasAdjacentNTs = false;
  let adjacentDetails: { line: number; lhs: string; rhs: string; pair: string } | undefined;
  let epsilonDetails: { line: number; lhs: string } | undefined;

  const prods: { lhs: string; rhsList: string[] }[] = [];
  let startSymbol = 'E';

  lines.forEach((line, lineIdx) => {
    if (!line.includes('->')) {
      syntaxValid = false;
      return;
    }
    const [lhsRaw, rhsRaw] = line.split('->').map((s) => s.trim());
    if (!lhsRaw || lhsRaw.length !== 1 || lhsRaw !== lhsRaw.toUpperCase() || lhsRaw < 'A' || lhsRaw > 'Z') {
      syntaxValid = false;
    } else {
      if (lineIdx === 0) startSymbol = lhsRaw;
      nonTerminals.add(lhsRaw);
    }
    const rhsParts = (rhsRaw || '').split('|').map((s) => s.trim());
    prods.push({ lhs: lhsRaw, rhsList: rhsParts });
  });

  if (syntaxValid) {
    prods.forEach((prod, lineIdx) => {
      prod.rhsList.forEach((alt) => {
        if (alt === 'ε' || alt === 'eps' || alt === '' || alt === '^') {
          hasEpsilon = true;
          epsilonDetails = { line: lineIdx + 1, lhs: prod.lhs };
        }

        // Tokenize RHS into terminals and non-terminals
        // Delimit symbols like +, *, (, ), id, ==, &, etc.
        const tokens = tokenizeRhs(alt);

        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (tok === 'ε' || tok === 'eps' || tok === '^') {
            hasEpsilon = true;
            epsilonDetails = { line: lineIdx + 1, lhs: prod.lhs };
            continue;
          }

          const isNT = tok.length === 1 && tok >= 'A' && tok <= 'Z';
          if (isNT) {
            nonTerminals.add(tok);
          } else {
            terminals.add(tok);
          }

          if (i < tokens.length - 1) {
            const nextTok = tokens[i + 1];
            const isNextNT = nextTok.length === 1 && nextTok >= 'A' && nextTok <= 'Z';
            if (isNT && isNextNT) {
              hasAdjacentNTs = true;
              adjacentDetails = {
                line: lineIdx + 1,
                lhs: prod.lhs,
                rhs: alt,
                pair: `${tok} and ${nextTok}`,
              };
            }
          }
        }
      });
    });
  }

  const isOperatorGrammar =
    syntaxValid && !hasEpsilon && !hasAdjacentNTs && terminals.size > 0 && nonTerminals.size > 0;

  const totalRules = prods.reduce((acc, p) => acc + p.rhsList.length, 0);

  const invariants = [
    {
      passed: syntaxValid,
      title: '1. Production Syntax Integrity',
      message: syntaxValid
        ? 'LHS consists of single non-terminal variable.'
        : 'Invalid production syntax (LHS must be single uppercase variable A-Z).',
      tag: syntaxValid ? 'VALID' : 'INVALID',
    },
    {
      passed: terminals.size > 0 && nonTerminals.size > 0,
      title: '2. Symbol Classification',
      message: 'Deterministic terminal/variable separation.',
      tag: 'DISJOINT',
    },
    {
      passed: !hasEpsilon,
      title: '3. No ε-Productions (Epsilon Free)',
      message: hasEpsilon
        ? `Found ε-production at Line ${epsilonDetails?.line || 1} (${epsilonDetails?.lhs} → ε).`
        : 'No non-terminal derives the empty string null token.',
      tag: hasEpsilon ? 'FAILED' : 'ε-FREE',
    },
    {
      passed: !hasAdjacentNTs,
      title: '4. No Adjacent Non-Terminals',
      message: hasAdjacentNTs
        ? `Violated at Line ${adjacentDetails?.line || 1}: ${adjacentDetails?.lhs} → ${adjacentDetails?.rhs} (adjacent non-terminals ${adjacentDetails?.pair}).`
        : 'No two variables appear side-by-side in any RHS.',
      tag: hasAdjacentNTs ? 'FAILED' : 'ISOLATED',
    },
    {
      passed: terminals.size > 0,
      title: '5. Terminal Alphabet Non-Emptiness',
      message: 'Operators present for establishing precedence relations.',
      tag: terminals.size > 0 ? 'POPULATED' : 'EMPTY',
    },
  ];

  let errorReason: string | undefined;
  if (!syntaxValid) {
    errorReason = 'Invalid production syntax. Each line must be in form: A -> alpha | beta';
  } else if (hasAdjacentNTs && adjacentDetails) {
    errorReason = `Line ${adjacentDetails.line}: Production ${adjacentDetails.lhs} → ${adjacentDetails.rhs} contains adjacent non-terminals ${adjacentDetails.pair}. Operator grammars strictly forbid two non-terminals appearing consecutively in any production body.`;
  } else if (hasEpsilon && epsilonDetails) {
    errorReason = `Line ${epsilonDetails.line}: Production ${epsilonDetails.lhs} → ε contains an empty derivation. Operator grammars cannot permit null transitions.`;
  } else if (terminals.size === 0) {
    errorReason = 'No terminals found in grammar. Terminal operators are required to construct precedence relations.';
  }

  return {
    isValid: syntaxValid,
    isOperatorGrammar,
    syntaxValid,
    hasEpsilon,
    hasAdjacentNTs,
    adjacentDetails,
    epsilonDetails,
    nonTerminals: Array.from(nonTerminals),
    terminals: Array.from(terminals),
    startSymbol,
    rulesCount: totalRules,
    charsCount: text.length,
    productions: prods,
    invariants,
    errorReason,
  };
}

export function tokenizeRhs(rhs: string): string[] {
  // Supports tokens like id, num, bool, single chars like +, *, (, ), etc.
  const tokens: string[] = [];
  const words = rhs.trim().split(/\s+/).filter(Boolean);

  for (const word of words) {
    // If the word has common multichar tokens like 'id', 'bool'
    if (word === 'id' || word === 'bool' || word === 'num' || word === '==' || word === '&&' || word === '!=') {
      tokens.push(word);
    } else if (word.length === 1) {
      tokens.push(word);
    } else {
      // Split into characters, keeping 'id' together if matches
      let i = 0;
      while (i < word.length) {
        if (word.startsWith('id', i)) {
          tokens.push('id');
          i += 2;
        } else if (word.startsWith('==', i)) {
          tokens.push('==');
          i += 2;
        } else if (word.startsWith('&&', i)) {
          tokens.push('&&');
          i += 2;
        } else {
          tokens.push(word[i]);
          i += 1;
        }
      }
    }
  }

  return tokens;
}

export function computeLeadingTrailing(val: GrammarValidationResult): LeadingTrailingData {
  const leading: Record<string, Set<string>> = {};
  const trailing: Record<string, Set<string>> = {};
  const leadingSteps: LeadingTrailingStep[] = [];
  const trailingSteps: LeadingTrailingStep[] = [];

  val.nonTerminals.forEach((nt) => {
    leading[nt] = new Set<string>();
    trailing[nt] = new Set<string>();
  });

  let stepId = 1;

  // PASS 1: Direct terminal extraction for LEADING
  val.productions.forEach((prod) => {
    prod.rhsList.forEach((rhs) => {
      const tokens = tokenizeRhs(rhs);
      if (tokens.length === 0) return;

      const first = tokens[0];
      const isFirstNT = first.length === 1 && first >= 'A' && first <= 'Z';

      if (!isFirstNT) {
        // Direct terminal: A -> a ...
        if (!leading[prod.lhs].has(first)) {
          leading[prod.lhs].add(first);
          leadingSteps.push({
            id: stepId++,
            phase: 'leading',
            nt: prod.lhs,
            ruleTitle: 'Direct Terminal Extraction',
            production: `${prod.lhs} → ${rhs}`,
            terminalExtracted: first,
            ruleCode: `a ∈ Leading(${prod.lhs})`,
            deductionNotes: `From ${prod.lhs} → ${rhs}: The first symbol is terminal '${first}'. Thus '${first}' belongs to Leading(${prod.lhs}).`,
            currentSet: Array.from(leading[prod.lhs]),
            delta: `+ { ${first} }`,
          });
        }
      } else if (tokens.length > 1) {
        const second = tokens[1];
        const isSecondNT = second.length === 1 && second >= 'A' && second <= 'Z';
        if (!isSecondNT) {
          // A -> B a ...
          if (!leading[prod.lhs].has(second)) {
            leading[prod.lhs].add(second);
            leadingSteps.push({
              id: stepId++,
              phase: 'leading',
              nt: prod.lhs,
              ruleTitle: 'Preceded by Non-Terminal',
              production: `${prod.lhs} → ${rhs}`,
              terminalExtracted: second,
              ruleCode: `a ∈ Leading(${prod.lhs})`,
              deductionNotes: `From ${prod.lhs} → ${rhs}: Non-terminal ${first} is immediately followed by terminal '${second}'. Thus '${second}' belongs to Leading(${prod.lhs}).`,
              currentSet: Array.from(leading[prod.lhs]),
              delta: `+ { ${second} }`,
            });
          }
        }
      }
    });
  });

  // Iterative propagation for LEADING: A -> B ... => Leading(A) ⊇ Leading(B)
  let changed = true;
  let passNum = 2;
  while (changed) {
    changed = false;
    val.productions.forEach((prod) => {
      prod.rhsList.forEach((rhs) => {
        const tokens = tokenizeRhs(rhs);
        if (tokens.length === 0) return;
        const first = tokens[0];
        const isFirstNT = first.length === 1 && first >= 'A' && first <= 'Z';
        if (isFirstNT && first !== prod.lhs) {
          const bSet = leading[first] || new Set();
          bSet.forEach((term) => {
            if (!leading[prod.lhs].has(term)) {
              leading[prod.lhs].add(term);
              changed = true;
              leadingSteps.push({
                id: stepId++,
                phase: 'leading',
                nt: prod.lhs,
                ruleTitle: `Transitive Propagation (Pass ${passNum})`,
                production: `${prod.lhs} → ${rhs}`,
                inheritedFrom: first,
                terminalExtracted: term,
                ruleCode: `Leading(${prod.lhs}) ⊇ Leading(${first})`,
                deductionNotes: `From ${prod.lhs} → ${first} ...: Leading(${prod.lhs}) inherits terminal '${term}' from Leading(${first}).`,
                currentSet: Array.from(leading[prod.lhs]),
                delta: `+ { ${term} }`,
              });
            }
          });
        }
      });
    });
    passNum++;
    if (passNum > 6) break;
  }

  // PASS 1: Direct terminal extraction for TRAILING
  val.productions.forEach((prod) => {
    prod.rhsList.forEach((rhs) => {
      const tokens = tokenizeRhs(rhs);
      if (tokens.length === 0) return;

      const last = tokens[tokens.length - 1];
      const isLastNT = last.length === 1 && last >= 'A' && last <= 'Z';

      if (!isLastNT) {
        // Direct terminal at tail: A -> ... a
        if (!trailing[prod.lhs].has(last)) {
          trailing[prod.lhs].add(last);
          trailingSteps.push({
            id: stepId++,
            phase: 'trailing',
            nt: prod.lhs,
            ruleTitle: 'Direct Terminal Extraction',
            production: `${prod.lhs} → ${rhs}`,
            terminalExtracted: last,
            ruleCode: `a ∈ Trailing(${prod.lhs})`,
            deductionNotes: `From ${prod.lhs} → ${rhs}: The trailing symbol is terminal '${last}'. Thus '${last}' belongs to Trailing(${prod.lhs}).`,
            currentSet: Array.from(trailing[prod.lhs]),
            delta: `+ { ${last} }`,
          });
        }
      } else if (tokens.length > 1) {
        const secondLast = tokens[tokens.length - 2];
        const isSecondLastNT = secondLast.length === 1 && secondLast >= 'A' && secondLast <= 'Z';
        if (!isSecondLastNT) {
          // A -> ... a B
          if (!trailing[prod.lhs].has(secondLast)) {
            trailing[prod.lhs].add(secondLast);
            trailingSteps.push({
              id: stepId++,
              phase: 'trailing',
              nt: prod.lhs,
              ruleTitle: 'Preceded by Non-Terminal',
              production: `${prod.lhs} → ${rhs}`,
              terminalExtracted: secondLast,
              ruleCode: `a ∈ Trailing(${prod.lhs})`,
              deductionNotes: `From ${prod.lhs} → ${rhs}: Terminal '${secondLast}' immediately precedes trailing non-terminal ${last}. Thus '${secondLast}' belongs to Trailing(${prod.lhs}).`,
              currentSet: Array.from(trailing[prod.lhs]),
              delta: `+ { ${secondLast} }`,
            });
          }
        }
      }
    });
  });

  // Iterative propagation for TRAILING: A -> ... B => Trailing(A) ⊇ Trailing(B)
  changed = true;
  passNum = 2;
  while (changed) {
    changed = false;
    val.productions.forEach((prod) => {
      prod.rhsList.forEach((rhs) => {
        const tokens = tokenizeRhs(rhs);
        if (tokens.length === 0) return;
        const last = tokens[tokens.length - 1];
        const isLastNT = last.length === 1 && last >= 'A' && last <= 'Z';
        if (isLastNT && last !== prod.lhs) {
          const bSet = trailing[last] || new Set();
          bSet.forEach((term) => {
            if (!trailing[prod.lhs].has(term)) {
              trailing[prod.lhs].add(term);
              changed = true;
              trailingSteps.push({
                id: stepId++,
                phase: 'trailing',
                nt: prod.lhs,
                ruleTitle: `Transitive Propagation (Pass ${passNum})`,
                production: `${prod.lhs} → ${rhs}`,
                inheritedFrom: last,
                terminalExtracted: term,
                ruleCode: `Trailing(${prod.lhs}) ⊇ Trailing(${last})`,
                deductionNotes: `From ${prod.lhs} → ... ${last}: Trailing(${prod.lhs}) inherits terminal '${term}' from Trailing(${last}).`,
                currentSet: Array.from(trailing[prod.lhs]),
                delta: `+ { ${term} }`,
              });
            }
          });
        }
      });
    });
    passNum++;
    if (passNum > 6) break;
  }

  const leadingFinal: Record<string, string[]> = {};
  const trailingFinal: Record<string, string[]> = {};

  val.nonTerminals.forEach((nt) => {
    leadingFinal[nt] = Array.from(leading[nt] || []);
    trailingFinal[nt] = Array.from(trailing[nt] || []);
  });

  return {
    leading: leadingFinal,
    trailing: trailingFinal,
    leadingSteps,
    trailingSteps,
  };
}

export function computePrecedenceMatrix(
  val: GrammarValidationResult,
  sets: LeadingTrailingData
): PrecedenceMatrixData {
  // Delimiter terminal '$'
  const terminals = [...val.terminals];
  if (!terminals.includes('$')) {
    terminals.push('$');
  }

  const cells: Record<string, Record<string, PrecedenceCell>> = {};
  const relationTracker: Record<string, Record<string, Set<'⋖' | '⋗' | '≐'>>> = {};
  const derivationLog: DerivationTraceItem[] = [];

  terminals.forEach((r) => {
    cells[r] = {};
    relationTracker[r] = {};
    terminals.forEach((c) => {
      relationTracker[r][c] = new Set();
    });
  });

  let traceStep = 1;

  // RULE 1: Equal Precedence (a ≐ b)
  // For production A -> ... a b ... or A -> ... a B b ...
  val.productions.forEach((prod) => {
    prod.rhsList.forEach((rhs) => {
      const tokens = tokenizeRhs(rhs);
      for (let i = 0; i < tokens.length - 1; i++) {
        const tokA = tokens[i];
        const tokB = tokens[i + 1];
        const isA_NT = tokA.length === 1 && tokA >= 'A' && tokA <= 'Z';
        const isB_NT = tokB.length === 1 && tokB >= 'A' && tokB <= 'Z';

        if (!isA_NT && !isB_NT) {
          // a b adjacent terminals
          if (relationTracker[tokA]?.[tokB]) {
            relationTracker[tokA][tokB].add('≐');
            derivationLog.push({
              step: traceStep++,
              ruleName: 'Rule 1 (a ≐ b)',
              source: `${prod.lhs} → ${rhs}`,
              cellKey: `M[${tokA}, ${tokB}]`,
              row: tokA,
              col: tokB,
              symbol: '≐',
              reason: `From production ${prod.lhs} → ${rhs}: Terminals '${tokA}' and '${tokB}' appear adjacent.`,
              originProd: `${prod.lhs} → ${rhs}`,
            });
          }
        } else if (!isA_NT && isB_NT && i + 2 < tokens.length) {
          const tokC = tokens[i + 2];
          const isC_NT = tokC.length === 1 && tokC >= 'A' && tokC <= 'Z';
          if (!isC_NT) {
            // a B c (e.g. ( E ) )
            if (relationTracker[tokA]?.[tokC]) {
              relationTracker[tokA][tokC].add('≐');
              derivationLog.push({
                step: traceStep++,
                ruleName: 'Rule 1 (a ≐ c)',
                source: `${prod.lhs} → ${rhs}`,
                cellKey: `M[${tokA}, ${tokC}]`,
                row: tokA,
                col: tokC,
                symbol: '≐',
                reason: `From production ${prod.lhs} → ${rhs}: Terminals '${tokA}' and '${tokC}' frame single variable ${tokB}.`,
                originProd: `${prod.lhs} → ${rhs}`,
              });
            }
          }
        }
      }
    });
  });

  // RULE 2: Yields Precedence (a ⋖ b)
  // For production A -> ... a B ... and b in Leading(B)
  val.productions.forEach((prod) => {
    prod.rhsList.forEach((rhs) => {
      const tokens = tokenizeRhs(rhs);
      for (let i = 0; i < tokens.length - 1; i++) {
        const tokA = tokens[i];
        const tokB = tokens[i + 1];
        const isA_NT = tokA.length === 1 && tokA >= 'A' && tokA <= 'Z';
        const isB_NT = tokB.length === 1 && tokB >= 'A' && tokB <= 'Z';

        if (!isA_NT && isB_NT) {
          const leadingB = sets.leading[tokB] || [];
          leadingB.forEach((b) => {
            if (relationTracker[tokA]?.[b]) {
              relationTracker[tokA][b].add('⋖');
              derivationLog.push({
                step: traceStep++,
                ruleName: 'Rule 2 (a ⋖ Leading(B))',
                source: `${prod.lhs} → ${rhs}`,
                cellKey: `M[${tokA}, ${b}]`,
                row: tokA,
                col: b,
                symbol: '⋖',
                reason: `From production ${prod.lhs} → ${rhs}: Terminal '${tokA}' directly precedes non-terminal ${tokB}. Since '${b}' ∈ Leading(${tokB}), '${tokA}' ⋖ '${b}'.`,
                originProd: `${prod.lhs} → ${rhs}`,
                targetNT: tokB,
              });
            }
          });
        }
      }
    });
  });

  // RULE 3: Takes Precedence (a ⋗ b)
  // For production A -> ... B b ... and a in Trailing(B)
  val.productions.forEach((prod) => {
    prod.rhsList.forEach((rhs) => {
      const tokens = tokenizeRhs(rhs);
      for (let i = 0; i < tokens.length - 1; i++) {
        const tokB = tokens[i];
        const tokb = tokens[i + 1];
        const isB_NT = tokB.length === 1 && tokB >= 'A' && tokB <= 'Z';
        const isb_NT = tokb.length === 1 && tokb >= 'A' && tokb <= 'Z';

        if (isB_NT && !isb_NT) {
          const trailingB = sets.trailing[tokB] || [];
          trailingB.forEach((a) => {
            if (relationTracker[a]?.[tokb]) {
              relationTracker[a][tokb].add('⋗');
              derivationLog.push({
                step: traceStep++,
                ruleName: 'Rule 3 (Trailing(B) ⋗ b)',
                source: `${prod.lhs} → ${rhs}`,
                cellKey: `M[${a}, ${tokb}]`,
                row: a,
                col: tokb,
                symbol: '⋗',
                reason: `From production ${prod.lhs} → ${rhs}: Non-terminal ${tokB} directly precedes terminal '${tokb}'. Since '${a}' ∈ Trailing(${tokB}), '${a}' ⋗ '${tokb}'.`,
                originProd: `${prod.lhs} → ${rhs}`,
                targetNT: tokB,
              });
            }
          });
        }
      }
    });
  });

  // RULE 4: Endmarker Delimiter Rules ($)
  // $ ⋖ Leading(StartSymbol)
  const startNT = val.startSymbol;
  const leadingStart = sets.leading[startNT] || [];
  leadingStart.forEach((b) => {
    if (relationTracker['$']?.[b]) {
      relationTracker['$'][b].add('⋖');
      derivationLog.push({
        step: traceStep++,
        ruleName: 'Rule 4 ($ ⋖ Leading(S))',
        source: `$ ⋖ Leading(${startNT})`,
        cellKey: `M[$, ${b}]`,
        row: '$',
        col: b,
        symbol: '⋖',
        reason: `Sentinel start marker '$' yields precedence to all initial boundary terminals of start symbol ${startNT} ($ ⋖ ${b}).`,
      });
    }
  });

  // Trailing(StartSymbol) ⋗ $
  const trailingStart = sets.trailing[startNT] || [];
  trailingStart.forEach((a) => {
    if (relationTracker[a]?.['$']) {
      relationTracker[a]['$'].add('⋗');
      derivationLog.push({
        step: traceStep++,
        ruleName: 'Rule 4 (Trailing(S) ⋗ $)',
        source: `Trailing(${startNT}) ⋗ $`,
        cellKey: `M[${a}, $]`,
        row: a,
        col: '$',
        symbol: '⋗',
        reason: `All final trailing terminals of start symbol ${startNT} take precedence over sentinel end marker '$' (${a} ⋗ $).`,
      });
    }
  });

  // Build cell objects & find conflicts
  const conflicts: PrecedenceCell[] = [];
  let yieldsCount = 0;
  let takesCount = 0;
  let equalsCount = 0;
  let blanksCount = 0;
  let conflictCount = 0;

  terminals.forEach((r) => {
    terminals.forEach((c) => {
      const set = relationTracker[r][c];
      const relList = Array.from(set);

      let primary: 'yields' | 'takes' | 'equals' | 'conflict' | 'accept' | 'blank' = 'blank';
      let displaySymbol = '—';
      const isConflict = relList.length > 1;

      if (r === '$' && c === '$') {
        primary = 'accept';
        displaySymbol = 'ACCEPT';
      } else if (isConflict) {
        primary = 'conflict';
        displaySymbol = relList.join(' / ');
        conflictCount++;
      } else if (relList.includes('⋖')) {
        primary = 'yields';
        displaySymbol = '⋖';
        yieldsCount++;
      } else if (relList.includes('⋗')) {
        primary = 'takes';
        displaySymbol = '⋗';
        takesCount++;
      } else if (relList.includes('≐')) {
        primary = 'equals';
        displaySymbol = '≐';
        equalsCount++;
      } else {
        blanksCount++;
      }

      // Generate conflict explanation if conflict exists
      let conflictBadge: string | undefined;
      let derivation1: { rule: string; text: string; proof: string } | undefined;
      let derivation2: { rule: string; text: string; proof: string } | undefined;
      let resultSummary: string | undefined;

      if (isConflict) {
        if (r === c) {
          conflictBadge = 'Associativity Conflict';
        } else {
          conflictBadge = 'Precedence Conflict';
        }

        const cellLogs = derivationLog.filter((item) => item.row === r && item.col === c);
        const yieldLog = cellLogs.find((l) => l.symbol === '⋖');
        const takeLog = cellLogs.find((l) => l.symbol === '⋗');
        const eqLog = cellLogs.find((l) => l.symbol === '≐');

        derivation1 = yieldLog
          ? {
              rule: `${yieldLog.ruleName} (Yields ⋖)`,
              text: yieldLog.reason,
              proof: yieldLog.source,
            }
          : {
              rule: 'Derivation 1 (Yields ⋖)',
              text: `Yields relation for M[${r}, ${c}]`,
              proof: `${r} ⋖ ${c}`,
            };

        derivation2 = takeLog
          ? {
              rule: `${takeLog.ruleName} (Takes ⋗)`,
              text: takeLog.reason,
              proof: takeLog.source,
            }
          : eqLog
          ? {
              rule: `${eqLog.ruleName} (Equals ≐)`,
              text: eqLog.reason,
              proof: eqLog.source,
            }
          : {
              rule: 'Derivation 2 (Takes ⋗)',
              text: `Takes relation for M[${r}, ${c}]`,
              proof: `${r} ⋗ ${c}`,
            };

        resultSummary = `Resulting relation set is { ${relList.join(', ')} }. When encountering terminal '${r}' on top of stack and '${c}' in lookahead, the parser cannot decide whether to SHIFT or REDUCE.`;
      }

      const cellObj: PrecedenceCell = {
        row: r,
        col: c,
        relations: relList,
        primaryRelation: primary,
        displaySymbol,
        isConflict,
        conflictBadge,
        derivation1,
        derivation2,
        resultSummary,
      };

      cells[r][c] = cellObj;
      if (isConflict) {
        conflicts.push(cellObj);
      }
    });
  });

  const total = terminals.length * terminals.length;
  const density = total > 0 ? (total - blanksCount) / total : 0;

  return {
    terminals,
    cells,
    conflicts,
    isPrecedenceGrammar: conflicts.length === 0,
    derivationLog,
    stats: {
      total,
      yields: yieldsCount,
      takes: takesCount,
      equals: equalsCount,
      conflicts: conflictCount,
      blanks: blanksCount,
      density: Math.round(density * 100),
    },
  };
}

export function simulateShiftReduceParse(
  inputStr: string,
  matrixData: PrecedenceMatrixData,
  val: GrammarValidationResult
): ParseStep[] {
  // Tokenize input and append '$'
  const rawTokens = inputStr.trim().split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  rawTokens.forEach((w) => {
    if (w === 'id' || w === 'bool' || w === 'num') {
      tokens.push(w);
    } else if (w.length === 1) {
      tokens.push(w);
    } else {
      let i = 0;
      while (i < w.length) {
        if (w.startsWith('id', i)) {
          tokens.push('id');
          i += 2;
        } else if (w.startsWith('==', i)) {
          tokens.push('==');
          i += 2;
        } else if (w.startsWith('!=', i)) {
          tokens.push('!=');
          i += 2;
        } else if (w.startsWith('&&', i)) {
          tokens.push('&&');
          i += 2;
        } else if (w.startsWith('||', i)) {
          tokens.push('||');
          i += 2;
        } else {
          tokens.push(w[i]);
          i += 1;
        }
      }
    }
  });

  tokens.push('$');

  const stack: string[] = ['$'];
  let inputIdx = 0;
  const steps: ParseStep[] = [];
  let stepNum = 1;

  const maxSteps = 50;

  while (stepNum <= maxSteps) {
    const currentInput = tokens.slice(inputIdx);
    const lookahead = currentInput[0] || '$';

    // Find the topmost terminal in the stack
    let topTerm = '$';
    let topTermIdx = 0;
    for (let i = stack.length - 1; i >= 0; i--) {
      const s = stack[i];
      const isNT = s.length === 1 && s >= 'A' && s <= 'Z';
      if (!isNT) {
        topTerm = s;
        topTermIdx = i;
        break;
      }
    }

    // Check if accept: stack is ['$'] + non-terminals (or reduced to start symbol) and lookahead is '$'
    if (topTerm === '$' && lookahead === '$') {
      const nonTerminals = stack.filter((s) => s.length === 1 && s >= 'A' && s <= 'Z');
      const hasOnlyStartNT = stack.length >= 2 && nonTerminals.length === stack.length - 1;

      if (hasOnlyStartNT) {
        steps.push({
          step: stepNum,
          stack: [...stack],
          relation: '≐',
          relType: 'accept',
          topTerm: '$',
          lookahead: '$',
          input: [...currentInput],
          action: 'ACCEPT',
          actionBadge: 'ACCEPT (COMPLETE)',
          reason: `Start symbol ${val.startSymbol} matches and sentinel markers balance ($ ≐ $). Syntactic derivation complete and verified.`,
          handle: null,
        });
        break;
      }
    }

    const cell = matrixData.cells[topTerm]?.[lookahead];

    if (!cell || cell.primaryRelation === 'blank') {
      steps.push({
        step: stepNum++,
        stack: [...stack],
        relation: '∅',
        relType: 'error',
        topTerm,
        lookahead,
        input: [...currentInput],
        action: 'SYNTAX ERROR',
        actionBadge: 'BLANK (SYNTAX ERROR)',
        reason: `Precedence matrix M[${topTerm}, ${lookahead}] has no relation. Syntactic rejection.`,
        handle: null,
      });
      break;
    }

    if (cell.primaryRelation === 'conflict') {
      steps.push({
        step: stepNum++,
        stack: [...stack],
        relation: '⋖/⋗',
        relType: 'error',
        topTerm,
        lookahead,
        input: [...currentInput],
        action: 'SYNTAX ERROR',
        actionBadge: 'CONFLICT (AMBIGUOUS)',
        reason: `Precedence matrix M[${topTerm}, ${lookahead}] contains conflict { ${cell.relations.join(', ')} }. Non-deterministic shift/reduce blocked.`,
        handle: null,
      });
      break;
    }

    if (cell.primaryRelation === 'accept') {
      steps.push({
        step: stepNum,
        stack: [...stack],
        relation: '≐',
        relType: 'accept',
        topTerm: '$',
        lookahead: '$',
        input: [...currentInput],
        action: 'ACCEPT',
        actionBadge: 'ACCEPT (COMPLETE)',
        reason: `Endmarker sentinel reached. Successfully parsed input string.`,
        handle: null,
      });
      break;
    }

    if (cell.primaryRelation === 'yields' || cell.primaryRelation === 'equals') {
      // SHIFT
      const symbol = cell.primaryRelation === 'yields' ? '⋖' : '≐';
      steps.push({
        step: stepNum++,
        stack: [...stack],
        relation: symbol,
        relType: cell.primaryRelation === 'yields' ? 'shift' : 'equal',
        topTerm,
        lookahead,
        input: [...currentInput],
        action: 'SHIFT',
        actionBadge: 'SHIFT TO STACK',
        reason: `${topTerm} ${symbol} ${lookahead}: Stack top yields precedence to incoming token. Shift '${lookahead}' onto stack.`,
        handle: null,
      });

      stack.push(lookahead);
      inputIdx++;
    } else if (cell.primaryRelation === 'takes') {
      // REDUCE
      // Search down the stack to find the left boundary of the handle
      // In operator precedence, find leftmost terminal in stack such that belowTerm ⋖ currentTerm
      let leftmostTerminalIdx = topTermIdx;

      for (let i = topTermIdx; i >= 0; i--) {
        const item = stack[i];
        const isNT = item.length === 1 && item >= 'A' && item <= 'Z';
        if (!isNT) {
          // Check relation between the terminal below it and this terminal
          let belowTerm = '$';
          for (let j = i - 1; j >= 0; j--) {
            if (!(stack[j].length === 1 && stack[j] >= 'A' && stack[j] <= 'Z')) {
              belowTerm = stack[j];
              break;
            }
          }

          const relBelow = matrixData.cells[belowTerm]?.[item]?.primaryRelation;
          if (relBelow === 'yields' || belowTerm === '$') {
            leftmostTerminalIdx = i;
            break;
          }
        }
      }

      // In operator grammar, the handle can also include a non-terminal immediately preceding the leftmost terminal
      let handleStart = leftmostTerminalIdx;
      if (handleStart > 1) {
        const prevItem = stack[handleStart - 1];
        const isPrevNT = prevItem.length === 1 && prevItem >= 'A' && prevItem <= 'Z';
        if (isPrevNT) {
          handleStart = handleStart - 1;
        }
      }

      // Protect sentinel
      if (handleStart <= 0) {
        handleStart = 1;
      }

      // The handle slice from handleStart to end
      const handleSlice = stack.slice(handleStart);
      const handleStr = handleSlice.join(' ');

      const toPattern = (symbols: string[]) =>
        symbols
          .map((s) => {
            const isNT = (s.length === 1 && s >= 'A' && s <= 'Z') || val.nonTerminals.includes(s);
            return isNT ? 'N' : s;
          })
          .join(' ');

      const handlePattern = toPattern(handleSlice);

      // Match against actual productions in the grammar
      let matchedProd: { lhs: string; rhs: string } | null = null;

      for (const prod of val.productions) {
        for (const alt of prod.rhsList) {
          const altTokens = tokenizeRhs(alt);
          const altPattern = toPattern(altTokens);
          if (altPattern === handlePattern) {
            // Check if exact token-by-token match
            if (altTokens.length === handleSlice.length && altTokens.every((tok, idx) => tok === handleSlice[idx])) {
              matchedProd = { lhs: prod.lhs, rhs: alt };
              break;
            }
            if (!matchedProd) {
              matchedProd = { lhs: prod.lhs, rhs: alt };
            }
          }
        }
        if (
          matchedProd &&
          toPattern(tokenizeRhs(matchedProd.rhs)) === handlePattern &&
          tokenizeRhs(matchedProd.rhs).every((tok, idx) => tok === handleSlice[idx])
        ) {
          break;
        }
      }

      if (!matchedProd) {
        // No production matches this handle pattern: REJECT
        let errorDetail = `Handle [${handleStr}] (pattern: ${handlePattern}) matches no production.`;
        if (handleSlice[0] === '*' || handleSlice[0] === '+') {
          errorDetail += ` The '${handleSlice[0]}' operator has no left operand.`;
        } else if (handlePattern === '( )') {
          errorDetail += ` Empty parentheses don't match any production.`;
        }

        steps.push({
          step: stepNum++,
          stack: [...stack],
          relation: '⋗',
          relType: 'error',
          topTerm,
          lookahead,
          input: [...currentInput],
          action: 'SYNTAX ERROR',
          actionBadge: 'REJECT (NO PRODUCTION)',
          reason: errorDetail,
          handle: handleStr,
          productionApplied: undefined,
        });
        break;
      }

      steps.push({
        step: stepNum++,
        stack: [...stack],
        relation: '⋗',
        relType: 'reduce',
        topTerm,
        lookahead,
        input: [...currentInput],
        action: 'REDUCE',
        actionBadge: 'REDUCE HANDLE',
        reason: `Top terminal '${topTerm}' takes precedence over lookahead '${lookahead}' (${topTerm} ⋗ ${lookahead}). Reducing handle [${handleStr}] to ${matchedProd.lhs} via production ${matchedProd.lhs} → ${matchedProd.rhs}.`,
        handle: handleStr,
        productionApplied: `${matchedProd.lhs} → ${matchedProd.rhs}`,
      });

      // Pop handle from stack and push LHS
      stack.splice(handleStart);
      stack.push(matchedProd.lhs);
    } else {
      // Unrecognized or unhandled relation: terminate gracefully without hanging
      steps.push({
        step: stepNum++,
        stack: [...stack],
        relation: '∅',
        relType: 'error',
        topTerm,
        lookahead,
        input: [...currentInput],
        action: 'SYNTAX ERROR',
        actionBadge: 'ERROR',
        reason: `Unexpected state at stack top [${topTerm}] with lookahead [${lookahead}]. Parsing halted.`,
        handle: null,
      });
      break;
    }
  }

  return steps;
}

export function buildDerivationTree(steps: ParseStep[]): ParseTreeNode | null {
  const lastStep = steps[steps.length - 1];
  if (!lastStep || lastStep.action !== 'ACCEPT') {
    return null;
  }

  let nodeId = 1;
  const treeStack: ParseTreeNode[] = [];

  for (const st of steps) {
    if (st.action === 'SHIFT') {
      treeStack.push({
        id: `node-${nodeId++}`,
        label: st.lookahead,
        type: 'terminal',
        children: [],
      });
    } else if (st.action === 'REDUCE' && st.handle) {
      const handleTokens = st.handle.split(/\s+/).filter(Boolean);
      const childCount = handleTokens.length;

      const children: ParseTreeNode[] = [];
      for (let i = 0; i < childCount; i++) {
        const child = treeStack.pop();
        if (child) {
          children.unshift(child);
        }
      }

      const lhs = st.productionApplied ? st.productionApplied.split('→')[0].trim() : 'E';
      const parentNode: ParseTreeNode = {
        id: `node-${nodeId++}`,
        label: lhs,
        type: 'nt',
        children,
      };
      treeStack.push(parentNode);
    }
  }

  const validNodes = treeStack.filter((n) => n.label !== '$');
  return validNodes.length > 0 ? validNodes[validNodes.length - 1] : null;
}

