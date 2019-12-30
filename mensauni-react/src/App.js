import React, { useState } from 'react';
import './App.scss';
// react-bootstrap
import { Nav, Collapse, Button, NavDropdown } from 'react-bootstrap';

// react fontawesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowDown, faCheckSquare, faAngleDown, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import { faChevronRight, faCaretRight } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Language switcher
import { withLocalize } from 'react-localize-redux';
import { Translate } from 'react-localize-redux';
import { renderToStaticMarkup } from "react-dom/server"
import LanguageMenuItem from './Components/LanguageMenuItem'
import DarkModeSwitch from './Components/DarkModeSwitch'
import enTranslations from './translations/en.locale.json'
import deTranslations from './translations/de.locale.json'

//fa library
library.add(faAngleDown, faCaretDown, faChevronRight, faCaretRight);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.props.initialize({
      languages: [
        { name: "English", code: "en" },
        { name: "German", code: "de" }
      ],
      options: {
        renderToStaticMarkup,
        defaultLanguage: "de"
      }
    });

    this.props.addTranslationForLanguage(deTranslations, "de");
    this.props.addTranslationForLanguage(enTranslations, "en");
  }

  render() {
    return (
      <React.Fragment>
        <Sidebar />
        <DarkModeSwitch />
        <div className="Content flex-column">
          <ul>
            <li></li>
            <li>test</li>
            <li>test</li>
            <li>test</li>
            <li>test</li>
          </ul>
        </div>
      </React.Fragment>
    );
  }
}

function Sidebar() {
  const [canteenToggle, setCanteenToggle] = useState(false);

  return (
    <Nav className="Sidebar flex-column border-right p-3">
      <h3>Men(sen)ubar</h3>
      <Nav.Item
        className="NavItem unselectable border-bottom"
        onClick={() => setCanteenToggle(!canteenToggle)}
        aria-controls="canteen-collapse"
        aria-expanded={canteenToggle}
      ><Translate id="canteen" /> <FontAwesomeIcon className="menu-caret float-right" icon="caret-down" />
      </Nav.Item>
      <Collapse in={canteenToggle}>
        <ul className="submenu list-unstyled">
          <li className="pl-2 pt-1 pb-2">
            <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
            <Translate id="canteenList.giessberg" />
          </li>
          <li className="pl-2 pt-1 pb-2">
            <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
            <Translate id="canteenList.htwg" />
          </li>
          <li className="pl-2 pt-1 pb-2">
            <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
            <Translate id="canteenList.friedrichshafen" />
          </li>
          <li className="pl-2 pt-1 pb-2">
            <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
            <Translate id="canteenList.weingarten" />
          </li>
          <li className="pl-2 pt-1 pb-2">
            <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
            <Translate id="canteenList.ravensburg" />
          </li>
        </ul>
      </Collapse>
      <LanguageMenuItem />
    </Nav>
  );
}

export default withLocalize(App);
