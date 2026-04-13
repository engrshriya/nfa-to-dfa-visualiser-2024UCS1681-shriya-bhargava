interface TransitionTableProps {
  title: string;
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string | string[]>>;
  startState: string;
  acceptStates: string[];
  highlightStates?: string[];
  stateLabels?: Record<string, string>;
}

const TransitionTable = ({
  title,
  states,
  alphabet,
  transitions,
  startState,
  acceptStates,
  highlightStates = [],
  stateLabels,
}: TransitionTableProps) => {
  const formatCell = (value: string | string[] | undefined) => {
    if (!value) return '∅';
    if (Array.isArray(value)) {
      return value.length === 0 ? '∅' : `{${value.join(', ')}}`;
    }
    return value;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary">
        <h3 className="font-semibold text-secondary-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">State</th>
              {alphabet.map(sym => (
                <th key={sym} className="px-4 py-2 text-center font-mono font-medium text-muted-foreground">
                  {sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map(state => {
              const isStart = state === startState;
              const isAccept = acceptStates.includes(state);
              const isHighlighted = highlightStates.includes(state);
              const label = stateLabels?.[state];
              return (
                <tr
                  key={state}
                  className={`border-b border-border last:border-0 transition-colors ${
                    isHighlighted ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-mono font-medium">
                    <span className="flex items-center gap-1">
                      {isStart && <span className="text-state-start">→</span>}
                      {isAccept && <span className="text-state-accept">*</span>}
                      {label ? `${label} = ${state}` : state}
                    </span>
                  </td>
                  {alphabet.map(sym => (
                    <td key={sym} className="px-4 py-2 text-center font-mono">
                      {formatCell(transitions[state]?.[sym])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransitionTable;
