import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { LocalizeProvider } from 'react-localize-redux';
import { Translate } from "react-localize-redux";

const LocaleWrapper = props => (
    <LocalizeProvider>
        <App />
        <span><Translate id="boi" /></span>
    </LocalizeProvider>
)

ReactDOM.render(<LocaleWrapper />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
