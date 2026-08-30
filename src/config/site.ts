export const site = {
  name: "Lo importante de hoy",
  url: "https://loimportantehoy.mx",
  description: "Una revista digital de cultura, historia, música e ideas para lectores curiosos.",
  membership: { price: 99, currency: "MXN", period: "mes" },
  instagram: "https://www.instagram.com/loimportantehoyjerrymc/",
} as const;

export const categories = [
  { slug: "historia", name: "Historia" },
  { slug: "musica", name: "Música" },
  { slug: "personajes", name: "Personajes" },
  { slug: "cultura", name: "Cultura" },
  { slug: "ideas", name: "Ideas" },
  { slug: "frases-que-inspiran", name: "Frases que inspiran" },
] as const;
