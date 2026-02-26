'use client';

import React, { useState, useEffect } from 'react';

// --- DATA ---
const events = [
    {
        nom: "Skeleton Fort",
        indice: "Crâne gris aux yeux verts",
        safer: true, high: true,
        objectif: "Nettoyer ~12 vagues de squelettes + boss pour la clé de la vault.",
        astuce: "Gare ton navire à l'abri des canons. Utilise les barils de poudre (kegs) sur les gros groupes.",
        danger: "Laisser le bateau broadside (de côté) aux canons du fort."
    },
    {
        nom: "Reaper Fortress",
        indice: "Crâne gris foncé avec chapeau et yeux rouges",
        safer: true, high: true,
        objectif: "15 vagues: squelettes élites, fantômes terrestres + navires fantômes (Ghost ships).",
        astuce: "Gère le combat naval en priorité. Utilise les pièges de feu du fort au sol.",
        danger: "Ignorer les navires fantômes qui tournent autour et qui vont te couler."
    },
    {
        nom: "Ghost Fleet",
        indice: "Tornade verte fine (au-dessus d'une île)",
        safer: true, high: true,
        objectif: "Détruire 4 vagues de navires fantômes et le Burning Blade amiral.",
        astuce: "Longe la ronde de navires par l'extérieur. Un navire fantôme meurt en 3 boulets normaux.",
        danger: "Traverser la flotte par le milieu ou passer directement derrière eux (ils lâchent des mines)."
    },
    {
        nom: "Ashen Winds (Ashen Lord)",
        indice: "Grosse tornade rouge",
        safer: true, high: true,
        objectif: "Vaincre un Ashen Lord (boss de feu) en 3 phases.",
        astuce: "Garde un seau rempli d'eau. Reste très mobile et tire au pistolet/sniper pendant qu'il crache du feu.",
        danger: "Aller au corps à corps pendant la pluie de météores ou le souffle de feu."
    },
    {
        nom: "Skeleton Fleet",
        indice: "Nuage en forme de navire / galion",
        safer: true, high: true,
        objectif: "Couler 3 vagues de navires squelettes en pleine mer.",
        astuce: "Viens ultra-chargé en boulets et planches. Récupère les caisses des damnés entre les vagues.",
        danger: "S'arrêter complètement. Reste en mouvement circulaire autour d'eux."
    },
    {
        nom: "Kraken",
        indice: "L'eau devient noire / Vitesse chute",
        safer: true, high: true,
        objectif: "Couper assez de tentacules pour fuir ou le faire disparaître.",
        astuce: "Priorité : focus le tentacule qui s'enroule sur ton bateau. Répare l'eau avant de tirer.",
        danger: "Sauter à l'eau ou oublier de vérifier les trous dans la cale inférieure."
    },
    {
        nom: "Fort of Fortune",
        indice: "Crâne géant aux yeux rouges brillants (fissuré)",
        safer: false, high: true,
        objectif: "Fort très long avec Ashen Lord à la fin. Loot énorme (Athéna).",
        astuce: "Point chaud PvP. Idéal pour voler ou se faire voler.",
        danger: "Ouvrir la vault sans avoir checké l'horizon."
    },
    {
        nom: "Fleet of Fortune",
        indice: "Nuage en forme de navire rouge vif",
        safer: false, high: true,
        objectif: "Combat naval qui donne le très convoité Chest of Fortune.",
        astuce: "Même stratégie que la Skeleton Fleet normale, mais prépare-toi au PvP.",
        danger: "Y aller avec peu de ressources."
    },
    {
        nom: "Burning Blade",
        indice: "Colonne de flammes rouges tourbillonnantes (Ciel)",
        safer: false, high: true,
        objectif: "Combattre le navire amiral. Option de le couler (épée) ou de le piloter.",
        astuce: "C'est l'événement majeur des Reapers. Combat naval très intense.",
        danger: "T'approcher si tu veux juste une session chill."
    },
    {
        nom: "Fort of the Damned",
        indice: "Crâne rouge vif (fixe en L-14)",
        safer: false, high: true,
        objectif: "Raid manuel activé par les joueurs. Très gros butin.",
        astuce: "Nécessite les 6 flammes du sort et un crâne rituel.",
        danger: "Impossible à lancer en Safer Seas."
    },
    {
        nom: "Skull of Siren Song",
        indice: "Note fantomatique bleue (au mât)",
        safer: false, high: true,
        objectif: "Voyage compétitif (course) partagé sur tout le serveur.",
        astuce: "Le navire qui porte le crâne est ralenti par une malédiction.",
        danger: "Accepter la quête en pensant que c'est du PvE tranquille."
    }
];

const iles = [
    // Outposts
    { nom: "Port Merrick", slug: "Port_Merrick", coord: "D10", type: "Outpost", ilots: 1 },
    { nom: "Sanctuary Outpost", slug: "Sanctuary_Outpost", coord: "F7", type: "Outpost", ilots: 1 },
    { nom: "Dagger Tooth Outpost", slug: "Dagger_Tooth_Outpost", coord: "M8", type: "Outpost", ilots: 1 },
    { nom: "Galleon's Grave Outpost", slug: "Galleon's_Grave_Outpost", coord: "R8", type: "Outpost", ilots: 1 },
    { nom: "Ancient Spire Outpost", slug: "Ancient_Spire_Outpost", coord: "Q17", type: "Outpost", ilots: 1 },
    { nom: "Plunder Outpost", slug: "Plunder_Outpost", coord: "K18", type: "Outpost", ilots: 1 },
    { nom: "Morrow's Peak Outpost", slug: "Morrow's_Peak_Outpost", coord: "V17", type: "Outpost", ilots: 1 },

    // Seaposts (Contrebandiers)
    { nom: "The North Star Seapost", slug: "The_North_Star_Seapost", coord: "H10", type: "Seapost", ilots: 1 },
    { nom: "The Spoils of Plenty Store", slug: "The_Spoils_of_Plenty_Store", coord: "B7", type: "Seapost", ilots: 1 },
    { nom: "Stephen's Spoils", slug: "Stephen's_Spoils", coord: "L15", type: "Seapost", ilots: 1 },
    { nom: "The Finest Trading Post", slug: "The_Finest_Trading_Post", coord: "F17", type: "Seapost", ilots: 1 },
    { nom: "Three Paces East Seapost", slug: "Three_Paces_East_Seapost", coord: "S10", type: "Seapost", ilots: 1 },
    { nom: "The Wild Treasures Store", slug: "The_Wild_Treasures_Store", coord: "O4", type: "Seapost", ilots: 1 },
    { nom: "Brian's Bazaar", slug: "Brian's_Bazaar", coord: "Y12", type: "Seapost", ilots: 1 },
    { nom: "Roaring Traders", slug: "Roaring_Traders", coord: "U20", type: "Seapost", ilots: 1 },

    // Petites Iles
    { nom: "Barnacle Cay", slug: "Barnacle_Cay", coord: "O15", type: "Small", ilots: 1 },
    { nom: "Blind Man's Lagoon", slug: "Blind_Man's_Lagoon", coord: "N6", type: "Small", ilots: 1 },
    { nom: "Booty Isle", slug: "Booty_Isle", coord: "K20", type: "Small", ilots: 1 },
    { nom: "Boulder Cay", slug: "Boulder_Cay", coord: "G5", type: "Small", ilots: 1 },
    { nom: "Castaway Isle", slug: "Castaway_Isle", coord: "K14", type: "Small", ilots: 1 },
    { nom: "Cursewater Shores", slug: "Cursewater_Shores", coord: "Y13", type: "Small", ilots: 1 },
    { nom: "Flame's End", slug: "Flame's_End", coord: "V19", type: "Small", ilots: 1 },
    { nom: "Isle of Last Words", slug: "Isle_of_Last_Words", coord: "O9", type: "Small", ilots: 1 },
    { nom: "Lookout Point", slug: "Lookout_Point", coord: "I20", type: "Small", ilots: 1 },
    { nom: "Magma's Tide", slug: "Magma's_Tide", coord: "Y20", type: "Small", ilots: 1 },
    { nom: "Paradise Spring", slug: "Paradise_Spring", coord: "L17", type: "Small", ilots: 1 },
    { nom: "Picaroon Palms", slug: "Picaroon_Palms", coord: "I4", type: "Small", ilots: 1 },
    { nom: "Scorched Pass", slug: "Scorched_Pass", coord: "X11", type: "Small", ilots: 1 },
    { nom: "Scurvy Isley", slug: "Scurvy_Isley", coord: "K4", type: "Small", ilots: 1 },
    { nom: "Sea Dog's Rest", slug: "Sea_Dog's_Rest", coord: "C11", type: "Small", ilots: 1 },
    { nom: "Shiver Retreat", slug: "Shiver_Retreat", coord: "Q11", type: "Small", ilots: 1 },
    { nom: "Tri-Rock Isle", slug: "Tri-Rock_Isle", coord: "R10", type: "Small", ilots: 1 },
    { nom: "Black Sand Atoll", slug: "Black_Sand_Atoll", coord: "O3", type: "Small", ilots: 2 },
    { nom: "Black Water Enclave", slug: "Black_Water_Enclave", coord: "R5", type: "Small", ilots: 2 },
    { nom: "Chicken Isle", slug: "Chicken_Isle", coord: "I16", type: "Small", ilots: 2 },
    { nom: "Cinder Islet", slug: "Cinder_Islet", coord: "U14", type: "Small", ilots: 2 },
    { nom: "Fools Lagoon", slug: "Fools_Lagoon", coord: "I14", type: "Small", ilots: 2 },
    { nom: "Glowstone Cay", slug: "Glowstone_Cay", coord: "Z18", type: "Small", ilots: 2 },
    { nom: "Lagoon of Whispers", slug: "Lagoon_of_Whispers", coord: "D12", type: "Small", ilots: 2 },
    { nom: "Lonely Isle", slug: "Lonely_Isle", coord: "G8", type: "Small", ilots: 2 },
    { nom: "Plunderer's Plight", slug: "Plunderer's_Plight", coord: "V6", type: "Small", ilots: 2 },
    { nom: "Roaring Sands", slug: "Roaring_Sands", coord: "U21", type: "Small", ilots: 2 },
    { nom: "The Forsaken Brink", slug: "The_Forsaken_Brink", coord: "U15", type: "Small", ilots: 2 },
    { nom: "Twin Groves", slug: "Twin_Groves", coord: "H11", type: "Small", ilots: 2 },
    { nom: "Cutlass Cay", slug: "Cutlass_Cay", coord: "M18", type: "Small", ilots: 3 },
    { nom: "Liar's Backbone", slug: "Liar's_Backbone", coord: "S11", type: "Small", ilots: 3 },
    { nom: "Mutineer Rock", slug: "Mutineer_Rock", coord: "N19", type: "Small", ilots: 3 },
    { nom: "Salty Sands", slug: "Salty_Sands", coord: "G3", type: "Small", ilots: 3 },
    { nom: "Brimstone Rock", slug: "Brimstone_Rock", coord: "X18", type: "Small", ilots: 4 },
    { nom: "Old Salts Atoll", slug: "Old_Salts_Atoll", coord: "F18", type: "Small", ilots: 4 },
    { nom: "Rum Runner Isle", slug: "Rum_Runner_Isle", coord: "H9", type: "Small", ilots: 4 },
    { nom: "Rapier Cay", slug: "Rapier_Cay", coord: "D8", type: "Small", ilots: 5 },
    { nom: "Shark Tooth Key", slug: "Shark_Tooth_Key", coord: "P13", type: "Small", ilots: 5 },
    { nom: "Sandy Shallows", slug: "Sandy_Shallows", coord: "D5", type: "Small", ilots: 6 },
    { nom: "Uncharted Isle At K9", slug: "Uncharted_Island_(K-9)", coord: "K9", type: "Small", ilots: 3 },
    { nom: "Uncharted Isle At N13", slug: "Uncharted_Island_(N-13)", coord: "N13", type: "Small", ilots: 4 },

    // Grandes Iles
    { nom: "Cannon Cove", slug: "Cannon_Cove", coord: "G10", type: "Large", ilots: 1 },
    { nom: "Crescent Isle", slug: "Crescent_Isle", coord: "B9", type: "Large", ilots: 1 },
    { nom: "Kraken's Fall", slug: "Kraken's_Fall", coord: "R12", type: "Large", ilots: 1 },
    { nom: "Lone Cove", slug: "Lone_Cove", coord: "H6", type: "Large", ilots: 1 },
    { nom: "Marauder's Arch", slug: "Marauder's_Arch", coord: "Q3", type: "Large", ilots: 1 },
    { nom: "Plunder Valley", slug: "Plunder_Valley", coord: "G16", type: "Large", ilots: 1 },
    { nom: "Smugglers' Bay", slug: "Smugglers'_Bay", coord: "F3", type: "Large", ilots: 1 },
    { nom: "The Crooked Masts", slug: "The_Crooked_Masts", coord: "O11", type: "Large", ilots: 1 },
    { nom: "Wanderers Refuge", slug: "Wanderers_Refuge", coord: "F12", type: "Large", ilots: 1 },
    { nom: "Mermaid's Hideaway", slug: "Mermaid's_Hideaway", coord: "B13", type: "Large", ilots: 2 },
    { nom: "Thieves' Haven", slug: "Thieves'_Haven", coord: "M20", type: "Large", ilots: 2 },
    { nom: "Crook's Hollow", slug: "Crook's_Hollow", coord: "M16", type: "Large", ilots: 3 },
    { nom: "Discovery Ridge", slug: "Discovery_Ridge", coord: "E17", type: "Large", ilots: 3 },
    { nom: "Fetcher's Rest", slug: "Fetcher's_Rest", coord: "V12", type: "Large", ilots: 3 },
    { nom: "Flintlock Peninsula", slug: "Flintlock_Peninsula", coord: "W14", type: "Large", ilots: 3 },
    { nom: "Old Faithful Isle", slug: "Old_Faithful_Isle", coord: "M4", type: "Large", ilots: 3 },
    { nom: "Snake Island", slug: "Snake_Island", coord: "K16", type: "Large", ilots: 3 },
    { nom: "Devil's Ridge", slug: "Devil's_Ridge", coord: "P19", type: "Large", ilots: 4 },
    { nom: "The Devil's Thirst", slug: "The_Devil's_Thirst", coord: "W21", type: "Large", ilots: 4 },
    { nom: "The Sunken Grove", slug: "The_Sunken_Grove", coord: "P7", type: "Large", ilots: 4 },
    { nom: "Ruby's Fall", slug: "Ruby's_Fall", coord: "Y16", type: "Large", ilots: 5 },
    { nom: "Shark Bait Cove", slug: "Shark_Bait_Cove", coord: "H19", type: "Large", ilots: 7 },
    { nom: "Ashen Reaches", slug: "Ashen_Reaches", coord: "V23", type: "Large", ilots: 8 },
    { nom: "Shipwreck Bay", slug: "Shipwreck_Bay", coord: "M10", type: "Large", ilots: 10 },
    { nom: "Sailor's Bounty", slug: "Sailor's_Bounty", coord: "C4", type: "Large", ilots: 11 },
];

const butin = [
    { nom: "Gemmes de Sirène (Saphir, Émeraude, Rubis)", prix: "1000-2000", vendeur: "TOUS (Sauf Athena)", note: "Se vend à n'importe quelle faction." },
    { nom: "Souffles de la mer (Breaths of the Sea)", prix: "4000-8000", vendeur: "TOUS (Sauf Athena)", note: "Trésor sous-marin haute valeur." },
    { nom: "Orbe des secrets", prix: "~20000", vendeur: "TOUS (Sauf Athena)", note: "Très payant, accepté par tous." },
    { nom: "Coffre de Rage", prix: "3000-3500", vendeur: "Gold Hoarders", note: "DANGER FEU : Arroser souvent ou mettre sur la proue." },
    { nom: "Coffre Pleureur (Sorrow)", prix: "3000-3500", vendeur: "Gold Hoarders", note: "DANGER EAU : Remplit la cale. Écoper ou mettre sur chaloupe." },
    { nom: "Coffre des mille grogs", prix: "2200-2600", vendeur: "Gold Hoarders", note: "DANGER : Rend le porteur ivre." },
    { nom: "Caisse de Tissu élégant", prix: "100-700", vendeur: "Marchands", note: "SEC : S'abîme à l'eau ou la pluie." },
    { nom: "Caisse de Rhum", prix: "100-700", vendeur: "Marchands", note: "FRAGILE : Ne pas sauter ni tomber." },
    { nom: "Caisse de Plantes", prix: "100-700", vendeur: "Marchands", note: "EAU : Doit tremper dans un fond d'eau." },
    { nom: "Crâne rituel (Ritual Skull)", prix: "10 Doublons", vendeur: "Larinna", note: "Se vend à Larinna ou active le FotD." },
    { nom: "Tomes Cendrés", prix: "10 Doublons", vendeur: "Larinna", note: "Se vend pour des doublons." },
    { nom: "Poissons Trophées (Cuits)", prix: "750-11000", vendeur: "Hunter's Call", note: "Doubler le prix si cuit parfaitement." }
];

// --- HELPERS ---
function lettreEnChiffre(l: string) { return l.toUpperCase().charCodeAt(0) - 64; }

export default function SotCompanionPage() {
    const [posX, setPosX] = useState('');
    const [posY, setPosY] = useState('');
    const [navResult, setNavResult] = useState<{ o: any, s: any } | null>(null);

    const [searchIsland, setSearchIsland] = useState('');
    const [filterTaille, setFilterTaille] = useState('');
    const [filterIlots, setFilterIlots] = useState('');

    const [searchLoot, setSearchLoot] = useState('');

    const [selectedEvent, setSelectedEvent] = useState('');
    const [filterMode, setFilterMode] = useState('safer');

    // Navigation logic
    useEffect(() => {
        if (!posX || !posY) {
            setNavResult(null);
            return;
        }
        const x = lettreEnChiffre(posX);
        const y = parseInt(posY);

        let plusProcheO = null; let minDO = Infinity;
        let plusProcheS = null; let minDS = Infinity;

        iles.forEach(ile => {
            const ileX = lettreEnChiffre(ile.coord.charAt(0));
            const ileY = parseInt(ile.coord.substring(1));
            const d2 = Math.pow(ileX - x, 2) + Math.pow(ileY - y, 2);

            if (ile.type === "Outpost" && d2 < minDO) { minDO = d2; plusProcheO = ile; }
            if (ile.type === "Seapost" && d2 < minDS) { minDS = d2; plusProcheS = ile; }
        });

        setNavResult({ o: plusProcheO, s: plusProcheS });
    }, [posX, posY]);

    const resetNav = () => { setPosX(''); setPosY(''); };
    const resetIles = () => { setSearchIsland(''); setFilterTaille(''); setFilterIlots(''); };
    const resetLoot = () => { setSearchLoot(''); };
    const resetEvents = () => { setSelectedEvent(''); setFilterMode('safer'); };

    const filteredIlesList = iles.filter(i => {
        if (searchIsland.length < 2 && filterTaille === "" && filterIlots === "") return false;
        const matchNom = i.nom.toLowerCase().includes(searchIsland.toLowerCase());
        const matchTaille = filterTaille === "" || i.type === filterTaille;
        let matchIlots = true;
        if (filterIlots === "5") matchIlots = i.ilots >= 5;
        else if (filterIlots !== "") matchIlots = i.ilots === parseInt(filterIlots);

        return matchNom && matchTaille && matchIlots;
    });

    const filteredLootList = butin.filter(b => {
        if (searchLoot === '*') return true;
        if (searchLoot.length < 2) return false;
        return b.nom.toLowerCase().includes(searchLoot.toLowerCase()) || b.note.toLowerCase().includes(searchLoot.toLowerCase());
    });

    const currentEvent = events.find(e => e.nom === selectedEvent);
    const displayEvent = currentEvent && (filterMode === 'all' || (filterMode === 'safer' && currentEvent.safer) || (filterMode === 'high' && currentEvent.high));

    return (
        <div className="sot-companion-page">
            <style jsx global>{`
                :root {
                    --bg: #0b141a;
                    --card: #16242d;
                    --accent: #00ffcc;
                    --text: #e0e0e0;
                    --gold: #ffcc00;
                    --danger: #ff4d4d;
                    --safe: #4cd137;
                }

                .sot-companion-page {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: var(--bg);
                    color: var(--text);
                    margin: 0;
                    padding: 15px;
                    line-height: 1.4;
                    min-height: 100vh;
                }

                .container { max-width: 900px; margin: 0 auto; }

                header {
                    text-align: center;
                    border-bottom: 2px solid var(--accent);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }

                h1 { color: var(--accent); margin: 0; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px; }

                section {
                    background: var(--card);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }

                h2 { font-size: 1.1rem; margin-top: 0; border-left: 4px solid var(--accent); padding-left: 10px; margin-bottom: 15px; }

                .input-group { display: flex; gap: 10px; width: 100%; flex-wrap: wrap; }
                
                input, select {
                    background: #0b141a;
                    border: 1px solid #333;
                    color: white;
                    padding: 10px;
                    border-radius: 6px;
                    flex-grow: 1;
                    font-size: 0.95rem;
                    box-sizing: border-box;
                }

                .reset-btn {
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 0 15px;
                    cursor: pointer;
                    font-weight: bold;
                    min-height: 40px;
                }
                .reset-btn:hover { background: var(--danger); }

                .nav-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; }
                .result-box { margin-top: 10px; padding: 10px; background: rgba(0, 255, 204, 0.1); border-left: 4px solid var(--accent); border-radius: 6px; }

                /* Styles Iles */
                .island-filters { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; }
                @media (max-width: 600px) { .island-filters { grid-template-columns: 1fr 1fr; } .island-filters input { grid-column: span 2; } }
                
                .island-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: #1c2e3a;
                    padding: 10px;
                    border-radius: 8px;
                    margin-top: 8px;
                    border: 1px solid #2d414d;
                }
                .island-img { width: 90px; height: 90px; object-fit: contain; background: #0b141a; border-radius: 5px; border: 1px solid #444; }
                .type-tag { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: #333; }

                /* Styles Events */
                .event-card { background: #1c2e3a; padding: 12px; border-radius: 8px; margin-top: 10px; border-left: 4px solid var(--gold); }
                .event-card h3 { margin: 0 0 8px 0; color: var(--gold); display: flex; justify-content: space-between; align-items: center; }
                .badge-safer { background: var(--safe); color: #000; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; }
                .badge-high { background: var(--danger); color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; }
                .event-detail { margin-bottom: 5px; font-size: 0.9rem; }
                .event-detail strong { color: var(--accent); }
                
                /* Styles Loot */
                .loot-item { padding: 10px 0; font-size: 0.9rem; margin-top: 5px; border-bottom: 1px solid #2d414d; }
                .loot-item:last-child { border-bottom: none; }
                .danger-border { border-left: 5px solid var(--danger); background: rgba(255, 77, 77, 0.1); padding-left: 10px; border-radius: 4px; }
                .exception-border { border-left: 5px solid var(--gold); background: rgba(255, 204, 0, 0.05); padding-left: 10px; border-radius: 4px; }

                .placeholder-img { display: flex; align-items: center; justify-content: center; background: #0b141a; color: #444; font-size: 0.8rem; }
            `}</style>

            <div className="container">
                <header>
                    <h1>SOT Companion Pro</h1>
                </header>

                <section id="navigation">
                    <h2>📍 Navigation de Vente</h2>
                    <div className="nav-grid">
                        <input
                            type="text"
                            placeholder="Lettre (ex: G)"
                            maxLength={1}
                            value={posX}
                            onChange={(e) => setPosX(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Chiffre (ex: 10)"
                            value={posY}
                            onChange={(e) => setPosY(e.target.value)}
                        />
                        <button className="reset-btn" onClick={resetNav}>✕</button>
                    </div>
                    {navResult && (
                        <div id="navResult" className="result-box">
                            🏠 Outpost: <strong>{navResult.o.nom}</strong> ({navResult.o.coord})<br />
                            ⛵ Contrebandier: <strong>{navResult.s.nom}</strong> ({navResult.s.coord})
                        </div>
                    )}
                </section>

                <section id="islands">
                    <h2>🏝️ Identificateur d'Îles</h2>
                    <div className="island-filters">
                        <input
                            type="text"
                            placeholder="Nom de l'île..."
                            value={searchIsland}
                            onChange={(e) => setSearchIsland(e.target.value)}
                        />
                        <select value={filterTaille} onChange={(e) => setFilterTaille(e.target.value)}>
                            <option value="">Taille (Toutes)</option>
                            <option value="Small">Petite</option>
                            <option value="Large">Grande</option>
                        </select>
                        <select value={filterIlots} onChange={(e) => setFilterIlots(e.target.value)}>
                            <option value="">Zones (Toutes)</option>
                            <option value="1">1 part</option>
                            <option value="2">2 parts</option>
                            <option value="3">3 parts</option>
                            <option value="4">4 parts</option>
                            <option value="5">5+ parts</option>
                        </select>
                        <button className="reset-btn" onClick={resetIles}>✕</button>
                    </div>
                    <div id="islandList">
                        {filteredIlesList.map((i, idx) => (
                            <div key={idx} className="island-card">
                                <img
                                    src={`https://seaofthieves.wiki.gg/wiki/Special:FilePath/${i.slug}_Map-Blank.jpg`}
                                    className="island-img"
                                    loading="lazy"
                                    alt={i.nom}
                                    onError={(e: any) => {
                                        const fallback = `https://seaofthieves.wiki.gg/wiki/Special:FilePath/${i.slug}_Map.png`;
                                        if (e.target.src !== fallback) e.target.src = fallback;
                                        else e.target.style.display = 'none';
                                    }}
                                />
                                <div>
                                    <strong>{i.nom}</strong> <span className="type-tag">{i.type}</span><br />
                                    <small>Coord: {i.coord} | Zones: {i.ilots}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="loot">
                    <h2>💰 Guide du Butin Spécial</h2>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Recherche (ex: tissu, rage) ou * pour tout"
                            value={searchLoot}
                            onChange={(e) => setSearchLoot(e.target.value)}
                        />
                        <button className="reset-btn" onClick={resetLoot}>✕</button>
                    </div>
                    <div id="lootResults">
                        {filteredLootList.map((b, idx) => {
                            let alertClass = b.note.includes("DANGER") || b.note.includes("SEC") || b.note.includes("FRAGILE") ? "danger-border" : "exception-border";
                            return (
                                <div key={idx} className={`loot-item ${alertClass}`}>
                                    <strong>{b.nom}</strong> - <span style={{ color: 'var(--gold)' }}>{b.prix}</span><br />
                                    <small>Vendre: <strong>{b.vendeur}</strong></small><br />
                                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>{b.note}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section id="events">
                    <h2>🌪️ World Events & Menaces</h2>
                    <div className="input-group">
                        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                            <option value="">-- Choisir un indice ciel --</option>
                            {events.map((e, idx) => <option key={idx} value={e.nom}>{e.indice}</option>)}
                        </select>
                        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                            <option value="safer">Mode: Safer Seas</option>
                            <option value="high">Mode: High Seas</option>
                            <option value="all">Tous les modes</option>
                        </select>
                        <button className="reset-btn" onClick={resetEvents}>✕</button>
                    </div>
                    <div id="eventList">
                        {displayEvent && (
                            <div className="event-card">
                                <h3>
                                    {currentEvent.nom}
                                    {currentEvent.safer ? <span className="badge-safer">Safer Seas OK</span> : <span className="badge-high">High Seas Only</span>}
                                </h3>
                                <div className="event-detail">👀 <strong>Indice :</strong> {currentEvent.indice}</div>
                                <div className="event-detail">🎯 <strong>Objectif :</strong> {currentEvent.objectif}</div>
                                <div className="event-detail" style={{ color: '#4cd137' }}>💡 <strong>Astuce :</strong> {currentEvent.astuce}</div>
                                <div className="event-detail" style={{ color: 'var(--danger)' }}>⚠️ <strong>À éviter :</strong> {currentEvent.danger}</div>
                            </div>
                        )}
                        {selectedEvent && !displayEvent && (
                            <div className="result-box" style={{ borderLeftColor: 'var(--danger)' }}>
                                Cet événement ({selectedEvent}) n'est pas disponible dans le mode sélectionné.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
