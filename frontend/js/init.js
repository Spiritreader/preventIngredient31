let rowCounter = 0;
let rowElement;
let yolo = false; // You Only Load Once
let menuAll;
let menuDatePickr;
let globalSelectedDate = new Date();
let supplementInfo;
let menuFirstDay;
let menuLastDay;

function init(mensaSelection) {
    globalSelectedDate.setHours(12, 0, 0);
    if (localStorage.lang == null) {
        localStorage.lang = "de";
    }
    if (localStorage.darkmode == "true") {
        if (!darkmodeEnabled) {
            toggleDarkmode($("#dark-mode-toggle"));
            darkmodeEnabled = true;    
        }
    } else {
        document.getElementById("flatpickr-css-dark").disabled = true;
    }
    $('select[id=langSelect]').val(localStorage.lang);
    localStorage.lastSelectedUni = mensaSelection;
    switch (mensaSelection) {
        case "giessbergCanteen":
            document.getElementById('selectedUniversity').innerText = 'Uni KN';
            break;
        case "htwgCanteen":
            document.getElementById('selectedUniversity').innerText = 'HTWG KN';
            break;
        case "weingartenCanteen":
            document.getElementById('selectedUniversity').innerText = 'HS RV';
            break;
        case "ravensburgCanteen":
            document.getElementById('selectedUniversity').innerText = 'DHBW RV';
            break;
        case "friedrichshafenCanteen":
            document.getElementById('selectedUniversity').innerText = 'DHBW FN';
            break;
    }
    // Hide menu on uni change if the initial page load occurred
    if (yolo) prepareDynamicReload();
    $.get("/api/v2", { mensa: locale[localStorage.lang].canteens[mensaSelection], lang: localStorage.lang }, function (response) {
        menuAll = response;
        supplementInfo = locale[localStorage.lang].supplements;
        setUpLocale(localStorage.lang);
        menuFirstDay = new Date(menuAll[0].date);
        menuLastDay = new Date(menuAll[menuAll.length - 1].date);
        // Reset global date to the last available, prevents date from jumping to next month when switching
        if (globalSelectedDate > menuLastDay) {
            globalSelectedDate = menuLastDay;
        }

        // Check if a menu is offered on Saturday
        let firstSaturdayIndex = -1;
        let firstSaturday;
        let secondSaturday;
        for (let i = 0; i < menuAll.length; i++) {
            let date = new Date(menuAll[i].date);
            if (date.getDay() === 6) {
                firstSaturday = new Date(menuAll[i].date);
                break;
            }
        }
        if (firstSaturdayIndex != -1) {
            for (let i = firstSaturdayIndex + 1; i < menuAll.length; i++) {
                let date = new Date(menuAll[i].date);

                if (date.getDay() === 6) {
                    secondSaturday = new Date(menuAll[i].date);
                    break;
                }
            }
        }

        //check globalSelectedDate is a weekend
        let isWeekend = (globalSelectedDate.getDay() === 6) || (globalSelectedDate.getDay() === 0);
        if (isWeekend) {
            //check if the first saturday is defined. If not, that means there is no weekend menu -> skip to monday
            if (firstSaturday) {
                //check if the globalSelectedDate is NOT on the first saturday with a menu.
                if (!(firstSaturday.getDate() === globalSelectedDate.getDate())) {
                    //check if the second saturday menu is defined. If not, that means we're not on a menu day -> skip
                    if (secondSaturday) {
                        //check if the second saturday is NOT on a menu date. If this is true, we want to skip.
                        if (!(secondSaturday.getDate() === globalSelectedDate.getDate())) {
                            globalSelectedDate.setDate(globalSelectedDate.getDate() + (1 + 7 - globalSelectedDate.getDay()) % 7);
                        }
                    } else {
                        globalSelectedDate.setDate(globalSelectedDate.getDate() + (1 + 7 - globalSelectedDate.getDay()) % 7);
                    }
                }
            } else {
                globalSelectedDate.setDate(globalSelectedDate.getDate() + (1 + 7 - globalSelectedDate.getDay()) % 7);
            }
        }
        updateHeaderDay(localStorage.lang);

        //init flatpickr, specifically enable saturday menu days
        menuDatePickr = flatpickr("#calendar-dateboi", {
            minDate: menuFirstDay,
            maxDate: menuLastDay,
            "disable": [
                function (date) {
                    // return true to disable
                    if (firstSaturday && (date.toDateString() === firstSaturday.toDateString())) {
                        return false;
                    } else if (secondSaturday && (date.toDateString() === secondSaturday.toDateString())) {
                        return false;
                    }
                    return (date.getDay() === 6 || date.getDay() === 0);
                }
            ],
            "locale": {
                "firstDayOfWeek": 1 // start week on Monday
            },
            dateFormat: "d.m",
            onChange: dateChanger
        });
        //update flatpickr date after init
        menuDatePickr.setDate(globalSelectedDate);

        //if init has not fulfilled the you only load once condition
        if (!yolo) {
            // Show everything after initial page load completed ;)
            // Initial loading spinner gets removed after initial page load
            let hider = document.getElementsByClassName("hider")[0];
            let hiderMenu = document.getElementById("hiderMenu");
            let spinnyBoi = document.getElementById("spinny-boi-menu");
            hider.parentNode.removeChild(hider);
            hiderMenu.classList.remove("hiderMenu");
            spinnyBoi.classList.add("hide");
            yolo = true;
            showMenu(response, getYMDOnly(globalSelectedDate));
        } else {
            dynamicReload();
        }
    });

}

/**
 * Prepares a dynamic reload by starting the spinner for the table only
 */
function prepareDynamicReload() {
    let hiderMenu = document.getElementById("hiderMenu");
    hiderMenu.classList.add("hiderMenu");
    let spinnyBoi = document.getElementById("spinny-boi-menu");
    spinnyBoi.classList.remove("hide");
    let tableMenu = document.getElementById("tableMenu");
    tableMenu.classList.add("hide");
}

function dynamicReload() {
    let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
    menuDatePickr.setDate(globalSelectedDate);
    showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), getYMDOnly(globalSelectedDate));
    let hiderMenu = document.getElementById("hiderMenu");
    let spinnyBoi = document.getElementById("spinny-boi-menu");
    let tableMenu = document.getElementById("tableMenu");
    hiderMenu.classList.remove("hiderMenu");
    spinnyBoi.classList.add("hide");
    tableMenu.classList.remove("hide");
}

function updateHeaderDay(language) {
    let day = locale[language].weekdays[globalSelectedDate.getDay()]
    //let day = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"][globalSelectedDate.getDay()]
    document.getElementById('weekday').innerText = day;
}

/**
 * Change the date
 * @param {*} selectedDates Array of dates that were selected (in this case ar.length == 1) 
 */
function dateChanger(selectedDates) {
    let selectedDate = selectedDates[0];
    if (selectedDate) {
        if (selectedDate >= menuLastDay) {
            selectedDate = menuLastDay;
        }
        globalSelectedDate = selectedDate;
        let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
        showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), getYMDOnly(globalSelectedDate));
    }
}


/**
 * Add filter-checkboxes to the page
 * @param {*} supplements json of supplements, allergens and tags 
 */
function populateCheckboxes(supplements) {
    let allergenKeys = Object.keys(supplements.allergens).sort();
    let additivesKeys = Object.keys(supplements.additives);
    let tagKeys = Object.keys(supplements.categories).sort();
    let allergens = document.querySelector("#collapseAllergens > div");
    let additives = document.querySelector("#collapseSupplements > div");
    let tags = document.querySelector("#collapseTags > div");

    while (allergens.firstChild) {
        allergens.removeChild(allergens.firstChild);
    }
    while (additives.firstChild) {
        additives.removeChild(additives.firstChild);
    }
    while (tags.firstChild) {
        tags.removeChild(tags.firstChild);
    }

    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row');
    allergenKeys.forEach((key) => {
        inject(allergens, supplements.allergens, key, 'sups');
    });
    allergens.appendChild(rowElement);

    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row')
    additivesKeys.forEach((key) => {
        inject(additives, supplements.additives, key, 'sups');
    });
    additives.appendChild(rowElement);


    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row')
    tagKeys.forEach((key) => {
        injectTags(tags, supplements.categories, key, 'tags');
    });
    tags.appendChild(rowElement);
    //todo: reapply previously selected checkboxes
    excludeSup.forEach((sup) => {
        document.getElementById(sup).checked = true;
    })
    includeTags.forEach((tag) => {
        document.getElementById(tag).checked = true;
    })
    onChangeCheckbox();
    filterBoiAdd();
}

function inject(body, lookup, key, classInfo) {
    let inputDiv = document.createElement('div');
    inputDiv.setAttribute('class', 'col-lg-3 col-md-3 form-check');

    //define label
    let label = document.createElement('label');
    label.setAttribute('class', 'form-check-label ' + classInfo + '-label');
    label.setAttribute('for', key);
    label.textContent = lookup[key] + " (" + key + ")";

    //define input
    let input = document.createElement('input');
    input.setAttribute('class', 'form-check-input ' + classInfo + '-checkbox');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', key);

    //append checkbox and label to inputDiv
    inputDiv.appendChild(input);
    inputDiv.appendChild(label);

    rowElement.appendChild(inputDiv);

    if (rowElement.children.length == 4) {
        body.appendChild(rowElement);
        rowElement = document.createElement('div');
        rowElement.setAttribute('class', 'row')
    }
}

function injectTags(body, lookup, key, classInfo) {
    let inputDiv = document.createElement('div');
    inputDiv.setAttribute('class', 'col-lg-3 col-md-3 form-check');

    //define label
    let label = document.createElement('label');
    label.setAttribute('class', 'form-check-label ' + classInfo + '-label');
    label.setAttribute('for', key);
    if (key === "B") {
        label.innerHTML = lookup[key] + " " + "<img class=\"tagCheckboxImg\" src=\"https://www.seezeit.com/fileadmin/template/images/icons/speiseplan/stern.png\" />";
    } else {
        label.innerHTML = lookup[key] + " " + "<img class=\"tagCheckboxImg\" src=\"https://www.seezeit.com/fileadmin/template/images/icons/speiseplan/" + key + ".png\" />";
    }

    //define input
    let input = document.createElement('input');
    input.setAttribute('class', 'form-check-input ' + classInfo + '-checkbox');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', key);

    //append checkbox and label to inputDiv
    inputDiv.appendChild(input);
    inputDiv.appendChild(label);

    rowElement.appendChild(inputDiv);

    if (rowElement.children.length == 4) {
        body.appendChild(rowElement);
        rowElement = document.createElement('div');
        rowElement.setAttribute('class', 'row')
    }
}

/**
 * Change language dependent on the selected language
 */
function setUpLocale(language) {
    let text = locale[language].htmlText;
    document.getElementById("sr-next").innerText = text.srNext;
    document.getElementById("sr-previous").innerText = text.srPrevious;
    document.getElementById("headingAllergens").innerText = text.headingAllergens;
    document.getElementById("headingSupplements").innerText = text.headingSupplements;
    document.getElementById("headingTags").innerText = text.headingTags;
    document.getElementById("headingPrice").innerText = text.headingPrice;
    document.getElementById("headingCategory").innerText = text.headingCategory;
    document.getElementById("disclaimerText").innerHTML = text.disclaimerText;
    document.getElementById("aboutText").innerHTML = text.aboutText;
    populateCheckboxes(locale[language].supplements);
}

/**
 * Time in days between two dates
 * @param {*} dt1 StartDate
 * @param {*} dt2 EndDate
 */
function tdiff(dt1, dt2) {
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
}

function getYMDOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}