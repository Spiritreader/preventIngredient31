let excludeSup = [];
let includeTags = [];
let darkmodeEnabled = false;
/**
 * Load new menu if a checkbox is checked/unchecked
 */
function onChangeCheckbox() {
    $("input[type='checkbox']").on("change", function () {
        if (this.checked) {
            if (this.className.split(" ").includes("sups-checkbox") && !excludeSup.includes(this.id)) {
                excludeSup.push(this.id);
            } else if (this.className.split(" ").includes("tags-checkbox") && !includeTags.includes(this.id)) {
                includeTags.push(this.id);
            }
        } else {
            let index;
            if (this.className.split(" ").includes("sups-checkbox")) {
                index = excludeSup.indexOf(this.id);
                if (index > -1) {
                    excludeSup.splice(index, 1);
                }
            } else if (this.className.split(" ").includes("tags-checkbox")) {
                index = includeTags.indexOf(this.id);
                if (index > -1) {
                    includeTags.splice(index, 1);
                }
            }
        }
        let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
        filterBoiAdd();
        showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
    })
}

/**
 * Display the menu given the menu and date
 * @param {*} menu array with menus as objects
 * @param {*} day Date to be displayed
 */
function showMenu(menu, day) {
    let tableBody = document.getElementById("dishes");
    document.getElementById("dishes").innerHTML = "";
    // Check if the desired menu is found in the array
    let menuToFind = menu.find((toFind) => {
        toFind = new Date(toFind.date);
        toFind.setHours(0, 0, 0);
        if (toFind.toDateString() === day.toDateString()) {
            return true;
        }
        return false;
    });
    if (!menuToFind) {
        console.log("couldn't find anything");
        return;
    }
    let parser = new DOMParser()
    // Add dishes to the page
    menuToFind.dishes.forEach((dish) => {
        let dishItemList = dish.Name.split("|");
        // Display tooltip on hover over allergen and additive numbers as well as categories
        for (let i = 0; i < dishItemList.length; i++) {
            let dishListRegexMatch = dishItemList[i].match(/\(\d([a-zA-Z]|\d|,)*\)/g);
            let name = dishItemList[i];
            if (dishListRegexMatch) {
                dishListRegexMatch.forEach((rex) => {
                    let supplements = rex ? rex.toString() : "";
                    if (supplements !== "") {
                        supplements = supplements.replace(/\(|\)/g, "");
                        let splittedSups = supplements.split(",");
                        for (let j = 0; j < splittedSups.length; j++) {
                            let allergen = supplementInfo.allergens[splittedSups[j]];
                            let additive = supplementInfo.additives[splittedSups[j]];
                            if (allergen) {
                                splittedSups[j] = "<span data-toggle=\"tooltip\" title=\"" + allergen + "\" data-placement=\"top\" class=\"badge badge-green " + splittedSups[j] + "\">" + splittedSups[j] + "</span>";
                            } else if (additive) {
                                splittedSups[j] = "<span data-toggle=\"tooltip\" title=\"" + additive + "\" data-placement=\"top\" class=\"badge badge-red " + splittedSups[j] + "\">" + splittedSups[j] + "</span>";
                            } else {
                                splittedSups[j] = "<span data-toggle=\"tooltip\" title=\"" + locale[localStorage.lang].htmlText.undefined + "\" data-placement=\"top\" class=\"badge badge-darkgrey " + splittedSups[j] + "\">" + splittedSups[j] + "</span>";
                            }
                        }
                        supplements = splittedSups.join(" ");
                    }
                    name = name.trim().replace(rex, supplements);
                });
            }

            if (name.trim().length != 0) {
                dishItemList[i] = name.trim() + "<br>";
            }
        }
        let tags = dish.Tags;
        let newElement = "<tr><th colspan=\"3\" class=\"categoryHeader\">" + dish.Category + "</th></tr>" +
            "<tr class=\"dish-content\"><td>" + dishItemList.join("") + "</td>" +
            "<td>" + dish.Pricing + "</td>" +
            "<td>";
        tags.forEach((tag) => {
            newElement += "<span data-toggle=\"tooltip\" title=\"" + supplementInfo.categories[tag] + "\" data-placement=\"top\"><img class=\"tagImg\" src=\"./img/" + tag + ".png\" /></span>";
        })
        newElement += "</td></tr>";
        tableBody.insertAdjacentHTML("beforeend", newElement);
    })
    checkDateArrow();
    updateHeaderDay(localStorage.lang);
    $(function () {
        $('[data-toggle="tooltip"]').tooltip({
            boundary: 'window'
        })
    });
    if (localStorage.darkmode == "true") {
        $(".dish-content").toggleClass("dish-content-darkmode");
        $(".categoryHeader").toggleClass("categoryHeader-darkmode");
    }
}

/**
 * Removes all items with the exclude tags or supplements
 * @param {*} menuItems String menu
 * @param {*} includeTags Array with tags as strings (Veg, Vegan, Sch, R, G, L, W, F, B)
 * @param {*} excludeSup Array with supplements as strings.
 */
function filterMenu(menus, excludeSup, includeTags) {
    menus.forEach((menu) => {
        let filtered = [];
        menu.dishes.forEach((item) => {
            let tags = item.Tags;
            let supplements = getSupplements(item.Name);
            if (!excludeSup) {
                console.log("not");
            }
            if (includeTags) {
                if (includeTags && tags.find(m => includeTags.includes(m)) && !supplements.some(m => excludeSup.includes(m))) {
                    filtered.push(item);
                }
            } else if (!supplements.some(m => excludeSup.includes(m))) {
                filtered.push(item);
            }
        });
        menu.dishes = filtered;
    })
    return menus;
}

/**
 * Returns all supplements found in a string
 * @param {*} string String with supplement list in the form of /\(\d.*\)/
 */
function getSupplements(string) {
    let ingredients = string.split("|");
    let supplements = [];
    ingredients.forEach((ing) => {
        let throwOut = false;
        let res = ing.match(/\(\d([a-zA-Z]|\d|,)*\)/g);
        if (res) {
            res.forEach((match) => {
                match = match.replace("(", "").replace(")", "");
                match.split(",").forEach((elem) => {
                    if (!supplements.includes(elem)) {
                        supplements.push(elem);
                    }
                });
            })
        }
    })
    return supplements.sort();
}

/**
 * Display the menu of the previous day
 */
function previous() {
    let currentMenu = matchMenuDay(menuAll, globalSelectedDate);
    if (currentMenu != -1) {
        if (menuAll[currentMenu - 1]) {
            globalSelectedDate = new Date(menuAll[currentMenu - 1].date);
            menuDatePickr.setDate(globalSelectedDate);
            let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
            showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
        }
    }
    checkDateArrow();
}

/**
 * Display the menu of the next day
 */
function next() {
    let currentMenu = matchMenuDay(menuAll, globalSelectedDate);
    if (currentMenu != -1) {
        if (menuAll[currentMenu + 1]) {
            globalSelectedDate = new Date(menuAll[currentMenu + 1].date);
            menuDatePickr.setDate(globalSelectedDate);
            let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
            showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
        }
    }
    checkDateArrow();
}

/**
 * Disable/enable the arrow buttons
 */
function checkDateArrow() {
    if (globalSelectedDate.toDateString() === menuLastDay.toDateString()) {
        document.getElementById("button-next").classList.add("disabled");
    } else {
        document.getElementById("button-next").classList.remove("disabled");
    }
    if (globalSelectedDate.toDateString() === menuFirstDay.toDateString()) {
        document.getElementById("button-previous").classList.add("disabled");
    } else {
        document.getElementById("button-previous").classList.remove("disabled");
    }
}

function matchMenuDay(menu, day) {
    for (let i = 0; i < menu.length; i++) {
        toFind = new Date(menu[i].date);
        toFind.setHours(0, 0, 0);
        if (toFind.toDateString() === day.toDateString()) {
            return i;
        }
    }
    return -1;
}

/**
 * Removes the given filter pill
 * @param {*} filter String of the filter pill to remove
 */
function filterBoiRemove(filter) {
    let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
    let index = excludeSup.indexOf(filter);
    let ele = document.getElementsByClassName(filter)[0];
    document.getElementById(filter).checked = false;
    if (index > -1) {
        excludeSup.splice(index, 1);
    } else {
        index = includeTags.indexOf(filter);
        includeTags.splice(index, 1);
    }
    ele.parentNode.removeChild(ele);
    showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
    if (excludeSup.length === 0 && includeTags.length === 0) {
        document.getElementById("filter-pillboi").innerHTML = "";
    }
}

/**
 * Adds filter tags for checkboxes
 */
function filterBoiAdd() {
    let filterBoi = document.getElementById("filter-pillboi");
    while (filterBoi.firstChild) {
        filterBoi.removeChild(filterBoi.firstChild);
    }
    excludeSup.forEach((sup) => {
        filterBoi.innerHTML += "<a href=\"javascript: void(0);\" onclick=\"filterBoiRemove('" + sup + "')\" class=\"badge badge-pill badge-light " + sup + "\">" + sup + " <i class=\"fas fa-times\"></i></a> ";
    })
    includeTags.forEach((tag) => {
        filterBoi.innerHTML += "<a href=\"javascript: void(0);\" onclick=\"filterBoiRemove('" + tag + "')\" class=\"badge badge-pill badge-light " + tag + "\">" + supplementInfo.categories[tag] + " <i class=\"fas fa-times\"></i></a> ";
    })
    if (filterBoi.innerHTML != "") {
        filterBoi.innerHTML += "<a href=\"javascript: void(0);\" onclick=\"removeAllFilter()\" class=\"badge badge-pill badge-reset\">Reset Filter <i class=\"fas fa-times\"></i></a> ";
    }
}

/**
 * Removes all filters
 */
function removeAllFilter() {
    let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
    let checkboxes = document.getElementsByClassName("form-check-input");
    excludeSup = [];
    includeTags = [];
    document.getElementById("filter-pillboi").innerHTML = "";
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
    showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
}

/**
 * Change language on language change
 */
$("#langSelect").on("change", function () {
    localStorage.lang = this.value;
    init(localStorage.lastSelectedUni);
});

$("#dark-mode-toggle").on("click", function () {
    if (localStorage.darkmode == "true") {
        localStorage.darkmode = "false";
        darkmodeEnabled = false;
    } else if (localStorage.darkmode == "false") {
        localStorage.darkmode = "true";
        darkmodeEnabled = true;
    } else {
        localStorage.darkmode = "true";
        darkmodeEnabled = true;
    }
    toggleDarkmode(this);
});

$(window).on('load', function () {
    $(".btn.dropdown-toggle").attr("id", "bs-select-btn");
    $("#bs-select-btn").on("click", selectpickerDmFix);
    if (localStorage.darkmode == "true") {
        $(".dropdown-toggle").toggleClass("btn-light");
        $(".dropdown-toggle").toggleClass("btn-dark");
    }
});

function toggleDarkmode(button) {
    $(button).toggleClass("btn-light");
    $(button).toggleClass("btn-dark");
    $(button).toggleClass("fa-moon");
    $(button).toggleClass("fa-sun");
    $("body").toggleClass("body-darkmode");
    $("footer").toggleClass("page-footer-darkmode");
    $(".thead-dark").toggleClass("thead-darkmode");
    $("table").toggleClass("table-darkmode");
    $("#menu-table-header > th").toggleClass("menu-table-header-darkmode");
    $(".modal-content").toggleClass("modal-content-darkmode");
    $("#hiderMenu").toggleClass("hiderMenu-darkmode");
    $(".hider").toggleClass("hider-darkmode");
    $(".card").toggleClass("card-dark-mode");
    $(".sups-cardboi").toggleClass("sups-cardboi-darkmode");
    $(".allergens-cardboi").toggleClass("allergens-cardboi-darkmode");
    $("#button-previous").toggleClass("navigation-button-darkmode");
    $("#button-next").toggleClass("navigation-button-darkmode");
    $("#button-previous").toggleClass("navigation-button-darkmode:hover");
    $("#button-next").toggleClass("navigation-button-darkmode:hover");
    $(".datePickerInput").toggleClass("datePickerInput-darkmode");
    $(".datePickerInput:focus").toggleClass("datePickerInput-darkmode:focus");
    $(".input-group-text").toggleClass("input-group-text-darkmode");
    $(".dish-content").toggleClass("dish-content-darkmode");
    $(".categoryHeader").toggleClass("categoryHeader-darkmode");
    toggleDropdownDarkmode();
    toggleFlatpickrDark();
}

function selectpickerDmFix() {
    console.log("jannis");
    if (localStorage.darkmode == "true") {
        darkmodeEnabled = true;
        $(".dropdown-toggle").addClass("btn-light");
        $(".dropdown-toggle").addClass("btn-dark");
        $(".dropdown-menu").addClass("dropdown-menu-darkmode");
        $(".dropdown-item").addClass("dropdown-item-darkmode");
        $(".dropdown-item").addClass("dropdown-item-darkmode:hover");
    }
    if (!darkmodeEnabled && $(".dropdown-menu").hasClass("dropdown-menu-darkmode")) {
        $(".dropdown-menu").removeClass("dropdown-menu-darkmode");
        $(".dropdown-item").removeClass("dropdown-item-darkmode");
        $(".dropdown-item").removeClass("dropdown-item-darkmode:hover");
    }
    $("#bs-select-btn").unbind("click", selectpickerDmFix);
}

function toggleDropdownDarkmode() {
    $(".dropdown-toggle").toggleClass("btn-light");
    $(".dropdown-toggle").toggleClass("btn-dark");
    $(".dropdown-menu").toggleClass("dropdown-menu-darkmode");
    $(".dropdown-item").toggleClass("dropdown-item-darkmode");
    $(".dropdown-item").toggleClass("dropdown-item-darkmode:hover");
}

function toggleFlatpickrDark() {
    var stylesheet = document.getElementById("flatpickr-css");
    var stylesheetDark = document.getElementById("flatpickr-css-dark");
    if (stylesheet.disabled) {
        stylesheet.disabled = false;
        stylesheetDark.disabled = true;
    } else {
        stylesheet.disabled = true;
        stylesheetDark.disabled = false;
    }
}