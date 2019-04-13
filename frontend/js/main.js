let excludeSup = [];
let includeTags = [];

function onChangeCheckbox() {
    let url = "/api";
    let data;
    $("input[type='checkbox']").on("change", function () {
        if (this.checked) {
            if (this.className.split(" ").includes("sups-checkbox")) {
                excludeSup.push(this.id);
            } else if (this.className.split(" ").includes("tags-checkbox")) {
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
        showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
    })
}

function showMenu(menu, day) {
    let tableBody = document.getElementById("dishes");
    document.getElementById("dishes").innerHTML = "";
    //let dishes = menu[day].dishes;
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
    menuToFind.dishes.forEach((dish) => {
        let dishItemList = dish.Name.split("|");
        for (let i = 0; i < dishItemList.length; i++) {
            let dishListRegexMatch = dishItemList[i].match(/\(\d([a-zA-Z]|\d|,)*\)/g);
            let name = dishItemList[i].replace(dishListRegexMatch, "").trim();
            /*let name = dishItemList[i];
            if (dishListRegexMatch) {
                dishListRegexMatch.forEach((rex) => {
                    name = name.replace(rex, "").trim();
                })
            }*/
            let supplements = dishListRegexMatch ? dishListRegexMatch.toString() : "";
            if (supplements !== "") {
                supplements = supplements.replace(/\(|\)/g, "");
                let splittedSups = supplements.split(",");
                for (let j = 0; j < splittedSups.length; j++) {
                    let allergen = supplementTranslation.Allergene[splittedSups[j]];
                    let additive = supplementTranslation.Zusatzstoffe[splittedSups[j]];
                    let tag = supplementTranslation.Kategorien[splittedSups[j]];
                    if (allergen) {
                        splittedSups[j] = "<span data-toggle=\"tooltip\" title=\"" + allergen + "\" data-placement=\"top\" class=\"badge badge-green " + splittedSups[j] + "\">" + splittedSups[j] + "</span>";
                    } else if (additive) {
                        splittedSups[j] = "<span data-toggle=\"tooltip\" title=\"" + additive + "\" data-placement=\"top\" class=\"badge badge-red " + splittedSups[j] + "\">" + splittedSups[j] + "</span>";
                    }
                }
                supplements = splittedSups.join(" ");
                // console.log(splittedSups);
            }

            dishItemList[i] = name + " " + supplements + " <br/>";
        }
        let tags = dish.Tags;
        let newElement = "<tr><th colspan=\"3\" class=\"categoryHeader\">" + dish.Category + "</th></tr>" +
            "<tr><td>" + dishItemList.join("") + "</td>" +
            "<td>" + dish.Pricing + "</td>" +
            "<td>";
        tags.forEach((tag) => {
            newElement += "<img class=\"tagImg\" src=\"./img/" + tag + ".png\" />  "
        })
        newElement += "</td></tr>";
        let el = parser.parseFromString(newElement, "text/xml");
        tableBody.insertAdjacentHTML("beforeend", newElement);
    })
    updateHeaderDay();
    $(function () {
        $('[data-toggle="tooltip"]').tooltip({
            boundary: 'window'
        })
    });
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

function previous() {
    let currentMenu = matchMenuDay(menuAll, globalSelectedDate);
    if (currentMenu != -1) {
        if (menuAll[currentMenu - 1]) {
            globalSelectedDate = new Date(menuAll[currentMenu - 1].date);
            menuDatePickr.setDate(globalSelectedDate);
            //showMenu(menuAll, globalSelectedDate);
            let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
            showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
        }
    }
    if (globalSelectedDate.toDateString() === menuFirstDay.toDateString()) {
        document.getElementById("button-previous").classList.add("disabled");
    }
    if (globalSelectedDate.toDateString() !== menuLastDay.toDateString()) {
        document.getElementById("button-next").classList.remove("disabled");
    }
}

function next() {
    let currentMenu = matchMenuDay(menuAll, globalSelectedDate);
    if (currentMenu != -1) {
        if (menuAll[currentMenu + 1]) {
            globalSelectedDate = new Date(menuAll[currentMenu + 1].date);
            menuDatePickr.setDate(globalSelectedDate);
            //showMenu(menuAll, globalSelectedDate);
            let menuToBeFiltered = JSON.parse(JSON.stringify(menuAll));
            showMenu(filterMenu(menuToBeFiltered, excludeSup, (includeTags.length != 0) ? includeTags : undefined), globalSelectedDate);
        }
    }
    if (globalSelectedDate.toDateString() === menuLastDay.toDateString()) {
        document.getElementById("button-next").classList.add("disabled");
    }
    if (globalSelectedDate.toDateString() !== menuFirstDay.toDateString()) {
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