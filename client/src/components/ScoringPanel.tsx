type ScoringPanelProps = {
  scoring: {
    minLength: number | string;
    baseScore: number | string;
    perLetter: number | string;
    lengthBonus: string;
    useTable: boolean;
    scoreTable: string;
  };
  onChange: (value: ScoringPanelProps['scoring']) => void;
};

export default function ScoringPanel({ scoring, onChange }: ScoringPanelProps) {
  const update = (key: keyof ScoringPanelProps['scoring'], value: string | number | boolean) => {
    onChange({ ...scoring, [key]: value });
  };

  return (
    <section className="panel">
      <h2>Scoring</h2>
      <div className="scoring">
        <label>
          Minimum length
          <input
            type="number"
            min="2"
            value={scoring.minLength}
            onChange={(event) => update('minLength', event.target.value)}
          />
        </label>
        <label>
          Base score
          <input
            type="number"
            value={scoring.baseScore}
            onChange={(event) => update('baseScore', event.target.value)}
          />
        </label>
        <label>
          Per-letter score
          <input
            type="number"
            value={scoring.perLetter}
            onChange={(event) => update('perLetter', event.target.value)}
          />
        </label>
        <label>
          Length bonuses (CSV by length starting at 1)
          <input
            type="text"
            value={scoring.lengthBonus}
            onChange={(event) => update('lengthBonus', event.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={scoring.useTable}
            onChange={(event) => update('useTable', event.target.checked)}
          />
          Use explicit length score table
        </label>
        <label>
          Length score table (CSV or JSON object, e.g. 3:1,4:2 or JSON like 3=1,4=2)
          <input
            type="text"
            value={scoring.scoreTable}
            onChange={(event) => update('scoreTable', event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
