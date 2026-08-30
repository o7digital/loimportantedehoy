export type Article = {
  slug: string; number: number; title: string; seoTitle: string; description: string;
  category: string; categorySlug: string; published: string; updated: string; readTime: number;
  author: string; featured?: boolean; image?: string; excerpt: string; intro: string[];
  premium: { heading: string; paragraphs: string[] }[];
};

export const articles: Article[] = [
  {
    slug: "the-doors-el-dia-en-que-se-cerro-una-era", number: 218, featured: true,
    title: "The Doors: el día en que se cerró una era",
    seoTitle: "The Doors y el final de una era | Lo importante de hoy",
    description: "Una mirada editorial al legado de The Doors y al momento en que su historia cambió para siempre.",
    category: "Música", categorySlug: "musica", published: "2026-08-30", updated: "2026-08-30", readTime: 7,
    author: "Redacción Lo importante de hoy", image: "/the-doors-edicion.webp",
    excerpt: "Algunas bandas terminan. Otras permanecen como una puerta abierta hacia el tiempo que las hizo posibles.",
    intro: [
      "The Doors ocupan un lugar extraño y persistente en la memoria del rock: fueron una banda de su tiempo y, al mismo tiempo, una pregunta que ese tiempo dejó sin responder.",
      "Esta edición recorre su huella cultural sin convertirla en una lista de fechas. Nos interesa la tensión entre la música, la imagen pública y el modo en que una obra sigue cambiando cuando quienes la crearon ya no pueden explicarla.",
    ],
    premium: [
      { heading: "Una música que abría habitaciones", paragraphs: ["El órgano, la guitarra contenida y una voz que parecía hablar desde un escenario interior construyeron un lenguaje reconocible desde los primeros compases.", "Más que reconstruir una cronología exhaustiva, esta lectura propone escuchar cómo una generación proyectó sus deseos y contradicciones en cuatro músicos."] },
      { heading: "Después del último acorde", paragraphs: ["Cuando una historia cultural se cierra, comienza otra: la de sus reediciones, sus nuevas audiencias y las preguntas que cada época vuelve a hacerle."] },
    ],
  },
  {
    slug: "ingrid-bergman-una-vida-fuera-del-guion", number: 217,
    title: "Ingrid Bergman: una vida fuera del guion", seoTitle: "Ingrid Bergman: una vida fuera del guion",
    description: "Un retrato editorial sobre la presencia, las decisiones y el legado cinematográfico de Ingrid Bergman.",
    category: "Personajes", categorySlug: "personajes", published: "2026-08-29", updated: "2026-08-29", readTime: 6,
    author: "Redacción Lo importante de hoy", excerpt: "Una carrera puede parecer escrita de antemano. Una vida, casi nunca.",
    intro: ["La cámara encontraba en Ingrid Bergman una mezcla poco común de cercanía y misterio. Su trayectoria permite pensar en la distancia entre el personaje público y las decisiones privadas.", "Este ensayo breve funciona como puerta de entrada a su obra y a una conversación más amplia sobre libertad, fama y memoria cinematográfica."],
    premium: [{ heading: "La mirada y la elección", paragraphs: ["La pantalla conserva gestos; el tiempo, en cambio, reorganiza su significado. Volver a sus películas es observar también cómo ha cambiado nuestra manera de mirar."] }],
  },
  {
    slug: "la-ciudad-que-aprendio-a-mirar-hacia-arriba", number: 216,
    title: "La ciudad que aprendió a mirar hacia arriba", seoTitle: "La ciudad que aprendió a mirar hacia arriba",
    description: "Una lectura cultural de la arquitectura, la memoria urbana y nuestra forma de habitar la ciudad.",
    category: "Historia", categorySlug: "historia", published: "2026-08-28", updated: "2026-08-28", readTime: 8,
    author: "Redacción Lo importante de hoy", excerpt: "Toda ciudad cuenta dos historias: la que sucede a ras de suelo y la que espera sobre nuestras cabezas.",
    intro: ["Las ciudades se leen caminando, pero también levantando la vista. Cornisas, anuncios, cúpulas y ventanas guardan capas de decisiones colectivas.", "Esta pieza propone una forma de observar el paisaje urbano sin atribuirle una historia específica: como archivo vivo y como ejercicio cotidiano de atención."],
    premium: [{ heading: "El archivo sobre la calle", paragraphs: ["Mirar hacia arriba interrumpe la ruta automática. En esa pausa aparecen las distintas velocidades con las que una ciudad se construye, se olvida y vuelve a reconocerse."] }],
  },
  {
    slug: "las-canciones-que-cambiaron-una-generacion", number: 215,
    title: "Las canciones que cambiaron una generación", seoTitle: "Las canciones que cambiaron una generación",
    description: "Una reflexión sobre las canciones que se convierten en memoria compartida y lenguaje generacional.",
    category: "Cultura", categorySlug: "cultura", published: "2026-08-27", updated: "2026-08-27", readTime: 5,
    author: "Redacción Lo importante de hoy", excerpt: "Una canción dura minutos. La vida que construimos alrededor de ella puede durar décadas.",
    intro: ["No existe una sola banda sonora para una generación. Existen canciones que se cruzan con cambios sociales, descubrimientos personales y formas nuevas de reconocerse.", "En lugar de una clasificación definitiva, esta edición explora por qué ciertas melodías se convierten en una memoria que muchas personas sienten propia."],
    premium: [{ heading: "Escuchar juntos", paragraphs: ["Antes de ser archivo, una canción es presente compartido. Su fuerza no depende únicamente de la letra o la melodía, sino de todo lo que ocurre a su alrededor."] }],
  },
];

export const getArticle = (slug: string) => articles.find((article) => article.slug === slug);
