import React from 'react';
import logo from './logo.svg';
import './App.css';
// react-bootstrap
import Button from 'react-bootstrap/Button';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wieischdesnochmal : "sammiboi",
      vingiboi: "oiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
    }
  }

  updateState = () => {
    this.setState({vingiboi: "yoi"});
    console.log("i was updated!!");
  }

  render() {
    return (
      <div className="App">
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossOrigin="anonymous"
        />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Test name="Ying-Kai Police Department" stateUpdater={this.updateState} globalState={this.state} />
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

class Test extends React.Component {
  der_yinger(ying) {
    return "hehe " + ying;    
  }

  render() {
    return (
      <div className="card" style={{ width: '18rem', color: "black" }}>
        <h1>{this.der_yinger("kamelasa")}</h1>
        <p>Des isch {this.props.name}, 1 awesome dude!</p>
        <div id="test"><Sammer test="bierbär" stateUpdater={this.props.stateUpdater} globalState={this.props.globalState}/></div>
      </div>
    );
  }
}

class Sammer extends React.Component {
  constructor(props) {
    super(props);
    //console.log(props.test)
    this.state = {
      counter: 0
    };
    this.der_sammer = this.der_sammer.bind(this);
    this.tempyboi = 12;
  }

  bootstrap() {
    return (
      <Button onClick={this.der_sammer}>{this.props.globalState.vingiboi} {this.state.counter}</Button>
    )
  }

  der_sammer() {
    this.setState((prevState) => ({
      counter: prevState.counter + 1
    }));
    this.props.stateUpdater();
  }

  render() {
    return (
      this.bootstrap()
    )
  }
}

export default App;
