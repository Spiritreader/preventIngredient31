const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mcache = require('memory-cache');
const seezeitURL = 'https://www.seezeit.com/essen/speiseplaene/';
const defaultMensa = 'mensa-giessberg';
//cache duration in seconds
const cacheDuration = (3600 * 12);

/**
 * Retrieves all menus for each day available as well as all dishes for each menu
 * @param {*} dom the dom element to parse
 */
function getAllMenus(dom) {
    let menus = [];
    let daysAvailable = [];

    //Get days for which a menu is available
    dom.querySelectorAll(".tab").forEach((elem) => {
        elem = elem.text;
        daysAvailable.push(new Date(new Date().getFullYear(), (parseInt(elem.split(".")[2]) - 1), parseInt(elem.split(".")[1]), 12));
    });

    for (let i = 1; i <= daysAvailable.length; i++) {
        // Object for a daily menu
        let menuForDay = {
            date: daysAvailable[i - 1],
            dishes: []
        };

        //Retrieve all dishes for selected day i
        let currentMenu = dom.querySelectorAll("#tab" + i + " .title");
        for (let j = 0; j < currentMenu.length; j++) {
            let pricing = currentMenu[j].parentElement.getElementsByClassName("preise")
            if (pricing[0]) {
                pricing = pricing[0].textContent;
                let pricingStudentsDe = pricing.match(/\d*,\d* € Studierende/);
                let pricingStudentsEn = pricing.match(/\d*,\d* € student/);
                if (pricingStudentsDe) {
                    pricing = pricingStudentsDe[0].substring(0, pricingStudentsDe[0].indexOf("Studierende")).trim();
                } else if (pricingStudentsEn) {
                    pricing = pricingStudentsEn[0].substring(0, pricingStudentsEn[0].indexOf("student")).trim();
                }
            } else {
                pricing = "-";
            }
            if (currentMenu[j].textContent) {
                if (currentMenu[j].textContent.includes("Fleischbällchen")) {
                    currentMenu[j].textContent = currentMenu[j].textContent.replace("Fleischbällchen", "leischbällchen")
                }
            }
            let tagElements = currentMenu[j].parentElement.parentElement.getElementsByClassName("speiseplanTagKatIcon");
            let menuItem = {
                Name: currentMenu[j].textContent,
                Category: currentMenu[j].parentElement.parentElement.parentElement.querySelector("div").textContent,
                Pricing: pricing
            }
            let tags = [];
            for (let k = 0; k < tagElements.length; k++) {
                let tag = tagElements[k].className.split(" ")[1];
                if (tag) {
                    tags.push(tag);
                }
            }
            menuItem.Tags = tags;
            //Add each menuItem to the dishes list for the current day i
            menuForDay.dishes.push(menuItem);
        }
        //Add menu to menuList
        menus.push(menuForDay);
    }
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
        let res = ing.match(/\(\d.*\)/);
        if (res) {
            res = res[0].replace("(", "").replace(")", "");
            res.split(",").forEach((elem) => {
                if (!supplements.includes(elem)) {
                    supplements.push(elem);
                }
            });
        }
    })
    return supplements.sort();
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

function handleApiGet(req, res) {
    if ((req.query.includeTags && req.query.includeTags.length != 0) || req.query.excludeSup.length != 0) {
        console.log("GET received from " + req.ip + " with Query: " + req.query.excludeSup + " " + req.query.includeTags);
    } else {
        console.log("GET received from " + req.ip);
    }
    let key = '__express__' + req.query.mensa;
    let cachedBody = mcache.get(key);
    if (cachedBody) {
        console.log("Returning cached result with cache: " + mcache.keys());
        res.send(cachedBody);
        return;
    } else {
        console.log("Returning non-cached result.");
        JSDOM.fromURL(seezeitURL + req.query.mensa, '').then(dom => {
            let menus = getAllMenus(dom.window.document);
            let menusFiltered = filterMenu(menus, req.query.excludeSup, req.query.includeTags);
            mcache.put(key, menusFiltered, cacheDuration * 1000);
            res.json(menusFiltered).status(200);
        });
    }
}

function parseQuery(req, res, next) {
    if (!req.query.mensa) {
        req.query.mensa = defaultMensa;
    }
    const supplements = [];
    if (Array.isArray(req.query.excludeSup) || Array.isArray(req.query.includeTags)) {
        res.send("400: Bad request boi. Do not send multiple queries of the same name!").status(400);
        return;
    }

    if (req.query.excludeSup) {
        req.query.excludeSup.split(",").forEach((elem) => {
            if (!supplements.includes(elem)) {
                supplements.push(elem);
            }
        });
    }
    req.query.excludeSup = supplements;

    if (req.query.includeTags) {
        const tags = [];
        req.query.includeTags.split(",").forEach((elem) => {
            if (!tags.includes(elem)) {
                tags.push(elem);
            }
        });
        req.query.includeTags = tags;
    }
    next();
}

module.exports.parseQuery = parseQuery;
module.exports.handleApiGet = handleApiGet;
