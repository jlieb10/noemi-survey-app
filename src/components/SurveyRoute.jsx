import Survey from './Survey.jsx';

/**
 * Route component for standalone survey
 */
const SurveyRoute = () => (
  <div className="lux-container">
    <header className="app-header" role="banner">
      <img src="/logo.png" alt="NOEMI logo" className="app-logo" />
    </header>
    <main role="main">
      <Survey onComplete={(id) => {
        if (import.meta.env.DEV) console.debug('Survey completed with ID:', id);
        // In standalone mode, just log the completion
        alert(`Survey completed! Participant ID: ${id}`);
      }} />
    </main>
  </div>
);

export default SurveyRoute;