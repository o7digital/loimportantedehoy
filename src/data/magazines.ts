import type { MagazineTheme } from "../lib/magazine-theme";

export type MagazineChapter = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  stats?: { value: string; label: string }[];
  entries?: { label: string; text: string }[];
  quote?: string;
  attribution?: string;
  song?: { title: string; artist: string; album?: string; note: string; url?: string };
  layout?: "story" | "facts" | "quote" | "music";
  image?: string;
  photoCredit?: string;
  photoSource?: string;
};

export type Magazine = {
  slug: string;
  date: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  anniversary: string;
  image: string;
  photograph?: string;
  photoCredit?: string;
  photoSource?: string;
  photoPosition?: string;
  theme?: MagazineTheme;
  coverCutout?: string;
  category: string;
  sources: string[];
  chapters: MagazineChapter[];
};

// Adaptaciones para lectura móvil de las ediciones originales de JerryMC.
// Las imágenes originales se conservan completas en public/revistas.
export const magazines: Magazine[] = [
  {
    slug: "frida", date: "2026-11-15", dateLabel: "15 de noviembre de 2026",
    title: "Frida", subtitle: "La esperanza tenía cuatro patas.",
    anniversary: "Cuarto aniversario luctuoso · 2022–2026",
    image: "/revistas/frida-2026-11-15.jpg", category: "Una vida que inspira", photograph: "/editorial/frida.jpg", photoCredit: "Gobierno de la Ciudad de México · CC BY 4.0", photoSource: "https://commons.wikimedia.org/wiki/File:Frida,_perra_de_rescate_de_la_marina.jpg", photoPosition: "38% 38%",
    sources: ["Secretaría de Marina", "El Informador", "Clannad"],
    chapters: [
      { id: "portada", label: "Portada", kicker: "Una vida que inspira", title: "Frida" },
      {
        id: "historia", label: "Su historia", kicker: "Hechos y personajes", title: "Donde todo parecía perdido, Frida buscaba una vida.",
        intro: "Una labrador rescatista que se convirtió en símbolo de solidaridad.",
        paragraphs: ["Frida formó parte de la Secretaría de Marina de México. Su imagen, con gafas, botas y arnés, se volvió un emblema de esperanza durante los sismos de septiembre de 2017.", "Nació el 12 de abril de 2009 y murió el 15 de noviembre de 2022, a los 13 años. Su historia recuerda el trabajo de los equipos que buscan a otros cuando todo parece perdido."],
      },
      {
        id: "huella", label: "Su huella", kicker: "Una vida al servicio de los demás", title: "Detrás de cada número, una historia.",
        stats: [{ value: "12", label: "personas encontradas con vida" }, { value: "43", label: "personas sin vida localizadas" }],
        intro: "Su huella más profunda quedó en quienes pudieron volver a casa.",
        entries: [{ label: "Haití · 2010", text: "Terremoto." }, { label: "México · 2013", text: "Explosión de la Torre de Pemex." }, { label: "Ecuador · 2017", text: "Deslave." }, { label: "Oaxaca y Ciudad de México · 2017", text: "Sismos de septiembre." }],
      },
      {
        id: "equipo", label: "El equipo", kicker: "Detrás de la heroína", title: "Nadie rescata en solitario.", image: "/editorial/frida-equipo-semar.jpg", photoCredit: "Secretaría de Marina / Gobierno de México", photoSource: "https://www.gob.mx/semar/galerias/develacion-de-la-escultura-de-frida-elemento-canino-de-busqueda-y-rescate",
        intro: "Un binomio canino reúne al perro y a su manejador: olfato, entrenamiento y confianza para trabajar juntos.",
        entries: [{ label: "Gafas", text: "Protección para sus ojos." }, { label: "Botas", text: "Cuidado de las almohadillas." }, { label: "Arnés", text: "Apoyo en maniobras de rescate." }],
        paragraphs: ["Al retirarse, el 24 de junio de 2019, Frida entregó su equipo táctico y recibió un juguete. Comenzaba su vida de descanso y cuidados."],
      },
      {
        id: "palabras", label: "Palabras", kicker: "Palabras que inspiran", title: "Una despedida. Una huella para siempre.",
        quote: "Nos vemos gordita, hasta la próxima misión", attribution: "Israel Arauz Salinas · su último manejador",
        paragraphs: ["La memoria de Frida vive en las personas que ayudó a encontrar y en quienes trabajaron a su lado. Una historia de servicio, confianza y esperanza."],
      },
      {
        id: "musica", label: "Música", kicker: "Música que conecta", title: "Una canción para recordarla.",
        song: { title: "I Will Find You", artist: "Clannad", album: "El último de los mohicanos", url: "https://www.youtube.com/watch?v=poIUiyy9z24", note: "Una promesa de búsqueda y esperanza que evoca la misión de Frida. Una voz emotiva y serena para honrar su memoria." },
      },
    ],
  },
  {
    slug: "leon-russell", date: "2026-11-13", dateLabel: "13 de noviembre de 2026",
    title: "Leon Russell", subtitle: "El maestro detrás de los grandes maestros del rock.",
    anniversary: "10 años de su partida · 2016–2026", image: "/revistas/leon-russell-2026-11-13.jpg", photograph: "/editorial/leon-russell.jpg", photoCredit: "Jim Gilbert / Jtgphoto · CC BY-SA 4.0", photoSource: "https://commons.wikimedia.org/wiki/File:20160228-Leon_Russell-JTG.jpg", photoPosition: "60% 35%",
    category: "Una vida entre gigantes", sources: ["Edición original de JerryMC · 13 de noviembre"],
    chapters: [
      { id: "portada", label: "Portada", kicker: "Una vida entre gigantes", title: "Leon Russell" },
      {
        id: "historia", label: "Su historia", kicker: "Hechos y personajes", title: "Hay músicos que llenan escenarios. Otros transforman la música.",
        intro: "Pianista, compositor y productor. Una vida compartida con algunos de los nombres esenciales del rock.",
        paragraphs: ["Leon Russell colaboró con George Harrison, Bob Dylan, Joe Cocker y Elton John. Su trabajo lo llevó a cruzar géneros, generaciones y escenarios.", "Nació el 2 de abril de 1942 en Lawton, Oklahoma. Falleció el 13 de noviembre de 2016 en Nashville, Tennessee. Esta edición recuerda diez años de su partida."],
      },
      {
        id: "momentos", label: "Momentos", kicker: "Momentos esenciales", title: "Tres fechas. Un legado que sigue sonando.",
        entries: [{ label: "1970", text: "Publica Leon Russell, con A Song for You." }, { label: "1971", text: "Participa en el Concierto para Bangladesh." }, { label: "2011", text: "Ingresa al Salón de la Fama del Rock & Roll." }],
        paragraphs: ["A Song for You, Superstar, Delta Lady y This Masquerade forman parte de su legado musical."],
      },
      {
        id: "conexiones", label: "Conexiones", kicker: "Dos canciones, dos maestros", title: "Un piano. Un mismo sentimiento.",
        intro: "A Song for You y Your Song nacieron en 1970: dos declaraciones de amor al piano que unieron musicalmente a Leon Russell y Elton John.",
        paragraphs: ["Elton John consideró A Song for You una de las canciones que más hubiera querido componer.", "Otra de las grandes conexiones de Russell fue Superstar, escrita con Bonnie Bramlett en 1969 y popularizada mundialmente por The Carpenters en 1971."],
      },
      {
        id: "palabras", label: "Palabras", kicker: "Palabras que inspiran", title: "El amor, incluso cuando se apagan las luces.",
        intro: "A Song for You habla de intimidad, memoria y una canción que permanece. Superstar mira hacia la ausencia y la soledad después del escenario.",
        paragraphs: ["Dos maneras de expresar un mismo deseo: que la música llegue a alguien, más allá de la distancia y del tiempo."],
        quote: "Hay músicos que llenan escenarios. Otros transforman para siempre la música.", attribution: "De la edición original · JerryMC",
      },
      {
        id: "musica", label: "Música", kicker: "Música que conecta", title: "Una declaración que trasciende el tiempo.",
        song: { title: "A Song for You", artist: "Leon Russell", album: "Canción publicada en 1970 · Versión en vídeo: Signature Songs", url: "https://www.youtube.com/watch?v=l0ELq9b147c", note: "Vuelve al piano y a la voz de su autor. Una canción que conecta a dos maestros y a todas las personas que alguna vez la hicieron suya." },
      },
    ],
  },
  {
    slug: "abbey-road", date: "2026-11-12", dateLabel: "12 de noviembre de 2026",
    title: "Abbey Road Studios", subtitle: "Aquí la música aprendió a imaginar lo imposible.",
    anniversary: "95 años · 1931–2026", image: "/revistas/abbey-road-2026-11-12.jpg", photograph: "/editorial/abbey-road-studio.jpg", photoCredit: "Misterweiss · Dominio público", photoSource: "https://commons.wikimedia.org/wiki/File:Abbey_Rd_Studios.jpg", photoPosition: "50% 60%",
    category: "Un lugar con historia", sources: ["Abbey Road Studios", "The Beatles", "Edición original de JerryMC"],
    chapters: [
      { id: "portada", label: "Portada", kicker: "Un lugar con historia", title: "Abbey Road Studios" },
      {
        id: "historia", label: "Su historia", kicker: "El hecho de hoy", title: "Una calle, un disco, un nombre.",
        intro: "El 12 de noviembre de 1931 abrió en Londres como EMI Studios. Edward Elgar dirigió a la Orquesta Sinfónica de Londres en la ceremonia inaugural.",
        paragraphs: ["El recinto está en el número 3 de Abbey Road. En 1969, The Beatles tomaron el nombre de la calle para su álbum, después de descartar el título provisional Everest.", "Paul McCartney propuso fotografiarse fuera del estudio. El éxito del disco inspiró después el cambio de nombre de EMI Studios a Abbey Road Studios."],
      },
      {
        id: "grabaciones", label: "Grabaciones", kicker: "Grabaciones que cambiaron la escucha", title: "Si estas paredes pudieran cantar.",
        entries: [{ label: "The Beatles", text: "Sgt. Pepper’s Lonely Hearts Club Band." }, { label: "Pink Floyd", text: "The Dark Side of the Moon." }, { label: "Amy Winehouse y Tony Bennett", text: "Body and Soul." }],
        paragraphs: ["El cine también suena aquí: bandas sonoras de El señor de los anillos, Harry Potter y películas de Star Wars."],
      },
      {
        id: "estudio", label: "El estudio", kicker: "Un recinto vivo", title: "La historia sigue grabándose.",
        intro: "En 2026 continúa con grabación, mezcla y masterización. El estudio suma instrumentos, herramientas y nuevas formas de encuentro.",
        entries: [{ label: "Antes de la inauguración", text: "Paul Robeson ya había grabado Rockin’ Chair en Studio Three." }, { label: "Dos escenarios · 1969", text: "The Beatles tocaron con Billy Preston en la azotea de Apple Corps. Meses después, en EMI Studios, dieron forma a Abbey Road." }],
      },
      {
        id: "palabras", label: "Palabras", kicker: "Palabras que inspiran", title: "Un estudio también puede ser un instrumento.",
        quote: "Aquí la música aprendió a imaginar lo imposible.", attribution: "De la edición original · JerryMC",
        paragraphs: ["Orquesta, rock y experimentación: las grabaciones de Abbey Road permiten escuchar lo que ocurre cuando un espacio se vuelve parte de la creación."],
      },
      {
        id: "musica", label: "Música", kicker: "Música que conecta", title: "Escucha lo que un estudio puede imaginar.",
        song: { title: "A Day in the Life", artist: "The Beatles", album: "Sgt. Pepper’s Lonely Hearts Club Band · 1967", url: "https://www.youtube.com/watch?v=usNsCeOV4GM", note: "Orquesta, rock y experimentación: una obra que revela el estudio como instrumento creativo." },
      },
    ],
  },
];

export const latestMagazine = magazines[0];
