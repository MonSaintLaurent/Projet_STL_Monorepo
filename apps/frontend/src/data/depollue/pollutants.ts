export const pollutants = {
  plastic_bottle: {
    id: "plastic_bottle",
    emoji: "X",
    name: "Bouteille en plastique",
    shortDescription: "Déchet plastique flottant",
    description:
      "Les bouteilles en plastique mettent des centaines d’années à se dégrader et nuisent gravement à la faune aquatique",
  },

  tire: {
    id: "tire",
    emoji: "X",
    name: "Pneu usagé",
    shortDescription: "Pneu abandonné dans le fleuve",
    description:
      "Les pneus libèrent des substances toxiques et perturbent les écosystèmes aquatiques",
  },

  oil_barrel: {
    id: "oil_barrel",
    emoji: "X",
    name: "Baril de pétrole",
    shortDescription: "Source de pollution chimique",
    description:
      "Les hydrocarbures contaminent l’eau et détruisent les habitats naturels",
  },
} as const;
