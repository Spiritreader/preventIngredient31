const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mcache = require('memory-cache');
const parseString = require('xml2js').parseString;
const http = require('http');
const seezeitDE = 'https://www.seezeit.com/essen/speiseplaene/';
const seezeitEN = 'https://www.seezeit.com/en/food/menus/';
const seezeitXmlDE = 'http://www.max-manager.de/daten-extern/seezeit/xml/%i/speiseplan.xml';
const seezeitXmlEN = 'http://www.max-manager.de/daten-extern/seezeit/xml/%i/speiseplan_en.xml';
const defaultMensaDE = 'mensa-giessberg';
const defaultMensaEN = 'giessberg-canteen'
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

function convertXmltoJson(xml) {
    menus = [];
    if (!xml) {
        return menus;
    }
    xml.speiseplan.tag.forEach((day) => {
        let menu = {
            date: new Date(day.$.timestamp * 1000),
            dishes: []
        };
        day.item.forEach((item) => {
            let tags = [];
            item.icons[0].split(",").forEach((icon) => {
                switch (icon) {
                    case "23": tags.push("B");
                    break;
                    case "24": tags.push("Vegan");
                    break;
                    case "45": tags.push("Sch");
                    break; 
                    case "46": tags.push("R");
                    break; 
                    case "48": tags.push("L");
                    break; 
                    case "49": tags.push("G");
                    break; 
                    case "50": tags.push("F");
                    break;
                    case "51": tags.push("Veg");
                    break; 
                    case "52": tags.push("W");
                    break; 
                }                    
            });
            const gramPrice = "Pro 100g: "
            if (item.category && ((item.category[0] === "Bioessen") || (item.category[0] === "Wok"))) {
                if (item.preis1) {
                    item.preis1[0] = gramPrice + item.preis1[0];
                }
                if (item.preis2) {
                    item.preis2[0] = gramPrice + item.preis2[0];
                }
                if (item.preis3) {
                    item.preis3[0] = gramPrice + item.preis3[0];
                }
                if (item.preis4) {
                    item.preis4[0] = gramPrice + item.preis4[0];
                }
            }
            if (item.title && item.title[0].includes("Fleischbällchen")) {
                item.title[0] = item.title[0].replace("Fleischbällchen", "leischbällchen");
            } 
            dish = {
                Name: item.title ? item.title[0] : "",
                Category: item.category ? item.category[0]: "",
                Pricing: item.preis1 ? item.preis1[0] + " €" : "",
                PricingSchool: item.preis2 ? item.preis2[0] + " €": "",
                PricingEmp: item.preis3 ? item.preis3[0] + " €" : "",
                PricingGuest: item.preis4 ? item.preis4[0] + " €": "",
                Tags: tags
            }
            menu.dishes.push(dish)
        });
        menus.push(menu);
    });
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
        console.log("API v1: GET received from " + req.ip + " with query " + "exclude_sups=(" + req.query.excludeSup + ") include_tags=(" + req.query.includeTags + ")");
        console.log("API v1: user-agent: " + req.get('User-Agent'));
    } else {
        console.log("API v1: GET received from " + req.ip);
        console.log("API v1: user-agent: " + req.get('User-Agent'));
    }
    let key = '__express__' + req.query.mensa;
    let cachedBody = mcache.get(key);
    if (cachedBody) {
        console.log("API v1: Returning cached result for " + req.query.mensa + " with cache: " + mcache.keys());
        res.json(filterMenu(JSON.parse(JSON.stringify(cachedBody)), req.query.excludeSup, req.query.includeTags)).status(200);
    } else {
        console.log("API v1: Returning non-cached result for " + req.query.mensa);
        JSDOM.fromURL(req.query.langURL + req.query.mensa, '').then(dom => {
            let menus = getAllMenus(dom.window.document);
            let menusFiltered = filterMenu(JSON.parse(JSON.stringify(menus)), req.query.excludeSup, req.query.includeTags);
            mcache.put(key, menus, cacheDuration * 1000);
            res.json(menusFiltered).status(200);
        });
    }
}

function handleApiV2Get(req, res) {
    if ((req.query.includeTags && req.query.includeTags.length != 0) || req.query.excludeSup.length != 0) {
        console.log("API v2: GET received from " + req.ip + " for " + req.query.mensa + " with query " + "exclude_sups=(" + req.query.excludeSup + ") include_tags=(" + req.query.includeTags + ")");
        console.log("API v2: User Agent: " + req.get('User-Agent'));
    } else {
        console.log("API v2: GET received from " + req.ip + " for " + req.query.mensa)
        console.log("API v2: User Agent: " + req.get('User-Agent'));
    }
    http.get(req.query.langURL, (httpRes) => {
        const { statusCode } = httpRes;
        const contentType = httpRes.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/xml/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/xml but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            httpRes.resume();
            return;
        }

        httpRes.setEncoding('utf8');
        let rawData = '';
        httpRes.on('data', (chunk) => { rawData += chunk; });
        httpRes.on('end', () => {
            parseString(rawData, function (err, result) {
                if (err) {
                    res.send("it's all fucked up m8").status(503);
                    return;
                }
                res.json(filterMenu(convertXmltoJson(result), req.query.excludeSup, req.query.includeTags)).status(200);
            });
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
}

function parseQuery(req, res, next) {
    if (!req.query.lang) {
        req.query.lang = "de";
        req.query.langURL = seezeitDE;
    } else if (req.query.lang !== "de" && req.query.lang !== "en") {
        req.query.lang = "de";
        req.query.langURL = seezeitDE;
    } else if (req.query.lang === "en") {
        req.query.langURL = seezeitEN;
    } else if (req.query.lang === "de") {
        req.query.langURL = seezeitDE;
    }

    if (!req.query.mensa && req.query.lang === "de") {
        req.query.mensa = defaultMensaDE;
    } else if (!req.query.mensa && req.query.lang === "en") {
        req.query.mensa = defaultMensaEN;
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

function convertQueryToXmlFormat(req, res, next) {
    if (req.query.langURL === seezeitDE) {
        req.query.langURL = seezeitXmlDE.replace("%i", req.query.mensa.replace("-", "_"));
    } else if (req.query.langURL === seezeitEN) {
        if (req.query.mensa === defaultMensaEN) {
            req.query.mensa = defaultMensaDE;
        }
        req.query.langURL = seezeitXmlEN.replace("%i", req.query.mensa.replace("-", "_"));
    }
    next();
}

module.exports.parseQuery = parseQuery;
module.exports.handleApiGet = handleApiGet;
module.exports.convertQueryToXmlFormat = convertQueryToXmlFormat;
module.exports.handleApiV2Get = handleApiV2Get;