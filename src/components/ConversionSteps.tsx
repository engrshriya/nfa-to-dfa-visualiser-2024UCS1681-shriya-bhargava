import { useState } from 'react';
import { ConversionStep, NFA, DFA } from '@/lib/nfa-to-dfa';
import { Button } from '@/components/ui/button';
import TransitionTable from './TransitionTable';
import GraphVisualization from './GraphVisualization';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface ConversionStepsProps {
  nfa: NFA;
  dfa: DFA;
  steps: ConversionStep[];
  onReset: () => void;
}

function stateSetKey(states: string[]): string {
  return `{${states.sort().join(',')}}`;
}

const ConversionSteps = ({ nfa, dfa, steps, onReset }: ConversionStepsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Build NFA graph data
  const nfaNodes = nfa.states.map(s => ({
    id: s,
    label: s,
    isStart: s === nfa.startState,
    isAccept: nfa.acceptStates.includes(s),
  }));
  const nfaEdges = Object.entries(nfa.transitions).flatMap(([from, symbols]) =>
    Object.entries(symbols).flatMap(([symbol, targets]) =>
      targets.map(to => ({ from, to, label: symbol }))
    )
  );

  // Build NFA transition table data
  const nfaAlphabet = nfa.alphabet.filter(a => a !== 'ε' && a !== 'epsilon');
  const hasEpsilon = nfa.alphabet.includes('ε') || nfa.alphabet.includes('epsilon');
  const nfaTableAlphabet = hasEpsilon ? [...nfaAlphabet, 'ε'] : nfaAlphabet;

  // Build DFA graph when complete
  const dfaNodes = dfa.states.map(s => ({
    id: stateSetKey(s),
    label: dfa.stateLabels[stateSetKey(s)] || stateSetKey(s),
    isStart: stateSetKey(s) === stateSetKey(dfa.startState),
    isAccept: dfa.acceptStates.some(a => stateSetKey(a) === stateSetKey(s)),
  }));
  const dfaEdges = Object.entries(dfa.transitions).flatMap(([from, symbols]) =>
    Object.entries(symbols)
      .filter(([, to]) => to !== '{}'  && to !== '{}')
      .map(([symbol, to]) => ({ from, to, label: symbol }))
  );

  // DFA table
  const dfaTableStates = dfa.states.map(s => stateSetKey(s));

  return (
    <div className="space-y-6">
      {/* Step navigation */}
      <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
        <div className="flex gap-2">
          {!isLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(steps.length - 1)}
            >
              <SkipForward className="w-4 h-4 mr-1" /> Skip to End
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (isLast) onReset();
              else setCurrentStep(currentStep + 1);
            }}
          >
            {isLast ? 'Start Over' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Current step explanation */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
            step.type === 'complete'
              ? 'bg-step-complete/10 text-step-complete'
              : 'bg-primary/10 text-primary'
          }`}>
            {step.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <p className="text-foreground font-medium mb-3">{step.description}</p>
        <div className="math-block whitespace-pre-wrap">{step.math}</div>
      </div>

      {/* Graphs side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GraphVisualization
          title="NFA (Original)"
          nodes={nfaNodes}
          edges={nfaEdges}
          highlightNodes={step.highlight || []}
        />
        {isLast ? (
          <GraphVisualization
            title="DFA (Result)"
            nodes={dfaNodes}
            edges={dfaEdges}
          />
        ) : (
          <div className="bg-card rounded-lg border border-border border-dashed flex items-center justify-center p-8">
            <p className="text-muted-foreground text-sm text-center">
              DFA graph will appear when conversion is complete.<br />
              Keep stepping through!
            </p>
          </div>
        )}
      </div>

      {/* Transition tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransitionTable
          title="NFA Transition Table"
          states={nfa.states}
          alphabet={nfaTableAlphabet}
          transitions={nfa.transitions}
          startState={nfa.startState}
          acceptStates={nfa.acceptStates}
          highlightStates={step.highlight || []}
        />
        {step.dfaTableSnapshot.length > 0 ? (
          <TransitionTable
            title="DFA Transition Table (building...)"
            states={step.dfaTableSnapshot.map(s => stateSetKey(s.state))}
            alphabet={dfa.alphabet}
            transitions={Object.fromEntries(
              step.dfaTableSnapshot.map(s => [
                stateSetKey(s.state),
                Object.fromEntries(
                  Object.entries(s.transitions).map(([sym, targets]) => [
                    sym,
                    targets.length > 0 ? stateSetKey(targets) : '∅',
                  ])
                ),
              ])
            )}
            startState={stateSetKey(dfa.startState)}
            acceptStates={dfa.acceptStates.map(a => stateSetKey(a))}
            stateLabels={dfa.stateLabels}
          />
        ) : (
          <div className="bg-card rounded-lg border border-border border-dashed flex items-center justify-center p-8">
            <p className="text-muted-foreground text-sm">DFA table will build step by step</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionSteps;
