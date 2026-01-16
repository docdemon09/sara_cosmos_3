import React, { useState } from 'react';
import CelestialScene from './CelestialScene';
import IntroSequence from './components/IntroSequence';

function App() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <>
      {!introFinished ? (
        <IntroSequence onComplete={() => setIntroFinished(true)} />
      ) : (
        <CelestialScene autoStart={true} />
      )}
    </>
  );
}

export default App;
