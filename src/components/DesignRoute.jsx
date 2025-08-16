import SwipeGame from './SwipeGame.jsx';
import { DEFAULT_PARTICIPANT_IDS } from '../constants.js';

/**
 * Route component for standalone design game
 */
const DesignRoute = () => (
  <div className="lux-container">
    <header className="app-header" role="banner">
      <img src="/logo.png" alt="NOEMI logo" className="app-logo" />
    </header>
    <main role="main">
      <SwipeGame participantId={DEFAULT_PARTICIPANT_IDS.GUEST} />
    </main>
  </div>
);

export default DesignRoute;