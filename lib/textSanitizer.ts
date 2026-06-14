const htmlEntityMap: Record<string, string> = {
  "&yacute;": "ý",
  "&Yacute;": "Ý",
  "&iuml;": "ï",
  "&Iuml;": "Ï",
  "&aacute;": "á",
  "&eacute;": "é",
  "&iacute;": "í",
  "&oacute;": "ó",
  "&uacute;": "ú",
  "&ntilde;": "ñ",
  "&ccedil;": "ç"
};

const knownBrokenText: Record<string, string> = {
  "Matěj Kov?ř": "Matěj Kovář",
  "Luk?? Horn?ček": "Lukáš Horníček",
  "Tom?? Hole?": "Tomáš Holeš",
  "Robin Hran?č": "Robin Hranáč",
  "Vladim?r Coufal": "Vladimír Coufal",
  "?těp?n Chaloupek": "Štěpán Chaloupek",
  "Ladislav Krejč?": "Ladislav Krejčí",
  "David Jur?sek": "David Jurásek",
  "Vladim?r Darida": "Vladimír Darida",
  "Hradec Kr?lov?": "Hradec Králové",
  "Luk?? Červ": "Lukáš Červ",
  "Luk?? Provod": "Lukáš Provod",
  "Michal Sad?lek": "Michal Sadílek",
  "Tom?? Souček": "Tomáš Souček",
  "Mojm?r Chytil": "Mojmír Chytil",
  "Pavel ?ulc": "Pavel Šulc",
  "Tom?? Chorý": "Tomáš Chorý",
  "Denis Vi?inský": "Denis Višinský",
  "Borussia M?nchengladbach": "Borussia Mönchengladbach",
  "Eray C?mert": "Eray Cömert",
  "Aur?le Amenda": "Aurèle Amenda",
  "Rub?n Vargas": "Rubén Vargas",
  "Fortuna D?sseldorf": "Fortuna Düsseldorf",
  "Gatito Fern?ndez": "Gatito Fernández",
  "Cerro Porte?o": "Cerro Porteño",
  "Gast?n Olveira": "Gastón Olveira",
  "Gustavo Vel?zquez": "Gustavo Velázquez",
  "Juan Jos? C?ceres": "Juan José Cáceres",
  "Fabi?n Balbuena": "Fabián Balbuena",
  "J?nior Alonso": "Júnior Alonso",
  "Atl?tico Mineiro": "Atlético Mineiro",
  "Atl?tico Madrid": "Atlético Madrid",
  "Jos? Canale": "José Canale",
  "Lan?s": "Lanús",
  "Gustavo G?mez": "Gustavo Gómez",
  "Ram?n Sosa": "Ramón Sosa",
  "Diego G?mez": "Diego Gómez",
  "Miguel Almir?n": "Miguel Almirón",
  "Maur?cio": "Maurício",
  "Andr?s Cubas": "Andrés Cubas",
  "Dami?n Bobadilla": "Damián Bobadilla",
  "Mat?as Galarza": "Matías Galarza",
  "?lex Arce": "Álex Arce",
  "Gabriel ?valos": "Gabriel Ávalos",
  "Castell?n": "Castellón",
  "Mert G?nok": "Mert Günok",
  "Fenerbah?e": "Fenerbahçe",
  "Uğurcan ?akır": "Uğurcan Çakır",
  "Zeki ?elik": "Zeki Çelik",
  "?ağlar S?y?nc?": "Çağlar Söyüncü",
  "Abd?lkerim Bardakcı": "Abdülkerim Bardakcı",
  "Mert M?ld?r": "Mert Müldür",
  "?aykur Rizespor": "Çaykur Rizespor",
  "Salih ?zcan": "Salih Özcan",
  "Orkun K?k??": "Orkun Kökçü",
  "Hakan ?alhanoğlu": "Hakan Çalhanoğlu",
  "İsmail Y?ksek": "İsmail Yüksek",
  "Kerem Akt?rkoğlu": "Kerem Aktürkoğlu",
  "Arda G?ler": "Arda Güler",
  "Deniz G?l": "Deniz Gül",
  "Yunus Akg?n": "Yunus Akgün",
  "Kevin Rodr?guez": "Kevin Rodríguez",
  "Hurac?n": "Huracán",
  "Jeremy Ar?valo": "Jeremy Arévalo",
  "Nathan Ak?": "Nathan Aké",
  "Emiliano Mart?nez": "Emiliano Martínez",
  "Ger?nimo Rulli": "Gerónimo Rulli",
  "Lisandro Mart?nez": "Lisandro Martínez",
  "Nicol?s Otamendi": "Nicolás Otamendi",
  "Nicol?s Tagliafico": "Nicolás Tagliafico",
  "Valent?n Barco": "Valentín Barco",
  "Enzo Fern?ndez": "Enzo Fernández",
  "Nicol?s Gonz?lez": "Nicolás González",
  "Juli?n Alvarez": "Julián Alvarez",
  "Jos? Manuel L?pez": "José Manuel López",
  "Lautaro Mart?nez": "Lautaro Martínez",
  "Esp?rance de Tunis": "Espérance de Tunis",
  "Far?s Chaïbi": "Farès Chaïbi",
  "Far?s Ghedjemis": "Farès Ghedjemis",
  "Luis Mej?a": "Luis Mejía",
  "C?sar Samudio": "César Samudio",
  "Marath?n": "Marathón",
  "C?sar Blackman": "César Blackman",
  "Jos? C?rdoba": "José Córdoba",
  "Edgardo Fari?a": "Edgardo Fariña",
  "Jorge Guti?rrez": "Jorge Gutiérrez",
  "Cristian Mart?nez": "Cristian Martínez",
  "Jos? Luis Rodr?guez": "José Luis Rodríguez",
  "Ju?rez": "Juárez",
  "Yoel B?rcenas": "Yoel Bárcenas",
  "Mazatl?n": "Mazatlán",
  "An?bal Godoy": "Aníbal Godoy",
  "Azar?as Londo?o": "Azarías Londoño",
  "Universidad Cat?lica de Chile": "Universidad Católica de Chile",
  "Tom?s Rodr?guez": "Tomás Rodríguez",
  "Ismael D?az": "Ismael Díaz",
  "Le?n": "León",
  "Universidad de Concepci?n": "Universidad de Concepción"
};

export function sanitizeDisplayText(value: string | null | undefined, fallback = "확인 필요") {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  let next = value.trim();

  for (const [entity, decoded] of Object.entries(htmlEntityMap)) {
    next = next.replaceAll(entity, decoded);
  }

  for (const [broken, fixed] of Object.entries(knownBrokenText)) {
    next = next.replaceAll(broken, fixed);
  }

  return next.replace(/\uFFFD/g, "").replace(/\?/g, "").replace(/\s+/g, " ").trim() || fallback;
}

export function hasBrokenDisplayText(value: string | null | undefined) {
  return Boolean(value && (value.includes("?") || value.includes("\uFFFD") || /&[a-z]+;/i.test(value)));
}
