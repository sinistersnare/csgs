import React from 'react';
import ReactDOM from 'react-dom';
import FilterableServerList from './App';
import './index.css';
import './App.css';

ReactDOM.render(
  <FilterableServerList url="/api/servers" pollInterval={10000} />,
  document.getElementById('root')
);
