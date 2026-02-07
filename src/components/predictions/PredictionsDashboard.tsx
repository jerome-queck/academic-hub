import { PageHeader } from '../layout';
import { WhatIfCalculator } from './WhatIfCalculator';
import { RequiredGradeCalculator } from './RequiredGradeCalculator';

export function PredictionsDashboard() {
  return (
    <div>
      <PageHeader
        title="Predictions"
        description="Simulate scenarios and plan your path to success"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatIfCalculator />
        <RequiredGradeCalculator />
      </div>
    </div>
  );
}
