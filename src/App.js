import React from 'react';
import './App.css';
import PaperSearchContainer from './components/PaperSearchContainer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Academic Paper Explorer</h1>
        <p>Search, visualize and discover academic papers</p>
      </header>
      <main className="App-main">
        <PaperSearchContainer />
      </main>
      <footer className="App-footer">
        <p>© {new Date().getFullYear()} Academic Paper Explorer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;