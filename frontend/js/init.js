let rowCounter = 0;
let rowElement;
let yolo = false;
let menuAll;
let menuDatePickr;
let globalSelectedDate = new Date();
let supplementTranslation;
let menuFirstDay;
let menuLastDay;

function init() {
    let isWeekend = (globalSelectedDate.getDay() === 6) || (globalSelectedDate.getDay() === 0);
    if (isWeekend) {
        globalSelectedDate.setDate(globalSelectedDate.getDate() + (1 + 7 - globalSelectedDate.getDay()) % 7);
    }
    document.getElementById("calendar-dateboi").value = globalSelectedDate.getDate() + "." + (globalSelectedDate.getMonth() + 1) + "." + globalSelectedDate.getFullYear()
    $.get("https://v22019017598480774.supersrv.de/api", function (response) {
        menuAll = response;
        menuFirstDay = new Date(menuAll[0].date);
        menuLastDay = new Date(menuAll[menuAll.length - 1].date);
        menuDatePickr = flatpickr("#calendar-dateboi", {
            minDate: menuFirstDay,
            maxDate: menuLastDay,
            "disable": [
                function (date) {
                    // return true to disable
                    return (date.getDay() === 6 || date.getDay() === 0);
                }
            ],
            "locale": {
                "firstDayOfWeek": 1 // start week on Monday
            },
            dateFormat: "d.m.Y",
            onChange: dateChanger
        });
        $.ajax({
            dataType: "json",
            url: "./supplements.json"
        }).done(function (data) {
            if (!yolo) {
                // Show everything ;)
                let hider = document.getElementsByClassName("hider")[0];
                hider.parentNode.removeChild(hider);

                supplementTranslation = data;
                processCheckboxes(data);
                onChangeCheckbox();
                yolo = true;
                showMenu(response, new Date(globalSelectedDate.getFullYear(), globalSelectedDate.getMonth(), globalSelectedDate.getDate()));
            }
        })

    });

}

function dateChanger(selectedDates) {
    let selectedDate = selectedDates[0];
    if (selectedDate) {
        globalSelectedDate = selectedDate;
        showMenu(menuAll, selectedDate);
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

function processCheckboxes(supplements) {
    let allergenKeys = Object.keys(supplements.Allergene).sort();
    let additivesKeys = Object.keys(supplements.Zusatzstoffe);
    let tagKeys = Object.keys(supplements.Kategorien).sort();
    let allergens = document.querySelector("#collapseAllergens > div");
    let additives = document.querySelector("#collapseSupplements > div");
    let tags = document.querySelector("#collapseTags > div");

    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row');
    allergenKeys.forEach((key) => {
        inject(allergens, supplements.Allergene, key, 'sups');
    });
    allergens.appendChild(rowElement);

    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row')
    additivesKeys.forEach((key) => {
        inject(additives, supplements.Zusatzstoffe, key, 'sups');
    });
    additives.appendChild(rowElement);


    rowElement = document.createElement('div');
    rowElement.setAttribute('class', 'row')
    tagKeys.forEach((key) => {
        injectTags(tags, supplements.Kategorien, key, 'tags');
    });
    tags.appendChild(rowElement);
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