import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './src/app';

(function () {
  ReactDOM.render(
    <React.StrictMode><App /></React.StrictMode>,
    document.getElementById('root')
  );
})();