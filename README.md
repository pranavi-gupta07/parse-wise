# Parse-wise
Parse-Wise is an interactive compiler design visualizer built to make parsing concepts easier to understand through step-by-step execution and visual analysis. It currently offers two operations the user can choose between: **Operator Precedence Parsing** and **Regular Expression to DFA conversion**. The operator precedence module provides an intuitive way to explore how expressions are analyzed, how precedence relationships are established, and how parsing decisions are made during syntax analysis.

The application also provides conflict analysis to identify and understand ambiguities or conflicts that can arise during parsing. Its shift-reduce execution view allows users to follow the parsing process step by step, making it easier to observe stack operations, input processing, shifts, reductions, and the decisions made by the parser at each stage.

By combining parsing logic with an interactive visual interface, Parse-Wise aims to bridge the gap between the theoretical concepts taught in compiler design and their practical execution. Instead of treating parsing algorithms as purely abstract concepts, the project allows students to interact with the process and clearly observe how a parser works internally.

## RE to DFA

The RE to DFA module converts a regular expression directly into a deterministic finite automaton using the direct (followpos) method, without building an intermediate NFA. The user enters a regular expression, and Parse-Wise builds the automaton dynamically in four stages:

1. **Regular Expression** – the input is validated, converted to explicit-concatenation and postfix forms, and augmented with an end-marker as `(r)#`. Each symbol occurrence is numbered as a position.
2. **Syntax Tree** – the tree is built node by node from the postfix form, showing the input symbol being read and the build stack at every step. As each node is created, its `nullable`, `firstpos` and `lastpos` values are computed and explained.
3. **Followpos** – the followpos table is filled one update at a time from the cat-nodes and star-nodes of the tree, alongside a followpos graph where each arrow `i → j` means `j ∈ followpos(i)`.
4. **DFA** – DFA states are created as sets of positions starting from `firstpos(root)`. Each transition is computed and drawn as it is found, with the Dstates list and transition table (Dtran) updating live. Once the DFA is complete, any input string can be tested on it symbol by symbol, with the active state highlighted on the graph.

Every stage can be viewed **step by step** (with next/previous, auto-play and keyboard shortcuts) or with **show all** to see the complete result at once. Supported syntax includes union `|`, concatenation (implicit or `.`), `*`, `+`, `?`, parentheses and `ε`, with single-character input symbols.

The project is designed as an educational and visualization tool for students studying compiler design, particularly those learning operator precedence parsing, conflict detection, shift-reduce parsing techniques, and the construction of DFAs from regular expressions.

## Running locally

```
npm install
npm run dev
```

The app runs at `http://localhost:3000`.
