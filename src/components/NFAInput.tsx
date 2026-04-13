import { useState } from 'react';
import { NFA, PRESET_EXAMPLES } from '@/lib/nfa-to-dfa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, BookOpen } from 'lucide-react';

interface NFAInputProps {
  onSubmit: (nfa: NFA) => void;
}

const NFAInput = ({ onSubmit }: NFAInputProps) => {
  const [states, setStates] = useState('q0,q1,q2');
  const [alphabet, setAlphabet] = useState('a,b');
  const [startState, setStartState] = useState('q0');
  const [acceptStates, setAcceptStates] = useState('q2');
  const [transitions, setTransitions] = useState<{ from: string; symbol: string; to: string }[]>([
    { from: 'q0', symbol: 'a', to: 'q0,q1' },
    { from: 'q0', symbol: 'b', to: 'q0' },
    { from: 'q1', symbol: 'b', to: 'q2' },
  ]);

  const addTransition = () => {
    setTransitions([...transitions, { from: '', symbol: '', to: '' }]);
  };

  const removeTransition = (index: number) => {
    setTransitions(transitions.filter((_, i) => i !== index));
  };

  const updateTransition = (index: number, field: string, value: string) => {
    const updated = [...transitions];
    updated[index] = { ...updated[index], [field]: value };
    setTransitions(updated);
  };

  const loadPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    const nfa = preset.nfa;
    setStates(nfa.states.join(','));
    setAlphabet(nfa.alphabet.join(','));
    setStartState(nfa.startState);
    setAcceptStates(nfa.acceptStates.join(','));

    const trans: { from: string; symbol: string; to: string }[] = [];
    for (const [from, symbols] of Object.entries(nfa.transitions)) {
      for (const [symbol, targets] of Object.entries(symbols)) {
        if (targets.length > 0) {
          trans.push({ from, symbol, to: targets.join(',') });
        }
      }
    }
    setTransitions(trans);
  };

  const handleSubmit = () => {
    const stateList = states.split(',').map(s => s.trim());
    const alphList = alphabet.split(',').map(s => s.trim());
    const acceptList = acceptStates.split(',').map(s => s.trim());

    const transMap: Record<string, Record<string, string[]>> = {};
    stateList.forEach(s => { transMap[s] = {}; });

    transitions.forEach(t => {
      if (t.from && t.symbol) {
        if (!transMap[t.from]) transMap[t.from] = {};
        transMap[t.from][t.symbol] = t.to.split(',').map(s => s.trim()).filter(Boolean);
      }
    });

    onSubmit({
      states: stateList,
      alphabet: alphList,
      transitions: transMap,
      startState: startState.trim(),
      acceptStates: acceptList,
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Load Example
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESET_EXAMPLES.map((preset, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => loadPreset(preset)}
              className="text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            States (comma-separated)
          </label>
          <Input value={states} onChange={e => setStates(e.target.value)} placeholder="q0,q1,q2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Alphabet (comma-separated, use ε for epsilon)
          </label>
          <Input value={alphabet} onChange={e => setAlphabet(e.target.value)} placeholder="a,b" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Start State</label>
          <Input value={startState} onChange={e => setStartState(e.target.value)} placeholder="q0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Accept States (comma-separated)
          </label>
          <Input value={acceptStates} onChange={e => setAcceptStates(e.target.value)} placeholder="q2" />
        </div>
      </div>

      {/* Transitions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Transition Function δ</label>
          <Button variant="outline" size="sm" onClick={addTransition}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {transitions.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">δ(</span>
              <Input
                className="w-20 font-mono text-sm"
                value={t.from}
                onChange={e => updateTransition(i, 'from', e.target.value)}
                placeholder="q0"
              />
              <span className="text-sm text-muted-foreground font-mono">,</span>
              <Input
                className="w-16 font-mono text-sm"
                value={t.symbol}
                onChange={e => updateTransition(i, 'symbol', e.target.value)}
                placeholder="a"
              />
              <span className="text-sm text-muted-foreground font-mono">) =</span>
              <Input
                className="flex-1 font-mono text-sm"
                value={t.to}
                onChange={e => updateTransition(i, 'to', e.target.value)}
                placeholder="q0,q1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeTransition(i)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full" size="lg">
        Start Conversion →
      </Button>
    </div>
  );
};

export default NFAInput;
