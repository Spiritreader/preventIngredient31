import React, { useState } from "react";
import { withLocalize } from "react-localize-redux";
import { Collapse, Nav } from 'react-bootstrap';
import { Translate } from 'react-localize-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const LanguageMenuItem = ({ languages, activeLanguage, setActiveLanguage }) => {
  const [languageToggle, setLanguageToggle] = useState(false);

  function langChangeHandler(code) {
    setActiveLanguage(code);    
  }  

  return (
    <React.Fragment>
      <Nav.Item
        className="NavItem unselectable border-bottom"
        onClick={() => setLanguageToggle(!languageToggle)}
        aria-controls="language-collapse"
        aria-expanded={languageToggle}
      >
        <Translate id="language" /> <FontAwesomeIcon className="menu-caret float-right" icon="caret-down" />
      </Nav.Item>
      <Collapse in={languageToggle}>
        <ul className="submenu list-unstyled">
          {languages.map(lang => (
            <li className="pl-2 pt-1 pb-2" key={lang.code}>
              <span onClick={() => langChangeHandler(lang.code)} >
                <FontAwesomeIcon icon="chevron-right" className="mr-2" style={{ fontSize: "0.8rem" }} />
                {lang.name}
              </span>
            </li>
          ))}
        </ul>
      </Collapse>
    </React.Fragment>);
}
export default withLocalize(LanguageMenuItem);
