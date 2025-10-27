const kartenNamen = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king','ace'];
const farben = ['of_spades', 'of_hearts', 'of_diamonds', 'of_clubs']


let spielerKarten = [];
let dealerKarten = [];

// Spieleinstellungen
let guthaben = 100;
let einsatz = 10;
const MIN_EINSATZ = 10;
const MAX_EINSATZ = 500;
const EINSATZ_STEP = 10;

//mischen
function shuffle(karten) {
  for (let i = karten.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [karten[i], karten[j]] = [karten[j], karten[i]];
  }
  return karten;
}

//karte ziehen
function drawCard() {
    return karten.pop();
}

//schnelles deaktivieren der Buttons
function disableAllButtons() {
    const standBtn = document.getElementById('stand-btn');
    const hitBtn = document.getElementById('hit-btn');
    const splitBtn = document.getElementById('split-btn');
    standBtn.disabled = true;
    hitBtn.disabled = true;
    splitBtn.disabled = true;
    standBtn.classList.remove('active');
    hitBtn.classList.remove('active');
    splitBtn.classList.remove('active');
    standBtn.classList.add('inactive');
    hitBtn.classList.add('inactive');
    splitBtn.classList.add('inactive');
}

disableAllButtons();

// s.o.
function enableButtons() {
    const standBtn = document.getElementById('stand-btn');
    const hitBtn = document.getElementById('hit-btn');
    const splitBtn = document.getElementById('split-btn');
    standBtn.disabled = false;
    hitBtn.disabled = false;
    standBtn.classList.remove('inactive');
    hitBtn.classList.remove('inactive');
    standBtn.classList.add('active');
    hitBtn.classList.add('active');
    checkSplitPossible(); 
}

// wert auf bildschirm anzeigen
function valueToText() {
    if (dealerKarten.length > 1 && !dealerRevealed) {
        const sichtbareKarten = [dealerKarten[1]];
        document.getElementById('dealer-value').textContent = handValue(sichtbareKarten);
    } else {
        document.getElementById('dealer-value').textContent = handValue(dealerKarten);
    }
    document.getElementById('player-value').textContent = handValue(spielerKarten);
}

// value zu bildern ändern + diese anzeigen
function renderDealerHand(hand, containerId) {
    const container = document.getElementById('dealer-hand');
    container.innerHTML = '';
    
    hand.forEach((card, index) => {
        const img = document.createElement('img');
        if (index === 0 && !dealerRevealed) {
            img.src = 'pics/karten/back.png';
            img.alt = 'verdeckte_karte';
        } else {
            img.src = `pics/karten/${card.karte}_${card.farbe}.png`;
            img.alt = `${card.karte}_${card.farbe}`;
        }
        img.className = 'karte-img';
        container.appendChild(img);
    });
}

// s.o.
function renderPlayerHand(hand, containerId) {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    hand.forEach(card => {
        const img = document.createElement('img');
        img.src = `pics/karten/${card.karte}_${card.farbe}.png`;
        img.alt = `${card.karte}_${card.farbe}`;
        img.className = 'karte-img';
        container.appendChild(img);
    });
}

// initiale karten austeilen
function dealInitialCards() {
    spielerKarten = [];
    dealerKarten = [];
    
    spielerKarten.push(drawCard());
    dealerKarten.push(drawCard());
    spielerKarten.push(drawCard());
    dealerKarten.push(drawCard());
    
    return { spielerKarten, dealerKarten };
}

// hand wert berechnen
function handValue(hand) {
    let value = 0;
    let aceCount = 0;
    hand.forEach(card => {
        if (card.karte === 'ace') {
            aceCount++;
            value += 11;
        } else if (['king', 'queen', 'jack'].includes(card.karte)) {
            value += 10;
        } else {
            value += parseInt(card.karte);
        }
    });
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    return value;
}


// dealer karte verdecken
let dealerRevealed = false;

// Währungs-UI aktualisieren
function updateWährungUI() {
    document.getElementById('guthaben').innerText = guthaben;
    document.getElementById('einsatz').innerText = einsatz;
    document.getElementById('einsatz-minus').disabled = einsatz <= MIN_EINSATZ;
    document.getElementById('einsatz-plus').disabled = einsatz >= MAX_EINSATZ || einsatz + EINSATZ_STEP > guthaben;
    updateHighscore(guthaben);
}

// Währung anpassen
function adjustGuthaben(result) {
    if (result === 'win') {
        guthaben += einsatz * 2;
    } else if (result === 'draw') {
        guthaben += einsatz;
    }
    updateWährungUI();
}

// Highscore verwalten. gespeichert wird im localStorage
function updateHighscore(guthaben) {
    let highscore = localStorage.getItem("blackjack_highscore");

    if (!highscore || guthaben > parseInt(highscore)) {
        localStorage.setItem("blackjack_highscore", guthaben);
        highscore = guthaben;
    }

    document.getElementById("highscore").innerText = highscore;
}

// Highscore laden
function loadHighscore() {
    let highscore = localStorage.getItem("blackjack_highscore");
    if (highscore) {
        document.getElementById("highscore").innerText = highscore;
    } else {
        document.getElementById("highscore").innerText = 0;
    }
}

// asynchrones Ende des Spiels für normales Spiel. Warten zwischen den Zügen des Dealers
async function finishNormalGame() {
    // Dealer-Karten aufdecken
    dealerRevealed = true;
    renderDealerHand(dealerKarten, 'dealer-hand');
    
    let dealerValue = handValue(dealerKarten);
    
    while (dealerValue < 17) {
        await new Promise(resolve => setTimeout(resolve, 800));
        dealerKarten.push(drawCard());
        dealerValue = handValue(dealerKarten);
        renderDealerHand(dealerKarten, 'dealer-hand');
        valueToText();
    }
    
    const playerValue = handValue(spielerKarten);
    valueToText();
    
    let result = '';
    if (playerValue > 21) {
        result = 'Du hast verloren!';
    } else if (dealerValue > 21 || playerValue > dealerValue) {
        result = 'Du hast gewonnen!';
        adjustGuthaben('win');
    } else if (playerValue < dealerValue) {
        result = 'Du hast verloren!';
    } else {
        result = 'Unentschieden!';
        adjustGuthaben('draw');
    }
    document.getElementById('resultat').innerText = result;
    disableAllButtons();
}
// s.o. für split
async function finishSplitGame() {
    dealerRevealed = true;
    renderDealerHand(dealerKarten, 'dealer-hand');
    
    let dealerValue = handValue(dealerKarten);
    
    while (dealerValue < 17) {
        await new Promise(resolve => setTimeout(resolve, 800));
        dealerKarten.push(drawCard());
        dealerValue = handValue(dealerKarten);
        renderDealerHand(dealerKarten, 'dealer-hand');
        valueToText();
    }
    const value1 = handValue(splitHand1);
    const value2 = handValue(splitHand2);
    valueToText();
    
    let result = '';
    let winCount = 0, drawCount = 0;
    
    if (value1 > 21) {
        result += 'Hand 1 verloren! ';
    } else if (dealerValue > 21 || value1 > dealerValue) {
        result += 'Hand 1 gewonnen! ';
        winCount++;
    } else if (value1 < dealerValue) {
        result += 'Hand 1 verloren! ';
    } else {
        result += 'Hand 1 unentschieden! ';
        drawCount++;
    }
    
    if (value2 > 21) {
        result += 'Hand 2 verloren!';
    } else if (dealerValue > 21 || value2 > dealerValue) {
        result += 'Hand 2 gewonnen!';
        winCount++;
    } else if (value2 < dealerValue) {
        result += 'Hand 2 verloren!';
    } else {
        result += 'Hand 2 unentschieden!';
        drawCount++;
    }
    
    document.getElementById('resultat').innerText = result;
    guthaben += winCount * einsatz * 2 + drawCount * einsatz;
    updateWährungUI();
    disableAllButtons();
    splitActive = false;
}

// überprüfen ob blackjack auf dem tisch liegt
function checkForBlackjack() {
    if (splitActive) return false;
    
    const playerValue = handValue(spielerKarten);
    const dealerValue = handValue([dealerKarten[1]]); 

    if (playerValue === 21) {
        const dealerFullValue = handValue(dealerKarten);
        dealerRevealed = true;
        renderDealerHand(dealerKarten, 'dealer-hand');
        valueToText();
        
        if (dealerFullValue === 21) {
            document.getElementById('resultat').innerText = 'Beide haben Blackjack! Unentschieden!';
            adjustGuthaben('draw');
        } else {
            document.getElementById('resultat').innerText = 'Blackjack! Du hast gewonnen!';
            adjustGuthaben('win');
        }
        disableAllButtons();
        return true;
    }
    return false;
}

document.getElementById('einsatz-minus').addEventListener('click', () => {
    if (einsatz > MIN_EINSATZ) {
        einsatz -= EINSATZ_STEP;
        updateWährungUI();
    }
});

document.getElementById('einsatz-plus').addEventListener('click', () => {
    if (einsatz + EINSATZ_STEP <= MAX_EINSATZ && einsatz + EINSATZ_STEP <= guthaben) {
        einsatz += EINSATZ_STEP;
        updateWährungUI();
    }
});

document.getElementById('all-in-btn').addEventListener('click', () => {
    einsatz = Math.min(guthaben, MAX_EINSATZ);
    updateWährungUI();
});

// Initialisierung von Highscore und Währungs
updateWährungUI();
loadHighscore();

let karten = [];

// Neues Spiel starten
document.getElementById('new-game-btn').addEventListener('click', () => {
    if (guthaben < einsatz) {
        document.getElementById('resultat').innerText = 'Nicht genug Guthaben für den Einsatz!';
        return;
    }
    guthaben -= einsatz;
    updateWährungUI();
    
    // Neues Deck erstellen und mischen. Altes löschen
    karten = [];
    for (let farbe of farben) {
        for (let name of kartenNamen) {
        karten.push({ karte: name, farbe: farbe });
        }
    }
    karten = shuffle([...karten]);
    spielerKarten = [];
    dealerKarten = [];
    splitActive = false;
    splitHand1 = [];
    splitHand2 = [];
    currentSplitHand = 1;
    dealerRevealed = false;

    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('dealer-hand').innerHTML = '';
    document.getElementById('player-value').textContent = '';
    document.getElementById('dealer-value').textContent= '';
    document.getElementById('resultat').innerText = '';

    const { spielerKarten: neueSpielerKarten, dealerKarten: neueDealerKarten } = dealInitialCards();
    spielerKarten = neueSpielerKarten;
    dealerKarten = neueDealerKarten;
    renderPlayerHand(spielerKarten, 'player-hand');
    renderDealerHand(dealerKarten, 'dealer-hand');
    
    valueToText();
    enableButtons();
    checkForBlackjack();
    checkSplitPossible();
});

// split
let splitActive = false;
let splitHand1 = [];
let splitHand2 = [];
let currentSplitHand = 1;

// überprüfen ob split möglich ist
function checkSplitPossible() {
    const splitBtn = document.getElementById('split-btn');
    const k1 = spielerKarten[0]?.karte;
    const k2 = spielerKarten[1]?.karte;
    if (
        spielerKarten.length === 2 &&
        k1 === k2 &&
        guthaben >= einsatz &&
        !splitActive
    ) {
        splitBtn.disabled = false;
        splitBtn.classList.remove('inactive');
        splitBtn.classList.add('active');
    } else {
        splitBtn.disabled = true;
        splitBtn.classList.remove('active');
        splitBtn.classList.add('inactive');
    }
}
// splitten
document.getElementById('split-btn').addEventListener('click', () => {
    const k1 = spielerKarten[0]?.karte;
    const k2 = spielerKarten[1]?.karte;
    if (
        spielerKarten.length === 2 &&
        k1 === k2 &&
        guthaben >= einsatz
    ) {
        guthaben -= einsatz;
        updateWährungUI();
        
        splitActive = true;
        splitHand1 = [spielerKarten[0]];
        splitHand2 = [spielerKarten[1]];
        currentSplitHand = 1;

        splitHand1.push(drawCard());
        splitHand2.push(drawCard());
        
        spielerKarten = splitHand1;
        renderPlayerHand(spielerKarten, 'player-hand');
        valueToText();
        document.getElementById('resultat').innerText = 'Hand 1 - Ziehen oder Stehen!';
        
        disableAllButtons();
        const hitBtn = document.getElementById('hit-btn');
        const standBtn = document.getElementById('stand-btn');
        const splitBtn = document.getElementById('split-btn');
        hitBtn.disabled = false;
        standBtn.disabled = false;
        splitBtn.disabled = true;

        hitBtn.classList.remove('inactive');
        hitBtn.classList.add('active');
        standBtn.classList.remove('inactive');
        standBtn.classList.add('active');
        splitBtn.classList.remove('active');
        splitBtn.classList.add('inactive');

        checkForBlackjack();
    }
});

// ziehen. Oben für split, unten für normal
document.getElementById('hit-btn').addEventListener('click', () => {
    if (splitActive) {
        if (currentSplitHand === 1) {
            splitHand1.push(drawCard());
            spielerKarten = splitHand1;
            renderPlayerHand(spielerKarten, 'player-hand');
            valueToText();
            
            const hand1Value = handValue(splitHand1);
            if (hand1Value > 21) {
                document.getElementById('resultat').innerText = 'Hand 1 verloren! Jetzt Hand 2!';
                currentSplitHand = 2;
                spielerKarten = splitHand2;
                renderPlayerHand(spielerKarten, 'player-hand');
                valueToText();
                checkForBlackjack();
            } else if (hand1Value === 21) {
                document.getElementById('resultat').innerText = 'Hand 1 hat 21! Jetzt Hand 2!';
                currentSplitHand = 2;
                spielerKarten = splitHand2;
                renderPlayerHand(spielerKarten, 'player-hand');
                valueToText();
                checkForBlackjack();
            }
        } else {
            splitHand2.push(drawCard());
            spielerKarten = splitHand2;
            renderPlayerHand(spielerKarten, 'player-hand');
            valueToText();
            
            const hand2Value = handValue(splitHand2);
            if (hand2Value > 21) {
                document.getElementById('resultat').innerText = 'Hand 2 verloren! Dealer zieht...';
                finishSplitGame();
            } else if (hand2Value === 21) {
                document.getElementById('resultat').innerText = 'Hand 2 hat 21! Dealer zieht...';
                finishSplitGame();
            }
        }
    } else {
        spielerKarten.push(drawCard());
        renderPlayerHand(spielerKarten, 'player-hand');
        valueToText();
        checkSplitPossible();
        
        const value = handValue(spielerKarten);
        if (value > 21) {
            document.getElementById('resultat').innerText = 'Du hast verloren!';
            dealerRevealed = true;
            renderDealerHand(dealerKarten, 'dealer-hand');
            valueToText();
            disableAllButtons();
        } else if (value === 21) {
            document.getElementById('resultat').innerText = 'Du hast 21! Dealer zieht...';
            finishNormalGame();
        }
    }
});

// stehen. Oben für split, unten für normal
document.getElementById('stand-btn').addEventListener('click', () => {
    if (splitActive) {
        if (currentSplitHand === 1) {
            document.getElementById('resultat').innerText = 'Hand 1 beendet! Jetzt Hand 2!';
            currentSplitHand = 2;
            spielerKarten = splitHand2;
            renderPlayerHand(spielerKarten, 'player-hand');
            valueToText();
            checkForBlackjack();
        } else {
            document.getElementById('resultat').innerText = 'Hand 2 beendet! Dealer zieht...';
            finishSplitGame();
        }
    } else {
        document.getElementById('resultat').innerText = 'Dealer zieht...';
        finishNormalGame();
    }
});

