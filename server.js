const fs = require('fs');
const jsdom = require('jsdom');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { JSDOM } = jsdom;
const seezeitURL = 'https://www.seezeit.com/essen/speiseplaene/';
const defaultMensa = 'mensa-giessberg';
const app = express();

const privateKey = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/privkey.pem', 'utf8');
const cert = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/mensauni.de/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: cert,
	ca: ca
}
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);


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
 * @param {*} excludeTags Array with tags as strings (Veg, Vegan, Sch, R, G, L, W, F, B)
 * @param {*} excludeSup Array with supplements as strings.
 */
function filterMenu(menus, excludeSup, excludeTags) {
    menus.forEach((menu) => {
        let filtered = [];
        menu.dishes.forEach((item) => {
            let tags = item.Tags;
            let supplements = getSupplements(item.Name);
            if (!excludeSup) {
                console.log("not");
            }
            if (!tags.find(m => excludeTags.includes(m)) && !supplements.some(m => excludeSup.includes(m))) {
                filtered.push(item);
            }
        });
        menu.dishes = filtered;
    })
    return menus;
}

function parseQuery(req, res, next) {
    if (!req.query.mensa) {
        req.query.mensa = defaultMensa + "/";
    }    
    const supplements = [];
    if (Array.isArray(req.query.excludeSup) || Array.isArray(req.query.excludeTags)) {
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

    const tags = [];
    if (req.query.excludeTags) {
        req.query.excludeTags.split(",").forEach((elem) => {
            if (!tags.includes(elem)) {
                tags.push(elem);
            }
        });
    }
    req.query.excludeTags = tags;
    next();
}

app.get("/api", cors(), parseQuery, (req, res) => {
    if (req.query.excludeTags.length != 0 || req.query.excludeSup.length != 0) {
        console.log("GET received from " + req.ip + " with Query: " + req.query.excludeSup + " " + req.query.excludeTags);
    } else {
        console.log("GET received from " + req.ip);
    }
    JSDOM.fromURL(seezeitURL + req.query.mensa, '').then(dom => {
        let menus = getAllMenus(dom.window.document);
        let menusFiltered = filterMenu(menus, req.query.excludeSup, req.query.excludeTags);
        res.json(menusFiltered).status(200);
    });
})


/* Set up server */
app.all('*', ensureSecure);
app.use(express.static('/var/opt/preventingredient31/frontend'));
app.use(helmet());
function ensureSecure (req, res, next) {
	        if (req.secure) {
			next();
		} else {
			res.redirect('https://' + req.headers.host + req.url);
		}
}
httpServer.listen(80, () => {
	console.log('We need less 31! Listening on port 80');
	httpsServer.listen(443, () => {
		console.log("We need less 31! HTTPS Server listening on port 443");
		process.setgid('node_server');
		process.setuid('node_server');
		console.log("Dropped root, switched to user node_server");
	});

});