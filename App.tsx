import React from 'react';
import Routing from './Routing';
import ErrorBoundary from './ErrorBoundary';  // ← Removed 'components/'

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routing />
    </ErrorBoundary>
  );
};

export default App;
