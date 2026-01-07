# allowed_objects.py
allowed_objects = {
    "boat": {
        "id": "boat",
        "emoji": "V",
        "name": "Bateau",
        "description": "Un bateau circulant sur le fleuve.",
    },
    "buoy": {
        "id": "buoy",
        "emoji": "V",
        "name": "Bouée",
        "description": "Bouée de signalisation pour la navigation.",
    },
    "fish": {
        "id": "fish",
        "emoji": "V",
        "name": "Poisson",
        "description": "Faune du fleuve Saint-Laurent",
    },
}

# pollutants.py
pollutants = {
    "plastic_bottle": {
        "id": "plastic_bottle",
        "emoji": "X",
        "name": "Bouteille en plastique",
        "description": "Les bouteilles en plastique mettent des centaines d’années à se dégrader et nuisent gravement à la faune aquatique.",
    },
    "tire": {
        "id": "tire",
        "emoji": "X",
        "name": "Pneu usagé",
        "description": "Les pneus libèrent des substances toxiques et perturbent les écosystèmes aquatiques.",
    },
    "oil_barrel": {
        "id": "oil_barrel",
        "emoji": "X",
        "name": "Baril de pétrole",
        "description": "Les hydrocarbures contaminent l’eau et détruisent les habitats naturels.",
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
        "timer": 130,
        "nb_pollutants": 2,
        "nb_allowedObjects": 1,
        "pollutants": [
            pollutants["plastic_bottle"],
            pollutants["tire"],
        ],
        "allowed_objects": [
            allowed_objects["boat"],
            allowed_objects["buoy"],
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
            [-70.597184, 47.212062],
            [-70.497252, 47.197137],
            [-70.446083, 47.169141],
            [-70.546703, 47.230293],
            [-70.442993, 47.226331],
            [-70.358857, 47.220036],
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
        "nb_pollutants": 2,
        "nb_allowed_objects": 2,
        "pollutants": [
            pollutants["oil_barrel"],
            pollutants["plastic_bottle"],
        ],
        "allowed_objects": [
            allowed_objects["boat"],
            allowed_objects["fish"],
        ],
        "spawn_points": [
        ],
    },
}
