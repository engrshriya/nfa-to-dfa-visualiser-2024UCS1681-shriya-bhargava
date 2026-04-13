import { useState } from 'react';
import { NFA, convertNFAtoDFA, DFA, ConversionStep } from '@/lib/nfa-to-dfa';
import NFAInput from '@/components/NFAInput';
import ConversionSteps from '@/components/ConversionSteps';
import StepIndicator from '@/components/StepIndicator';
import { ArrowRight, BookOpen, Lightbulb } from 'lucide-react';

const STEPS = ['Define NFA', 'NFA Table', 'Convert to DFA', 'DFA Result'];

const Index = () => {
  const [nfa, setNfa] = useState<NFA | null>(null);
  const [dfa, setDfa] = useState<DFA | null>(null);
  const [steps, setSteps] = useState<ConversionStep[]>([]);
  const [phase, setPhase] = useState(0);

  const handleNFASubmit = (inputNfa: NFA) => {
    setNfa(inputNfa);
    const result = convertNFAtoDFA(inputNfa);
    setDfa(result.dfa);
    setSteps(result.steps);
    setPhase(2);
  };

  const handleReset = () => {
    setNfa(null);
    setDfa(null);
    setSteps([]);
    setPhase(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto py-6 px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              NFA → DFA Converter
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            Learn the Subset Construction method step-by-step
          </p>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto py-8 px-4">
        <StepIndicator steps={STEPS} currentStep={phase} />

        {phase === 0 && (
          <div className="space-y-6">
            {/* Intro card */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-state-start flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground mb-1">What is this tool?</h2>
                  <p className="text-sm text-muted-foreground">
                    This tool teaches you the <strong>Subset Construction Algorithm</strong> — the standard method to convert
                    a Nondeterministic Finite Automaton (NFA) into an equivalent Deterministic Finite Automaton (DFA).
                    Enter your NFA below or pick a preset example, then walk through each step of the conversion.
                  </p>
                </div>
              </div>
            </div>

            {/* Key concepts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <BookOpen className="w-5 h-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">NFA</h3>
                <p className="text-xs text-muted-foreground">
                  Can have multiple transitions for the same input, and ε-transitions. A state can lead to multiple states.
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <ArrowRight className="w-5 h-5 text-state-start mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Subset Construction</h3>
                <p className="text-xs text-muted-foreground">
                  Each DFA state represents a <em>set</em> of NFA states. We compute ε-closures and move operations.
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <Lightbulb className="w-5 h-5 text-state-accept mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">DFA</h3>
                <p className="text-xs text-muted-foreground">
                  Exactly one transition per input symbol per state. No ambiguity — deterministic!
                </p>
              </div>
            </div>

            <NFAInput onSubmit={handleNFASubmit} />
          </div>
        )}

        {phase >= 2 && nfa && dfa && (
          <ConversionSteps nfa={nfa} dfa={dfa} steps={steps} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <p className="text-center text-xs text-muted-foreground">
          NFA → DFA Conversion Visualizer · Built for Theory of Computation students
        </p>
      </footer>
    </div>
  );
};

export default Index;
