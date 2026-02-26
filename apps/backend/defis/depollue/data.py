# allowed_objects.py
allowed_objects = {
    "sailboat": {
        "id": "sailboat",
        "emoji": "V",
        "name": "Voilier",
        "description": "Un voilier circulant sur le fleuve.",
        "image": "sailboat.png",
    },
    "buoy": {
        "id": "buoy",
        "emoji": "V",
        "name": "Bouée",
        "description": "Bouée de signalisation pour la navigation.",
        "image": "buoy.png",
    },
    "truite_arcenciel": {
        "id": "truite_arcenciel",
        "emoji": "V",
        "name": "Truite Arc-en-ciel",
        "description": "Petit poisson argenté, souvent pêché pour appât ou consommation locale.",
        "image": "truite_arcenciel.png",
    },
    "atlantic_salmon": {
        "id": "atlantic_salmon",
        "emoji": "V",
        "name": "Saumon atlantique",
        "description": "Poisson migrateur qui remonte le Saint-Laurent pour se reproduire.",
        "image": "atlantic_salmon.png",
    },
}

# pollutants.py
pollutants = {
    "plastic_bottle": {
        "id": "plastic_bottle",
        "emoji": "X",
        "name": "Bouteille en plastique",
        "description": "Les bouteilles en plastique mettent des centaines d’années à se dégrader et nuisent gravement à la faune aquatique.",
        "image": "plastic_bottle.png",
    },
    "tire": {
        "id": "tire",
        "emoji": "X",
        "name": "Pneu usagé",
        "description": "Les pneus libèrent des substances toxiques et perturbent les écosystèmes aquatiques.",
        "image": "tire.png",
    },
    "oil_barrel": {
        "id": "oil_barrel",
        "emoji": "X",
        "name": "Baril de pétrole",
        "description": "Les hydrocarbures contaminent l’eau et détruisent les habitats naturels.",
        "image": "oil_barrel.png",
    },
}

# maps.py
depollue_maps = {
    1: {
        "id": 1,
        "name": "Carte 1 — Fleuve Saint-Laurent",
        "initial_view_state": {
            "longitude": -70.6,
            "latitude": 47.1039,
            "zoom": 10.8,
            "pitch": 0,
            "bearing": 0,
        },
        "timer": 90,
        "nb_pollutants": 2,
        "nb_allowedObjects": 1,
        "pollutants": [
            pollutants["plastic_bottle"],
            pollutants["tire"],
            pollutants["oil_barrel"],
        ],
        "allowed_objects": [
            allowed_objects["sailboat"],
            allowed_objects["buoy"],
            allowed_objects["truite_arcenciel"],
            allowed_objects["atlantic_salmon"],
        ],
        "spawn_points": [
            [-70.836541, 47.034789],
            [-70.698147, 46.985871],
            [-70.754810, 46.989617],
            [-70.802200, 46.983529],
            [-70.708449, 47.035725],
            [-70.713600, 47.086934],
            [-70.644231, 47.076650],
            [-70.608517, 47.110535],
            [-70.544642, 47.108666],
            [-70.559065, 47.067298],
            [-70.512705, 47.136928],
            [-70.562843, 47.148601],
            [-70.446083, 47.169141],
            [-70.349928, 47.175488],
            [-70.412772, 47.154251],
            [-70.395945, 47.115254],
            [-70.488323, 47.108713],
            [-70.485232, 47.045596],
            [-70.578640, 47.017521],
            [-70.653160, 46.977440],
        ],
    },

    2: {
        "id": 2,
        "name": "Carte 2 — Zone 2",
        "initial_view_state": {
            "longitude": -73.56,
            "latitude": 45.51,
            "zoom": 12,
            "pitch": 0,
            "bearing": 0,
        },
        "timer": 120,
        "nb_pollutants": 0,
        "nb_allowedObjects": 0,
        "pollutants": [
            pollutants["oil_barrel"],
            pollutants["plastic_bottle"],
        ],
        "allowed_objects": [
            allowed_objects["sailboat"],
            allowed_objects["truite_arcenciel"],
        ],
        "spawn_points": [
        ],
    },
}
