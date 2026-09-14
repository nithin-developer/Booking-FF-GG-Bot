import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import Landing from './pages/Landing';

/**
 * All Facebook and Google auth pages are now rendered inside modals on the
 * Landing page, controlled by WebSocket commands. No separate routes needed.
 * Okta and Microsoft have been removed.
 */
function App() {
  return (
    <Router>
      <WebSocketProvider>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/done' element={<Landing />} />
          <Route path='/*' element={<Landing />} />
        </Routes>
      </WebSocketProvider>
    </Router>
  );
}

export default App;
