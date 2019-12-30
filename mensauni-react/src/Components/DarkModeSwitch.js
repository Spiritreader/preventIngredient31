import React, { useState } from 'react';
import useDarkMode from 'use-dark-mode';
import { faMoon, faSun } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'react-bootstrap';

const DarkModeSwitch = () => {
  const darkMode = useDarkMode(false);
  const [buttonClass, setButtonClass] = useState(initButton);
  const [iconClass, setIconClass] = useState(initIcon);

  function initButton() {
    if (darkMode.value) {
      return "btn-dark";
    } else {
      return "btn-light";
    }
  }

  function initIcon() {
    if (darkMode.value) {
      return faSun;
    } else {
      return faMoon;
    }
  }

  function darkModeToggle() {
    if (darkMode.value) {
      setButtonClass("btn-light");
      setIconClass(faMoon);
      darkMode.disable();
    } else {
      setButtonClass("btn-dark");
      setIconClass(faSun);
      darkMode.enable();
    }
  }

  return (
    <div>
      <Button id="dark-mode-toggle" onClick={() => darkModeToggle()} className={buttonClass}><FontAwesomeIcon icon={iconClass} /></Button>
    </div>
  )
};

export default DarkModeSwitch;

