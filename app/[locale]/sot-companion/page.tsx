'use client';

import React, { useState, useEffect } from 'react';

// --- DATA ---
const iles = [
    { nom: "Port Merrick", slug: "Port_Merrick", coord: "D10", type: "Outpost", ilots: 1 },
    { nom: "Sanctuary Outpost", slug: "Sanctuary_Outpost", coord: "F7", type: "Outpost", ilots: 1 },
    { nom: "Dagger Tooth Outpost", slug: "Dagger_Tooth_Outpost", coord: "M8", type: "Outpost", ilots: 1 },
    { nom: "Galleon's Grave Outpost", slug: "Galleon's_Grave_Outpost", coord: "R8", type: "Outpost", ilots: 1 },
    { nom: "Ancient Spire Outpost", slug: "Ancient_Spire_Outpost", coord: "Q17", type: "Outpost", ilots: 1 },
    { nom: "Plunder Outpost", slug: "Plunder_Outpost", coord: "K18", type: "Outpost", ilots: 1 },
    { nom: "Morrow's Peak Outpost", slug: "Morrow's_Peak_Outpost", coord: "V17", type: "Outpost", ilots: 1 },
    { nom: "The North Star Seapost", slug: "The_North_Star_Seapost", coord: "H10", type: "Seapost", ilots: 1 },
    { nom: "The Spoils of Plenty Store", slug: "The_Spoils_of_Plenty_Store", coord: "B7", type: "Seapost", ilots: 1 },
    { nom: "Stephen's Spoils", slug: "Stephen's_Spoils", coord: "L15", type: "Seapost", ilots: 1 },
    { nom: "The Finest Trading Post", slug: "The_Finest_Trading_Post", coord: "F17", type: "Seapost", ilots: 1 },
    { nom: "Three Paces East Seapost", slug: "Three_Paces_East_Seapost", coord: "S10", type: "Seapost", ilots: 1 },
    { nom: "The Wild Treasures Store", slug: "The_Wild_Treasures_Store", coord: "O4", type: "Seapost", ilots: 1 },
    { nom: "Brian's Bazaar", slug: "Brian's_Bazaar", coord: "Y12", type: "Seapost", ilots: 1 },
    { nom: "Roaring Traders", slug: "Roaring_Traders", coord: "U20", type: "Seapost", ilots: 1 },
    { nom: "Shipwreck Bay", slug: "Shipwreck_Bay", coord: "M10", type: "Large", ilots: 8 },
    { nom: "Shark Bait Cove", slug: "Shark_Bait_Cove", coord: "H19", type: "Large", ilots: 4 },
    { nom: "Cannon Cove", slug: "Cannon_Cove", coord: "G10", type: "Large", ilots: 1 },
    { nom: "Crescent Isle", slug: "Crescent_Isle", coord: "B9", type: "Large", ilots: 1 },
    { nom: "Lone Cove", slug: "Lone_Cove", coord: "H6", type: "Large", ilots: 1 },
    { nom: "Mermaid's Hideaway", slug: "Mermaid's_Hideaway", coord: "B13", type: "Large", ilots: 1 },
    { nom: "Sailor's Bounty", slug: "Sailor's_Bounty", coord: "C4", type: "Large", ilots: 1 },
    { nom: "Smugglers' Bay", slug: "Smugglers'_Bay", coord: "F3", type: "Large", ilots: 1 },
    { nom: "Wanderers Refuge", slug: "Wanderers_Refuge", coord: "F12", type: "Large", ilots: 1 },
    { nom: "Crook's Hollow", slug: "Crook's_Hollow", coord: "M16", type: "Large", ilots: 1 },
    { nom: "Devil's Ridge", slug: "Devil's_Ridge", coord: "P19", type: "Large", ilots: 1 },
    { nom: "Discovery Ridge", slug: "Discovery_Ridge", coord: "E17", type: "Large", ilots: 1 },
    { nom: "Plunder Valley", slug: "Plunder_Valley", coord: "G16", type: "Large", ilots: 1 },
    { nom: "Snake Island", slug: "Snake_Island", coord: "K16", type: "Large", ilots: 3 },
    { nom: "Thieves' Haven", slug: "Thieves'_Haven", coord: "M20", type: "Large", ilots: 1 },
    { nom: "Kraken's Fall", slug: "Kraken's_Fall", coord: "R12", type: "Large", ilots: 1 },
    { nom: "Marauder's Arch", slug: "Marauder's_Arch", coord: "Q3", type: "Large", ilots: 1 },
    { nom: "Old Faithful Isle", slug: "Old_Faithful_Isle", coord: "M4", type: "Large", ilots: 1 },
    { nom: "The Crooked Masts", slug: "The_Crooked_Masts", coord: "O11", type: "Large", ilots: 1 },
    { nom: "The Sunken Grove", slug: "The_Sunken_Grove", coord: "P7", type: "Large", ilots: 1 },
    { nom: "Ashen Reaches", slug: "Ashen_Reaches", coord: "V23", type: "Large", ilots: 1 },
    { nom: "Fetcher's Rest", slug: "Fetcher's_Rest", coord: "V12", type: "Large", ilots: 1 },
    { nom: "Flintlock Peninsula", slug: "Flintlock_Peninsula", coord: "W14", type: "Large", ilots: 1 },
    { nom: "Ruby's Fall", slug: "Ruby's_Fall", coord: "Y16", type: "Large", ilots: 1 },
    { nom: "The Devil's Thirst", slug: "The_Devil's_Thirst", coord: "W21", type: "Large", ilots: 1 },
    { nom: "Lagoon of Whispers", slug: "Lagoon_of_Whispers", coord: "D12", type: "Small", ilots: 1 },
    { nom: "Lonely Isle", slug: "Lonely_Isle", coord: "G8", type: "Small", ilots: 1 },
    { nom: "Picaroon Palms", slug: "Picaroon_Palms", coord: "I4", type: "Small", ilots: 1 },
    { nom: "Rapier Cay", slug: "Rapier_Cay", coord: "D8", type: "Small", ilots: 1 },
    { nom: "Rum Runner Isle", slug: "Rum_Runner_Isle", coord: "H9", type: "Small", ilots: 1 },
    { nom: "Salty Sands", slug: "Salty_Sands", coord: "G3", type: "Small", ilots: 2 },
    { nom: "Sandy Shallows", slug: "Sandy_Shallows", coord: "D5", type: "Small", ilots: 1 },
    { nom: "Sea Dog's Rest", slug: "Sea_Dog's_Rest", coord: "C11", type: "Small", ilots: 1 },
    { nom: "Boulder Cay", slug: "Boulder_Cay", coord: "G5", type: "Small", ilots: 1 },
    { nom: "Barnacle Cay", slug: "Barnacle_Cay", coord: "O15", type: "Small", ilots: 1 },
    { nom: "Booty Isle", slug: "Booty_Isle", coord: "K20", type: "Small", ilots: 1 },
    { nom: "Castaway Isle", slug: "Castaway_Isle", coord: "K14", type: "Small", ilots: 1 },
    { nom: "Chicken Isle", slug: "Chicken_Isle", coord: "I16", type: "Small", ilots: 1 },
    { nom: "Cutlass Cay", slug: "Cutlass_Cay", coord: "M18", type: "Small", ilots: 1 },
    { nom: "Fools Lagoon", slug: "Fools_Lagoon", coord: "I14", type: "Small", ilots: 1 },
    { nom: "Lookout Point", slug: "Lookout_Point", coord: "I20", type: "Small", ilots: 1 },
    { nom: "Mutineer Rock", slug: "Mutineer_Rock", coord: "N19", type: "Small", ilots: 1 },
    { nom: "Old Salts Atoll", slug: "Old_Salts_Atoll", coord: "F18", type: "Small", ilots: 1 },
    { nom: "Paradise Spring", slug: "Paradise_Spring", coord: "L17", type: "Small", ilots: 1 },
    { nom: "Hidden Spring Keep", slug: "Hidden_Spring_Keep", coord: "I8", type: "Fort", ilots: 1 },
    { nom: "Keel Haul Fort", slug: "Keel_Haul_Fort", coord: "C6", type: "Fort", ilots: 1 },
    { nom: "Sailor's Knot Stronghold", slug: "Sailor's_Knot_Stronghold", coord: "E14", type: "Fort", ilots: 1 },
    { nom: "Lost Gold Fort", slug: "Lost_Gold_Fort", coord: "H17", type: "Fort", ilots: 1 },
    { nom: "Fort of the Damned", slug: "Fort_of_the_Damned", coord: "L14", type: "Fort", ilots: 1 },
    { nom: "The Crow's Nest Fortress", slug: "The_Crow's_Nest_Fortress", coord: "O17", type: "Fort", ilots: 1 },
    { nom: "Molten Sands Fortress", slug: "Molten_Sands_Fortress", coord: "Z11", type: "Fort", ilots: 1 }
];

const butin = [
    { nom: "Gemmes de Sirène (Saphir, Émeraude, Rubis)", prix: "1000-2000", vendeur: "TOUS (Sauf Athena)", note: "Exception : Se vend à n'importe quelle faction. Idéal pour monter une réputation." },
    { nom: "Souffles de la mer (Breaths of the Sea)", prix: "4000-8000", vendeur: "TOUS (Sauf Athena)", note: "Exception : Accepté partout. Haute valeur." },
    { nom: "Coffre de Collection (Collector's Chest)", prix: "Variable", vendeur: "TOUS", note: "ASTUCE : Vendre les objets à l'intérieur AVANT de vendre le coffre vide." },
    { nom: "Orbe des secrets", prix: "~20000", vendeur: "TOUS (Sauf Athena)", note: "Exception : Très payant, accepté par tous." },
    { nom: "Coffre de Rage", prix: "3000-3500", vendeur: "Gold Hoarders", note: "DANGER FEU : Explose si non refroidi. Mettre sur la proue ou arroser." },
    { nom: "Coffre Pleureur (Sorrow)", prix: "3000-3500", vendeur: "Gold Hoarders", note: "DANGER EAU : Remplit la cale. Doit être écopé ou mis sur une chaloupe." },
    { nom: "Coffre des mille grogs", prix: "2200-2600", vendeur: "Gold Hoarders", note: "DANGER : Rend le porteur ivre." },
    { nom: "Caisse de Tissu élégant", prix: "100-700", vendeur: "Marchands", note: "SEC : S'abîme à l'eau ou la pluie. Ne jamais mettre en cale." },
    { nom: "Caisse de Rhum", prix: "100-700", vendeur: "Marchands", note: "FRAGILE : Se brise si tu sautes, tombes ou si le bateau cogne." },
    { nom: "Caisse de Plantes", prix: "100-700", vendeur: "Marchands", note: "EAU : Doit tremper dans un fond d'eau de cale pour rester fraîche." },
    { nom: "Crâne rituel (Ritual Skull)", prix: "10 Doublons", vendeur: "Larinna (Taverne)", note: "Exception : Se vend à Larinna ou s'utilise pour le Fort of the Damned." },
    { nom: "Tomes Cendrés (Ashen Tomes)", prix: "10 Doublons", vendeur: "Larinna (Taverne)", note: "Exception : Se vend à Larinna pour des doublons." },
    { nom: "Caisse de vers / Munitions / Feux d'artifice", prix: "~1000", vendeur: "Marchands", note: "ASTUCE : Se vendent au prix fort même si elles sont VIDES." },
    { nom: "Poissons Trophées (Cuits)", prix: "750-11000", vendeur: "Hunter's Call (Seaposts)", note: "ASTUCE : Toujours cuire parfaitement pour doubler le prix de vente." },
    { nom: "Viande de Kraken / Megalodon", prix: "~150", vendeur: "Hunter's Call (Seaposts)", note: "ASTUCE : Cuire pour la santé ou vendre au Seapost pour la réputation." }
];

// --- HELPERS ---
function lettreEnChiffre(l: string) { return l.toUpperCase().charCodeAt(0) - 64; }

export default function SotCompanionPage() {
    const [posX, setPosX] = useState('');
    const [posY, setPosY] = useState('');
    const [navResult, setNavResult] = useState<{ o: any, s: any } | null>(null);

    const [searchIsland, setSearchIsland] = useState('');
    const [filterIlots, setFilterIlots] = useState('');
    const [filteredIles, setFilteredIles] = useState<any[]>([]);

    const [searchLoot, setSearchLoot] = useState('');
    const [filteredLoot, setFilteredLoot] = useState<any[]>([]);

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

    // Island logic
    useEffect(() => {
        if (searchIsland.length < 2 && filterIlots === "") {
            setFilteredIles([]);
            return;
        }
        const filtered = iles.filter(i => {
            const matchNom = i.nom.toLowerCase().includes(searchIsland.toLowerCase());
            const matchIlots = filterIlots === "" || (filterIlots === "8" ? i.ilots >= 8 : i.ilots == parseInt(filterIlots));
            return matchNom && matchIlots;
        });
        setFilteredIles(filtered);
    }, [searchIsland, filterIlots]);

    // Loot logic
    useEffect(() => {
        if (searchLoot.length < 2) {
            setFilteredLoot([]);
            return;
        }
        const filtered = butin.filter(b => b.nom.toLowerCase().includes(searchLoot.toLowerCase()) || b.note.toLowerCase().includes(searchLoot.toLowerCase()));
        setFilteredLoot(filtered);
    }, [searchLoot]);

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

                .container { max-width: 800px; margin: 0 auto; }

                header {
                    text-align: center;
                    border-bottom: 2px solid var(--accent);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }

                h1 { color: var(--accent); margin: 0; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px; }
                .safer-seas-alert { color: var(--gold); font-size: 0.8rem; font-style: italic; margin-top: 5px; }

                section {
                    background: var(--card);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                    position: relative;
                }

                h2 { font-size: 1.1rem; margin-top: 0; border-left: 4px solid var(--accent); padding-left: 10px; margin-bottom: 15px; }

                .input-group { position: relative; display: flex; gap: 10px; width: 100%; }
                
                input, select {
                    background: #0b141a;
                    border: 1px solid #333;
                    color: white;
                    padding: 10px;
                    border-radius: 6px;
                    width: 100%;
                    box-sizing: border-box;
                    font-size: 1rem;
                }

                .reset-btn {
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 0 15px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .reset-btn:hover { background: var(--danger); }

                .nav-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; }

                .result-box {
                    margin-top: 10px;
                    padding: 10px;
                    background: rgba(0, 255, 204, 0.1);
                    border-radius: 6px;
                    border-left: 4px solid var(--accent);
                    font-size: 0.9rem;
                }

                .island-filters { display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; margin-bottom: 10px; }
                
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
                .island-img { width: 80px; height: 80px; object-fit: contain; background: #0b141a; border-radius: 5px; border: 1px solid #444; }
                .island-info { flex-grow: 1; }
                .island-info strong { color: var(--accent); }
                .type-tag { font-size: 0.7rem; padding: 2px 5px; border-radius: 4px; background: #333; }

                .loot-item { border-bottom: 1px solid #2d414d; padding: 10px 0; font-size: 0.9rem; margin-top: 5px; }
                .loot-item:last-child { border-bottom: none; }
                .warning { color: var(--danger); font-size: 0.85rem; display: block; margin-top: 3px; font-weight: bold; }

                .danger-border { border-left: 5px solid var(--danger); background: rgba(255, 77, 77, 0.1); padding-left: 10px; border-radius: 4px; }
                .exception-border { border-left: 5px solid var(--gold); background: rgba(255, 204, 0, 0.05); padding-left: 10px; border-radius: 4px; }
            `}</style>

            <div className="container">
                <header>
                    <h1>Sea of Thieves Companion</h1>
                    <div className="safer-seas-alert">Optimisé Safer Seas | Outil Rapide</div>
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
                        <button className="reset-btn" onClick={() => { setPosX(''); setPosY(''); }}>✕</button>
                    </div>
                    {navResult && (
                        <div id="navResult" className="result-box">
                            🏠 Outpost: <strong>{navResult.o.nom}</strong> ({navResult.o.coord})<br />
                            ⛵ Seapost: <strong>{navResult.s.nom}</strong> ({navResult.s.coord})
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
                        <select value={filterIlots} onChange={(e) => setFilterIlots(e.target.value)}>
                            <option value="">Ilots (Tous)</option>
                            <option value="1">1 part</option>
                            <option value="2">2 parts</option>
                            <option value="3">3 parts</option>
                            <option value="4">4 parts</option>
                            <option value="8">8+ parts</option>
                        </select>
                        <button className="reset-btn" onClick={() => { setSearchIsland(''); setFilterIlots(''); }}>✕</button>
                    </div>
                    <div id="islandList">
                        {filteredIles.map((i, idx) => (
                            <div key={idx} className="island-card">
                                <img
                                    src={`https://seaofthieves.fandom.com/wiki/Special:FilePath/${i.slug}_Map_Island.png`}
                                    className="island-img"
                                    alt={i.nom}
                                    onError={(e: any) => e.target.src = 'https://placehold.co/80?text=Map'}
                                />
                                <div className="island-info">
                                    <strong>{i.nom}</strong> <span className="type-tag">{i.type}</span><br />
                                    <small>Coord: {i.coord} | Parts: {i.ilots}</small>
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
                            placeholder="Recherche (ex: tissu, rage, gemme...)"
                            value={searchLoot}
                            onChange={(e) => setSearchLoot(e.target.value)}
                        />
                        <button className="reset-btn" onClick={() => setSearchLoot('')}>✕</button>
                    </div>
                    <div id="lootResults">
                        {filteredLoot.map((b, idx) => {
                            let alertClass = "";
                            if (b.note.includes("DANGER") || b.note.includes("SEC") || b.note.includes("FRAGILE") || b.note.includes("EAU")) {
                                alertClass = "danger-border";
                            } else if (b.note.includes("Exception") || b.note.includes("ASTUCE")) {
                                alertClass = "exception-border";
                            }
                            return (
                                <div key={idx} className={`loot-item ${alertClass}`}>
                                    <strong>{b.nom}</strong> - <span style={{ color: 'var(--gold)' }}>{b.prix} or</span><br />
                                    <small>Vendre: <strong>{b.vendeur}</strong></small>
                                    <span className="warning">{b.note}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
