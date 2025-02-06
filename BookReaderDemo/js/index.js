let worker;
let modelRegistry;
let version;

const qs = selector => document.querySelector(selector);
const status = message => (qs("#status").innerText = message);

const langFrom = qs("#lang-from");
const langTo = qs("#lang-to");

const langs = {
    "bg": "Bulgarian",
    "ca": "Catalan",
    "cs": "Czech",
    "nl": "Dutch",
    "en": "English",
    "et": "Estonian",
    "de": "German",
    "fr": "French",
    "is": "Icelandic",
    "it": "Italian",
    "nb": "Norwegian Bokmål",
    "nn": "Norwegian Nynorsk",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "es": "Spanish",
    "uk": "Ukrainian"
};

let supportedFromCodes = {};
let supportedToCodes = {};
let currentTo = null;

if (window.Worker) {
    worker = new Worker("js/worker.js");
    worker.postMessage(["import"]);
}

document.querySelector("#input").addEventListener("keyup", function (event) {
    translateCall();
});


if (BookReader) {    
    const next = BookReader.prototype.next;
    BookReader.prototype.next = function (...args) {
        console.log("BookReader.prototype.next triggered", args);
	let r = next.apply(this, args);

	$('.BRpagecontainer .BRtextLayer').each(function(index) {
	    $(this).attr("data-index", index);
	    if (this.textContent) {
		worker.postMessage(["translate", langFrom.value, langTo.value, [this.textContent], '[data-index="' + index + '"]']);
	    }
	});

	return r	
    };
}

const translateCall = () => {
    const text = document.querySelector("#input").value + "  ";
    if (!text.trim().length) return;
    const paragraphs = text.split("\n");
    qs("#output").setAttribute("disabled", true);
    worker.postMessage(["translate", langFrom.value, langTo.value, paragraphs, '#output']);
    //, qs("#output")]);
};

// This needs to be updates to change #output
worker.onmessage = function (e) {
    if (e.data[0] === "translate_reply" && e.data[1]) {
	console.log(e.data[2]);
	//document.querySelector(e.data[2]).value = e.data[1].join("\n\n");
	document.querySelector(e.data[2]).innerHTML = "<div style='color: black; background: #c6ae94; font-size: 4em;'>" + e.data[1].join("\n\n") + "</div>";
        qs("#output").removeAttribute("disabled");
    } else if (e.data[0] === "load_model_reply" && e.data[1]) {
        status(e.data[1]);
        translateCall();
    } else if (e.data[0] === "import_reply" && e.data[1]) {
        modelRegistry = e.data[1];
        version = e.data[2];
        init();
    }
};

const isSupported = (lngFrom, lngTo) => {
    return (`${lngFrom}${lngTo}` in modelRegistry) ||
        ((`${lngFrom}en` in modelRegistry) && (`en${lngTo}` in modelRegistry))
}

const loadModel = () => {
    const lngFrom = langFrom.value;
    const lngTo = langTo.value;
    if (lngFrom !== lngTo) {
        if (!isSupported(lngFrom, lngTo)) {
            status("Language pair is not supported");
            document.querySelector("#output").value = "";
            return;
        }

        status(`Installing model...`);
        console.log(`Loading model '${lngFrom}${lngTo}'`);
        worker.postMessage(["load_model", lngFrom, lngTo]);
    } else {
        const input = document.querySelector("#input").value;
        document.querySelector("#output").value = input;
    }
};

const findFirstSupportedTo = () => {
    return Object.entries(supportedToCodes).find(([code, ]) => code !== langFrom.value)[0]
}

langFrom.addEventListener("change", e => {
    const setToCode = (currentTo !== langFrom.value)
      ? currentTo
      : findFirstSupportedTo();
    setLangs(langTo, supportedToCodes, setToCode, langFrom.value);
    loadModel();
});

langTo.addEventListener("change", e => {
    currentTo = langTo.value;
    loadModel();
});

qs(".swap").addEventListener("click", e => {
    const prevLangFrom = langFrom.value
    langFrom.value = langTo.value;

    if (prevLangFrom in supportedToCodes) {
        setLangs(langTo, supportedToCodes, prevLangFrom, langFrom.value);
    }
    else {
        langTo.value = null;
    }

    qs("#input").value = qs("#output").value;
    loadModel();
});

const setLangs = (selector, langsToSet, value, exlcude) => {
    selector.innerHTML = "";
    for (const [code, type] of Object.entries(langsToSet)) {
        if (code === exlcude) continue;
        let name = langs[code];
        if (type === "dev") name += " (Beta)";
        selector.innerHTML += `<option value="${code}">${name}</option>`;
    }
    selector.value = value;
}

function init() {
    (qs("#version").innerText = version);

    // parse supported languages and model types (prod or dev)
    supportedFromCodes["en"] = "prod";
    supportedToCodes["en"] = "prod";
    for (const [langPair, value] of Object.entries(modelRegistry)) {
        const firstLang = langPair.substring(0, 2);
        const secondLang = langPair.substring(2, 4);
        if (firstLang !== "en") supportedFromCodes[firstLang] = value.model.modelType;
        if (secondLang !== "en") supportedToCodes[secondLang] = value.model.modelType;
    }

    // try to guess input language from user agent
    let myLang = navigator.language;
    let setFromCode = "en";
    if (myLang) {
        myLang = myLang.split("-")[0];
        if (myLang in supportedFromCodes) {
            console.log("guessing input language is", myLang);
            setFromCode = myLang;
        }
    }
    setLangs(langFrom, supportedFromCodes, setFromCode, null);

    // find first output lang that *isn't* input language
    const setToCode = findFirstSupportedTo();
    setLangs(langTo, supportedToCodes, setToCode, setFromCode);
    currentTo = setToCode;

    // load this model
    loadModel();
}
