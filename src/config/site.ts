const membershipPlans = [
  { id: "espanol", name: "Español", price: 29, description: "La revista y el archivo en español." },
  { id: "bilingue", name: "Español + inglés", price: 39, description: "La misma edición en español e inglés." },
  { id: "multilingue", name: "Multilingüe", price: 69, description: "La revista en los idiomas disponibles del catálogo." },
] as const;

export const site = {
  name: "Lo importante de hoy",
  url: "https://loimportantedehoy.vercel.app",
  description: "Una revista digital de cultura, historia, música e ideas para lectores curiosos.",
  membership: {
    price: membershipPlans[0].price,
    currency: "MXN",
    period: "mes",
    plans: membershipPlans,
  },
  instagram: "https://www.instagram.com/loimportantehoyjerrymc/",
} as const;

export type MembershipPlanId = typeof site.membership.plans[number]["id"];

export const categories = [
  { slug: "historia", name: "Historia" },
  { slug: "musica", name: "Música" },
  { slug: "personajes", name: "Personajes" },
  { slug: "cultura", name: "Cultura" },
  { slug: "ideas", name: "Ideas" },
  { slug: "frases-que-inspiran", name: "Frases que inspiran" },
] as const;
