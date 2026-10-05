export type StepId = 'grammar' | 'sets' | 'table' | 'trace';

export interface Production {
  lhs: string;
  rhsList: string[];
}

export interface InvariantStatus {
  passed: boolean;
  title: string;
  message: string;
  tag: string;
}

export interface GrammarValidationResult {
  isValid: boolean;
  isOperatorGrammar: boolean;
  syntaxValid: boolean;
  hasEpsilon: boolean;
  hasAdjacentNTs: boolean;
  adjacentDetails?: { line: number; lhs: string; rhs: string; pair: string };
  epsilonDetails?: { line: number; lhs: string };
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  rulesCount: number;
  charsCount: number;
  productions: Production[];
  invariants: InvariantStatus[];
  errorReason?: string;
}

export interface LeadingTrailingStep {
  id: number;
  phase: 'leading' | 'trailing';
  nt: string;
  ruleTitle: string;
  production: string;
  terminalExtracted?: string;
  inheritedFrom?: string;
  ruleCode: string;
  deductionNotes: string;
  currentSet: string[];
  delta?: string;
  isHighlighted?: boolean;
}

export interface LeadingTrailingData {
  leading: Record<string, string[]>;
  trailing: Record<string, string[]>;
  leadingSteps: LeadingTrailingStep[];
  trailingSteps: LeadingTrailingStep[];
}

export type RelationType = 'yields' | 'takes' | 'equals' | 'conflict' | 'accept' | 'blank';

export interface PrecedenceCell {
  row: string; // stack terminal
  col: string; // lookahead terminal
  relations: ('⋖' | '⋗' | '≐')[];
  primaryRelation: RelationType;
  displaySymbol: string;
  isConflict: boolean;
  conflictType?: 'associativity' | 'precedence' | 'general';
  conflictBadge?: string;
  derivation1?: {
    rule: string;
    text: string;
    proof: string;
  };
  derivation2?: {
    rule: string;
    text: string;
    proof: string;
  };
  resultSummary?: string;
}

export interface DerivationTraceItem {
  step: number;
  ruleName: string;
  source: string;
  cellKey: string;
  row: string;
  col: string;
  symbol: string;
  reason: string;
  originProd?: string;
  targetNT?: string;
}

export interface PrecedenceMatrixData {
  terminals: string[]; // e.g. ['+', '*', '(', ')', 'id', '$']
  cells: Record<string, Record<string, PrecedenceCell>>;
  conflicts: PrecedenceCell[];
  isPrecedenceGrammar: boolean;
  derivationLog: DerivationTraceItem[];
  stats: {
    total: number;
    yields: number;
    takes: number;
    equals: number;
    conflicts: number;
    blanks: number;
    density: number;
  };
}

export interface ParseStep {
  step: number;
  stack: string[];
  relation: string;
  relType: 'shift' | 'reduce' | 'equal' | 'accept' | 'error';
  topTerm: string;
  lookahead: string;
  input: string[];
  action: 'SHIFT' | 'REDUCE' | 'ACCEPT' | 'SYNTAX ERROR';
  actionBadge: string;
  reason: string;
  handle: string | null;
  productionApplied?: string;
}

export interface ParseTreeEdge {
  from: string;
  to: string;
}

export interface ParseTreeNode {
  id: string;
  label: string;
  type: 'nt' | 'terminal';
  children?: ParseTreeNode[];
}

export interface GrammarPreset {
  id: string;
  name: string;
  grammar: string;
  description: string;
  defaultInput?: string;
  category: 'valid' | 'conflict' | 'invalid';
}
