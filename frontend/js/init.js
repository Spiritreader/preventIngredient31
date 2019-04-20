let rowCounter = 0;
let rowElement;
let yolo = false; // You Only Load Once
let menuAll;
let menuDatePickr;
let globalSelectedDate = new Date();
let supplementTranslation;
let menuFirstDay;
let menuLastDay;

function init(mensaSelection) {
    if (localStorage.lang == null) {
        localStorage.lang = "de";
    }
    changeHtmlText(localStorage.lang);
    localStorage.lastSelectedUni = mensaSelection;
    switch (mensaSelection) {
        case "mensa-giessberg":
            document.getElementById('selectedUniversity').innerText = 'Uni KN';
            break;
        case "mensa-htwg":
            document.getElementById('selectedUniversity').innerText = 'HTWG KN';
            break;
        case "mensa-weingarten":
            document.getElementById('selectedUniversity').innerText = 'HS RV';
            break;
        case "mensa-ravensburg":
            document.getElementById('selectedUniversity').innerText = 'DHBW RV';
            break;
        case "mensa-friedrichshafen":
            document.getElementById('selectedUniversity').innerText = 'DHBW FN';
            break;
    }
    // Hide menu on uni change if the initial page load occurred
    if (yolo) {
        let hiderMenu = document.getElementById("hiderMenu");
        hiderMenu.classList.add("hiderMenu");
        let spinnyBoi = document.getElementById("spinny-boi-menu");
        spinnyBoi.classList.remove("hide");
        let tableMenu = document.getElementById("tableMenu");
        tableMenu.classList.add("hide");
    }
    let isWeekend = (globalSelectedDate.getDay() === 6) || (globalSelectedDate.getDay() === 0);
    if (isWeekend) {
        globalSelectedDate.setDate(globalSelectedDate.getDate() + (1 + 7 - globalSelectedDate.getDay()) % 7);
    }
    updateHeaderDay();
    let month = globalSelectedDate.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    let date = globalSelectedDate.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    document.getElementById("calendar-dateboi").value = date + "." + month;
    $.get("/api", { mensa: mensaSelection }, function (response) {
        menuAll = response;
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
        if (!yolo) {
            // Show everything ;)
            let hider = document.getElementsByClassName("hider")[0];
            let hiderMenu = document.getElementById("hiderMenu");
            let spinnyBoi = document.getElementById("spinny-boi-menu");
            hider.parentNode.removeChild(hider);
            hiderMenu.classList.remove("hiderMenu");
            spinnyBoi.classList.add("hide");

            supplementTranslation = lang[localStorage.lang].supplements;
            processCheckboxes(lang[localStorage.lang].supplements);
            yolo = true;
            showMenu(response, new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth(), globalSelectedDate.getDate()));
        } else {
            menuDatePickr.setDate(globalSelectedDate);
            let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
            showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth(), globalSelectedDate.getDate()));
            let hiderMenu = document.getElementById("hiderMenu");
            let spinnyBoi = document.getElementById("spinny-boi-menu");
            let tableMenu = document.getElementById("tableMenu");
            hiderMenu.classList.remove("hiderMenu");
            spinnyBoi.classList.add("hide");
            tableMenu.classList.remove("hide");
        }
    });

}

function updateHeaderDay() {
    let day = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][globalSelectedDate.getDay()]
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
        showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined),
            new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth(), globalSelectedDate.getDate()));
    }
}

/**
 * Time in days between two dates
 * @param {*} dt1 StartDate
 * @param {*} dt2 EndDate
 */
function tdiff(dt1, dt2) {
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
}

/**
 * Add filter-checkboxes to the page
 * @param {*} supplements json of supplements, allergens and tags 
 */
function processCheckboxes(supplements) {
    let allergenKeys = Object.keys(supplements.allergens).sort();
    let additivesKeys = Object.keys(supplements.additives);
    let tagKeys = Object.keys(supplements.categories).sort();
    let allergens = document.querySelector("#collapseAllergens > div");
    let additives = document.querySelector("#collapseSupplements > div");
    let tags = document.querySelector("#collapseTags > div");

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
    onChangeCheckbox();
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
