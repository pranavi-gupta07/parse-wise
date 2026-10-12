// ─────────────────────────────────────────────────────────────────────────────
// RE → DFA  (Direct method, Aho–Lam–Sethi–Ullman §3.9)
//
//   1. Augment the regular expression:  (r)#
//   2. Build the syntax tree and number every leaf (position)
//   3. Compute nullable / firstpos / lastpos bottom-up (post-order)
//   4. Compute followpos from cat-nodes and star/plus-nodes
//   5. Build DFA states as sets of positions, starting at firstpos(root)
//
// Supported syntax
//   a b 0 1 _ …  single-character input symbols
//   |            union
//   *  +  ?      Kleene star, one-or-more, optional (postfix)
//   ( )          grouping
//   .            optional explicit concatenation (juxtaposition also works)
//   ε            empty string (also accepted: the word "eps")
//   #            reserved for the end-marker
// ─────────────────────────────────────────────────────────────────────────────

export type ReNodeType = 'leaf' | 'eps' | 'cat' | 'or' | 'star' | 'plus' | 'opt';

export interface ReNode {
  id: number; // post-order index (0-based)
  type: ReNodeType;
  symbol?: string; // for leaves (including '#')
  pos?: number; // leaf position number (1-based)
  left?: ReNode; // also the only child for unary nodes
  right?: ReNode;
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
  depth: number;
}

export interface ReParseResult {
  ok: boolean;
  error?: string;
  errorIndex?: number;
  input: string;
  cleaned: string; // regex without whitespace
  explicit: string; // explicit concatenation form with ·
  augmented: string; // (r)·#
  postfix: string;
  root?: ReNode; // augmented tree root
  nodes: ReNode[]; // post-order
  positions: { pos: number; symbol: string }[];
  alphabet: string[];
  endPos: number;
  checks: { passed: boolean; title: string; message: string; tag: string }[];
}

export interface TreeStep {
  index: number;
  nodeId: number;
  title: string;
  nullableRule: string;
  firstposRule: string;
  lastposRule: string;
}

export interface FollowposStep {
  index: number;
  nodeId: number;
  kind: 'cat' | 'star' | 'plus';
  title: string;
  rule: string;
  sources: number[]; // positions i whose followpos grows
  added: number[]; // the set that is added
  delta: Record<number, number[]>; // genuinely new entries per position
  snapshot: Record<number, number[]>; // followpos after this step
}

export interface DfaState {
  name: string;
  positions: number[];
  accepting: boolean;
}

export interface DfaStep {
  index: number;
  kind: 'start' | 'transition';
  from?: string;
  symbol?: string;
  contributing: number[]; // positions p in S with symbol(p) = a
  union: number[]; // U
  target?: string; // state name (undefined if U = ∅)
  isNew: boolean;
  explanation: string;
  statesSoFar: DfaState[];
  transitionsSoFar: Record<string, Record<string, string>>;
  markedSoFar: string[];
}

export interface DfaResult {
  states: DfaState[];
  alphabet: string[];
  start: string;
  accepting: string[];
  transitions: Record<string, Record<string, string>>;
  followpos: Record<number, number[]>;
  treeSteps: TreeStep[];
  followSteps: FollowposStep[];
  dfaSteps: DfaStep[];
  hasDeadTransitions: boolean;
}

export interface SimStep {
  index: number;
  state: string | null;
  consumed: string;
  remaining: string;
  symbol?: string;
  next?: string | null;
  note: string;
}

export interface RePreset {
  id: string;
  name: string;
  regex: string;
  description: string;
  sampleAccept?: string;
  sampleReject?: string;
}

export const RE_PRESETS: RePreset[] = [
  {
    id: 'abb',
    name: '(a|b)*abb',
    regex: '(a|b)*abb',
    description: 'Classic textbook example — strings over {a,b} ending in abb.',
    sampleAccept: 'aabb',
    sampleReject: 'abab',
  },
  {
    id: 'astar-bstar',
    name: 'a*b*',
    regex: 'a*b*',
    description: "Any a's followed by any b's (includes ε).",
    sampleAccept: 'aaabb',
    sampleReject: 'aba',
  },
  {
    id: 'second-last',
    name: '(a|b)*a(a|b)',
    regex: '(a|b)*a(a|b)',
    description: 'Second-to-last symbol is a.',
    sampleAccept: 'bbab',
    sampleReject: 'abb',
  },
  {
    id: 'bin-01',
    name: '(0|1)*01',
    regex: '(0|1)*01',
    description: 'Binary strings ending in 01.',
    sampleAccept: '1101',
    sampleReject: '0110',
  },
  {
    id: 'ab-plus',
    name: 'a(b|c)+d?',
    regex: 'a(b|c)+d?',
    description: 'Uses + and ? operators.',
    sampleAccept: 'abcbd',
    sampleReject: 'ad',
  },
  {
    id: 'aa-bb',
    name: '(aa|bb)*(ab|ba)',
    regex: '(aa|bb)*(ab|ba)',
    description: 'Larger example with more DFA states.',
    sampleAccept: 'aabbab',
    sampleReject: 'aab',
  },
];

// ─── Set helpers ─────────────────────────────────────────────────────────────
const uniqSorted = (xs: number[]) => Array.from(new Set(xs)).sort((a, b) => a - b);
const union = (a: number[], b: number[]) => uniqSorted([...a, ...b]);
export const fmtSet = (xs: number[]) => (xs.length ? `{${xs.join(',')}}` : '∅');
const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// ─── Tokenizer + recursive-descent parser ────────────────────────────────────
type Tok = { t: 'sym' | 'eps' | 'or' | 'star' | 'plus' | 'opt' | 'lp' | 'rp' | 'dot'; v: string; i: number };

class ReSyntaxError extends Error {
  constructor(message: string, public index: number) {
    super(message);
  }
}

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (src.startsWith('eps', i)) {
      toks.push({ t: 'eps', v: 'ε', i });
      i += 3;
      continue;
    }
    switch (c) {
      case '|':
        toks.push({ t: 'or', v: c, i });
        break;
      case '*':
        toks.push({ t: 'star', v: c, i });
        break;
      case '+':
        toks.push({ t: 'plus', v: c, i });
        break;
      case '?':
        toks.push({ t: 'opt', v: c, i });
        break;
      case '(':
        toks.push({ t: 'lp', v: c, i });
        break;
      case ')':
        toks.push({ t: 'rp', v: c, i });
        break;
      case '.':
      case '·':
        toks.push({ t: 'dot', v: c, i });
        break;
      case 'ε':
        toks.push({ t: 'eps', v: 'ε', i });
        break;
      case '#':
        throw new ReSyntaxError("'#' is reserved for the end-marker of the augmented expression.", i);
      default:
        toks.push({ t: 'sym', v: c, i });
    }
    i++;
  }
  return toks;
}

type RawNode = { type: ReNodeType; symbol?: string; left?: RawNode; right?: RawNode };

function parseTokens(toks: Tok[], srcLen: number): RawNode {
  let p = 0;
  const peek = () => toks[p];
  const at = () => (toks[p] ? toks[p].i : srcLen);

  const startsFactor = (t?: Tok) => !!t && (t.t === 'sym' || t.t === 'eps' || t.t === 'lp');

  function expr(): RawNode {
    let node = term();
    while (peek() && peek().t === 'or') {
      p++;
      if (!startsFactor(peek())) {
        throw new ReSyntaxError("Missing operand after '|'.", at());
      }
      node = { type: 'or', left: node, right: term() };
    }
    return node;
  }

  function term(): RawNode {
    if (!startsFactor(peek())) {
      const t = peek();
      if (!t) throw new ReSyntaxError('Unexpected end of expression.', at());
      if (t.t === 'rp') throw new ReSyntaxError("Empty group or unmatched ')'.", t.i);
      if (t.t === 'or') throw new ReSyntaxError("Missing operand before '|'.", t.i);
      throw new ReSyntaxError(`Operator '${t.v}' has no operand.`, t.i);
    }
    let node = factor();
    while (true) {
      const t = peek();
      if (t && t.t === 'dot') {
        p++;
        if (!startsFactor(peek())) throw new ReSyntaxError("Missing operand after '.'.", at());
        node = { type: 'cat', left: node, right: factor() };
        continue;
      }
      if (startsFactor(t)) {
        node = { type: 'cat', left: node, right: factor() };
        continue;
      }
      break;
    }
    return node;
  }

  function factor(): RawNode {
    let node = base();
    while (peek() && (peek().t === 'star' || peek().t === 'plus' || peek().t === 'opt')) {
      const t = toks[p++];
      node = { type: t.t as 'star' | 'plus' | 'opt', left: node };
    }
    return node;
  }

  function base(): RawNode {
    const t = peek();
    if (!t) throw new ReSyntaxError('Unexpected end of expression.', at());
    if (t.t === 'sym') {
      p++;
      return { type: 'leaf', symbol: t.v };
    }
    if (t.t === 'eps') {
      p++;
      return { type: 'eps' };
    }
    if (t.t === 'lp') {
      p++;
      if (peek() && peek().t === 'rp') throw new ReSyntaxError("Empty parentheses '()'.", peek().i);
      const inner = expr();
      if (!peek() || peek().t !== 'rp') throw new ReSyntaxError("Missing closing ')'.", at());
      p++;
      return inner;
    }
    throw new ReSyntaxError(`Unexpected '${t.v}'.`, t.i);
  }

  if (toks.length === 0) throw new ReSyntaxError('Enter a regular expression.', 0);
  const tree = expr();
  if (p < toks.length) {
    const t = toks[p];
    if (t.t === 'rp') throw new ReSyntaxError("Unmatched ')'.", t.i);
    throw new ReSyntaxError(`Unexpected '${t.v}'.`, t.i);
  }
  return tree;
}

// ─── Pretty printers ─────────────────────────────────────────────────────────
const PREC: Record<ReNodeType, number> = { or: 1, cat: 2, star: 3, plus: 3, opt: 3, leaf: 4, eps: 4 };

function toInfix(n: RawNode, sep: string): string {
  switch (n.type) {
    case 'leaf':
      return n.symbol!;
    case 'eps':
      return 'ε';
    case 'or':
      return `${toInfix(n.left!, sep)}|${toInfix(n.right!, sep)}`;
    case 'cat': {
      const l = PREC[n.left!.type] < 2 ? `(${toInfix(n.left!, sep)})` : toInfix(n.left!, sep);
      const r = PREC[n.right!.type] < 2 ? `(${toInfix(n.right!, sep)})` : toInfix(n.right!, sep);
      return `${l}${sep}${r}`;
    }
    default: {
      const op = n.type === 'star' ? '*' : n.type === 'plus' ? '+' : '?';
      const c = PREC[n.left!.type] < 3 ? `(${toInfix(n.left!, sep)})` : toInfix(n.left!, sep);
      return `${c}${op}`;
    }
  }
}

function toPostfix(n: RawNode): string {
  switch (n.type) {
    case 'leaf':
      return n.symbol!;
    case 'eps':
      return 'ε';
    case 'or':
      return `${toPostfix(n.left!)}${toPostfix(n.right!)}|`;
    case 'cat':
      return `${toPostfix(n.left!)}${toPostfix(n.right!)}·`;
    case 'star':
      return `${toPostfix(n.left!)}*`;
    case 'plus':
      return `${toPostfix(n.left!)}+`;
    case 'opt':
      return `${toPostfix(n.left!)}?`;
  }
}

// ─── Public: parse + annotate ────────────────────────────────────────────────
export function parseRegex(input: string): ReParseResult {
  const cleaned = input.replace(/\s+/g, '');
  const base: ReParseResult = {
    ok: false,
    input,
    cleaned,
    explicit: '',
    augmented: '',
    postfix: '',
    nodes: [],
    positions: [],
    alphabet: [],
    endPos: 0,
    checks: [],
  };

  // Lightweight independent checks for the checklist UI
  let depth = 0;
  let balanced = true;
  for (const c of cleaned) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (depth < 0) balanced = false;
  }
  if (depth !== 0) balanced = false;
  const symbols = Array.from(new Set(cleaned.replace(/eps/g, '').split('').filter((c) => !'|*+?().·ε#'.includes(c))));

  let raw: RawNode;
  try {
    raw = parseTokens(tokenize(input), input.length);
  } catch (e) {
    const err = e as ReSyntaxError;
    base.error = err.message;
    base.errorIndex = err.index;
    base.checks = [
      { passed: cleaned.length > 0, title: 'Non-empty expression', message: cleaned.length ? `${cleaned.length} characters read.` : 'Type a regular expression to begin.', tag: 'INPUT' },
      { passed: balanced, title: 'Balanced parentheses', message: balanced ? 'Every ( has a matching ).' : 'Parentheses are not balanced.', tag: 'GROUPING' },
      { passed: false, title: 'Well-formed operators', message: err.message, tag: 'SYNTAX' },
      { passed: symbols.length > 0, title: 'Input alphabet Σ', message: symbols.length ? `Σ = {${symbols.sort().join(', ')}}` : 'No input symbols found.', tag: 'ALPHABET' },
    ];
    return base;
  }

  // Augment: (r)#
  const augmentedRaw: RawNode = { type: 'cat', left: raw, right: { type: 'leaf', symbol: '#' } };

  // Number leaves left-to-right and build annotated nodes in post-order
  let posCounter = 0;
  let idCounter = 0;
  const nodes: ReNode[] = [];
  const positions: { pos: number; symbol: string }[] = [];

  function build(r: RawNode, d: number): ReNode {
    const left = r.left ? build(r.left, d + 1) : undefined;
    const right = r.right ? build(r.right, d + 1) : undefined;
    const n: ReNode = {
      id: 0,
      type: r.type,
      symbol: r.symbol,
      left,
      right,
      nullable: false,
      firstpos: [],
      lastpos: [],
      depth: d,
    };
    if (r.type === 'leaf') {
      n.pos = ++posCounter;
      positions.push({ pos: n.pos, symbol: r.symbol! });
    }
    switch (r.type) {
      case 'leaf':
        n.nullable = false;
        n.firstpos = [n.pos!];
        n.lastpos = [n.pos!];
        break;
      case 'eps':
        n.nullable = true;
        break;
      case 'or':
        n.nullable = left!.nullable || right!.nullable;
        n.firstpos = union(left!.firstpos, right!.firstpos);
        n.lastpos = union(left!.lastpos, right!.lastpos);
        break;
      case 'cat':
        n.nullable = left!.nullable && right!.nullable;
        n.firstpos = left!.nullable ? union(left!.firstpos, right!.firstpos) : [...left!.firstpos];
        n.lastpos = right!.nullable ? union(left!.lastpos, right!.lastpos) : [...right!.lastpos];
        break;
      case 'star':
      case 'opt':
        n.nullable = true;
        n.firstpos = [...left!.firstpos];
        n.lastpos = [...left!.lastpos];
        break;
      case 'plus':
        n.nullable = left!.nullable;
        n.firstpos = [...left!.firstpos];
        n.lastpos = [...left!.lastpos];
        break;
    }
    n.id = idCounter++;
    nodes.push(n);
    return n;
  }

  const root = build(augmentedRaw, 0);
  const alphabet = Array.from(new Set(positions.filter((p) => p.symbol !== '#').map((p) => p.symbol))).sort();
  const explicit = toInfix(raw, '·');

  return {
    ok: true,
    input,
    cleaned,
    explicit,
    augmented: `(${explicit})·#`,
    postfix: `${toPostfix(raw)}#·`,
    root,
    nodes,
    positions,
    alphabet,
    endPos: posCounter,
    checks: [
      { passed: true, title: 'Non-empty expression', message: `${cleaned.length} characters read.`, tag: 'INPUT' },
      { passed: true, title: 'Balanced parentheses', message: 'Every ( has a matching ).', tag: 'GROUPING' },
      { passed: true, title: 'Well-formed operators', message: 'Every |, *, +, ? has the operands it needs.', tag: 'SYNTAX' },
      {
        passed: alphabet.length > 0,
        title: 'Input alphabet Σ',
        message: alphabet.length ? `Σ = {${alphabet.join(', ')}}` : 'Expression only matches ε — the DFA will have no transitions.',
        tag: 'ALPHABET',
      },
    ],
  };
}

export const nodeLabel = (n: ReNode) => {
  switch (n.type) {
    case 'leaf':
      return n.symbol!;
    case 'eps':
      return 'ε';
    case 'cat':
      return '·';
    case 'or':
      return '|';
    case 'star':
      return '*';
    case 'plus':
      return '+';
    case 'opt':
      return '?';
  }
};

const nodeKindName: Record<ReNodeType, string> = {
  leaf: 'Leaf',
  eps: 'ε-leaf',
  cat: 'Cat-node (·)',
  or: 'Or-node (|)',
  star: 'Star-node (*)',
  plus: 'Plus-node (+)',
  opt: 'Optional-node (?)',
};

export const describeNode = (n: ReNode) =>
  n.type === 'leaf' ? `Leaf '${n.symbol}' @ position ${n.pos}` : `${nodeKindName[n.type]} #${n.id + 1}`;

// ─── Public: build everything ────────────────────────────────────────────────
export function buildDfa(parse: ReParseResult): DfaResult | null {
  if (!parse.ok || !parse.root) return null;
  const { nodes, positions, alphabet, endPos, root } = parse;
  const symOf: Record<number, string> = {};
  positions.forEach((p) => (symOf[p.pos] = p.symbol));
  const B = (b: boolean) => (b ? 'true' : 'false');

  // 1. Tree annotation steps (post-order)
  const treeSteps: TreeStep[] = nodes.map((n, index) => {
    const c1 = n.left;
    const c2 = n.right;
    let nullableRule = '';
    let firstposRule = '';
    let lastposRule = '';
    switch (n.type) {
      case 'leaf':
        nullableRule = 'A leaf with a symbol never derives ε → false';
        firstposRule = `firstpos = {${n.pos}} (its own position)`;
        lastposRule = `lastpos = {${n.pos}} (its own position)`;
        break;
      case 'eps':
        nullableRule = 'ε-leaf → true';
        firstposRule = 'firstpos = ∅';
        lastposRule = 'lastpos = ∅';
        break;
      case 'or':
        nullableRule = `nullable(c1) ∨ nullable(c2) = ${B(c1!.nullable)} ∨ ${B(c2!.nullable)} = ${B(n.nullable)}`;
        firstposRule = `firstpos(c1) ∪ firstpos(c2) = ${fmtSet(c1!.firstpos)} ∪ ${fmtSet(c2!.firstpos)} = ${fmtSet(n.firstpos)}`;
        lastposRule = `lastpos(c1) ∪ lastpos(c2) = ${fmtSet(c1!.lastpos)} ∪ ${fmtSet(c2!.lastpos)} = ${fmtSet(n.lastpos)}`;
        break;
      case 'cat':
        nullableRule = `nullable(c1) ∧ nullable(c2) = ${B(c1!.nullable)} ∧ ${B(c2!.nullable)} = ${B(n.nullable)}`;
        firstposRule = c1!.nullable
          ? `c1 is nullable → firstpos(c1) ∪ firstpos(c2) = ${fmtSet(c1!.firstpos)} ∪ ${fmtSet(c2!.firstpos)} = ${fmtSet(n.firstpos)}`
          : `c1 not nullable → firstpos(c1) = ${fmtSet(n.firstpos)}`;
        lastposRule = c2!.nullable
          ? `c2 is nullable → lastpos(c1) ∪ lastpos(c2) = ${fmtSet(c1!.lastpos)} ∪ ${fmtSet(c2!.lastpos)} = ${fmtSet(n.lastpos)}`
          : `c2 not nullable → lastpos(c2) = ${fmtSet(n.lastpos)}`;
        break;
      case 'star':
        nullableRule = 'c1* always matches ε → true';
        firstposRule = `firstpos(c1) = ${fmtSet(n.firstpos)}`;
        lastposRule = `lastpos(c1) = ${fmtSet(n.lastpos)}`;
        break;
      case 'opt':
        nullableRule = 'c1? always matches ε → true';
        firstposRule = `firstpos(c1) = ${fmtSet(n.firstpos)}`;
        lastposRule = `lastpos(c1) = ${fmtSet(n.lastpos)}`;
        break;
      case 'plus':
        nullableRule = `nullable(c1) = ${B(n.nullable)}`;
        firstposRule = `firstpos(c1) = ${fmtSet(n.firstpos)}`;
        lastposRule = `lastpos(c1) = ${fmtSet(n.lastpos)}`;
        break;
    }
    return { index, nodeId: n.id, title: describeNode(n), nullableRule, firstposRule, lastposRule };
  });

  // 2. followpos
  const followpos: Record<number, number[]> = {};
  positions.forEach((p) => (followpos[p.pos] = []));
  const followSteps: FollowposStep[] = [];
  nodes.forEach((n) => {
    if (n.type !== 'cat' && n.type !== 'star' && n.type !== 'plus') return;
    const sources = n.type === 'cat' ? n.left!.lastpos : n.lastpos;
    const added = n.type === 'cat' ? n.right!.firstpos : n.firstpos;
    const delta: Record<number, number[]> = {};
    sources.forEach((i) => {
      const before = followpos[i];
      const after = union(before, added);
      const fresh = after.filter((x) => !before.includes(x));
      if (fresh.length) delta[i] = fresh;
      followpos[i] = after;
    });
    const snapshot: Record<number, number[]> = {};
    Object.keys(followpos).forEach((k) => (snapshot[+k] = [...followpos[+k]]));
    const rule =
      n.type === 'cat'
        ? `For every i in lastpos(c1) = ${fmtSet(sources)}, add firstpos(c2) = ${fmtSet(added)} to followpos(i)`
        : `For every i in lastpos(n) = ${fmtSet(sources)}, add firstpos(n) = ${fmtSet(added)} to followpos(i)`;
    followSteps.push({
      index: followSteps.length,
      nodeId: n.id,
      kind: n.type,
      title: describeNode(n),
      rule,
      sources,
      added,
      delta,
      snapshot,
    });
  });

  // 3. DFA construction
  const names = (i: number) => {
    // A … Z, then A1 … Z1, …
    const letter = String.fromCharCode(65 + (i % 26));
    const round = Math.floor(i / 26);
    return round === 0 ? letter : `${letter}${round}`;
  };
  const states: DfaState[] = [];
  const transitions: Record<string, Record<string, string>> = {};
  const marked: string[] = [];
  const dfaSteps: DfaStep[] = [];
  const snap = () => ({
    statesSoFar: states.map((s) => ({ ...s, positions: [...s.positions] })),
    transitionsSoFar: JSON.parse(JSON.stringify(transitions)) as Record<string, Record<string, string>>,
    markedSoFar: [...marked],
  });

  const startPositions = root!.firstpos;
  const start: DfaState = { name: names(0), positions: startPositions, accepting: startPositions.includes(endPos) };
  states.push(start);
  transitions[start.name] = {};
  dfaSteps.push({
    index: 0,
    kind: 'start',
    contributing: [],
    union: startPositions,
    target: start.name,
    isNew: true,
    explanation: `Start state ${start.name} = firstpos(root) = ${fmtSet(startPositions)}${start.accepting ? ` — contains # (position ${endPos}), so ${start.name} is accepting` : ''}.`,
    ...snap(),
  });

  let hasDead = false;
  let k = 0;
  while (k < states.length) {
    const S = states[k];
    marked.push(S.name);
    for (const a of alphabet) {
      const contributing = S.positions.filter((p) => symOf[p] === a);
      let U: number[] = [];
      contributing.forEach((p) => (U = union(U, followpos[p])));
      let target: DfaState | undefined;
      let isNew = false;
      let explanation: string;
      if (U.length === 0) {
        hasDead = true;
        explanation = contributing.length
          ? `In ${S.name} = ${fmtSet(S.positions)}, positions ${fmtSet(contributing)} carry '${a}' but their followpos is empty → no transition (dead).`
          : `In ${S.name} = ${fmtSet(S.positions)}, no position carries '${a}' → Dtran[${S.name}, ${a}] = ∅ (no transition).`;
      } else {
        target = states.find((s) => sameSet(s.positions, U));
        const parts = contributing.map((p) => `followpos(${p})`).join(' ∪ ');
        if (!target) {
          isNew = true;
          target = { name: names(states.length), positions: U, accepting: U.includes(endPos) };
          states.push(target);
          transitions[target.name] = {};
          explanation = `In ${S.name}, '${a}' occurs at ${fmtSet(contributing)}. U = ${parts} = ${fmtSet(U)} is new → create state ${target.name}${target.accepting ? ' (accepting: contains #)' : ''}.`;
        } else {
          explanation = `In ${S.name}, '${a}' occurs at ${fmtSet(contributing)}. U = ${parts} = ${fmtSet(U)} = existing state ${target.name}.`;
        }
        transitions[S.name][a] = target.name;
      }
      dfaSteps.push({
        index: dfaSteps.length,
        kind: 'transition',
        from: S.name,
        symbol: a,
        contributing,
        union: U,
        target: target?.name,
        isNew,
        explanation,
        ...snap(),
      });
    }
    k++;
  }

  return {
    states,
    alphabet,
    start: start.name,
    accepting: states.filter((s) => s.accepting).map((s) => s.name),
    transitions,
    followpos,
    treeSteps,
    followSteps,
    dfaSteps,
    hasDeadTransitions: hasDead,
  };
}

// ─── Public: run a string through the DFA ────────────────────────────────────
export function simulateDfa(dfa: DfaResult, input: string): { steps: SimStep[]; accepted: boolean } {
  const chars = input.replace(/\s+/g, '').split('').filter(Boolean);
  const steps: SimStep[] = [];
  let cur: string | null = dfa.start;
  steps.push({
    index: 0,
    state: cur,
    consumed: '',
    remaining: chars.join(''),
    note: `Begin in start state ${cur}.`,
  });
  for (let i = 0; i < chars.length; i++) {
    const a = chars[i];
    const next: string | null = cur && dfa.transitions[cur]?.[a] ? dfa.transitions[cur][a] : null;
    const note = !dfa.alphabet.includes(a)
      ? `'${a}' is not in Σ = {${dfa.alphabet.join(', ')}} → reject.`
      : next
      ? `δ(${cur}, ${a}) = ${next}`
      : `δ(${cur}, ${a}) is undefined (dead state) → reject.`;
    steps.push({
      index: i + 1,
      state: next,
      symbol: a,
      next,
      consumed: chars.slice(0, i + 1).join(''),
      remaining: chars.slice(i + 1).join(''),
      note,
    });
    cur = next;
    if (!cur) break;
  }
  const accepted = !!cur && steps.length === chars.length + 1 && dfa.accepting.includes(cur);
  return { steps, accepted };
}
