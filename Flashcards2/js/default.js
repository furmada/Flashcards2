var local = WinJS.Application.local;
var categories = [];
var studyCards = [];
var currentStudyCard = 0;
var currentCategory;

function confirmAsync(title, msg) {
    var buttons = [
        new Windows.UI.Popups.UICommand("Yes"),
        new Windows.UI.Popups.UICommand("No")];
    return dialogInterceptor(title, msg, buttons).showAsync();
}

function dialogInterceptor(title, msg, buttons) {
    var dialog = new Windows.UI.Popups.MessageDialog(msg, title);
    if (buttons) {
        buttons.forEach(function (button) {
            dialog.commands.append(button);
        });
    }
    return dialog;
}

function exportCategoryToFile() {
    var fws = currentCategory+"!";
    for (c in categories) {
        if (categories[c][0] == currentCategory) {
            for (crd in categories[c][1]) {
                fws += categories[c][1][crd][0] + ":" + categories[c][1][crd][1] + ";";
            }
        }
    }
    var savePicker = new Windows.Storage.Pickers.FileSavePicker();
    savePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
    savePicker.fileTypeChoices.insert("Open Flashcards File", [".ofc"]);
    savePicker.suggestedFileName = "OpenFlashcards-" + currentCategory;
    savePicker.pickSaveFileAsync().then(function (file) {
        if (file) {
            Windows.Storage.CachedFileManager.deferUpdates(file);
            Windows.Storage.FileIO.writeTextAsync(file, fws).done(function () {
                Windows.Storage.CachedFileManager.completeUpdatesAsync(file).done(function (updateStatus) {
                    if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                        WinJS.log && WinJS.log("File " + file.name + " was saved.", "sample", "status");
                    } else {
                        WinJS.log && WinJS.log("File " + file.name + " couldn't be saved.", "sample", "status");
                    }
                });
            });
        } else {
            WinJS.log && WinJS.log("Operation cancelled.", "sample", "status");
        }
    });
}

function importCategoryFromFile() {
    var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
    openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
    openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
    openPicker.fileTypeFilter.replaceAll([".ofc", ".txt"]);
    openPicker.pickSingleFileAsync().then(function (file) {
        if (file) {
            Windows.Storage.FileIO.readTextAsync(file).done(function (data) {
                var p = -1;
                var catName = data.split("!", 2)[0];
                var fCards = data.split("!", 2)[1];
                var clist = [];
                var splitcat = fCards.split(";");
                for (c in splitcat) {
                    var ccrd = splitcat[c];
                    var splitcrd = ccrd.split(":");
                    if (splitcrd.length <= 1) {
                        continue;
                    }
                    clist.push([splitcrd[0], splitcrd[1]]);
                }
                console.log(currentCategory);
                for (c in categories) {
                    if (categories[c][0] == catName) {
                        console.log("Found: "+categories[c][0])
                        p = c;
                        break;
                    }
                }
                if (p == -1) {
                    categories.push([catName, clist]);
                    addCategoriesToSelector();
                }
                else {
                    categories[p][1] = clist;
                }
                currentCategory = catName;
                processCards();
            });
        }
    });
}

function showInput(mode, title) {
    document.getElementById("inputAsk").setAttribute("class", "visible");
    document.getElementById("inputTitle").innerHTML = window.toStaticHTML(title);
    console.log("Showing input: " + mode);
    document.getElementById("inputSingleLine").value = "";
    document.getElementById("inputTxt1").value = "";
    document.getElementById("inputTxt2").value = "";
    if (mode == 'category') {
        document.getElementById("inputSingleLine").setAttribute("class", "visible");
        document.getElementById("inputTxt1").setAttribute("class", "hidden");
        document.getElementById("inputTxt2").setAttribute("class", "hidden");
        document.getElementById("inputSubmit").setAttribute("onclick", "newCategory()");
        document.getElementById("inputSingleLine").focus();
    }
    else if (mode == 'card') {
        document.getElementById("inputSingleLine").setAttribute("class", "hidden");
        document.getElementById("inputTxt1").setAttribute("class", "visible");
        document.getElementById("inputTxt2").setAttribute("class", "visible");
        document.getElementById("inputSubmit").setAttribute("onclick", "addCard()");
        document.getElementById("inputTxt1").focus();
    }
}

function hideInput() {
    document.getElementById("inputAsk").setAttribute("class", "hidden");
    document.getElementById("inputSingleLine").setAttribute("class", "hidden");
    document.getElementById("inputTxt1").setAttribute("class", "hidden");
    document.getElementById("inputTxt2").setAttribute("class", "hidden");
}

function addCard() {
    console.log("addCard");
    var front = document.getElementById("inputTxt1").value;
    var back = document.getElementById("inputTxt2").value;
    for (c in categories) {
        if (categories[c][0] == currentCategory) {
            categories[c][1].push([front, back]);
        }
    }
    processCards(currentCategory);
    hideInput();
}

function loadNextCard() {
    if (currentStudyCard >= studyCards.length - 1) {
        currentStudyCard = 0;
    }
    else {
        currentStudyCard++;
    }
    document.getElementById("studyCardHolder").innerHTML = "";
    console.log("Next card: " + studyCards[currentStudyCard][0] + ":" + studyCards[currentStudyCard][1]);
    var dom = formCardDom(studyCards[currentStudyCard][0], studyCards[currentStudyCard][1]);
    document.getElementById("studyCardHolder").appendChild(dom);
}

function studyMode() {
    console.log("Study Mode.");
    if (document.getElementById("studyMode").getAttribute("class") == "visible") {
        document.getElementById("studyMode").setAttribute("class", "hidden");
        return;
    }
    document.getElementById("studyTitle").innerHTML = "Study: "+currentCategory;
    document.getElementById("studyMode").setAttribute("class", "visible");
    studyCards = [];
    for (c in categories) {
        if (categories[c][0] == currentCategory) {
            for (crd in categories[c][1]) {
                studyCards.push(categories[c][1][crd]);
            }
        }
    }
    currentStudyCard = -1;
    studyNext();
}

function studyFlip(knew) {
    console.log("Card known: " + knew);
    if (knew == true) {
        for (sc in studyCards) {
            if (studyCards[sc][0] == studyCards[currentStudyCard][0] && studyCards[sc][1] == studyCards[currentStudyCard][1]) {
                console.log("Card deleted.");
                studyCards.splice(sc, 1);
                break;
            }
        }
    }
    if (knew == false) {
        currentStudyCard++;
    }
    document.getElementById("studyQuestion").innerHTML = "Review, then tap Next";
    var toflip = document.getElementById("studyCardHolder").firstChild;
    toflip.setAttribute("class", "card back");
    toflip.firstChild.innerHTML = toflip.lastChild.innerHTML.split(":")[1];
    document.getElementById("studyForgot").setAttribute("class", "hidden");
    document.getElementById("studyKnow").setAttribute("class", "hidden");
    document.getElementById("studyNext").setAttribute("class", "visible");
}

function studyNext() {
    document.getElementById("studyQuestion").innerHTML = "Do you know this?";
    document.getElementById("studyForgot").setAttribute("class", "visible");
    document.getElementById("studyKnow").setAttribute("class", "visible");
    document.getElementById("studyNext").setAttribute("class", "hidden");
    if (studyCards.length == 0) {
        confirmAsync("You know all the cards!", "Start again?").done(function (button) {
            if (button.label == "No") {
                studyMode();
            }
            if (button.label == "Yes") {
                studyCards = [];
                for (c in categories) {
                    if (categories[c][0] == currentCategory) {
                        for (crd in categories[c][1]) {
                            studyCards.push(categories[c][1][crd]);
                        }
                    }
                }
                currentStudyCard = -1;
                studyNext();
            }
        });
    }
    else {
        loadNextCard();
    }
}

function newCategory() {
    console.log("newCategory");
    var cname = document.getElementById("inputSingleLine").value;
    categories.push([cname, []]);
    addCategoriesToSelector();
    hideInput();
}

function categoryConfirmRemove(ev) {
    confirmAsync("This category ("+currentCategory+") will be deleted", "Are you sure you want to do continue?")
                .done(function (button) {
                    if (button.label == "Yes") {
                        removeCategory();
                    }
                });
}

function removeCategory() {
    for (c in categories) {
        if (categories[c][0] == currentCategory) {
            if (categories.length > 1) {
                categories.splice(c, 1);
            }
            else {
                categories = [["Default", [["You must have at least one category.", "Delete to hide."]]]];
            }
            break;
        }
    }
    currentCategory = categories[0][0];
    processCards(currentCategory);
    addCategoriesToSelector();
}

function cardConfirmRemove(ev) {
    confirmAsync("This card will be deleted", "Are you sure you want to do continue?")
                .done(function (button) {
                    if (button.label === "Yes") {
                        removeCard(ev);
                    }
                });
}

function removeCard(ev) {
    console.log("removeCard");
    var cdiv = ev.srcElement.parentNode;
    var front;
    var back;
    for (cn in cdiv.childNodes) {
        var cnode = cdiv.childNodes[cn];
        if (cnode.tagName == "DIV") {
            console.log("Found div");
            var inner = cnode.innerHTML;
            front = inner.split(":")[0];
            back = inner.split(":")[1];
            console.log(front + ":" + back);
            for (c in categories) {
                var cat = categories[c];
                for (crd in cat[1]) {
                    if (cat[1][crd][0] == front && cat[1][crd][1] == back) {
                        console.log("Found match.");
                        cat[1].splice(crd, 1);
                        processCards(currentCategory);
                    }
                }
            }
        }
    }
}

function reload() {
    processCards(currentCategory);
}

function onCategoryChange() {
    var cat = document.getElementById("catSelect").value;
    console.log("Registered selected category: " + cat);
    currentCategory = cat;
    processCards(cat);
}

function addCategoriesToSelector() {
    console.log("Adding categories to selector.");
    document.getElementById("catSelect").innerHTML = "";
    categories.forEach(function (c) {
        var opt = document.createElement("option");
        opt.innerHTML = c[0];
        document.getElementById("catSelect").appendChild(opt);
    })
}

function categoriesToLocal() {
    var cstr = "";
    for (c in categories) {
        cstr += categories[c][0] + ";";
    }
    console.log(cstr);
    local.writeText("categories", cstr);
}

function cardsToLocal() {
    categories.forEach(function (cat) {
        var cstr = "";
        for (c in cat[1]) {
            cstr += cat[1][c][0] + ":" + cat[1][c][1] + ";";
        }
        console.log(cstr);
        var ccname = "category_".concat(cat[0]);
        local.writeText(ccname, cstr);
    });
}

function localToCategories(init0) {
    categories = [];
    local.readText("categories", "Default").then(function (data) {
        console.log("Raw Dump for Categories: " + data);
        if (data.charAt(data.length - 1) == ";") {
            console.log("Detected trailing semicolon.");
            data = data.slice(0, data.length - 1);
            console.log("Repaired data: " + data);
        }
        var sdata = data.split(";");
        for (p in sdata) {
            var ccat = sdata[p];
            console.log("Current Category: " + ccat);
            categories.push([ccat])
            localToCards(ccat, p);
        }
        currentCategory = categories[0][0];
        addCategoriesToSelector();
        WinJS.Promise.timeout(500).then(function (c) {
            processCards(currentCategory);
        });
    });
}

function localToCards(category, addTo) {
    var toret = [];
    console.log("Loading cards for " + category);
    local.readText("category_" + category, "").then(function (data) {
        console.log("Raw Dump for Category: " + data);
        if (data == "" && category == "Default") {
            data = "Welcome to Flashcards:This is the flipside of a card;";
        }
        if (data.charAt(data.length - 1) == ";") {
            console.log("Detected trailing semicolon.");
            data = data.slice(0, data.length - 1);
            console.log("Repaired data: " + data);
        }
        var splitcat = data.split(";");
        for (c in splitcat) {
            var ccrd = splitcat[c];
            var splitcrd = ccrd.split(":");
            if (splitcrd.length <= 1) {
                continue;
            }
            toret.push([splitcrd[0], splitcrd[1]]);
        }
        categories[addTo].push(toret);
    });
}

function formCardDom(front, back) {
    console.log("Forming dom: " + front + " : " + back);
    var parentDiv = document.createElement("div");
    parentDiv.setAttribute("class", "card front");
    var p = document.createElement("h2");
    p.innerHTML = front;
    parentDiv.appendChild(p);
    var delbtn = document.createElement("button");
    delbtn.innerHTML = "-";
    delbtn.onclick = function (ev) { cardConfirmRemove(ev);}
    parentDiv.appendChild(delbtn);
    var idiv = document.createElement("div");
    idiv.innerHTML = front + ":" + back;
    parentDiv.appendChild(idiv);
    parentDiv.onclick = function (ev) {
        elem = ev.srcElement;
        if (ev.srcElement.tagName == "H2") {
            elem = ev.srcElement.parentNode;
        }
        switch (elem.getAttribute("class")) {
            case ("card front"):
                elem.setAttribute("class", "card back");
                elem.firstChild.innerHTML = back;
                break;
            case ("card back"):
                elem.setAttribute("class", "card front");
                elem.firstChild.innerHTML = front;
                break;
        }
    }
    return parentDiv;
}

function processCards(category) {
    console.log("ProcessCards: "+category)
    document.getElementById("cardHolder").innerHTML = "";
    for (c in categories) {
        if (categories[c][0] == category) {
            for (crd in categories[c][1]) {
                var dom = formCardDom(categories[c][1][crd][0], categories[c][1][crd][1]);
                document.getElementById("cardHolder").appendChild(dom);
            }
        }
    }
}

(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            localToCategories(true);
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
        args.setPromise(new WinJS.Promise(function (){
            console.log("Suspending");
            categoriesToLocal();
            cardsToLocal();
        }));
    };

    WinJS.Application.onsettings = function (e) {
        e.detail.applicationcommands = {
            "Settings": { title: "Settings" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    };
    app.onunload = function () {
        console.log("Unloading");
        categoriesToLocal();
        cardsToLocal();
    }

    app.start();
})();
