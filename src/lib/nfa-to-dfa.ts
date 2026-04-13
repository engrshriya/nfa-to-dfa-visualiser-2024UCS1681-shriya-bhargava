export interface NFA {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string[]>>;
  startState: string;
  acceptStates: string[];
}

export interface DFA {
  states: string[][];
  alphabet: string[];
  transitions: Record<string, Record<string, string>>;
  startState: string[];
  acceptStates: string[][];
  stateLabels: Record<string, string>;
}

export interface ConversionStep {
  type: 'epsilon_closure' | 'move' | 'new_state' | 'mark_accept' | 'complete';
  description: string;
  math: string;
  highlight?: string[];
  dfaTableSnapshot: { state: string[]; transitions: Record<string, string[]> }[];
}

function epsilonClosure(nfa: NFA, states: string[]): string[] {
  const stack = [...states];
  const closure = new Set(states);
  while (stack.length > 0) {
    const s = stack.pop()!;
    const eps = nfa.transitions[s]?.['ε'] || nfa.transitions[s]?.['epsilon'] || [];
    for (const t of eps) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
      }
    }
  }
  return Array.from(closure).sort();
}

function move(nfa: NFA, states: string[], symbol: string): string[] {
  const result = new Set<string>();
  for (const s of states) {
    const targets = nfa.transitions[s]?.[symbol] || [];
    for (const t of targets) {
      result.add(t);
    }
  }
  return Array.from(result).sort();
}

function stateSetKey(states: string[]): string {
  return `{${states.sort().join(',')}}`;
}

export function convertNFAtoDFA(nfa: NFA): { dfa: DFA; steps: ConversionStep[] } {
  const steps: ConversionStep[] = [];
  const alphabet = nfa.alphabet.filter(a => a !== 'ε' && a !== 'epsilon');

  // Step 1: ε-closure of start state
  const startClosure = epsilonClosure(nfa, [nfa.startState]);
  steps.push({
    type: 'epsilon_closure',
    description: `Compute ε-closure of start state {${nfa.startState}}`,
    math: `ε-closure({${nfa.startState}}) = ${stateSetKey(startClosure)}`,
    highlight: startClosure,
    dfaTableSnapshot: [],
  });

  const dfaStates: string[][] = [startClosure];
  const dfaTransitions: Record<string, Record<string, string[]>> = {};
  const unmarked: string[][] = [startClosure];
  const visited = new Set<string>();
  visited.add(stateSetKey(startClosure));

  while (unmarked.length > 0) {
    const current = unmarked.shift()!;
    const currentKey = stateSetKey(current);
    dfaTransitions[currentKey] = {};

    steps.push({
      type: 'new_state',
      description: `Processing DFA state ${currentKey}`,
      math: `Current state: ${currentKey}`,
      highlight: current,
      dfaTableSnapshot: buildSnapshot(dfaStates, dfaTransitions, alphabet),
    });

    for (const symbol of alphabet) {
      const moveResult = move(nfa, current, symbol);
      const closureResult = epsilonClosure(nfa, moveResult);

      const moveStr = moveResult.length > 0 ? stateSetKey(moveResult) : '∅';
      const closureStr = closureResult.length > 0 ? stateSetKey(closureResult) : '∅';

      steps.push({
        type: 'move',
        description: `From ${currentKey} on input '${symbol}': move then ε-closure`,
        math: `δ(${currentKey}, ${symbol}) = ε-closure(move(${currentKey}, ${symbol}))\n= ε-closure(${moveStr})\n= ${closureStr}`,
        highlight: closureResult,
        dfaTableSnapshot: buildSnapshot(dfaStates, dfaTransitions, alphabet),
      });

      if (closureResult.length === 0) {
        dfaTransitions[currentKey][symbol] = [];
        continue;
      }

      dfaTransitions[currentKey][symbol] = closureResult;
      const closureKey = stateSetKey(closureResult);

      if (!visited.has(closureKey)) {
        visited.add(closureKey);
        dfaStates.push(closureResult);
        unmarked.push(closureResult);
      }
    }
  }

  // Determine accept states
  const dfaAcceptStates = dfaStates.filter(stateSet =>
    stateSet.some(s => nfa.acceptStates.includes(s))
  );

  if (dfaAcceptStates.length > 0) {
    steps.push({
      type: 'mark_accept',
      description: 'Mark DFA accept states (any state containing an NFA accept state)',
      math: `NFA accept states: {${nfa.acceptStates.join(', ')}}\nDFA accept states: ${dfaAcceptStates.map(s => stateSetKey(s)).join(', ')}`,
      highlight: dfaAcceptStates.flat(),
      dfaTableSnapshot: buildSnapshot(dfaStates, dfaTransitions, alphabet),
    });
  }

  // Build labels
  const stateLabels: Record<string, string> = {};
  dfaStates.forEach((s, i) => {
    stateLabels[stateSetKey(s)] = `D${i}`;
  });

  steps.push({
    type: 'complete',
    description: 'Conversion complete! The DFA is ready.',
    math: `DFA States: ${dfaStates.map(s => `${stateLabels[stateSetKey(s)]} = ${stateSetKey(s)}`).join(', ')}`,
    dfaTableSnapshot: buildSnapshot(dfaStates, dfaTransitions, alphabet),
  });

  const dfaTransitionsFlat: Record<string, Record<string, string>> = {};
  for (const [key, trans] of Object.entries(dfaTransitions)) {
    dfaTransitionsFlat[key] = {};
    for (const [sym, target] of Object.entries(trans)) {
      dfaTransitionsFlat[key][sym] = stateSetKey(target);
    }
  }

  return {
    dfa: {
      states: dfaStates,
      alphabet,
      transitions: dfaTransitionsFlat,
      startState: startClosure,
      acceptStates: dfaAcceptStates,
      stateLabels,
    },
    steps,
  };
}

function buildSnapshot(
  states: string[][],
  transitions: Record<string, Record<string, string[]>>,
  alphabet: string[]
) {
  return states.map(s => ({
    state: s,
    transitions: Object.fromEntries(
      alphabet.map(sym => [sym, transitions[stateSetKey(s)]?.[sym] || []])
    ),
  }));
}

// Preset examples
export const PRESET_EXAMPLES: { name: string; nfa: NFA }[] = [
  {
    name: 'Simple: strings ending in "ab"',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: {
        q0: { a: ['q0', 'q1'], b: ['q0'] },
        q1: { b: ['q2'] },
        q2: {},
      },
      startState: 'q0',
      acceptStates: ['q2'],
    },
  },
  {
    name: 'With ε-transitions',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b', 'ε'],
      transitions: {
        q0: { 'ε': ['q1'] },
        q1: { a: ['q1'], b: ['q2'] },
        q2: { a: ['q2'] },
      },
      startState: 'q0',
      acceptStates: ['q2'],
    },
  },
  {
    name: 'Strings with "01" substring',
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      transitions: {
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
        q1: { '1': ['q2'] },
        q2: { '0': ['q2'], '1': ['q2'] },
      },
      startState: 'q0',
      acceptStates: ['q2'],
    },
  },
];
