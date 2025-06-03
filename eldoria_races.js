// Table des bonus/malus raciaux synchronisée avec le lore
window.eldoriaRaceBonuses = {
    "Humains":    { for: 0, res: +1, dex: 0, int: +2, mag: 0, char: -2, ment: +1 },
    "Elfes":      { for: 0, res: -2, dex: +3, int: 0, mag: +1, char: 0, ment: -1 },
    "Nains des Profondeurs": { for: +3, res: +2, dex: 0, int: 0, mag: -1, char: -2, ment: 0 },
    "Khorlaks":   { for: -1, res: -2, dex: 0, int: 0, mag: +1, char: +2, ment: 0 },
    "Draïdiens":  { for: 0, res: +2, dex: -1, int: +1, mag: +3, char: 0, ment: -4 },
    "Draegars":   { for: -3, res: 0, dex: -3, int: +1, mag: +5, char: 0, ment: 0 },
    "Ykharas":    { for: +1, res: 0, dex: +4, int: 0, mag: -2, char: 0, ment: -2 },
    "Séraphins":  { for: -2, res: -2, dex: 0, int: 0, mag: +6, char: 0, ment: -1 },
    "Skarjaks":   { for: +2, res: +3, dex: -1, int: -1, mag: -1, char: +1, ment: -1 },
    "Férymants":  { for: 0, res: 0, dex: -2, int: -4, mag: +5, char: +3, ment: 0 }
};

window.addEventListener("DOMContentLoaded", function() {
    // --- Variables globales ---
    const statIds = [
        { id: "statForce", key: "for", total: "total_for", bonus: "bonus_for" },
        { id: "statResistance", key: "res", total: "total_res", bonus: "bonus_res" },
        { id: "statDexterite", key: "dex", total: "total_dex", bonus: "bonus_dex" },
        { id: "statIntelligence", key: "int", total: "total_int", bonus: "bonus_int" },
        { id: "statMagie", key: "mag", total: "total_mag", bonus: "bonus_mag" },
        { id: "statCharisme", key: "char", total: "total_char", bonus: "bonus_char" },
        { id: "statMentale", key: "ment", total: "total_ment", bonus: "bonus_ment" }
    ];
    const maxPoints = 75;
    const maxStat = 20;

    // --- Fonctions utilitaires ---
    function getSelectedRace() {
        const select = document.getElementById("raceSelect");
        return select ? select.value : "";
    }
    function getRaceBonuses(race) {
        return window.eldoriaRaceBonuses[race] || { for:0, res:0, dex:0, int:0, mag:0, char:0, ment:0 };
    }

    // --- Mise à jour des bonus raciaux et totaux ---
    function updateRaceBonusesAndTotals() {
        const race = getSelectedRace();
        const bonuses = getRaceBonuses(race);
        let usedPoints = 0;
        let overLimit = false;

        statIds.forEach(stat => {
            const input = document.getElementById(stat.id);
            const bonusSpan = document.getElementById(stat.bonus);
            const totalSpan = document.getElementById(stat.total);
            let base = parseInt(input.value) || 0;
            const bonus = bonuses[stat.key] || 0;

            // Calcul de la base maximale autorisée pour cette stat
            let baseMax = maxStat - bonus;
            // Permettre de dépasser 20 en base si bonus est négatif
            if (baseMax < 0) baseMax = maxStat - bonus; // ex: maxStat=20, bonus=-3 => baseMax=23

            // Clamp la valeur de base entre 0 et baseMax
            if (base < 0) base = 0;
            if (base > baseMax) base = baseMax;
            input.value = base;

            let total = base + bonus;

            // Affichage bonus
            bonusSpan.textContent = bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : "";
            bonusSpan.className = bonus > 0 ? "bonus-positive" : bonus < 0 ? "bonus-negative" : "";

            // Affichage total
            totalSpan.textContent = total;
            if (total > maxStat) {
                totalSpan.classList.add("bonus-negative");
                overLimit = true;
            } else {
                totalSpan.classList.remove("bonus-negative");
            }

            usedPoints += base;
        });

        // Empêche de dépasser 75 points de base
        if (usedPoints > maxPoints) {
            // Trouve la stat qui a été modifiée en dernier
            let lastInput = document.activeElement;
            if (lastInput && lastInput.tagName === "INPUT" && lastInput.type === "number") {
                let lastBase = parseInt(lastInput.value) || 0;
                let diff = usedPoints - maxPoints;
                lastInput.value = Math.max(0, lastBase - diff);
            }
            // Recalcule après correction
            usedPoints = 0;
            statIds.forEach(stat => {
                const input = document.getElementById(stat.id);
                usedPoints += parseInt(input.value) || 0;
            });
        }

        // Affichage des points utilisés
        const usedPointsSpan = document.getElementById("usedPoints");
        usedPointsSpan.textContent = usedPoints;
        const pointsCounter = document.getElementById("pointsCounter");
        pointsCounter.classList.toggle("over-limit", usedPoints > maxPoints || overLimit);
        pointsCounter.classList.toggle("at-limit", usedPoints === maxPoints && !overLimit);

        // Affiche visuellement le dépassement mais ne désactive jamais les inputs
        statIds.forEach(stat => {
            const input = document.getElementById(stat.id);
            if (input) {
                input.classList.toggle("over-limit", usedPoints > maxPoints || overLimit);
            }
        });

        drawStatsRadar();
    }

    // --- Radar ---
    function drawStatsRadar() {
        const canvas = document.getElementById("radarCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = 180;
        const labelRadius = maxRadius + 28;
        const stats = ["Force", "Résistance", "Dextérité", "Intelligence", "Magie", "Charisme", "Mentale"];
        const baseValues = statIds.map(stat => parseInt(document.getElementById(stat.id).value) || 0);
        const bonuses = getRaceBonuses(getSelectedRace());
        const bonusValues = statIds.map(stat => bonuses[stat.key] || 0);
        // Empêche les valeurs négatives d'impacter le radar
        const totalValues = baseValues.map((base, i) => {
            const total = base + bonusValues[i];
            return total < 0 ? 0 : total;
        });

        // Grille
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, 2 * Math.PI);
            ctx.stroke();
        }
        // Axes et labels
        ctx.strokeStyle = "#777";
        ctx.lineWidth = 1;
        ctx.font = "14px Open Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < stats.length; i++) {
            const angle = (i * 2 * Math.PI) / stats.length - Math.PI / 2;
            const x = centerX + Math.cos(angle) * maxRadius;
            const y = centerY + Math.sin(angle) * maxRadius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
            // Labels
            const labelX = centerX + Math.cos(angle) * labelRadius;
            const labelY = centerY + Math.sin(angle) * labelRadius;
            ctx.fillStyle = "#e0d8c3";
            ctx.fillText(stats[i], labelX, labelY);
        }
        // Polygone base (SUPPRIMÉ pour ne garder que le polygone total)
        // Polygone total
        if (totalValues.some(val => val > 0)) {
            ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
            ctx.fillStyle = "rgba(76, 175, 80, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < stats.length; i++) {
                const angle = (i * 2 * Math.PI) / stats.length - Math.PI / 2;
                const radius = (totalValues[i] / 20) * maxRadius;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    // --- Sauvegarde/chargement automatique ---
    function saveForm() {
        const form = document.getElementById("characterForm");
        if (!form) return;
        const data = new FormData(form);
        const saveData = {};
        data.forEach((value, key) => {
            if (key !== "photo") saveData[key] = value;
        });
        const photoPreview = document.getElementById("photoPreview");
        if (photoPreview && photoPreview.src && !photoPreview.src.includes("R0lGODlh")) {
            saveData.photoData = photoPreview.src;
        }
        localStorage.setItem("characterData", JSON.stringify(saveData));
    }
    function loadForm() {
        const savedData = localStorage.getItem("characterData");
        if (!savedData) return;
        const data = JSON.parse(savedData);
        const form = document.getElementById("characterForm");
        Object.entries(data).forEach(([key, value]) => {
            if (key === "photoData") {
                const photoPreview = document.getElementById("photoPreview");
                if (photoPreview) {
                    photoPreview.src = value;
                    photoPreview.style.display = "block";
                }
            } else {
                const input = form.querySelector(`[name="${key}"]`);
                if (input && input.type !== "file") input.value = value;
            }
        });
        updateRaceBonusesAndTotals();
    }

    // --- Gestion de la photo ---
    const photoInput = document.getElementById("photo");
    const photoPreview = document.getElementById("photoPreview");
    if (photoInput && photoPreview) {
        photoInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                    photoPreview.style.display = "block";
                    saveForm();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- Écouteurs d'événements ---
    const form = document.getElementById("characterForm");
    if (form) {
        form.addEventListener("change", function() {
            updateRaceBonusesAndTotals();
            saveForm();
        });
        form.addEventListener("input", function() {
            updateRaceBonusesAndTotals();
            saveForm();
        });
    }
    const raceSelect = document.getElementById("raceSelect");
    if (raceSelect) {
        raceSelect.addEventListener("change", function() {
            updateRaceBonusesAndTotals();
            saveForm();
        });
    }
    statIds.forEach(stat => {
        const input = document.getElementById(stat.id);
        if (input) {
            input.addEventListener("input", function() {
                updateRaceBonusesAndTotals();
                saveForm();
            });
        }
    });

    // --- Chargement initial ---
    loadForm();
    setTimeout(drawStatsRadar, 300);

    // --- Export PNG ---
    document.getElementById("exportPngButton").addEventListener("click", function() {
        const form = document.getElementById("characterForm");
        const data = new FormData(form);
        const character = {};
        data.forEach((value, key) => character[key] = value);

        // Photo
        const exportPhotoEl = document.getElementById("exportPhoto");
        const photoPreview = document.getElementById("photoPreview");
        if (photoPreview.src && !photoPreview.src.includes("R0lGODlh")) {
            exportPhotoEl.src = photoPreview.src;
            exportPhotoEl.style.display = "block";
        } else {
            exportPhotoEl.style.display = "none";
        }

        // Identité
        document.getElementById("exportIdentite").innerHTML = `
            <h2>Identité</h2>
            <p><strong>Nom :</strong> ${character.name || "N/A"}</p>
            <p><strong>Race :</strong> ${character.race || "N/A"}</p>
            <p><strong>Faction :</strong> ${character.faction || "N/A"}</p>
            <p><strong>Classe / Rôle :</strong> ${character.class || "N/A"}</p>
        `;

        // Stats
        let statsHtml = '<h2>Statistiques</h2><table><thead><tr><th scope="col">Statistique</th><th scope="col">Base</th><th scope="col">Bonus Racial</th><th scope="col">Total</th></tr></thead><tbody>';
        const statsOrder = ["For", "Res", "Dex", "Int", "Mag", "Char", "Ment"];
        const statFullNames = {
            For: "Force", Res: "Résistance", Dex: "Dextérité", Int: "Intelligence", Mag: "Magie", Char: "Charisme", Ment: "Mentale"
        };
        const statInputNameMap = {
            statForce: "for", statResistance: "res", statDexterite: "dex",
            statIntelligence: "int", statMagie: "mag", statCharisme: "char", statMentale: "ment"
        };
        const selectedRace = character.race;
        const raceBonuses = window.eldoriaRaceBonuses[selectedRace] || { for:0, res:0, dex:0, int:0, mag:0, char:0, ment:0 };
        statsOrder.forEach(shortKeyCap => {
            const shortKeyLower = shortKeyCap.toLowerCase();
            const formInputName = Object.keys(statInputNameMap).find(name => statInputNameMap[name] === shortKeyLower);
            const baseValue = parseInt(character[formInputName] || "0");
            const bonusValue = raceBonuses[shortKeyLower] || 0;
            const totalValue = baseValue + bonusValue;
            const bonusText = bonusValue > 0 ? `+${bonusValue}` : bonusValue < 0 ? bonusValue.toString() : "0";
            const bonusClass = bonusValue > 0 ? "bonus-positive" : bonusValue < 0 ? "bonus-negative" : "";
            statsHtml += `<tr>
                <td>${statFullNames[shortKeyCap]} (${shortKeyCap})</td>
                <td>${baseValue}</td>
                <td><span class="${bonusClass}">${bonusText}</span></td>
                <td><strong>${totalValue}</strong></td>
            </tr>`;
        });
        statsHtml += "</tbody></table>";
        statsHtml += `<p><strong>Points de vie (PV) :</strong> ${character.pv || "N/A"}</p>`;
        statsHtml += `<p><strong>Points de mana (PM) :</strong> ${character.pm || "N/A"}</p>`;
        const exportStatsDiv = document.getElementById("exportStats");
        exportStatsDiv.innerHTML = statsHtml;

        // Ajout du radar dans l'export
        const radarTitle = document.createElement("h3");
        radarTitle.textContent = "Radar des Statistiques";
        radarTitle.style.color = "#ffcc00";
        radarTitle.style.fontFamily = "'Cinzel', serif";
        radarTitle.style.margin = "20px 0 10px 0";
        const radarExportCanvas = document.createElement("canvas");
        radarExportCanvas.width = 455;
        radarExportCanvas.height = 420;
        radarExportCanvas.style.display = "block";
        radarExportCanvas.style.margin = "20px auto";
        // Dessin du radar export
        (function drawExportRadar() {
            const ctx = radarExportCanvas.getContext("2d");
            const centerX = radarExportCanvas.width / 2;
            const centerY = radarExportCanvas.height / 2;
            const maxRadius = 180;
            const labelRadius = maxRadius + 28;
            const stats = ["Force", "Résistance", "Dextérité", "Intelligence", "Magie", "Charisme", "Mentale"];
            const statInputNameMap = [
                "statForce", "statResistance", "statDexterite",
                "statIntelligence", "statMagie", "statCharisme", "statMentale"
            ];
            const statKeys = ["for", "res", "dex", "int", "mag", "char", "ment"];
            const baseValues = statInputNameMap.map(name => parseInt(character[name] || "0"));
            const raceBonuses = window.eldoriaRaceBonuses[character.race] || { for:0, res:0, dex:0, int:0, mag:0, char:0, ment:0 };
            const bonusValues = statKeys.map(key => raceBonuses[key] || 0);
            const totalValues = baseValues.map((base, i) => base + bonusValues[i]);
            // Grille
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, 2 * Math.PI);
                ctx.stroke();
            }
            // Axes et labels
            ctx.strokeStyle = "#777";
            ctx.lineWidth = 1;
            ctx.font = "14px Open Sans";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let i = 0; i < stats.length; i++) {
                const angle = (i * 2 * Math.PI) / stats.length - Math.PI / 2;
                const x = centerX + Math.cos(angle) * maxRadius;
                const y = centerY + Math.sin(angle) * maxRadius;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();
                // Labels
                const labelX = centerX + Math.cos(angle) * labelRadius;
                const labelY = centerY + Math.sin(angle) * labelRadius;
                ctx.fillStyle = "#e0d8c3";
                ctx.fillText(stats[i], labelX, labelY);
            }
            // Polygone total
            if (totalValues.some(val => val > 0)) {
                ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
                ctx.fillStyle = "rgba(76, 175, 80, 0.2)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < stats.length; i++) {
                    const angle = (i * 2 * Math.PI) / stats.length - Math.PI / 2;
                    const radius = (totalValues[i] / 20) * maxRadius;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        })();
        exportStatsDiv.appendChild(radarTitle);
        exportStatsDiv.appendChild(radarExportCanvas);

        // Equipement
        document.getElementById("exportEquip").innerHTML = `
            <h2>Équipement &amp; Armes</h2>
            <p><strong>Arme principale :</strong> ${character.weapon || "N/A"}</p>
            <p><strong>Équipement notable :</strong></p><pre>${character.notableEquipment || "N/A"}</pre>
        `;
        // Capacités
        document.getElementById("exportCapacites").innerHTML = `
            <h2>Capacités &amp; Talents</h2>
            <pre>${character.abilities || "N/A"}</pre>
        `;
        // Historique
        document.getElementById("exportHistoire").innerHTML = `
            <h2>Historique &amp; Personnalité</h2>
            <p><strong>Origines :</strong></p><pre>${character.origins || "N/A"}</pre>
            <p><strong>Motivations :</strong></p><pre>${character.motivations || "N/A"}</pre>
            <p><strong>Relations :</strong></p><pre>${character.relationships || "N/A"}</pre>
            <p><strong>Traits de caractère :</strong></p><pre>${character.traits || "N/A"}</pre>
        `;
        // Objectifs
        document.getElementById("exportObjectifs").innerHTML = `
            <h2>Notes &amp; Objectifs</h2>
            <p><strong>Objectifs à court terme :</strong></p><pre>${character.shortTermGoals || "N/A"}</pre>
            <p><strong>Objectifs à long terme :</strong></p><pre>${character.longTermGoals || "N/A"}</pre>
            <p><strong>Événements marquants :</strong></p><pre>${character.events || "N/A"}</pre>
        `;

        const exportContainer = document.getElementById("exportPngContainer");
        exportContainer.style.display = "block";

        html2canvas(exportContainer, {
            backgroundColor: "#2a2a2a",
            useCORS: true,
            logging: false
        }).then(canvas => {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const characterName = (character.name || "personnage").trim().replace(/\s+/g, "_");
            link.download = `${characterName}_eldoria_fiche.png`;
            link.href = image;
            link.click();
            exportContainer.style.display = "none";
            exportStatsDiv.removeChild(radarTitle);
            exportStatsDiv.removeChild(radarExportCanvas);
        }).catch(err => {
            console.error("Erreur lors de l'exportation en PNG:", err);
            exportContainer.style.display = "none";
            exportStatsDiv.removeChild(radarTitle);
            exportStatsDiv.removeChild(radarExportCanvas);
            alert("Une erreur est survenue lors de la création du PNG. Vérifiez la console pour plus de détails.");
        });
    });
});

