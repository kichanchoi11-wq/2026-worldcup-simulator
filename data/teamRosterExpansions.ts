import type { PlayerPosition } from "@/types/team";

type RosterPosition = Extract<PlayerPosition, "GK" | "DF" | "MF" | "FW">;

export type RosterExpansionPlayer = {
  name: string;
  position: RosterPosition;
  club: string;
};

// Generated from FourFourTwo World Cup 2026 squad pages on 2026-06-14.
// The curated scouting profile keeps role/key-player context; this file supplies source-backed roster depth.
export const teamRosterExpansions: Record<string, RosterExpansionPlayer[]> = {
  "mexico": [
    {
      "name": "Guillermo Ochoa",
      "position": "GK",
      "club": "AEL Limassol"
    },
    {
      "name": "Raul Rangel",
      "position": "GK",
      "club": "Guadalajara"
    },
    {
      "name": "Carlos Acevedo",
      "position": "GK",
      "club": "Santos Laguna"
    },
    {
      "name": "Jesus Gallardo",
      "position": "DF",
      "club": "Toluca"
    },
    {
      "name": "Cesar Montes",
      "position": "DF",
      "club": "Lokomotiv Moscow"
    },
    {
      "name": "Jorge Sanchez",
      "position": "DF",
      "club": "PAOK"
    },
    {
      "name": "Johan Vasquez",
      "position": "DF",
      "club": "Genoa"
    },
    {
      "name": "Israel Reyes",
      "position": "DF",
      "club": "America"
    },
    {
      "name": "Mateo Chavez",
      "position": "DF",
      "club": "AZ"
    },
    {
      "name": "Edson Alvarez",
      "position": "MF",
      "club": "Fenerbahce"
    },
    {
      "name": "Orbelin Pineda",
      "position": "MF",
      "club": "AEK Athens"
    },
    {
      "name": "Roberto Alvarado",
      "position": "MF",
      "club": "Guadalajara"
    },
    {
      "name": "Luis Romo",
      "position": "MF",
      "club": "Guadalajara"
    },
    {
      "name": "Luis Chavez",
      "position": "MF",
      "club": "Dynamo Moscow"
    },
    {
      "name": "Erik Lira",
      "position": "MF",
      "club": "Cruz Azul"
    },
    {
      "name": "Brian Gutierrez",
      "position": "MF",
      "club": "Guadalajara"
    },
    {
      "name": "Gilberto Mora",
      "position": "MF",
      "club": "Tijuana"
    },
    {
      "name": "Obed Vargas",
      "position": "MF",
      "club": "Atletico Madrid"
    },
    {
      "name": "Alvaro Fidalgo",
      "position": "MF",
      "club": "Betis"
    },
    {
      "name": "Cesar Huerta",
      "position": "MF",
      "club": "RSC Anderlecht"
    },
    {
      "name": "Raul Jimenez",
      "position": "FW",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Alexis Vega",
      "position": "FW",
      "club": "Toluca"
    },
    {
      "name": "Santiago Gimenez",
      "position": "FW",
      "club": "Milan"
    },
    {
      "name": "Julian Quinones",
      "position": "FW",
      "club": "Al-Qadsiah"
    },
    {
      "name": "Guillermo Martinez",
      "position": "FW",
      "club": "UNAM"
    },
    {
      "name": "Armando Gonzalez",
      "position": "FW",
      "club": "Guadalajara"
    }
  ],
  "south-africa": [
    {
      "name": "Ronwen Williams",
      "position": "GK",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Ricardo Goss",
      "position": "GK",
      "club": "Siwelele"
    },
    {
      "name": "Sipho Chaine",
      "position": "GK",
      "club": "Orlando Pirates"
    },
    {
      "name": "Khuliso Mudau",
      "position": "DF",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Aubrey Modiba",
      "position": "DF",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Khulumani Ndamane",
      "position": "DF",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Olwethu Makhanya",
      "position": "DF",
      "club": "Philadelphia Union"
    },
    {
      "name": "Bradley Cross",
      "position": "DF",
      "club": "Kaizer Chiefs"
    },
    {
      "name": "Thabang Matuludi",
      "position": "DF",
      "club": "Polokwane City"
    },
    {
      "name": "Nkosinathi Sibisi",
      "position": "DF",
      "club": "Orlando Pirates"
    },
    {
      "name": "Kamogelo Sebelebele",
      "position": "DF",
      "club": "Orlando Pirates"
    },
    {
      "name": "Ime Okon",
      "position": "DF",
      "club": "Hannover 96"
    },
    {
      "name": "Samukele Kabini",
      "position": "DF",
      "club": "Molde FK"
    },
    {
      "name": "Mbekezeli Mbokazi",
      "position": "DF",
      "club": "Chicago Fire"
    },
    {
      "name": "Teboho Mokoena",
      "position": "MF",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Jayden Adams",
      "position": "MF",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Thalente Mbatha",
      "position": "MF",
      "club": "Orlando Pirates"
    },
    {
      "name": "Sphephelo Sithole",
      "position": "MF",
      "club": "Tondela"
    },
    {
      "name": "Oswin Appollis",
      "position": "FW",
      "club": "Orlando Pirates"
    },
    {
      "name": "Tshepang Moremi",
      "position": "FW",
      "club": "Orlando Pirates"
    },
    {
      "name": "Evidence Makgopa",
      "position": "FW",
      "club": "Orlando Pirates"
    },
    {
      "name": "Relebohile Mofokeng",
      "position": "FW",
      "club": "Orlando Pirates"
    },
    {
      "name": "Lyle Foster",
      "position": "FW",
      "club": "Burnley"
    },
    {
      "name": "Iqraam Rayners",
      "position": "FW",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Themba Zwane",
      "position": "FW",
      "club": "Mamelodi Sundowns"
    },
    {
      "name": "Thapelo Maseko",
      "position": "FW",
      "club": "AEL Limassol"
    }
  ],
  "korea-republic": [
    {
      "name": "Kim Seung-gyu",
      "position": "GK",
      "club": "FC Tokyo"
    },
    {
      "name": "Jo Hyeon-woo",
      "position": "GK",
      "club": "Ulsan HD"
    },
    {
      "name": "Song Bum-keun",
      "position": "GK",
      "club": "Jeonbuk Hyundai Motors"
    },
    {
      "name": "Kim Min-jae",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "Kim Moon-hwan",
      "position": "DF",
      "club": "Daejeon Hana Citizen"
    },
    {
      "name": "Seol Young-woo",
      "position": "DF",
      "club": "Red Star Belgrade"
    },
    {
      "name": "Cho Wi-je",
      "position": "DF",
      "club": "Jeonbuk Hyundai Motors"
    },
    {
      "name": "Lee Tae-seok",
      "position": "DF",
      "club": "Austria Wien"
    },
    {
      "name": "Park Jin-seob",
      "position": "DF",
      "club": "Zhejiang FC"
    },
    {
      "name": "Kim Tae-hyeon",
      "position": "DF",
      "club": "Kashima Antlers"
    },
    {
      "name": "Lee Han-beom",
      "position": "DF",
      "club": "Midtjylland"
    },
    {
      "name": "Jens Castrop",
      "position": "DF",
      "club": "Borussia Monchengladbach"
    },
    {
      "name": "Lee Ki-hyuk",
      "position": "DF",
      "club": "Gangwon FC"
    },
    {
      "name": "Lee Jae-sung",
      "position": "MF",
      "club": "Mainz 05"
    },
    {
      "name": "Hwang Hee-chan",
      "position": "MF",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Hwang In-beom",
      "position": "MF",
      "club": "Feyenoord"
    },
    {
      "name": "Lee Kang-in",
      "position": "MF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Paik Seung-ho",
      "position": "MF",
      "club": "Birmingham City"
    },
    {
      "name": "Kim Jin-gyu",
      "position": "MF",
      "club": "Jeonbuk Hyundai Motors"
    },
    {
      "name": "Lee Dong-gyeong",
      "position": "MF",
      "club": "Ulsan HD"
    },
    {
      "name": "Bae Jun-ho",
      "position": "MF",
      "club": "Stoke City"
    },
    {
      "name": "Eom Ji-sung",
      "position": "MF",
      "club": "Swansea City"
    },
    {
      "name": "Yang Hyun-jun",
      "position": "MF",
      "club": "Celtic"
    },
    {
      "name": "Son Heung-min",
      "position": "FW",
      "club": "Los Angeles FC"
    },
    {
      "name": "Cho Gue-sung",
      "position": "FW",
      "club": "Midtjylland"
    },
    {
      "name": "Oh Hyeon-gyu",
      "position": "FW",
      "club": "Besiktas"
    }
  ],
  "czechia": [
    {
      "name": "Matěj Kov?ř",
      "position": "GK",
      "club": "PSV Eindhoven"
    },
    {
      "name": "Jindřich Staněk",
      "position": "GK",
      "club": "Slavia Prague"
    },
    {
      "name": "Luk?? Horn?ček",
      "position": "GK",
      "club": "Braga"
    },
    {
      "name": "David Zima",
      "position": "DF",
      "club": "Slavia Prague"
    },
    {
      "name": "Tom?? Hole?",
      "position": "DF",
      "club": "Slavia Prague"
    },
    {
      "name": "Robin Hran?č",
      "position": "DF",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Vladim?r Coufal",
      "position": "DF",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "?těp?n Chaloupek",
      "position": "DF",
      "club": "Slavia Prague"
    },
    {
      "name": "Ladislav Krejč?",
      "position": "DF",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "David Jur?sek",
      "position": "DF",
      "club": "Slavia Prague"
    },
    {
      "name": "Jaroslav Zelen&yacute;",
      "position": "DF",
      "club": "Sparta Prague"
    },
    {
      "name": "David Douděra",
      "position": "DF",
      "club": "Slavia Prague"
    },
    {
      "name": "Vladim?r Darida",
      "position": "MF",
      "club": "Hradec Kr?lov?"
    },
    {
      "name": "Luk?? Červ",
      "position": "MF",
      "club": "Viktoria Plzeň"
    },
    {
      "name": "Luk?? Provod",
      "position": "MF",
      "club": "Slavia Prague"
    },
    {
      "name": "Michal Sad?lek",
      "position": "MF",
      "club": "Slavia Prague"
    },
    {
      "name": "Tom?? Souček",
      "position": "MF",
      "club": "West Ham United"
    },
    {
      "name": "Alexandr Sojka",
      "position": "MF",
      "club": "Viktoria Plzeň"
    },
    {
      "name": "Hugo Sochůrek",
      "position": "MF",
      "club": "Sparta Prague"
    },
    {
      "name": "Adam Hložek",
      "position": "FW",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Patrik Schick",
      "position": "FW",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Jan Kuchta",
      "position": "FW",
      "club": "Sparta Prague"
    },
    {
      "name": "Mojm?r Chytil",
      "position": "FW",
      "club": "Slavia Prague"
    },
    {
      "name": "Pavel ?ulc",
      "position": "FW",
      "club": "Lyon"
    },
    {
      "name": "Tom?? Chor&yacute;",
      "position": "FW",
      "club": "Slavia Prague"
    },
    {
      "name": "Denis Vi?insk&yacute;",
      "position": "FW",
      "club": "Viktoria Plzeň"
    }
  ],
  "canada": [
    {
      "name": "Dayne St. Clair",
      "position": "GK",
      "club": "Inter Miami"
    },
    {
      "name": "Maxime Crepeau",
      "position": "GK",
      "club": "Orlando City"
    },
    {
      "name": "Owen Goodman",
      "position": "GK",
      "club": "Barnsley"
    },
    {
      "name": "Moise Bombito",
      "position": "DF",
      "club": "Nice"
    },
    {
      "name": "Derek Cornelius",
      "position": "DF",
      "club": "Rangers"
    },
    {
      "name": "Alphonso Davies",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "Luc De Fougerolles",
      "position": "DF",
      "club": "FCV Dender"
    },
    {
      "name": "Alistair Johnston",
      "position": "DF",
      "club": "Celtic"
    },
    {
      "name": "Alfie Jones",
      "position": "DF",
      "club": "Middlesbrough"
    },
    {
      "name": "Richie Laryea",
      "position": "DF",
      "club": "Toronto FC"
    },
    {
      "name": "Niko Sigur",
      "position": "DF",
      "club": "Hajduk Split"
    },
    {
      "name": "Joel Waterman",
      "position": "DF",
      "club": "Chicago Fire"
    },
    {
      "name": "Ali Ahmed",
      "position": "MF",
      "club": "Norwich City"
    },
    {
      "name": "Tajon Buchanan",
      "position": "MF",
      "club": "Villarreal"
    },
    {
      "name": "Mathieu Choiniere",
      "position": "MF",
      "club": "Los Angeles FC"
    },
    {
      "name": "Stephen Eustaquio",
      "position": "MF",
      "club": "Los Angeles FC"
    },
    {
      "name": "Marcelo Flores",
      "position": "MF",
      "club": "Tigres UANL"
    },
    {
      "name": "Ismael Kone",
      "position": "MF",
      "club": "Sassuolo"
    },
    {
      "name": "Liam Millar",
      "position": "MF",
      "club": "Hull City"
    },
    {
      "name": "Jonathan Osorio",
      "position": "MF",
      "club": "Toronto FC"
    },
    {
      "name": "Nathan Saliba",
      "position": "MF",
      "club": "Anderlecht"
    },
    {
      "name": "Jacob Shaffelburg",
      "position": "MF",
      "club": "Los Angeles FC"
    },
    {
      "name": "Jonathan David",
      "position": "FW",
      "club": "Juventus"
    },
    {
      "name": "Promise David",
      "position": "FW",
      "club": "Royale-Union Saint Gilloise"
    },
    {
      "name": "Cyle Larin",
      "position": "FW",
      "club": "Southampton"
    },
    {
      "name": "Tani Oluwaseyi",
      "position": "FW",
      "club": "Villarreal"
    }
  ],
  "bosnia-and-herzegovina": [
    {
      "name": "Nikola Vasilj",
      "position": "GK",
      "club": "FC St. Pauli"
    },
    {
      "name": "Martin Zlomislic",
      "position": "GK",
      "club": "Rijeka"
    },
    {
      "name": "Osman Hadzikic",
      "position": "GK",
      "club": "Slaven Belupo"
    },
    {
      "name": "Sead Kolasinac",
      "position": "DF",
      "club": "Atalanta"
    },
    {
      "name": "Dennis Hadzikadunic",
      "position": "DF",
      "club": "Sampdoria"
    },
    {
      "name": "Amar Dedic",
      "position": "DF",
      "club": "Benfica"
    },
    {
      "name": "Nikola Katic",
      "position": "DF",
      "club": "Schalke 04"
    },
    {
      "name": "Tarik Muharemovic",
      "position": "DF",
      "club": "Sassuolo"
    },
    {
      "name": "Nihad Mujakic",
      "position": "DF",
      "club": "Gaziantep"
    },
    {
      "name": "Stjepan Radeljic",
      "position": "DF",
      "club": "Rijeka"
    },
    {
      "name": "Nidal Celik",
      "position": "DF",
      "club": "Lens"
    },
    {
      "name": "Amir Hadziahmetovic",
      "position": "MF",
      "club": "Hull City"
    },
    {
      "name": "Benjamin Tahirovic",
      "position": "MF",
      "club": "Brondby"
    },
    {
      "name": "Dzenis Burnic",
      "position": "MF",
      "club": "Karlsruher SC"
    },
    {
      "name": "Armin Gigovic",
      "position": "MF",
      "club": "Young Boys"
    },
    {
      "name": "Ivan Basic",
      "position": "MF",
      "club": "Astana"
    },
    {
      "name": "Esmir Bajraktarevic",
      "position": "MF",
      "club": "PSV"
    },
    {
      "name": "Amar Memic",
      "position": "MF",
      "club": "Viktoria Plzen"
    },
    {
      "name": "Ivan Sunjic",
      "position": "MF",
      "club": "Pafos"
    },
    {
      "name": "Kerim Alajbegovic",
      "position": "MF",
      "club": "Red Bull Salzburg"
    },
    {
      "name": "Ermin Mahmic",
      "position": "MF",
      "club": "Slovan Liberec"
    },
    {
      "name": "Edin Dzeko",
      "position": "FW",
      "club": "Schalke 04"
    },
    {
      "name": "Ermedin Demirovic",
      "position": "FW",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Samed Bazdar",
      "position": "FW",
      "club": "Jagiellonia Bialystok"
    },
    {
      "name": "Haris Tabakovic",
      "position": "FW",
      "club": "Borussia Monchengladbach"
    },
    {
      "name": "Jovo Lukic",
      "position": "FW",
      "club": "Universitatea Cluj"
    }
  ],
  "qatar": [
    {
      "name": "Mahmud Abunada",
      "position": "GK",
      "club": "Al-Rayyan"
    },
    {
      "name": "Salah Zakaria",
      "position": "GK",
      "club": "Al-Duhail"
    },
    {
      "name": "Meshaal Barsham",
      "position": "GK",
      "club": "Al-Sadd"
    },
    {
      "name": "Pedro Miguel",
      "position": "DF",
      "club": "Al-Sadd"
    },
    {
      "name": "Lucas Mendes",
      "position": "DF",
      "club": "Al-Wakrah"
    },
    {
      "name": "Issa Laye",
      "position": "DF",
      "club": "Al-Arabi"
    },
    {
      "name": "Jassem Gaber",
      "position": "DF",
      "club": "Al-Rayyan"
    },
    {
      "name": "Ayoub Al-Oui",
      "position": "DF",
      "club": "Al-Gharafa"
    },
    {
      "name": "Homam Ahmed",
      "position": "DF",
      "club": "Cultural Leonesa"
    },
    {
      "name": "Boualem Khoukhi",
      "position": "DF",
      "club": "Al-Sadd"
    },
    {
      "name": "Sultan Al-Brake",
      "position": "DF",
      "club": "Al-Duhail"
    },
    {
      "name": "Al-Hashmi Al-Hussain",
      "position": "DF",
      "club": "Al-Arabi"
    },
    {
      "name": "Abdulaziz Hatem",
      "position": "MF",
      "club": "Al-Rayyan"
    },
    {
      "name": "Karim Boudiaf",
      "position": "MF",
      "club": "Al-Duhail"
    },
    {
      "name": "Ahmed Al-Ganehi",
      "position": "MF",
      "club": "Al-Gharafa"
    },
    {
      "name": "Ahmed Fathy",
      "position": "MF",
      "club": "Al-Arabi"
    },
    {
      "name": "Assim Madibo",
      "position": "MF",
      "club": "Al-Wakrah"
    },
    {
      "name": "Ahmed Alaaeldin",
      "position": "FW",
      "club": "Al-Rayyan"
    },
    {
      "name": "Edmilson Junior",
      "position": "FW",
      "club": "Al-Duhail"
    },
    {
      "name": "Mohammed Muntari",
      "position": "FW",
      "club": "Al-Gharafa"
    },
    {
      "name": "Hassan Al-Haydos",
      "position": "FW",
      "club": "Al-Sadd"
    },
    {
      "name": "Akram Afif",
      "position": "FW",
      "club": "Al-Sadd"
    },
    {
      "name": "Yusuf Abdurisag",
      "position": "FW",
      "club": "Al-Wakrah"
    },
    {
      "name": "Almoez Ali",
      "position": "FW",
      "club": "Al-Duhail"
    },
    {
      "name": "Tahsin Jamshid",
      "position": "FW",
      "club": "Al-Duhail"
    },
    {
      "name": "Mohamed Manai",
      "position": "FW",
      "club": "Al-Shamal"
    }
  ],
  "switzerland": [
    {
      "name": "Gregor Kobel",
      "position": "GK",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Yvon Mvogo",
      "position": "GK",
      "club": "Lorient"
    },
    {
      "name": "Marvin Keller",
      "position": "GK",
      "club": "Young Boys"
    },
    {
      "name": "Miro Muheim",
      "position": "DF",
      "club": "Hamburger SV"
    },
    {
      "name": "Silvan Widmer",
      "position": "DF",
      "club": "Mainz 05"
    },
    {
      "name": "Nico Elvedi",
      "position": "DF",
      "club": "Borussia M?nchengladbach"
    },
    {
      "name": "Manuel Akanji",
      "position": "DF",
      "club": "Inter Milan"
    },
    {
      "name": "Ricardo Rodriguez",
      "position": "DF",
      "club": "Real Betis"
    },
    {
      "name": "Eray C?mert",
      "position": "DF",
      "club": "Valencia"
    },
    {
      "name": "Aur?le Amenda",
      "position": "DF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Luca Jaquez",
      "position": "DF",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Denis Zakaria",
      "position": "MF",
      "club": "Monaco"
    },
    {
      "name": "Remo Freuler",
      "position": "MF",
      "club": "Bologna"
    },
    {
      "name": "Johan Manzambi",
      "position": "MF",
      "club": "SC Freiburg"
    },
    {
      "name": "Granit Xhaka",
      "position": "MF",
      "club": "Sunderland"
    },
    {
      "name": "Ardon Jashari",
      "position": "MF",
      "club": "Milan"
    },
    {
      "name": "Djibril Sow",
      "position": "MF",
      "club": "Sevilla"
    },
    {
      "name": "Michel Aebischer",
      "position": "MF",
      "club": "Pisa"
    },
    {
      "name": "Fabian Rieder",
      "position": "MF",
      "club": "FC Augsburg"
    },
    {
      "name": "Breel Embolo",
      "position": "FW",
      "club": "Rennes"
    },
    {
      "name": "Dan Ndoye",
      "position": "FW",
      "club": "Nottingham Forest"
    },
    {
      "name": "Christian Fassnacht",
      "position": "FW",
      "club": "Young Boys"
    },
    {
      "name": "Rub?n Vargas",
      "position": "FW",
      "club": "Sevilla"
    },
    {
      "name": "Noah Okafor",
      "position": "FW",
      "club": "Leeds United"
    },
    {
      "name": "Zeki Amdouni",
      "position": "FW",
      "club": "Burnley"
    },
    {
      "name": "Cedric Itten",
      "position": "FW",
      "club": "Fortuna D?sseldorf"
    }
  ],
  "brazil": [
    {
      "name": "Alisson",
      "position": "GK",
      "club": "Liverpool"
    },
    {
      "name": "Ederson",
      "position": "GK",
      "club": "Fenerbahce"
    },
    {
      "name": "Weverton",
      "position": "GK",
      "club": "Gremio"
    },
    {
      "name": "Marquinhos",
      "position": "DF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Danilo Luiz",
      "position": "DF",
      "club": "Flamengo"
    },
    {
      "name": "Alex Sandro",
      "position": "DF",
      "club": "Flamengo"
    },
    {
      "name": "Gabriel Magalhaes",
      "position": "DF",
      "club": "Arsenal"
    },
    {
      "name": "Bremer",
      "position": "DF",
      "club": "Juventus"
    },
    {
      "name": "Roger Ibanez",
      "position": "DF",
      "club": "Al-Ahli"
    },
    {
      "name": "Douglas Santos",
      "position": "DF",
      "club": "Zenit Saint Petersburg"
    },
    {
      "name": "Leo Pereira",
      "position": "DF",
      "club": "Flamengo"
    },
    {
      "name": "Casemiro",
      "position": "MF",
      "club": "Manchester United"
    },
    {
      "name": "Ederson",
      "position": "MF",
      "club": "Atalanta"
    },
    {
      "name": "Lucas Paqueta",
      "position": "MF",
      "club": "Flamengo"
    },
    {
      "name": "Bruno Guimaraes",
      "position": "MF",
      "club": "Newcastle United"
    },
    {
      "name": "Fabinho",
      "position": "MF",
      "club": "Al-Ittihad"
    },
    {
      "name": "Danilo Santos",
      "position": "MF",
      "club": "Botafogo"
    },
    {
      "name": "Neymar",
      "position": "FW",
      "club": "Santos"
    },
    {
      "name": "Vinicius Junior",
      "position": "FW",
      "club": "Real Madrid"
    },
    {
      "name": "Raphinha",
      "position": "FW",
      "club": "Barcelona"
    },
    {
      "name": "Gabriel Martinelli",
      "position": "FW",
      "club": "Arsenal"
    },
    {
      "name": "Matheus Cunha",
      "position": "FW",
      "club": "Manchester United"
    },
    {
      "name": "Endrick",
      "position": "FW",
      "club": "Lyon"
    },
    {
      "name": "Luiz Henrique",
      "position": "FW",
      "club": "Zenit Saint Petersburg"
    },
    {
      "name": "Igor Thiago",
      "position": "FW",
      "club": "Brentford"
    },
    {
      "name": "Rayan",
      "position": "FW",
      "club": "Bournemouth"
    }
  ],
  "morocco": [
    {
      "name": "Yassine Bounou",
      "position": "GK",
      "club": "Al-Hilal"
    },
    {
      "name": "Munir El Kajoui",
      "position": "GK",
      "club": "RS Berkane"
    },
    {
      "name": "Reda Tagnaouti",
      "position": "GK",
      "club": "AS FAR"
    },
    {
      "name": "Achraf Hakimi",
      "position": "DF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Noussair Mazraoui",
      "position": "DF",
      "club": "Manchester United"
    },
    {
      "name": "Anass Salah-Eddine",
      "position": "DF",
      "club": "PSV"
    },
    {
      "name": "Youssef Belammari",
      "position": "DF",
      "club": "Al Ahly"
    },
    {
      "name": "Chadi Riad",
      "position": "DF",
      "club": "Crystal Palace"
    },
    {
      "name": "Nayef Aguerd",
      "position": "DF",
      "club": "Marseille"
    },
    {
      "name": "Zakaria El Ouahdi",
      "position": "DF",
      "club": "Genk"
    },
    {
      "name": "Issa Diop",
      "position": "DF",
      "club": "Fulham"
    },
    {
      "name": "Redouane Halhal",
      "position": "DF",
      "club": "Mechelen"
    },
    {
      "name": "Azzedine Ounahi",
      "position": "MF",
      "club": "Girona"
    },
    {
      "name": "Bilal El Khannouss",
      "position": "MF",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Samir El Mourabet",
      "position": "MF",
      "club": "Strasbourg"
    },
    {
      "name": "Sofyan Amrabat",
      "position": "MF",
      "club": "Real Betis"
    },
    {
      "name": "Ismael Saibari",
      "position": "MF",
      "club": "PSV"
    },
    {
      "name": "Neil El Aynaoui",
      "position": "MF",
      "club": "Roma"
    },
    {
      "name": "Ayyoub Bouaddi",
      "position": "MF",
      "club": "Lille"
    },
    {
      "name": "Abde Ezzalzouli",
      "position": "FW",
      "club": "Real Betis"
    },
    {
      "name": "Soufiane Rahimi",
      "position": "FW",
      "club": "Al Ain"
    },
    {
      "name": "Brahim Diaz",
      "position": "FW",
      "club": "Real Madrid"
    },
    {
      "name": "Ayoub El Kaabi",
      "position": "FW",
      "club": "Olympiacos"
    },
    {
      "name": "Chemsdine Talbi",
      "position": "FW",
      "club": "Sunderland"
    },
    {
      "name": "Gessime Yassine",
      "position": "FW",
      "club": "Strasbourg"
    },
    {
      "name": "Ayoube Amaimouni",
      "position": "FW",
      "club": "Frankfurt"
    }
  ],
  "haiti": [
    {
      "name": "Johny Placide",
      "position": "GK",
      "club": "Bastia"
    },
    {
      "name": "Alexandre Pierre",
      "position": "GK",
      "club": "Sochaux"
    },
    {
      "name": "Josue Duverger",
      "position": "GK",
      "club": "Cosmos Koblenz"
    },
    {
      "name": "Ricardo Ade",
      "position": "DF",
      "club": "LDU Quito"
    },
    {
      "name": "Carlens Arcus",
      "position": "DF",
      "club": "Angers"
    },
    {
      "name": "Martin Experience",
      "position": "DF",
      "club": "Nancy"
    },
    {
      "name": "Jean-Kevin Duverne",
      "position": "DF",
      "club": "Gent"
    },
    {
      "name": "Duke Lacroix",
      "position": "DF",
      "club": "Colorado Springs Switchbacks FC"
    },
    {
      "name": "Wilguens Paugain",
      "position": "DF",
      "club": "Zulte Waregem"
    },
    {
      "name": "Hannes Delcroix",
      "position": "DF",
      "club": "Lugano"
    },
    {
      "name": "Keeto Thermoncy",
      "position": "DF",
      "club": "Young Boys"
    },
    {
      "name": "Leverton Pierre",
      "position": "MF",
      "club": "Vizela"
    },
    {
      "name": "Danley Jean Jacques",
      "position": "MF",
      "club": "Philadelphia Union"
    },
    {
      "name": "Carl Sainte",
      "position": "MF",
      "club": "El Paso Locomotive FC"
    },
    {
      "name": "Jean-Ricner Bellegarde",
      "position": "MF",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Woodensky Pierre",
      "position": "MF",
      "club": "Violette"
    },
    {
      "name": "Dominique Simon",
      "position": "MF",
      "club": "Tatran Presov"
    },
    {
      "name": "Duckens Nazon",
      "position": "FW",
      "club": "Esteghlal"
    },
    {
      "name": "Frantzdy Pierrot",
      "position": "FW",
      "club": "Caykur Rizespor"
    },
    {
      "name": "Derrick Etienne Jr.",
      "position": "FW",
      "club": "Toronto FC"
    },
    {
      "name": "Louicius Deedson",
      "position": "FW",
      "club": "FC Dallas"
    },
    {
      "name": "Ruben Providence",
      "position": "FW",
      "club": "Almere City"
    },
    {
      "name": "Josue Casimir",
      "position": "FW",
      "club": "Auxerre"
    },
    {
      "name": "Yassin Fortune",
      "position": "FW",
      "club": "Vizela"
    },
    {
      "name": "Wilson Isidor",
      "position": "FW",
      "club": "Sunderland"
    },
    {
      "name": "Lenny Joseph",
      "position": "FW",
      "club": "Ferencvaros"
    }
  ],
  "scotland": [
    {
      "name": "Craig Gordon",
      "position": "GK",
      "club": "Hearts"
    },
    {
      "name": "Angus Gunn",
      "position": "GK",
      "club": "Nottingham Forest"
    },
    {
      "name": "Liam Kelly",
      "position": "GK",
      "club": "Rangers"
    },
    {
      "name": "Grant Hanley",
      "position": "DF",
      "club": "Hibernian"
    },
    {
      "name": "Jack Hendry",
      "position": "DF",
      "club": "Al-Ettifaq"
    },
    {
      "name": "Aaron Hickey",
      "position": "DF",
      "club": "Brentford"
    },
    {
      "name": "Dom Hyam",
      "position": "DF",
      "club": "Wrexham"
    },
    {
      "name": "Scott McKenna",
      "position": "DF",
      "club": "Dinamo Zagreb"
    },
    {
      "name": "Nathan Patterson",
      "position": "DF",
      "club": "Everton"
    },
    {
      "name": "Anthony Ralston",
      "position": "DF",
      "club": "Celtic"
    },
    {
      "name": "Andy Robertson",
      "position": "DF",
      "club": "Liverpool"
    },
    {
      "name": "John Souttar",
      "position": "DF",
      "club": "Rangers"
    },
    {
      "name": "Kieran Tierney",
      "position": "DF",
      "club": "Celtic"
    },
    {
      "name": "Ryan Christie",
      "position": "MF",
      "club": "Bournemouth"
    },
    {
      "name": "Findlay Curtis",
      "position": "MF",
      "club": "Kilmarnock"
    },
    {
      "name": "Lewis Ferguson",
      "position": "MF",
      "club": "Bologna"
    },
    {
      "name": "Ben Gannon-Doak",
      "position": "MF",
      "club": "Bournemouth"
    },
    {
      "name": "Tyler Fletcher",
      "position": "MF",
      "club": "Manchester United"
    },
    {
      "name": "John McGinn",
      "position": "MF",
      "club": "Aston Villa"
    },
    {
      "name": "Kenny McLean",
      "position": "MF",
      "club": "Norwich City"
    },
    {
      "name": "Scott McTominay",
      "position": "MF",
      "club": "Napoli"
    },
    {
      "name": "Che Adams",
      "position": "FW",
      "club": "Torino"
    },
    {
      "name": "Lyndon Dykes",
      "position": "FW",
      "club": "Charlton Athletic"
    },
    {
      "name": "George Hirst",
      "position": "FW",
      "club": "Ipswich Town"
    },
    {
      "name": "Lawrence Shankland",
      "position": "FW",
      "club": "Hearts"
    },
    {
      "name": "Ross Stewart",
      "position": "FW",
      "club": "Southampton"
    }
  ],
  "united-states": [
    {
      "name": "Matt Turner",
      "position": "GK",
      "club": "New England Revolution"
    },
    {
      "name": "Matt Freese",
      "position": "GK",
      "club": "New York City FC"
    },
    {
      "name": "Chris Brady",
      "position": "GK",
      "club": "Chicago Fire"
    },
    {
      "name": "Sergino Dest",
      "position": "DF",
      "club": "PSV"
    },
    {
      "name": "Tim Ream",
      "position": "DF",
      "club": "Charlotte FC"
    },
    {
      "name": "Antonee Robinson",
      "position": "DF",
      "club": "Fulham"
    },
    {
      "name": "Miles Robinson",
      "position": "DF",
      "club": "FC Cincinnati"
    },
    {
      "name": "Chris Richards",
      "position": "DF",
      "club": "Crystal Palace"
    },
    {
      "name": "Mark McKenzie",
      "position": "DF",
      "club": "Toulouse"
    },
    {
      "name": "Joe Scally",
      "position": "DF",
      "club": "Borussia Monchengladbach"
    },
    {
      "name": "Max Arfsten",
      "position": "DF",
      "club": "Columbus Crew"
    },
    {
      "name": "Alex Freeman",
      "position": "DF",
      "club": "Villarreal"
    },
    {
      "name": "Auston Trusty",
      "position": "DF",
      "club": "Celtic"
    },
    {
      "name": "Weston McKennie",
      "position": "MF",
      "club": "Juventus"
    },
    {
      "name": "Tyler Adams",
      "position": "MF",
      "club": "Bournemouth"
    },
    {
      "name": "Cristian Roldan",
      "position": "MF",
      "club": "Seattle Sounders"
    },
    {
      "name": "Giovanni Reyna",
      "position": "MF",
      "club": "Borussia Monchengladbach"
    },
    {
      "name": "Malik Tillman",
      "position": "MF",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Sebastian Berhalter",
      "position": "MF",
      "club": "Vancouver Whitecaps"
    },
    {
      "name": "Brenden Aaronson",
      "position": "MF",
      "club": "Leeds United"
    },
    {
      "name": "Christian Pulisic",
      "position": "FW",
      "club": "AC Milan"
    },
    {
      "name": "Timothy Weah",
      "position": "FW",
      "club": "Marseille"
    },
    {
      "name": "Ricardo Pepi",
      "position": "FW",
      "club": "PSV Eindhoven"
    },
    {
      "name": "Folarin Balogun",
      "position": "FW",
      "club": "Monaco"
    },
    {
      "name": "Haji Wright",
      "position": "FW",
      "club": "Coventry City"
    },
    {
      "name": "Alex Zendejas",
      "position": "FW",
      "club": "Club America"
    }
  ],
  "paraguay": [
    {
      "name": "Gatito Fern?ndez",
      "position": "GK",
      "club": "Cerro Porte?o"
    },
    {
      "name": "Orlando Gill",
      "position": "GK",
      "club": "San Lorenzo"
    },
    {
      "name": "Gast?n Olveira",
      "position": "GK",
      "club": "Olimpia"
    },
    {
      "name": "Gustavo Vel?zquez",
      "position": "DF",
      "club": "Cerro Porte?o"
    },
    {
      "name": "Omar Alderete",
      "position": "DF",
      "club": "Sunderland"
    },
    {
      "name": "Juan Jos? C?ceres",
      "position": "DF",
      "club": "Dynamo Moscow"
    },
    {
      "name": "Fabi?n Balbuena",
      "position": "DF",
      "club": "Gr&ecirc;mio"
    },
    {
      "name": "J?nior Alonso",
      "position": "DF",
      "club": "Atl?tico Mineiro"
    },
    {
      "name": "Jos? Canale",
      "position": "DF",
      "club": "Lan?s"
    },
    {
      "name": "Gustavo G?mez",
      "position": "DF",
      "club": "Palmeiras"
    },
    {
      "name": "Alexandro Maidana",
      "position": "DF",
      "club": "Talleres"
    },
    {
      "name": "Ram?n Sosa",
      "position": "MF",
      "club": "Palmeiras"
    },
    {
      "name": "Diego G?mez",
      "position": "MF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Miguel Almir?n",
      "position": "MF",
      "club": "Atlanta United FC"
    },
    {
      "name": "Maur?cio",
      "position": "MF",
      "club": "Palmeiras"
    },
    {
      "name": "Andr?s Cubas",
      "position": "MF",
      "club": "Vancouver Whitecaps FC"
    },
    {
      "name": "Dami?n Bobadilla",
      "position": "MF",
      "club": "S&atilde;o Paulo"
    },
    {
      "name": "Braian Ojeda",
      "position": "MF",
      "club": "Orlando City SC"
    },
    {
      "name": "Mat?as Galarza",
      "position": "MF",
      "club": "Atlanta United FC"
    },
    {
      "name": "Gustavo Caballero",
      "position": "MF",
      "club": "Portsmouth"
    },
    {
      "name": "Antonio Sanabria",
      "position": "FW",
      "club": "Cremonese"
    },
    {
      "name": "Kaku",
      "position": "FW",
      "club": "Al-Ain"
    },
    {
      "name": "?lex Arce",
      "position": "FW",
      "club": "Independiente Rivadavia"
    },
    {
      "name": "Julio Enciso",
      "position": "FW",
      "club": "Strasbourg"
    },
    {
      "name": "Gabriel ?valos",
      "position": "FW",
      "club": "Independiente"
    },
    {
      "name": "Isidro Pitta",
      "position": "FW",
      "club": "Red Bull Bragantino"
    }
  ],
  "australia": [
    {
      "name": "Mathew Ryan",
      "position": "GK",
      "club": "Levante"
    },
    {
      "name": "Paul Izzo",
      "position": "GK",
      "club": "Randers"
    },
    {
      "name": "Patrick Beach",
      "position": "GK",
      "club": "Melbourne City"
    },
    {
      "name": "Jordan Bos",
      "position": "DF",
      "club": "Feyenoord"
    },
    {
      "name": "Aziz Behich",
      "position": "DF",
      "club": "Melbourne City"
    },
    {
      "name": "Harry Souttar",
      "position": "DF",
      "club": "Leicester"
    },
    {
      "name": "Alessandro Circati",
      "position": "DF",
      "club": "Parma"
    },
    {
      "name": "Lucas Herrington",
      "position": "DF",
      "club": "Colorado Rapids"
    },
    {
      "name": "Cameron Burgess",
      "position": "DF",
      "club": "Swansea"
    },
    {
      "name": "Kai Trewin",
      "position": "DF",
      "club": "New York City FC"
    },
    {
      "name": "Milos Degenek",
      "position": "DF",
      "club": "Apoel Nicosia"
    },
    {
      "name": "Jason Geria",
      "position": "DF",
      "club": "Albirex Niigata"
    },
    {
      "name": "Jacob Italiano",
      "position": "DF",
      "club": "Grazer AK"
    },
    {
      "name": "Jackson Irvine",
      "position": "MF",
      "club": "St. Pauli"
    },
    {
      "name": "Aiden O'Neill",
      "position": "MF",
      "club": "New York City FC"
    },
    {
      "name": "Paul Okon Jr",
      "position": "MF",
      "club": "Sydney FC"
    },
    {
      "name": "Cameron Devlin",
      "position": "MF",
      "club": "Heart of Midlothian"
    },
    {
      "name": "Connor Metcalfe",
      "position": "FW",
      "club": "St. Pauli"
    },
    {
      "name": "Mathew Leckie",
      "position": "FW",
      "club": "Melbourne City"
    },
    {
      "name": "Nishan Velupillay",
      "position": "FW",
      "club": "Melbourne Victory"
    },
    {
      "name": "Cristian Volpato",
      "position": "FW",
      "club": "Sassuolo"
    },
    {
      "name": "Nestory Irankunda",
      "position": "FW",
      "club": "Watford"
    },
    {
      "name": "Awer Mabil",
      "position": "FW",
      "club": "Castell?n"
    },
    {
      "name": "Ajdin Hrustic",
      "position": "FW",
      "club": "Heracles Almelo"
    },
    {
      "name": "Mohamed Toure",
      "position": "FW",
      "club": "Norwich"
    },
    {
      "name": "Tete Yengi",
      "position": "FW",
      "club": "Machida Zelvia"
    }
  ],
  "turkiye": [
    {
      "name": "Mert G?nok",
      "position": "GK",
      "club": "Fenerbah?e"
    },
    {
      "name": "Altay Bayındır",
      "position": "GK",
      "club": "Manchester United"
    },
    {
      "name": "Uğurcan ?akır",
      "position": "GK",
      "club": "Galatasaray"
    },
    {
      "name": "Zeki ?elik",
      "position": "DF",
      "club": "Roma"
    },
    {
      "name": "Merih Demiral",
      "position": "DF",
      "club": "Al-Ahli"
    },
    {
      "name": "?ağlar S?y?nc?",
      "position": "DF",
      "club": "Fenerbah?e"
    },
    {
      "name": "Eren Elmalı",
      "position": "DF",
      "club": "Galatasaray"
    },
    {
      "name": "Abd?lkerim Bardakcı",
      "position": "DF",
      "club": "Galatasaray"
    },
    {
      "name": "Ozan Kabak",
      "position": "DF",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Mert M?ld?r",
      "position": "DF",
      "club": "Fenerbah?e"
    },
    {
      "name": "Ferdi Kadıoğlu",
      "position": "DF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Samet Akaydin",
      "position": "DF",
      "club": "?aykur Rizespor"
    },
    {
      "name": "Salih ?zcan",
      "position": "MF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Orkun K?k??",
      "position": "MF",
      "club": "Beşiktaş"
    },
    {
      "name": "Hakan ?alhanoğlu",
      "position": "MF",
      "club": "Inter Milan"
    },
    {
      "name": "İsmail Y?ksek",
      "position": "MF",
      "club": "Fenerbah?e"
    },
    {
      "name": "Kaan Ayhan",
      "position": "MF",
      "club": "Galatasaray"
    },
    {
      "name": "Kerem Akt?rkoğlu",
      "position": "FW",
      "club": "Fenerbah?e"
    },
    {
      "name": "Arda G?ler",
      "position": "FW",
      "club": "Real Madrid"
    },
    {
      "name": "Deniz G?l",
      "position": "FW",
      "club": "Porto"
    },
    {
      "name": "Kenan Yıldız",
      "position": "FW",
      "club": "Juventus"
    },
    {
      "name": "İrfan Can Kahveci",
      "position": "FW",
      "club": "Kasımpaşa"
    },
    {
      "name": "Yunus Akg?n",
      "position": "FW",
      "club": "Galatasaray"
    },
    {
      "name": "Barış Alper Yılmaz",
      "position": "FW",
      "club": "Galatasaray"
    },
    {
      "name": "Oğuz Aydın",
      "position": "FW",
      "club": "Fenerbah?e"
    },
    {
      "name": "Can Uzun",
      "position": "FW",
      "club": "Eintracht Frankfurt"
    }
  ],
  "germany": [
    {
      "name": "Manuel Neuer",
      "position": "GK",
      "club": "Bayern Munich"
    },
    {
      "name": "Oliver Baumann",
      "position": "GK",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Alexander Nubel",
      "position": "GK",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Antonio Rudiger",
      "position": "DF",
      "club": "Real Madrid"
    },
    {
      "name": "Jonathan Tah",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "David Raum",
      "position": "DF",
      "club": "RB Leipzig"
    },
    {
      "name": "Nico Schlotterbeck",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Waldemar Anton",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Malick Thiaw",
      "position": "DF",
      "club": "Newcastle United"
    },
    {
      "name": "Nathaniel Brown",
      "position": "DF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Felix Nmecha",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Joshua Kimmich",
      "position": "MF",
      "club": "Bayern Munich"
    },
    {
      "name": "Leroy Sane",
      "position": "MF",
      "club": "Galatasaray"
    },
    {
      "name": "Leon Goretzka",
      "position": "MF",
      "club": "Bayern Munich"
    },
    {
      "name": "Kai Havertz",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Jamal Musiala",
      "position": "MF",
      "club": "Bayern Munich"
    },
    {
      "name": "Florian Wirtz",
      "position": "MF",
      "club": "Liverpool"
    },
    {
      "name": "Pascal Gross",
      "position": "MF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Nadiem Amiri",
      "position": "MF",
      "club": "Mainz 05"
    },
    {
      "name": "Aleksandar Pavlovic",
      "position": "MF",
      "club": "Bayern Munich"
    },
    {
      "name": "Angelo Stiller",
      "position": "MF",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Jamie Leweling",
      "position": "MF",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Assan Ouedraogo",
      "position": "MF",
      "club": "RB Leipzig"
    },
    {
      "name": "Nick Woltemade",
      "position": "FW",
      "club": "Newcastle United"
    },
    {
      "name": "Deniz Undav",
      "position": "FW",
      "club": "VfB Stuttgart"
    },
    {
      "name": "Maximilian Beier",
      "position": "FW",
      "club": "Borussia Dortmund"
    }
  ],
  "curacao": [
    {
      "name": "Eloy Room",
      "position": "GK",
      "club": "Miami FC"
    },
    {
      "name": "Tyrick Bodak",
      "position": "GK",
      "club": "Telstar"
    },
    {
      "name": "Trevor Doornbusch",
      "position": "GK",
      "club": "VVV-Venlo"
    },
    {
      "name": "Shurandy Sambo",
      "position": "DF",
      "club": "Sparta Rotterdam"
    },
    {
      "name": "Jurien Gaari",
      "position": "DF",
      "club": "Abha"
    },
    {
      "name": "Roshon van Eijma",
      "position": "DF",
      "club": "RKC Waalwijk"
    },
    {
      "name": "Sherel Floranus",
      "position": "DF",
      "club": "PEC Zwolle"
    },
    {
      "name": "Deveron Fonville",
      "position": "DF",
      "club": "NEC"
    },
    {
      "name": "Armando Obispo",
      "position": "DF",
      "club": "PSV"
    },
    {
      "name": "Joshua Brenet",
      "position": "DF",
      "club": "Kayserispor"
    },
    {
      "name": "Riechedly Bazoer",
      "position": "DF",
      "club": "Konyaspor"
    },
    {
      "name": "Godfried Roemeratoe",
      "position": "MF",
      "club": "RKC Waalwijk"
    },
    {
      "name": "Juninho Bacuna",
      "position": "MF",
      "club": "Gaziantep"
    },
    {
      "name": "Livano Comenencia",
      "position": "MF",
      "club": "Zurich"
    },
    {
      "name": "Leandro Bacuna",
      "position": "MF",
      "club": "Igdir"
    },
    {
      "name": "Ar'jany Martha",
      "position": "MF",
      "club": "Rotherham United"
    },
    {
      "name": "Tyrese Noslin",
      "position": "MF",
      "club": "Telstar"
    },
    {
      "name": "Kevin Felida",
      "position": "MF",
      "club": "Den Bosch"
    },
    {
      "name": "Tahith Chong",
      "position": "MF",
      "club": "Sheffield United"
    },
    {
      "name": "Jurgen Locadia",
      "position": "FW",
      "club": "Miami FC"
    },
    {
      "name": "Jeremy Antonisse",
      "position": "FW",
      "club": "Kifisia"
    },
    {
      "name": "Sontje Hansen",
      "position": "FW",
      "club": "Middlesbrough"
    },
    {
      "name": "Kenji Gorre",
      "position": "FW",
      "club": "Maccabi Haifa"
    },
    {
      "name": "Jearl Margaritha",
      "position": "FW",
      "club": "Beveren"
    },
    {
      "name": "Brandley Kuwas",
      "position": "FW",
      "club": "Volendam"
    },
    {
      "name": "Gervane Kastaneer",
      "position": "FW",
      "club": "Terengganu"
    }
  ],
  "ivory-coast": [
    {
      "name": "Yahia Fofana",
      "position": "GK",
      "club": "Caykur Rizespor"
    },
    {
      "name": "Alban Lafont",
      "position": "GK",
      "club": "Panathinaikos"
    },
    {
      "name": "Mohamed Kone",
      "position": "GK",
      "club": "Charleroi"
    },
    {
      "name": "Ghislain Konan",
      "position": "DF",
      "club": "Gil Vicente"
    },
    {
      "name": "Odilon Kossounou",
      "position": "DF",
      "club": "Atalanta"
    },
    {
      "name": "Wilfried Singo",
      "position": "DF",
      "club": "Galatasaray"
    },
    {
      "name": "Evan Ndicka",
      "position": "DF",
      "club": "Roma"
    },
    {
      "name": "Emmanuel Agbadou",
      "position": "DF",
      "club": "Besiktas"
    },
    {
      "name": "Guela Doue",
      "position": "DF",
      "club": "Strasbourg"
    },
    {
      "name": "Ousmane Diomande",
      "position": "DF",
      "club": "Sporting CP"
    },
    {
      "name": "Christopher Operi",
      "position": "DF",
      "club": "Istanbul Basaksehir"
    },
    {
      "name": "Franck Kessie",
      "position": "MF",
      "club": "Al-Ahli"
    },
    {
      "name": "Jean Michael Seri",
      "position": "MF",
      "club": "Maribor"
    },
    {
      "name": "Ibrahim Sangare",
      "position": "MF",
      "club": "Nottingham Forest"
    },
    {
      "name": "Seko Fofana",
      "position": "MF",
      "club": "Porto"
    },
    {
      "name": "Christ Inao Oulai",
      "position": "MF",
      "club": "Trabzonspor"
    },
    {
      "name": "Parfait Guiagon",
      "position": "MF",
      "club": "Charleroi"
    },
    {
      "name": "Nicolas Pepe",
      "position": "FW",
      "club": "Villarreal"
    },
    {
      "name": "Oumar Diakite",
      "position": "FW",
      "club": "Cercle Brugge"
    },
    {
      "name": "Simon Adingra",
      "position": "FW",
      "club": "Monaco"
    },
    {
      "name": "Evann Guessand",
      "position": "FW",
      "club": "Crystal Palace"
    },
    {
      "name": "Amad Diallo",
      "position": "FW",
      "club": "Manchester United"
    },
    {
      "name": "Yan Diomande",
      "position": "FW",
      "club": "RB Leipzig"
    },
    {
      "name": "Bazoumana Toure",
      "position": "FW",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Elye Wahi",
      "position": "FW",
      "club": "Nice"
    },
    {
      "name": "Ange-Yoan Bonny",
      "position": "FW",
      "club": "Inter Milan"
    }
  ],
  "ecuador": [
    {
      "name": "Hernan Galindez",
      "position": "GK",
      "club": "Huracan"
    },
    {
      "name": "Moises Ramirez",
      "position": "GK",
      "club": "Kifisia"
    },
    {
      "name": "Gonzalo Valle",
      "position": "GK",
      "club": "LDU Quito"
    },
    {
      "name": "Willian Pacho",
      "position": "DF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Piero Hincapie",
      "position": "DF",
      "club": "Arsenal"
    },
    {
      "name": "Joel Ordonez",
      "position": "DF",
      "club": "Club Brugge"
    },
    {
      "name": "Felix Torres",
      "position": "DF",
      "club": "Internacional"
    },
    {
      "name": "Pervis Estupinan",
      "position": "DF",
      "club": "AC Milan"
    },
    {
      "name": "Yaimar Medina",
      "position": "DF",
      "club": "Racing Genk"
    },
    {
      "name": "Angelo Preciado",
      "position": "DF",
      "club": "Atl?tico Mineiro"
    },
    {
      "name": "Jackson Porozo",
      "position": "DF",
      "club": "Club Tijuana"
    },
    {
      "name": "Alan Minda",
      "position": "MF",
      "club": "Atl?tico Mineiro"
    },
    {
      "name": "Moises Caicedo",
      "position": "MF",
      "club": "Chelsea"
    },
    {
      "name": "Jordy Alcivar",
      "position": "MF",
      "club": "Independiente del Valle"
    },
    {
      "name": "Denil Castillo",
      "position": "MF",
      "club": "FC Midtjylland"
    },
    {
      "name": "John Yeboah",
      "position": "MF",
      "club": "Venezia"
    },
    {
      "name": "Alan Franco",
      "position": "MF",
      "club": "Atl?tico Mineiro"
    },
    {
      "name": "Pedro Vite",
      "position": "MF",
      "club": "Pumas UNAM"
    },
    {
      "name": "Kendry Paez",
      "position": "MF",
      "club": "River Plate"
    },
    {
      "name": "Nilson Angulo",
      "position": "MF",
      "club": "Sunderland"
    },
    {
      "name": "Gonzalo Plata",
      "position": "MF",
      "club": "Flamengo"
    },
    {
      "name": "Kevin Rodr?guez",
      "position": "FW",
      "club": "Union Saint-Gilloise"
    },
    {
      "name": "Anthony Valencia",
      "position": "FW",
      "club": "Antwerp"
    },
    {
      "name": "Enner Valencia",
      "position": "FW",
      "club": "Pachuca"
    },
    {
      "name": "Jordy Caicedo",
      "position": "FW",
      "club": "Hurac?n"
    },
    {
      "name": "Jeremy Ar?valo",
      "position": "FW",
      "club": "VfB Stuttgart"
    }
  ],
  "netherlands": [
    {
      "name": "Bart Verbruggen",
      "position": "GK",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Mark Flekken",
      "position": "GK",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Robin Roefs",
      "position": "GK",
      "club": "Sunderland"
    },
    {
      "name": "Virgil van Dijk",
      "position": "DF",
      "club": "captain"
    },
    {
      "name": "Denzel Dumfries",
      "position": "DF",
      "club": "Internazionale"
    },
    {
      "name": "Nathan Ak?",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Jurri&euml;n Timber",
      "position": "DF",
      "club": "Arsenal"
    },
    {
      "name": "Micky van de Ven",
      "position": "DF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Jan Paul van Hecke",
      "position": "DF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Jorrel Hato",
      "position": "DF",
      "club": "Chelsea"
    },
    {
      "name": "Frenkie de Jong",
      "position": "MF",
      "club": "Barcelona"
    },
    {
      "name": "Marten de Roon",
      "position": "MF",
      "club": "Atalanta"
    },
    {
      "name": "Tijjani Reijnders",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Teun Koopmeiners",
      "position": "MF",
      "club": "Juventus"
    },
    {
      "name": "Ryan Gravenberch",
      "position": "MF",
      "club": "Liverpool"
    },
    {
      "name": "Mats Wieffer",
      "position": "MF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Quinten Timber",
      "position": "MF",
      "club": "Marseille"
    },
    {
      "name": "Guus Til",
      "position": "MF",
      "club": "PSV Eindhoven"
    },
    {
      "name": "Memphis Depay",
      "position": "FW",
      "club": "Corinthians"
    },
    {
      "name": "Wout Weghorst",
      "position": "FW",
      "club": "Ajax"
    },
    {
      "name": "Donyell Malen",
      "position": "FW",
      "club": "Roma"
    },
    {
      "name": "Cody Gakpo",
      "position": "FW",
      "club": "Liverpool"
    },
    {
      "name": "Noa Lang",
      "position": "FW",
      "club": "Galatasaray"
    },
    {
      "name": "Justin Kluivert",
      "position": "FW",
      "club": "Bournemouth"
    },
    {
      "name": "Brian Brobbey",
      "position": "FW",
      "club": "Sunderland"
    },
    {
      "name": "Crysencio Summerville",
      "position": "FW",
      "club": "West Ham United"
    }
  ],
  "japan": [
    {
      "name": "Zion Suzuki",
      "position": "GK",
      "club": "Parma"
    },
    {
      "name": "Keisuke Osako",
      "position": "GK",
      "club": "Sanfrecce Hiroshima"
    },
    {
      "name": "Tomoki Hayakawa",
      "position": "GK",
      "club": "Kashima Antlers"
    },
    {
      "name": "Yuto Nagatomo",
      "position": "DF",
      "club": "FC Tokyo"
    },
    {
      "name": "Takehiro Tomiyasu",
      "position": "DF",
      "club": "Ajax"
    },
    {
      "name": "Ko Itakura",
      "position": "DF",
      "club": "Ajax"
    },
    {
      "name": "Shogo Taniguchi",
      "position": "DF",
      "club": "Sint-Truiden"
    },
    {
      "name": "Hiroki Ito",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "Yukinari Sugawara",
      "position": "DF",
      "club": "Werder Bremen"
    },
    {
      "name": "Ayumu Seko",
      "position": "DF",
      "club": "Le Havre"
    },
    {
      "name": "Tsuyoshi Watanabe",
      "position": "DF",
      "club": "Feyenoord"
    },
    {
      "name": "Junnosuke Suzuki",
      "position": "DF",
      "club": "Copenhagen"
    },
    {
      "name": "Wataru Endo",
      "position": "MF",
      "club": "Liverpool"
    },
    {
      "name": "Junya Ito",
      "position": "MF",
      "club": "Genk"
    },
    {
      "name": "Ritsu Doan",
      "position": "MF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Daichi Kamada",
      "position": "MF",
      "club": "Crystal Palace"
    },
    {
      "name": "Takefusa Kubo",
      "position": "MF",
      "club": "Real Sociedad"
    },
    {
      "name": "Ao Tanaka",
      "position": "MF",
      "club": "Leeds United"
    },
    {
      "name": "Keito Nakamura",
      "position": "MF",
      "club": "Reims"
    },
    {
      "name": "Kaishu Sano",
      "position": "MF",
      "club": "Mainz 05"
    },
    {
      "name": "Ayase Ueda",
      "position": "FW",
      "club": "Feyenoord"
    },
    {
      "name": "Daizen Maeda",
      "position": "FW",
      "club": "Celtic"
    },
    {
      "name": "Koki Ogawa",
      "position": "FW",
      "club": "NEC"
    },
    {
      "name": "Yuito Suzuki",
      "position": "FW",
      "club": "SC Freiburg"
    },
    {
      "name": "Keisuke Goto",
      "position": "FW",
      "club": "Sint-Truiden"
    },
    {
      "name": "Kento Shiogai",
      "position": "FW",
      "club": "VfL Wolfsburg"
    }
  ],
  "sweden": [
    {
      "name": "Kristoffer Nordfeldt",
      "position": "GK",
      "club": "AIK"
    },
    {
      "name": "Viktor Johansson",
      "position": "GK",
      "club": "Stoke City"
    },
    {
      "name": "Jacob Widell Zetterstrom",
      "position": "GK",
      "club": "Derby County"
    },
    {
      "name": "Victor Lindelof",
      "position": "DF",
      "club": "Aston Villa"
    },
    {
      "name": "Isak Hien",
      "position": "DF",
      "club": "Atalanta"
    },
    {
      "name": "Gabriel Gudmundsson",
      "position": "DF",
      "club": "Leeds United"
    },
    {
      "name": "Carl Starfelt",
      "position": "DF",
      "club": "Celta Vigo"
    },
    {
      "name": "Herman Johansson",
      "position": "DF",
      "club": "FC Dallas"
    },
    {
      "name": "Hjalmar Ekdal",
      "position": "DF",
      "club": "Burnley"
    },
    {
      "name": "Daniel Svensson",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Gustaf Lagerbielke",
      "position": "DF",
      "club": "Braga"
    },
    {
      "name": "Eric Smith",
      "position": "DF",
      "club": "FC St. Pauli"
    },
    {
      "name": "Elliot Stroud",
      "position": "DF",
      "club": "Mjallby AIF"
    },
    {
      "name": "Mattias Svanberg",
      "position": "MF",
      "club": "VfL Wolfsburg"
    },
    {
      "name": "Jesper Karlstrom",
      "position": "MF",
      "club": "Udinese"
    },
    {
      "name": "Yasin Ayari",
      "position": "MF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Lucas Bergvall",
      "position": "MF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Besfort Zeneli",
      "position": "MF",
      "club": "Union Saint-Gilloise"
    },
    {
      "name": "Alexander Isak",
      "position": "FW",
      "club": "Liverpool"
    },
    {
      "name": "Viktor Gyokeres",
      "position": "FW",
      "club": "Arsenal"
    },
    {
      "name": "Ken Sema",
      "position": "FW",
      "club": "Pafos"
    },
    {
      "name": "Anthony Elanga",
      "position": "FW",
      "club": "Newcastle United"
    },
    {
      "name": "Benjamin Nygren",
      "position": "FW",
      "club": "Celtic"
    },
    {
      "name": "Alexander Bernhardsson",
      "position": "FW",
      "club": "Holstein Kiel"
    },
    {
      "name": "Gustaf Nilsson",
      "position": "FW",
      "club": "Club Brugge"
    },
    {
      "name": "Taha Ali",
      "position": "FW",
      "club": "Malmo FF"
    }
  ],
  "tunisia": [
    {
      "name": "Aymen Dahmen",
      "position": "GK",
      "club": "CS Sfaxien"
    },
    {
      "name": "Sabri Ben Hessen",
      "position": "GK",
      "club": "Etoile du Sahel"
    },
    {
      "name": "Mouhib Chamakh",
      "position": "GK",
      "club": "Club Africain"
    },
    {
      "name": "Montassar Talbi",
      "position": "DF",
      "club": "Lorient"
    },
    {
      "name": "Dylan Bronn",
      "position": "DF",
      "club": "Servette"
    },
    {
      "name": "Ali Abdi",
      "position": "DF",
      "club": "Nice"
    },
    {
      "name": "Yan Valery",
      "position": "DF",
      "club": "Young Boys"
    },
    {
      "name": "Mohamed Amine Ben Hamida",
      "position": "DF",
      "club": "Esperance de Tunis"
    },
    {
      "name": "Moutaz Neffati",
      "position": "DF",
      "club": "IFK Norrkoping"
    },
    {
      "name": "Omar Rekik",
      "position": "DF",
      "club": "Maribor"
    },
    {
      "name": "Adem Arous",
      "position": "DF",
      "club": "Kasimpasa"
    },
    {
      "name": "Raed Chikhaoui",
      "position": "DF",
      "club": "US Monastir"
    },
    {
      "name": "Ellyes Skhiri",
      "position": "MF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Hannibal Mejbri",
      "position": "MF",
      "club": "Burnley"
    },
    {
      "name": "Anis Ben Slimane",
      "position": "MF",
      "club": "Norwich City"
    },
    {
      "name": "Mortadha Ben Ouanes",
      "position": "MF",
      "club": "Kasimpasa"
    },
    {
      "name": "Ismael Gharbi",
      "position": "MF",
      "club": "FC Augsburg"
    },
    {
      "name": "Hadj Mahmoud",
      "position": "MF",
      "club": "Lugano"
    },
    {
      "name": "Rani Khedira",
      "position": "MF",
      "club": "Union Berlin"
    },
    {
      "name": "Elias Achouri",
      "position": "FW",
      "club": "Copenhagen"
    },
    {
      "name": "Firas Chaouat",
      "position": "FW",
      "club": "Club Africain"
    },
    {
      "name": "Hazem Mastouri",
      "position": "FW",
      "club": "Dynamo Makhachkala"
    },
    {
      "name": "Elias Saad",
      "position": "FW",
      "club": "Hannover 96"
    },
    {
      "name": "Sebastian Tounekti",
      "position": "FW",
      "club": "Celtic"
    },
    {
      "name": "Khalil Ayari",
      "position": "FW",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Rayan Elloumi",
      "position": "FW",
      "club": "Vancouver Whitecaps"
    }
  ],
  "belgium": [
    {
      "name": "Thibaut Courtois",
      "position": "GK",
      "club": "Real Madrid"
    },
    {
      "name": "Senne Lammens",
      "position": "GK",
      "club": "Manchester United"
    },
    {
      "name": "Mike Penders",
      "position": "GK",
      "club": "Strasbourg"
    },
    {
      "name": "Thomas Meunier",
      "position": "DF",
      "club": "Lille"
    },
    {
      "name": "Timothy Castagne",
      "position": "DF",
      "club": "Fulham"
    },
    {
      "name": "Arthur Theate",
      "position": "DF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Zeno Debast",
      "position": "DF",
      "club": "Sporting CP"
    },
    {
      "name": "Maxim De Cuyper",
      "position": "DF",
      "club": "Brighton & Hove Albion"
    },
    {
      "name": "Brandon Mechele",
      "position": "DF",
      "club": "Club Brugge"
    },
    {
      "name": "Koni De Winter",
      "position": "DF",
      "club": "Milan"
    },
    {
      "name": "Joaquin Seys",
      "position": "DF",
      "club": "Club Brugge"
    },
    {
      "name": "Nathan Ngoy",
      "position": "DF",
      "club": "Lille"
    },
    {
      "name": "Axel Witsel",
      "position": "MF",
      "club": "Girona"
    },
    {
      "name": "Kevin De Bruyne",
      "position": "MF",
      "club": "Napoli"
    },
    {
      "name": "Youri Tielemans",
      "position": "MF",
      "club": "Aston Villa"
    },
    {
      "name": "Hans Vanaken",
      "position": "MF",
      "club": "Club Brugge"
    },
    {
      "name": "Charles De Ketelaere",
      "position": "MF",
      "club": "Atalanta"
    },
    {
      "name": "Amadou Onana",
      "position": "MF",
      "club": "Aston Villa"
    },
    {
      "name": "Nicolas Raskin",
      "position": "MF",
      "club": "Rangers"
    },
    {
      "name": "Diego Moreira",
      "position": "MF",
      "club": "Strasbourg"
    },
    {
      "name": "Romelu Lukaku",
      "position": "FW",
      "club": "Napoli"
    },
    {
      "name": "Leandro Trossard",
      "position": "FW",
      "club": "Arsenal"
    },
    {
      "name": "Jeremy Doku",
      "position": "FW",
      "club": "Manchester City"
    },
    {
      "name": "Dodi Lukebakio",
      "position": "FW",
      "club": "Benfica"
    },
    {
      "name": "Alexis Saelemaekers",
      "position": "FW",
      "club": "Milan"
    },
    {
      "name": "Matias Fernandez-Pardo",
      "position": "FW",
      "club": "Lille"
    }
  ],
  "egypt": [
    {
      "name": "El Mahdy Soliman",
      "position": "GK",
      "club": "Zamalek"
    },
    {
      "name": "Mohamed Alaa",
      "position": "GK",
      "club": "El Gouna"
    },
    {
      "name": "Mohamed El Shenawy",
      "position": "GK",
      "club": "Al Ahly"
    },
    {
      "name": "Mostafa Shobeir",
      "position": "GK",
      "club": "Al Ahly"
    },
    {
      "name": "Mohamed Hany",
      "position": "DF",
      "club": "Al Ahly"
    },
    {
      "name": "Tarek Alaa",
      "position": "DF",
      "club": "Zamalek"
    },
    {
      "name": "Hamdy Fathy",
      "position": "DF",
      "club": "Al Wakrah"
    },
    {
      "name": "Ramy Rabia",
      "position": "DF",
      "club": "Al Ain"
    },
    {
      "name": "Yasser Ibrahim",
      "position": "DF",
      "club": "Al Ahly"
    },
    {
      "name": "Hossam Abdelmaguid",
      "position": "DF",
      "club": "Zamalek"
    },
    {
      "name": "Mohamed Abdelmonem",
      "position": "DF",
      "club": "Nice"
    },
    {
      "name": "Ahmed Fatouh",
      "position": "DF",
      "club": "Zamalek"
    },
    {
      "name": "Karim Hafez",
      "position": "DF",
      "club": "Pyramids"
    },
    {
      "name": "Marwan Attia",
      "position": "MF",
      "club": "Al Ahly"
    },
    {
      "name": "Mohanad Lasheen",
      "position": "MF",
      "club": "Pyramids"
    },
    {
      "name": "Nabil Emad",
      "position": "MF",
      "club": "Al Najma"
    },
    {
      "name": "Mahmoud Saber",
      "position": "MF",
      "club": "Zed"
    },
    {
      "name": "Ahmed Zizo",
      "position": "MF",
      "club": "Al Ahly"
    },
    {
      "name": "Emam Ashour",
      "position": "MF",
      "club": "Al Ahly"
    },
    {
      "name": "Mostafa Ziko",
      "position": "MF",
      "club": "Pyramids"
    },
    {
      "name": "Mahmoud Trezeguet",
      "position": "MF",
      "club": "Al Ahly"
    },
    {
      "name": "Ibrahim Adel",
      "position": "MF",
      "club": "Nordsjaelland"
    },
    {
      "name": "Haissem Hassan",
      "position": "MF",
      "club": "Real Oviedo"
    },
    {
      "name": "Omar Marmoush",
      "position": "FW",
      "club": "Manchester City"
    },
    {
      "name": "Mohamed Salah",
      "position": "FW",
      "club": "Liverpool"
    },
    {
      "name": "Hamza Abdelkarim",
      "position": "FW",
      "club": "Barcelona B"
    }
  ],
  "iran": [
    {
      "name": "Alireza Beiranvand",
      "position": "GK",
      "club": "Tractor"
    },
    {
      "name": "Payam Niazmand",
      "position": "GK",
      "club": "Persepolis"
    },
    {
      "name": "Hossein Hosseini",
      "position": "GK",
      "club": "Sepahan"
    },
    {
      "name": "Saleh Hardani",
      "position": "DF",
      "club": "Esteghlal"
    },
    {
      "name": "Ehsan Hajsafi",
      "position": "DF",
      "club": "Sepahan"
    },
    {
      "name": "Shojae Khalilzadeh",
      "position": "DF",
      "club": "Tractor"
    },
    {
      "name": "Milad Mohammadi",
      "position": "DF",
      "club": "Persepolis"
    },
    {
      "name": "Hossein Kanaanizadegan",
      "position": "DF",
      "club": "Persepolis"
    },
    {
      "name": "Aria Yousefi",
      "position": "DF",
      "club": "Sepahan"
    },
    {
      "name": "Ali Nemati",
      "position": "DF",
      "club": "Foolad"
    },
    {
      "name": "Ramin Rezaeian",
      "position": "DF",
      "club": "Foolad"
    },
    {
      "name": "Danial Eiri",
      "position": "DF",
      "club": "Malavan"
    },
    {
      "name": "Saeid Ezatolahi",
      "position": "MF",
      "club": "Shabab Al-Ahli"
    },
    {
      "name": "Alireza Jahanbakhsh",
      "position": "MF",
      "club": "Dender"
    },
    {
      "name": "Mohammad Mohebi",
      "position": "MF",
      "club": "Rostov"
    },
    {
      "name": "Saman Ghoddos",
      "position": "MF",
      "club": "Kalba"
    },
    {
      "name": "Rouzbeh Cheshmi",
      "position": "MF",
      "club": "Esteghlal"
    },
    {
      "name": "Mahdi Torabi",
      "position": "MF",
      "club": "Tractor"
    },
    {
      "name": "Mohammad Ghorbani",
      "position": "MF",
      "club": "Al-Wahda"
    },
    {
      "name": "Amirmohammad Razzaghinia",
      "position": "MF",
      "club": "Esteghlal"
    },
    {
      "name": "Mehdi Taremi",
      "position": "FW",
      "club": "Olympiacos"
    },
    {
      "name": "Mehdi Ghayedi",
      "position": "FW",
      "club": "Al-Nasr"
    },
    {
      "name": "Ali Alipour",
      "position": "FW",
      "club": "Persepolis"
    },
    {
      "name": "Amirhossein Hosseinzadeh",
      "position": "FW",
      "club": "Tractor"
    },
    {
      "name": "Shahriyar Moghanlou",
      "position": "FW",
      "club": "Kalba"
    },
    {
      "name": "Dennis Eckert",
      "position": "FW",
      "club": "Standard Liege"
    }
  ],
  "new-zealand": [
    {
      "name": "Max Crocombe",
      "position": "GK",
      "club": "Millwall"
    },
    {
      "name": "Alex Paulsen",
      "position": "GK",
      "club": "Lechia Gdansk"
    },
    {
      "name": "Michael Woud",
      "position": "GK",
      "club": "Auckland FC"
    },
    {
      "name": "Tim Payne",
      "position": "DF",
      "club": "Wellington Phoenix"
    },
    {
      "name": "Francis de Vries",
      "position": "DF",
      "club": "Auckland FC"
    },
    {
      "name": "Tyler Bindon",
      "position": "DF",
      "club": "Sheffield United"
    },
    {
      "name": "Michael Boxall",
      "position": "DF",
      "club": "Minnesota United FC"
    },
    {
      "name": "Liberato Cacace",
      "position": "DF",
      "club": "Wrexham"
    },
    {
      "name": "Nando Pijnaker",
      "position": "DF",
      "club": "Auckland FC"
    },
    {
      "name": "Finn Surman",
      "position": "DF",
      "club": "Portland Timbers"
    },
    {
      "name": "Callan Elliot",
      "position": "DF",
      "club": "Auckland FC"
    },
    {
      "name": "Tommy Smith",
      "position": "DF",
      "club": "Braintree"
    },
    {
      "name": "Joe Bell",
      "position": "MF",
      "club": "Viking"
    },
    {
      "name": "Matthew Garbett",
      "position": "MF",
      "club": "Peterborough United"
    },
    {
      "name": "Marko Stamenic",
      "position": "MF",
      "club": "Swansea City"
    },
    {
      "name": "Sarpreet Singh",
      "position": "MF",
      "club": "Wellington Phoenix"
    },
    {
      "name": "Elijah Just",
      "position": "MF",
      "club": "Motherwell"
    },
    {
      "name": "Alex Rufer",
      "position": "MF",
      "club": "Wellington Phoenix"
    },
    {
      "name": "Ben Old",
      "position": "MF",
      "club": "Saint-Etienne"
    },
    {
      "name": "Callum McCowatt",
      "position": "MF",
      "club": "Silkeborg"
    },
    {
      "name": "Ryan Thomas",
      "position": "MF",
      "club": "PEC Zwolle"
    },
    {
      "name": "Lachlan Bayliss",
      "position": "MF",
      "club": "Newcastle Jets"
    },
    {
      "name": "Chris Wood",
      "position": "FW",
      "club": "Nottingham Forest"
    },
    {
      "name": "Kosta Barbarouses",
      "position": "FW",
      "club": "Western Sydney Wanderers"
    },
    {
      "name": "Ben Waine",
      "position": "FW",
      "club": "Port Vale"
    },
    {
      "name": "Jesse Randall",
      "position": "FW",
      "club": "Auckland FC"
    }
  ],
  "spain": [
    {
      "name": "Unai Simon",
      "position": "GK",
      "club": "Athletic Bilbao"
    },
    {
      "name": "David Raya",
      "position": "GK",
      "club": "Arsenal"
    },
    {
      "name": "Joan Garcia",
      "position": "GK",
      "club": "Barcelona"
    },
    {
      "name": "Marcos Llorente",
      "position": "DF",
      "club": "Atletico Madrid"
    },
    {
      "name": "Marc Pubill",
      "position": "DF",
      "club": "Atletico Madrid"
    },
    {
      "name": "Pedro Porro",
      "position": "DF",
      "club": "Tottenham"
    },
    {
      "name": "Aymeric Laporte",
      "position": "DF",
      "club": "Athletic Bilbao"
    },
    {
      "name": "Eric Garcia",
      "position": "DF",
      "club": "Barcelona"
    },
    {
      "name": "Pau Cubarsi",
      "position": "DF",
      "club": "Barcelona"
    },
    {
      "name": "Marc Cucurella",
      "position": "DF",
      "club": "Chelsea"
    },
    {
      "name": "Alejandro Grimaldo",
      "position": "DF",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Rodri",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Martin Zubimendi",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Mikel Merino",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Pedri",
      "position": "MF",
      "club": "Barcelona"
    },
    {
      "name": "Gavi",
      "position": "MF",
      "club": "Barcelona"
    },
    {
      "name": "Fabian Ruiz",
      "position": "MF",
      "club": "Paris St-Germain"
    },
    {
      "name": "Alex Baena",
      "position": "MF",
      "club": "Atletico Madrid"
    },
    {
      "name": "Yeremy Pino",
      "position": "FW",
      "club": "Crystal Palace"
    },
    {
      "name": "Victor Munoz",
      "position": "FW",
      "club": "Osasuna"
    },
    {
      "name": "Mikel Oyarzabal",
      "position": "FW",
      "club": "Real Sociedad"
    },
    {
      "name": "Ferran Torres",
      "position": "FW",
      "club": "Barcelona"
    },
    {
      "name": "Lamine Yamal",
      "position": "FW",
      "club": "Barcelona"
    },
    {
      "name": "Dani Olmo",
      "position": "FW",
      "club": "Barcelona"
    },
    {
      "name": "Nico Williams",
      "position": "FW",
      "club": "Athletic Bilbao"
    },
    {
      "name": "Borja Iglesias",
      "position": "FW",
      "club": "Celta Vigo"
    }
  ],
  "cape-verde": [
    {
      "name": "Vozinha",
      "position": "GK",
      "club": "Chaves"
    },
    {
      "name": "Marcio Rosa",
      "position": "GK",
      "club": "Montana"
    },
    {
      "name": "CJ dos Santos",
      "position": "GK",
      "club": "San Diego"
    },
    {
      "name": "Stopira",
      "position": "DF",
      "club": "Torreense"
    },
    {
      "name": "Pico",
      "position": "DF",
      "club": "Shamrock Rovers"
    },
    {
      "name": "Joao Paulo",
      "position": "DF",
      "club": "FCSB"
    },
    {
      "name": "Diney",
      "position": "DF",
      "club": "Al Bataeh"
    },
    {
      "name": "Logan Costa",
      "position": "DF",
      "club": "Villarreal"
    },
    {
      "name": "Steven Moreira",
      "position": "DF",
      "club": "Columbus Crew"
    },
    {
      "name": "Wagner Pina",
      "position": "DF",
      "club": "Trabzonspor"
    },
    {
      "name": "Sidny Lopes Cabral",
      "position": "DF",
      "club": "Benfica"
    },
    {
      "name": "Kelvin Pires",
      "position": "DF",
      "club": "SJK"
    },
    {
      "name": "Jamiro Monteiro",
      "position": "MF",
      "club": "PEC Zwolle"
    },
    {
      "name": "Kevin Pina",
      "position": "MF",
      "club": "Krasnodar"
    },
    {
      "name": "Deroy Duarte",
      "position": "MF",
      "club": "Ludogorets Razgrad"
    },
    {
      "name": "Telmo Arcanjo",
      "position": "MF",
      "club": "Vitoria de Guimaraes"
    },
    {
      "name": "Laros Duarte",
      "position": "MF",
      "club": "Puskas Akademia"
    },
    {
      "name": "Yannick Semedo",
      "position": "MF",
      "club": "Farense"
    },
    {
      "name": "Ryan Mendes",
      "position": "FW",
      "club": "Igdir"
    },
    {
      "name": "Garry Rodrigues",
      "position": "FW",
      "club": "Apollon Limassol"
    },
    {
      "name": "Willy Semedo",
      "position": "FW",
      "club": "Omonia"
    },
    {
      "name": "Jovane Cabral",
      "position": "FW",
      "club": "Estrela Amadora"
    },
    {
      "name": "Benchimol",
      "position": "FW",
      "club": "Akron Tolyatti"
    },
    {
      "name": "Dailon Livramento",
      "position": "FW",
      "club": "Casa Pia"
    },
    {
      "name": "Helio Varela",
      "position": "FW",
      "club": "Maccabi Tel Aviv"
    },
    {
      "name": "Nuno da Costa",
      "position": "FW",
      "club": "Istanbul Basaksehir"
    }
  ],
  "saudi-arabia": [
    {
      "name": "Mohammed Al-Owais",
      "position": "GK",
      "club": "Al-Ula"
    },
    {
      "name": "Nawaf Al-Aqidi",
      "position": "GK",
      "club": "Al-Nassr"
    },
    {
      "name": "Ahmed Al-Kassar",
      "position": "GK",
      "club": "Al-Qadsiah"
    },
    {
      "name": "Abdulelah Al Amri",
      "position": "DF",
      "club": "Al Nassr"
    },
    {
      "name": "Hassan Tambakti",
      "position": "DF",
      "club": "Al Hilal"
    },
    {
      "name": "Jehad Thikri",
      "position": "DF",
      "club": "Al Qadsiah"
    },
    {
      "name": "Ali Lajami",
      "position": "DF",
      "club": "Al Hilal"
    },
    {
      "name": "Hassan Kadesh",
      "position": "DF",
      "club": "Al Ittihad"
    },
    {
      "name": "Saud Abdulhamid",
      "position": "DF",
      "club": "Lens"
    },
    {
      "name": "Mohammed Abu Al Shamat",
      "position": "DF",
      "club": "Al Qadsiah"
    },
    {
      "name": "Ali Majrashi",
      "position": "DF",
      "club": "Al Ahli"
    },
    {
      "name": "Moteb Al Harbi",
      "position": "DF",
      "club": "Al Hilal"
    },
    {
      "name": "Nawaf Boushal",
      "position": "DF",
      "club": "Al Nassr"
    },
    {
      "name": "Sultan Al-Ghannam",
      "position": "DF",
      "club": "Al Nassr"
    },
    {
      "name": "Mohammed Kanno",
      "position": "MF",
      "club": "Al Hilal"
    },
    {
      "name": "Abdullah Al Khaibari",
      "position": "MF",
      "club": "Al Nassr"
    },
    {
      "name": "Ziyad Al Johani",
      "position": "MF",
      "club": "Al Ahli"
    },
    {
      "name": "Nasser Al Dawsari",
      "position": "MF",
      "club": "Al Hilal"
    },
    {
      "name": "Musab Al Juwayr",
      "position": "MF",
      "club": "Al Qadsiah"
    },
    {
      "name": "Alaa Al Hajji",
      "position": "MF",
      "club": "Neom"
    },
    {
      "name": "Salem Al Dawsari",
      "position": "MF",
      "club": "Al Hilal"
    },
    {
      "name": "Khalid Al Ghannam",
      "position": "MF",
      "club": "Al Ettifaq"
    },
    {
      "name": "Ayman Yahya",
      "position": "MF",
      "club": "Al Nassr"
    },
    {
      "name": "Firas Al Buraikan",
      "position": "FW",
      "club": "Al Ahli"
    },
    {
      "name": "Saleh Al Shehri",
      "position": "FW",
      "club": "Al Ittihad"
    },
    {
      "name": "Abdullah Al Hamdan",
      "position": "FW",
      "club": "Al Nassr"
    }
  ],
  "uruguay": [
    {
      "name": "Sergio Rochet",
      "position": "GK",
      "club": "Internacional"
    },
    {
      "name": "Santiago Mele",
      "position": "GK",
      "club": "Monterrey"
    },
    {
      "name": "Fernando Muslera",
      "position": "GK",
      "club": "Estudiantes"
    },
    {
      "name": "Ronald Araujo",
      "position": "DF",
      "club": "Barcelona"
    },
    {
      "name": "Jose Maria Gimenez",
      "position": "DF",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Santiago Bueno",
      "position": "DF",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Sebastian Caceres",
      "position": "DF",
      "club": "America"
    },
    {
      "name": "Mathias Olivera",
      "position": "DF",
      "club": "Napoli"
    },
    {
      "name": "Guillermo Varela",
      "position": "DF",
      "club": "Flamengo"
    },
    {
      "name": "Matias Vina",
      "position": "DF",
      "club": "River Plate"
    },
    {
      "name": "Joaquin Piquerez",
      "position": "DF",
      "club": "Palmeiras"
    },
    {
      "name": "Juan Manuel Sanabria",
      "position": "DF",
      "club": "Real Salt Lake"
    },
    {
      "name": "Federico Valverde",
      "position": "MF",
      "club": "Real Madrid"
    },
    {
      "name": "Rodrigo Bentancur",
      "position": "MF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Manuel Ugarte",
      "position": "MF",
      "club": "Manchester United"
    },
    {
      "name": "Emiliano Martinez",
      "position": "MF",
      "club": "Palmeiras"
    },
    {
      "name": "Rodrigo Zalazar",
      "position": "MF",
      "club": "Sporting CP"
    },
    {
      "name": "Giorgian De Arrascaeta",
      "position": "MF",
      "club": "Flamengo"
    },
    {
      "name": "Nicolas De La Cruz",
      "position": "MF",
      "club": "Flamengo"
    },
    {
      "name": "Agustin Canobbio",
      "position": "MF",
      "club": "Fluminense"
    },
    {
      "name": "Maximiliano Araujo",
      "position": "MF",
      "club": "Sporting CP"
    },
    {
      "name": "Brian Rodriguez",
      "position": "MF",
      "club": "America"
    },
    {
      "name": "Facundo Pellistri",
      "position": "MF",
      "club": "Panathinaikos"
    },
    {
      "name": "Darwin Nunez",
      "position": "FW",
      "club": "Al Hilal"
    },
    {
      "name": "Federico Vinas",
      "position": "FW",
      "club": "Real Oviedo"
    },
    {
      "name": "Rodrigo Aguirre",
      "position": "FW",
      "club": "Tigres"
    }
  ],
  "france": [
    {
      "name": "Mike Maignan",
      "position": "GK",
      "club": "Milan"
    },
    {
      "name": "Brice Samba",
      "position": "GK",
      "club": "Rennes"
    },
    {
      "name": "Robin Risser",
      "position": "GK",
      "club": "Lens"
    },
    {
      "name": "Lucas Digne",
      "position": "DF",
      "club": "Aston Villa"
    },
    {
      "name": "Jules Kounde",
      "position": "DF",
      "club": "Barcelona"
    },
    {
      "name": "Theo Hernandez",
      "position": "DF",
      "club": "Al-Hilal"
    },
    {
      "name": "Lucas Hernandez",
      "position": "DF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Dayot Upamecano",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "William Saliba",
      "position": "DF",
      "club": "Arsenal"
    },
    {
      "name": "Ibrahima Konate",
      "position": "DF",
      "club": "Liverpool"
    },
    {
      "name": "Malo Gusto",
      "position": "DF",
      "club": "Chelsea"
    },
    {
      "name": "Maxence Lacroix",
      "position": "DF",
      "club": "Crystal Palace"
    },
    {
      "name": "N'Golo Kante",
      "position": "MF",
      "club": "Fenerbahce"
    },
    {
      "name": "Adrien Rabiot",
      "position": "MF",
      "club": "Milan"
    },
    {
      "name": "Aurelien Tchouameni",
      "position": "MF",
      "club": "Real Madrid"
    },
    {
      "name": "Manu Kone",
      "position": "MF",
      "club": "Roma"
    },
    {
      "name": "Warren Zaire-Emery",
      "position": "MF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Kylian Mbappe",
      "position": "FW",
      "club": "Real Madrid"
    },
    {
      "name": "Ousmane Dembele",
      "position": "FW",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Marcus Thuram",
      "position": "FW",
      "club": "Inter Milan"
    },
    {
      "name": "Bradley Barcola",
      "position": "FW",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Michael Olise",
      "position": "FW",
      "club": "Bayern Munich"
    },
    {
      "name": "Maghnes Akliouche",
      "position": "FW",
      "club": "Monaco"
    },
    {
      "name": "Desire Doue",
      "position": "FW",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Rayan Cherki",
      "position": "FW",
      "club": "Manchester City"
    },
    {
      "name": "Jean-Philippe Mateta",
      "position": "FW",
      "club": "Crystal Palace"
    }
  ],
  "senegal": [
    {
      "name": "Yehvann Diouf",
      "position": "GK",
      "club": "Nice"
    },
    {
      "name": "Edouard Mendy",
      "position": "GK",
      "club": "Al-Ahli"
    },
    {
      "name": "Mory Diaw",
      "position": "GK",
      "club": "Le Havre"
    },
    {
      "name": "Mamadou Sarr",
      "position": "DF",
      "club": "Chelsea"
    },
    {
      "name": "Abdoulaye Seck",
      "position": "DF",
      "club": "Maccabi Haifa"
    },
    {
      "name": "Ismail Jakobs",
      "position": "DF",
      "club": "Galatasaray"
    },
    {
      "name": "Krepin Diatta",
      "position": "DF",
      "club": "Monaco"
    },
    {
      "name": "Moussa Niakhate",
      "position": "DF",
      "club": "Lyon"
    },
    {
      "name": "Antoine Mendy",
      "position": "DF",
      "club": "Nice"
    },
    {
      "name": "El Hadji Malick Diouf",
      "position": "DF",
      "club": "West Ham United"
    },
    {
      "name": "Nobel Mendy",
      "position": "DF",
      "club": "Rayo Vallecano"
    },
    {
      "name": "Kalidou Koulibaly",
      "position": "DF",
      "club": "Al-Hilal"
    },
    {
      "name": "Idrissa Gueye",
      "position": "MF",
      "club": "Everton"
    },
    {
      "name": "Pathe Ciss",
      "position": "MF",
      "club": "Rayo Vallecano"
    },
    {
      "name": "Lamine Camara",
      "position": "MF",
      "club": "Monaco"
    },
    {
      "name": "Pape Matar Sarr",
      "position": "MF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Habib Diarra",
      "position": "MF",
      "club": "Sunderland"
    },
    {
      "name": "Pape Gueye",
      "position": "MF",
      "club": "Villarreal"
    },
    {
      "name": "Assane Diao",
      "position": "FW",
      "club": "Como"
    },
    {
      "name": "Boulaye Dia",
      "position": "FW",
      "club": "Lazio"
    },
    {
      "name": "Nicolas Jackson",
      "position": "FW",
      "club": "Bayern Munich"
    },
    {
      "name": "Cherif Ndiaye",
      "position": "FW",
      "club": "Samsunspor"
    },
    {
      "name": "Ismaila Sarr",
      "position": "FW",
      "club": "Crystal Palace"
    },
    {
      "name": "Habib Diallo",
      "position": "FW",
      "club": "Metz"
    },
    {
      "name": "Bamba Dieng",
      "position": "FW",
      "club": "Lorient"
    },
    {
      "name": "Ibrahim Mbaye",
      "position": "FW",
      "club": "Paris Saint-Germain"
    }
  ],
  "iraq": [
    {
      "name": "Fahad Talib",
      "position": "GK",
      "club": "Al-Talaba"
    },
    {
      "name": "Jalal Hassan",
      "position": "GK",
      "club": "Al-Zawraa"
    },
    {
      "name": "Ahmed Basil",
      "position": "GK",
      "club": "Al-Shorta"
    },
    {
      "name": "Rebin Sulaka",
      "position": "DF",
      "club": "Port"
    },
    {
      "name": "Hussein Ali",
      "position": "DF",
      "club": "Pogon Szczecin"
    },
    {
      "name": "Zaid Tahseen",
      "position": "DF",
      "club": "Pakhtakor"
    },
    {
      "name": "Akam Hashim",
      "position": "DF",
      "club": "Al-Zawraa"
    },
    {
      "name": "Manaf Younis",
      "position": "DF",
      "club": "Al-Shorta"
    },
    {
      "name": "Ahmed Yahya",
      "position": "DF",
      "club": "Al-Shorta"
    },
    {
      "name": "Merchas Doski",
      "position": "DF",
      "club": "Viktoria Plzen"
    },
    {
      "name": "Mustafa Saadoon",
      "position": "DF",
      "club": "Al-Shorta"
    },
    {
      "name": "Frans Putros",
      "position": "DF",
      "club": "Persib"
    },
    {
      "name": "Youssef Amyn",
      "position": "MF",
      "club": "AEK Larnaca"
    },
    {
      "name": "Ibrahim Bayesh",
      "position": "MF",
      "club": "Al-Dhafra"
    },
    {
      "name": "Ahmed Qasem",
      "position": "MF",
      "club": "Nashville SC"
    },
    {
      "name": "Zidane Iqbal",
      "position": "MF",
      "club": "Utrecht"
    },
    {
      "name": "Amir Al-Ammari",
      "position": "MF",
      "club": "Cracovia"
    },
    {
      "name": "Ali Jasim",
      "position": "MF",
      "club": "Al-Najma"
    },
    {
      "name": "Kevin Yakob",
      "position": "MF",
      "club": "AGF"
    },
    {
      "name": "Aimar Sher",
      "position": "MF",
      "club": "Sarpsborg"
    },
    {
      "name": "Marko Farji",
      "position": "MF",
      "club": "Venezia"
    },
    {
      "name": "Zaid Ismail",
      "position": "MF",
      "club": "Al-Talaba"
    },
    {
      "name": "Ali Al-Hamadi",
      "position": "FW",
      "club": "Ipswich Town"
    },
    {
      "name": "Mohanad Ali",
      "position": "FW",
      "club": "Dibba"
    },
    {
      "name": "Ali Yousif",
      "position": "FW",
      "club": "Al-Talaba"
    },
    {
      "name": "Aymen Hussein",
      "position": "FW",
      "club": "Al-Karma"
    }
  ],
  "norway": [
    {
      "name": "Orjan Nyland",
      "position": "GK",
      "club": "Sevilla"
    },
    {
      "name": "Egil Selvik",
      "position": "GK",
      "club": "Watford"
    },
    {
      "name": "Sander Tangvik",
      "position": "GK",
      "club": "Hamburger SV"
    },
    {
      "name": "Kristoffer Ajer",
      "position": "DF",
      "club": "Brentford"
    },
    {
      "name": "Julian Ryerson",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Leo Ostigard",
      "position": "DF",
      "club": "Genoa"
    },
    {
      "name": "Marcus Holmgren Pedersen",
      "position": "DF",
      "club": "Torino"
    },
    {
      "name": "David Moller Wolfe",
      "position": "DF",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Fredrik Andre Bjorkan",
      "position": "DF",
      "club": "Bodo/Glimt"
    },
    {
      "name": "Torbjorn Heggem",
      "position": "DF",
      "club": "Bologna"
    },
    {
      "name": "Sondre Langas",
      "position": "DF",
      "club": "Derby County"
    },
    {
      "name": "Henrik Falchener",
      "position": "DF",
      "club": "Viking"
    },
    {
      "name": "Martin Odegaard",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Sander Berge",
      "position": "MF",
      "club": "Fulham"
    },
    {
      "name": "Patrick Berg",
      "position": "MF",
      "club": "Bodo/Glimt"
    },
    {
      "name": "Kristian Thorstvedt",
      "position": "MF",
      "club": "Sassuolo"
    },
    {
      "name": "Morten Thorsby",
      "position": "MF",
      "club": "Cremonese"
    },
    {
      "name": "Antonio Nusa",
      "position": "MF",
      "club": "RB Leipzig"
    },
    {
      "name": "Fredrik Aursnes",
      "position": "MF",
      "club": "Benfica"
    },
    {
      "name": "Oscar Bobb",
      "position": "MF",
      "club": "Fulham"
    },
    {
      "name": "Jens Petter Hauge",
      "position": "MF",
      "club": "Bodo/Glimt"
    },
    {
      "name": "Andreas Schjelderup",
      "position": "MF",
      "club": "Benfica"
    },
    {
      "name": "Thelo Aasgaard",
      "position": "MF",
      "club": "Rangers"
    },
    {
      "name": "Alexander Sorloth",
      "position": "FW",
      "club": "Atletico Madrid"
    },
    {
      "name": "Erling Haaland",
      "position": "FW",
      "club": "Manchester City"
    },
    {
      "name": "Jorgen Strand Larsen",
      "position": "FW",
      "club": "Crystal Palace"
    }
  ],
  "argentina": [
    {
      "name": "Emiliano Mart?nez",
      "position": "GK",
      "club": "Aston Villa"
    },
    {
      "name": "Juan Musso",
      "position": "GK",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Ger?nimo Rulli",
      "position": "GK",
      "club": "Marseille"
    },
    {
      "name": "Leonardo Balerdi",
      "position": "DF",
      "club": "Marseille"
    },
    {
      "name": "Lisandro Mart?nez",
      "position": "DF",
      "club": "Manchester United"
    },
    {
      "name": "Facundo Medina",
      "position": "DF",
      "club": "Marseille"
    },
    {
      "name": "Nahuel Molina",
      "position": "DF",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Gonzalo Montiel",
      "position": "DF",
      "club": "River Plate"
    },
    {
      "name": "Nicol?s Otamendi",
      "position": "DF",
      "club": "Benfica"
    },
    {
      "name": "Cristian Romero",
      "position": "DF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Nicol?s Tagliafico",
      "position": "DF",
      "club": "Lyon"
    },
    {
      "name": "Valent?n Barco",
      "position": "MF",
      "club": "Strasbourg"
    },
    {
      "name": "Rodrigo De Paul",
      "position": "MF",
      "club": "Inter Miami"
    },
    {
      "name": "Enzo Fern?ndez",
      "position": "MF",
      "club": "Chelsea"
    },
    {
      "name": "Giovani Lo Celso",
      "position": "MF",
      "club": "Betis"
    },
    {
      "name": "Alexis Mac Allister",
      "position": "MF",
      "club": "Liverpool"
    },
    {
      "name": "Exequiel Palacios",
      "position": "MF",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Leandro Paredes",
      "position": "MF",
      "club": "Boca Juniors"
    },
    {
      "name": "Nicol?s Gonz?lez",
      "position": "MF",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Thiago Almada",
      "position": "FW",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Juli?n Alvarez",
      "position": "FW",
      "club": "Atl?tico Madrid"
    },
    {
      "name": "Jos? Manuel L?pez",
      "position": "FW",
      "club": "Palmeiras"
    },
    {
      "name": "Lautaro Mart?nez",
      "position": "FW",
      "club": "Internazionale"
    },
    {
      "name": "Lionel Messi",
      "position": "FW",
      "club": "Inter Miami"
    },
    {
      "name": "Nico Paz",
      "position": "FW",
      "club": "Como"
    },
    {
      "name": "Giuliano Simeone",
      "position": "FW",
      "club": "Atl?tico Madrid"
    }
  ],
  "algeria": [
    {
      "name": "Melvin Mastil",
      "position": "GK",
      "club": "Stade Nyonnais"
    },
    {
      "name": "Oussama Benbot",
      "position": "GK",
      "club": "USM Alger"
    },
    {
      "name": "Luca Zidane",
      "position": "GK",
      "club": "Granada"
    },
    {
      "name": "A&iuml;ssa Mandi",
      "position": "DF",
      "club": "Lille"
    },
    {
      "name": "Achref Abada",
      "position": "DF",
      "club": "USM Alger"
    },
    {
      "name": "Mohamed Amine Tougai",
      "position": "DF",
      "club": "Esp?rance de Tunis"
    },
    {
      "name": "Zineddine Bela&iuml;d",
      "position": "DF",
      "club": "JS Kabylie"
    },
    {
      "name": "Jaouen Hadjam",
      "position": "DF",
      "club": "Young Boys"
    },
    {
      "name": "Rayan A&iuml;t-Nouri",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Rafik Belghali",
      "position": "DF",
      "club": "Hellas Verona"
    },
    {
      "name": "Ramy Bensebaini",
      "position": "DF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Samir Chergui",
      "position": "DF",
      "club": "Paris"
    },
    {
      "name": "Ramiz Zerrouki",
      "position": "MF",
      "club": "Twente"
    },
    {
      "name": "Houssem Aouar",
      "position": "MF",
      "club": "Al-Ittihad"
    },
    {
      "name": "Far?s Cha&iuml;bi",
      "position": "MF",
      "club": "Eintracht Frankfurt"
    },
    {
      "name": "Hicham Boudaoui",
      "position": "MF",
      "club": "Nice"
    },
    {
      "name": "Nabil Bentaleb",
      "position": "MF",
      "club": "Lille"
    },
    {
      "name": "Ibrahim Maza",
      "position": "MF",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Yacine Titraoui",
      "position": "MF",
      "club": "Charleroi"
    },
    {
      "name": "Riyad Mahrez",
      "position": "FW",
      "club": "Al-Ahli"
    },
    {
      "name": "Amine Gouiri",
      "position": "FW",
      "club": "Marseille"
    },
    {
      "name": "Anis Hadj Moussa",
      "position": "FW",
      "club": "Feyenoord"
    },
    {
      "name": "Nadhir Benbouali",
      "position": "FW",
      "club": "Győr"
    },
    {
      "name": "Mohamed Amoura",
      "position": "FW",
      "club": "VfL Wolfsburg"
    },
    {
      "name": "Adil Boulbina",
      "position": "FW",
      "club": "Al-Duhail"
    },
    {
      "name": "Far?s Ghedjemis",
      "position": "FW",
      "club": "Frosinone"
    }
  ],
  "austria": [
    {
      "name": "Alexander Schlager",
      "position": "GK",
      "club": "Red Bull Salzburg"
    },
    {
      "name": "Florian Wiegele",
      "position": "GK",
      "club": "Viktoria Plzen"
    },
    {
      "name": "Patrick Pentz",
      "position": "GK",
      "club": "Brondby"
    },
    {
      "name": "David Affengruber",
      "position": "DF",
      "club": "Elche"
    },
    {
      "name": "Kevin Danso",
      "position": "DF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Stefan Posch",
      "position": "DF",
      "club": "Mainz 05"
    },
    {
      "name": "David Alaba",
      "position": "DF",
      "club": "Real Madrid"
    },
    {
      "name": "Philipp Lienhart",
      "position": "DF",
      "club": "SC Freiburg"
    },
    {
      "name": "Phillipp Mwene",
      "position": "DF",
      "club": "Mainz 05"
    },
    {
      "name": "Alexander Prass",
      "position": "DF",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Marco Friedl",
      "position": "DF",
      "club": "Werder Bremen"
    },
    {
      "name": "Michael Svoboda",
      "position": "DF",
      "club": "Venezia"
    },
    {
      "name": "Xaver Schlager",
      "position": "MF",
      "club": "RB Leipzig"
    },
    {
      "name": "Nicolas Seiwald",
      "position": "MF",
      "club": "RB Leipzig"
    },
    {
      "name": "Marcel Sabitzer",
      "position": "MF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Florian Grillitsch",
      "position": "MF",
      "club": "Braga"
    },
    {
      "name": "Carney Chukwuemeka",
      "position": "MF",
      "club": "Borussia Dortmund"
    },
    {
      "name": "Romano Schmid",
      "position": "MF",
      "club": "Werder Bremen"
    },
    {
      "name": "Christoph Baumgartner",
      "position": "MF",
      "club": "RB Leipzig"
    },
    {
      "name": "Konrad Laimer",
      "position": "MF",
      "club": "Bayern Munich"
    },
    {
      "name": "Patrick Wimmer",
      "position": "MF",
      "club": "VfL Wolfsburg"
    },
    {
      "name": "Paul Wanner",
      "position": "MF",
      "club": "PSV Eindhoven"
    },
    {
      "name": "Alessandro Schopf",
      "position": "MF",
      "club": "Wolfsberger AC"
    },
    {
      "name": "Marko Arnautovic",
      "position": "FW",
      "club": "Red Star Belgrade"
    },
    {
      "name": "Michael Gregoritsch",
      "position": "FW",
      "club": "FC Augsburg"
    },
    {
      "name": "Sasa Kalajdzic",
      "position": "FW",
      "club": "LASK"
    }
  ],
  "jordan": [
    {
      "name": "Yazeed Abulaila",
      "position": "GK",
      "club": "Al-Hussein"
    },
    {
      "name": "Abdallah Al-Fakhouri",
      "position": "GK",
      "club": "Al-Wehdat"
    },
    {
      "name": "Abdel Rahman Al-Talalga",
      "position": "GK",
      "club": "Al-Faisaly"
    },
    {
      "name": "Abdallah Nasib",
      "position": "DF",
      "club": "Al-Zawraa"
    },
    {
      "name": "Yazan Al-Arab",
      "position": "DF",
      "club": "FC Seoul"
    },
    {
      "name": "Husam Abu Dahab",
      "position": "DF",
      "club": "Al-Faisaly"
    },
    {
      "name": "Mohammad Abualnadi",
      "position": "DF",
      "club": "Selangor"
    },
    {
      "name": "Yousef Abu Al-Jazar",
      "position": "DF",
      "club": "Al-Hussein"
    },
    {
      "name": "Salim Obaid",
      "position": "DF",
      "club": "Al-Hussein"
    },
    {
      "name": "Ahmad Assaf",
      "position": "DF",
      "club": "Al-Hussein"
    },
    {
      "name": "Noor Al-Rawabdeh",
      "position": "MF",
      "club": "Selangor"
    },
    {
      "name": "Ibrahim Sa'deh",
      "position": "MF",
      "club": "Al-Karma"
    },
    {
      "name": "Mohammad Abu Hashish",
      "position": "MF",
      "club": "Al-Karma"
    },
    {
      "name": "Nizar Al-Rashdan",
      "position": "MF",
      "club": "Qatar SC"
    },
    {
      "name": "Mohannad Abu Taha",
      "position": "MF",
      "club": "Al-Quwa Al-Jawiya"
    },
    {
      "name": "Amer Jamous",
      "position": "MF",
      "club": "Al-Zawraa"
    },
    {
      "name": "Mohammad Al-Dawoud",
      "position": "MF",
      "club": "Al-Wehdat"
    },
    {
      "name": "Yousef Qashi",
      "position": "MF",
      "club": "Al-Hussein"
    },
    {
      "name": "Mohammad Taha",
      "position": "MF",
      "club": "Al-Hussein"
    },
    {
      "name": "Musa Al-Taamari",
      "position": "FW",
      "club": "Rennes"
    },
    {
      "name": "Mahmoud Al-Mardi",
      "position": "FW",
      "club": "Al-Hussein"
    },
    {
      "name": "Baha' Faisal",
      "position": "FW",
      "club": "Al-Waab"
    },
    {
      "name": "Mohammad Abu Zrayq",
      "position": "FW",
      "club": "Raja Casablanca"
    },
    {
      "name": "Ibrahim Sabra",
      "position": "FW",
      "club": "Lokomotiva Zagreb"
    },
    {
      "name": "Odeh Al-Fakhouri",
      "position": "FW",
      "club": "Pyramids"
    },
    {
      "name": "Ali Azaizeh",
      "position": "FW",
      "club": "Al-Shabab"
    }
  ],
  "portugal": [
    {
      "name": "Diogo Costa",
      "position": "GK",
      "club": "Porto"
    },
    {
      "name": "Jose Sa",
      "position": "GK",
      "club": "Wolverhampton Wanderers"
    },
    {
      "name": "Rui Silva",
      "position": "GK",
      "club": "Sporting CP"
    },
    {
      "name": "Ricardo Velho",
      "position": "GK",
      "club": "Genclerbirligi"
    },
    {
      "name": "Ruben Dias",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Joao Cancelo",
      "position": "DF",
      "club": "Barcelona"
    },
    {
      "name": "Nelson Semedo",
      "position": "DF",
      "club": "Fenerbahce"
    },
    {
      "name": "Nuno Mendes",
      "position": "DF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Diogo Dalot",
      "position": "DF",
      "club": "Manchester United"
    },
    {
      "name": "Goncalo Inacio",
      "position": "DF",
      "club": "Sporting CP"
    },
    {
      "name": "Renato Veiga",
      "position": "DF",
      "club": "Villarreal"
    },
    {
      "name": "Tomas Araujo",
      "position": "DF",
      "club": "Benfica"
    },
    {
      "name": "Bernardo Silva",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Bruno Fernandes",
      "position": "MF",
      "club": "Manchester United"
    },
    {
      "name": "Ruben Neves",
      "position": "MF",
      "club": "Al-Hilal"
    },
    {
      "name": "Vitinha",
      "position": "MF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Joao Neves",
      "position": "MF",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Matheus Nunes",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Francisco Trincao",
      "position": "MF",
      "club": "Sporting CP"
    },
    {
      "name": "Samu Costa",
      "position": "MF",
      "club": "Mallorca"
    },
    {
      "name": "Cristiano Ronaldo",
      "position": "FW",
      "club": "Al-Nassr"
    },
    {
      "name": "Joao Felix",
      "position": "FW",
      "club": "Al-Nassr"
    },
    {
      "name": "Rafael Leao",
      "position": "FW",
      "club": "Milan"
    },
    {
      "name": "Goncalo Guedes",
      "position": "FW",
      "club": "Real Sociedad"
    },
    {
      "name": "Goncalo Ramos",
      "position": "FW",
      "club": "Paris Saint-Germain"
    },
    {
      "name": "Pedro Neto",
      "position": "FW",
      "club": "Chelsea"
    }
  ],
  "dr-congo": [
    {
      "name": "Lionel Mpasi",
      "position": "GK",
      "club": "Le Havre"
    },
    {
      "name": "Timothy Fayulu",
      "position": "GK",
      "club": "Noah"
    },
    {
      "name": "Matthieu Epolo",
      "position": "GK",
      "club": "Standard Liege"
    },
    {
      "name": "Chancel Mbemba",
      "position": "DF",
      "club": "Lille"
    },
    {
      "name": "Arthur Masuaku",
      "position": "DF",
      "club": "Lens"
    },
    {
      "name": "Gedeon Kalulu",
      "position": "DF",
      "club": "Aris Limassol"
    },
    {
      "name": "Joris Kayembe",
      "position": "DF",
      "club": "Genk"
    },
    {
      "name": "Dylan Batubinsika",
      "position": "DF",
      "club": "AEL"
    },
    {
      "name": "Axel Tuanzebe",
      "position": "DF",
      "club": "Burnley"
    },
    {
      "name": "Aaron Wan-Bissaka",
      "position": "DF",
      "club": "West Ham United"
    },
    {
      "name": "Rocky Bushiri",
      "position": "DF",
      "club": "Hibernian"
    },
    {
      "name": "Steve Kapuadi",
      "position": "DF",
      "club": "Widzew Lodz"
    },
    {
      "name": "Meschak Elia",
      "position": "MF",
      "club": "Alanyaspor"
    },
    {
      "name": "Samuel Moutoussamy",
      "position": "MF",
      "club": "Atromitos"
    },
    {
      "name": "Edo Kayembe",
      "position": "MF",
      "club": "Watford"
    },
    {
      "name": "Charles Pickel",
      "position": "MF",
      "club": "Espanyol"
    },
    {
      "name": "Gael Kakuta",
      "position": "MF",
      "club": "AEL"
    },
    {
      "name": "Noah Sadiki",
      "position": "MF",
      "club": "Sunderland"
    },
    {
      "name": "Nathanael Mbuku",
      "position": "MF",
      "club": "Montpellier"
    },
    {
      "name": "Ngal'ayel Mukau",
      "position": "MF",
      "club": "Lille"
    },
    {
      "name": "Brian Cipenga",
      "position": "MF",
      "club": "Castellon"
    },
    {
      "name": "Cedric Bakambu",
      "position": "FW",
      "club": "Real Betis"
    },
    {
      "name": "Theo Bongonda",
      "position": "FW",
      "club": "Spartak Moscow"
    },
    {
      "name": "Fiston Mayele",
      "position": "FW",
      "club": "Pyramids"
    },
    {
      "name": "Yoane Wissa",
      "position": "FW",
      "club": "Newcastle United"
    },
    {
      "name": "Simon Banza",
      "position": "FW",
      "club": "Al Jazira"
    }
  ],
  "uzbekistan": [
    {
      "name": "Utkir Yusupov",
      "position": "GK",
      "club": "Navbahor"
    },
    {
      "name": "Abduvohid Nematov",
      "position": "GK",
      "club": "Nasaf"
    },
    {
      "name": "Botirali Ergashev",
      "position": "GK",
      "club": "Neftchi"
    },
    {
      "name": "Abdukodir Khusanov",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Khojiakbar Alijonov",
      "position": "DF",
      "club": "Pakhtakor"
    },
    {
      "name": "Farrukh Sayfiev",
      "position": "DF",
      "club": "Neftchi"
    },
    {
      "name": "Rustam Ashurmatov",
      "position": "DF",
      "club": "Esteghlal"
    },
    {
      "name": "Sherzod Nasrullaev",
      "position": "DF",
      "club": "Pakhtakor"
    },
    {
      "name": "Umar Eshmurodov",
      "position": "DF",
      "club": "Nasaf"
    },
    {
      "name": "Bekhruz Karimov",
      "position": "DF",
      "club": "Surkhon"
    },
    {
      "name": "Mukhammadrasul Abdumazhidov",
      "position": "DF",
      "club": "Pakhtakor"
    },
    {
      "name": "Jakhongir Urozov",
      "position": "DF",
      "club": "Dinamo"
    },
    {
      "name": "Mukhammadkodir Khamraliev",
      "position": "DF",
      "club": "Pakhtakor"
    },
    {
      "name": "Akmal Mozgovoy",
      "position": "MF",
      "club": "Baniyas"
    },
    {
      "name": "Otabek Shukurov",
      "position": "MF",
      "club": "Baniyas"
    },
    {
      "name": "Jamshid Iskanderov",
      "position": "MF",
      "club": "Neftchi"
    },
    {
      "name": "Odiljon Hamrobekov",
      "position": "MF",
      "club": "Tractor"
    },
    {
      "name": "Azizjon Ganiev",
      "position": "MF",
      "club": "Al Bataeh"
    },
    {
      "name": "Oston Urunov",
      "position": "MF",
      "club": "Persepolis"
    },
    {
      "name": "Dostonbek Khamdamov",
      "position": "MF",
      "club": "Pakhtakor"
    },
    {
      "name": "Alisher Odilov",
      "position": "MF",
      "club": "Neftchi"
    },
    {
      "name": "Ibrokhim Ibragimov",
      "position": "MF",
      "club": "Pakhtakor"
    },
    {
      "name": "Umarali Rakhmonaliev",
      "position": "MF",
      "club": "Sabah"
    },
    {
      "name": "Eldor Shomurodov",
      "position": "FW",
      "club": "Istanbul Basaksehir"
    },
    {
      "name": "Igor Sergeev",
      "position": "FW",
      "club": "Persepolis"
    },
    {
      "name": "Sherzod Temirov",
      "position": "FW",
      "club": "Erbil"
    }
  ],
  "colombia": [
    {
      "name": "Camilo Vargas",
      "position": "GK",
      "club": "Atlas"
    },
    {
      "name": "Alvaro Montero",
      "position": "GK",
      "club": "Velez Sarsfield"
    },
    {
      "name": "David Ospina",
      "position": "GK",
      "club": "Atletico Nacional"
    },
    {
      "name": "Davinson Sanchez",
      "position": "DF",
      "club": "Galatasaray"
    },
    {
      "name": "Jhon Lucumi",
      "position": "DF",
      "club": "Bologna"
    },
    {
      "name": "Yerry Mina",
      "position": "DF",
      "club": "Cagliari"
    },
    {
      "name": "Willer Ditta",
      "position": "DF",
      "club": "Cruz Azul"
    },
    {
      "name": "Daniel Munoz",
      "position": "DF",
      "club": "Crystal Palace"
    },
    {
      "name": "Santiago Arias",
      "position": "DF",
      "club": "Independiente"
    },
    {
      "name": "Johan Mojica",
      "position": "DF",
      "club": "Mallorca"
    },
    {
      "name": "Deiver Machado",
      "position": "DF",
      "club": "Nantes"
    },
    {
      "name": "Richard Rios",
      "position": "MF",
      "club": "Benfica"
    },
    {
      "name": "Jefferson Lerma",
      "position": "MF",
      "club": "Crystal Palace"
    },
    {
      "name": "Kevin Castano",
      "position": "MF",
      "club": "River Plate"
    },
    {
      "name": "Juan Camilo Portilla",
      "position": "MF",
      "club": "Athletico Paranaense"
    },
    {
      "name": "Gustavo Puerta",
      "position": "MF",
      "club": "Racing de Santander"
    },
    {
      "name": "Jhon Arias",
      "position": "MF",
      "club": "Palmeiras"
    },
    {
      "name": "Jorge Carrascal",
      "position": "MF",
      "club": "Flamengo"
    },
    {
      "name": "Juan Fernando Quintero",
      "position": "MF",
      "club": "River Plate"
    },
    {
      "name": "James Rodriguez",
      "position": "MF",
      "club": "Minnesota United"
    },
    {
      "name": "Jaminton Campaz",
      "position": "MF",
      "club": "Rosario Central"
    },
    {
      "name": "Juan Camilo Hernandez",
      "position": "FW",
      "club": "Real Betis"
    },
    {
      "name": "Luis Diaz",
      "position": "FW",
      "club": "Bayern Munich"
    },
    {
      "name": "Luis Suarez",
      "position": "FW",
      "club": "Sporting"
    },
    {
      "name": "Carlos Andres Gomez",
      "position": "FW",
      "club": "Vasco da Gama"
    },
    {
      "name": "Jhon Cordoba",
      "position": "FW",
      "club": "Krasnodar"
    }
  ],
  "england": [
    {
      "name": "Jordan Pickford",
      "position": "GK",
      "club": "Everton"
    },
    {
      "name": "Dean Henderson",
      "position": "GK",
      "club": "Crystal Palace"
    },
    {
      "name": "James Trafford",
      "position": "GK",
      "club": "Manchester City"
    },
    {
      "name": "Ezri Konsa",
      "position": "DF",
      "club": "Aston Villa"
    },
    {
      "name": "Nico O'Reilly",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "John Stones",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Marc Guehi",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Tino Livramento",
      "position": "DF",
      "club": "Newcastle United"
    },
    {
      "name": "Dan Burn",
      "position": "DF",
      "club": "Newcastle United"
    },
    {
      "name": "Reece James",
      "position": "DF",
      "club": "Chelsea"
    },
    {
      "name": "Djed Spence",
      "position": "DF",
      "club": "Tottenham Hotspur"
    },
    {
      "name": "Jarell Quansah",
      "position": "DF",
      "club": "Bayer Leverkusen"
    },
    {
      "name": "Declan Rice",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Elliot Anderson",
      "position": "MF",
      "club": "Nottingham Forest"
    },
    {
      "name": "Jude Bellingham",
      "position": "MF",
      "club": "Real Madrid"
    },
    {
      "name": "Jordan Henderson",
      "position": "MF",
      "club": "Brentford"
    },
    {
      "name": "Kobbie Mainoo",
      "position": "MF",
      "club": "Manchester United"
    },
    {
      "name": "Morgan Rogers",
      "position": "MF",
      "club": "Aston Villa"
    },
    {
      "name": "Eberechi Eze",
      "position": "MF",
      "club": "Arsenal"
    },
    {
      "name": "Bukayo Saka",
      "position": "FW",
      "club": "Arsenal"
    },
    {
      "name": "Harry Kane",
      "position": "FW",
      "club": "Bayern Munich"
    },
    {
      "name": "Marcus Rashford",
      "position": "FW",
      "club": "Barcelona"
    },
    {
      "name": "Anthony Gordon",
      "position": "FW",
      "club": "Newcastle United"
    },
    {
      "name": "Ollie Watkins",
      "position": "FW",
      "club": "Aston Villa"
    },
    {
      "name": "Noni Madueke",
      "position": "FW",
      "club": "Arsenal"
    },
    {
      "name": "Ivan Toney",
      "position": "FW",
      "club": "Al-Ahli"
    }
  ],
  "croatia": [
    {
      "name": "Dominik Livakovic",
      "position": "GK",
      "club": "Dinamo Zagreb"
    },
    {
      "name": "Dominik Kotarski",
      "position": "GK",
      "club": "Copenhagen"
    },
    {
      "name": "Ivor Pandur",
      "position": "GK",
      "club": "Hull City"
    },
    {
      "name": "Josko Gvardiol",
      "position": "DF",
      "club": "Manchester City"
    },
    {
      "name": "Duje Caleta-Car",
      "position": "DF",
      "club": "Real Sociedad"
    },
    {
      "name": "Josip Sutalo",
      "position": "DF",
      "club": "Ajax"
    },
    {
      "name": "Josip Stanisic",
      "position": "DF",
      "club": "Bayern Munich"
    },
    {
      "name": "Marin Pongracic",
      "position": "DF",
      "club": "Fiorentina"
    },
    {
      "name": "Martin Erlic",
      "position": "DF",
      "club": "Midtjylland"
    },
    {
      "name": "Luka Vuskovic",
      "position": "DF",
      "club": "Hamburger SV"
    },
    {
      "name": "Luka Modric",
      "position": "MF",
      "club": "Milan"
    },
    {
      "name": "Mateo Kovacic",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Mario Pasalic",
      "position": "MF",
      "club": "Atalanta"
    },
    {
      "name": "Nikola Vlasic",
      "position": "MF",
      "club": "Torino"
    },
    {
      "name": "Luka Sucic",
      "position": "MF",
      "club": "Real Sociedad"
    },
    {
      "name": "Martin Baturina",
      "position": "MF",
      "club": "Como"
    },
    {
      "name": "Kristijan Jakic",
      "position": "MF",
      "club": "FC Augsburg"
    },
    {
      "name": "Petar Sucic",
      "position": "MF",
      "club": "Inter Milan"
    },
    {
      "name": "Nikola Moro",
      "position": "MF",
      "club": "Bologna"
    },
    {
      "name": "Toni Fruk",
      "position": "MF",
      "club": "Rijeka"
    },
    {
      "name": "Ivan Perisic",
      "position": "FW",
      "club": "PSV Eindhoven"
    },
    {
      "name": "Andrej Kramaric",
      "position": "FW",
      "club": "TSG Hoffenheim"
    },
    {
      "name": "Ante Budimir",
      "position": "FW",
      "club": "Osasuna"
    },
    {
      "name": "Marco Pasalic",
      "position": "FW",
      "club": "Orlando City"
    },
    {
      "name": "Petar Musa",
      "position": "FW",
      "club": "FC Dallas"
    },
    {
      "name": "Igor Matanovic",
      "position": "FW",
      "club": "SC Freiburg"
    }
  ],
  "ghana": [
    {
      "name": "Lawrence Ati-Zigi",
      "position": "GK",
      "club": "St. Gallen"
    },
    {
      "name": "Joseph Anang",
      "position": "GK",
      "club": "St Patrick's Athletic"
    },
    {
      "name": "Benjamin Asare",
      "position": "GK",
      "club": "Hearts of Oak"
    },
    {
      "name": "Alidu Seidu",
      "position": "DF",
      "club": "Rennes"
    },
    {
      "name": "Jonas Adjetey",
      "position": "DF",
      "club": "VfL Wolfsburg"
    },
    {
      "name": "Abdul Mumin",
      "position": "DF",
      "club": "Rayo Vallecano"
    },
    {
      "name": "Gideon Mensah",
      "position": "DF",
      "club": "Auxerre"
    },
    {
      "name": "Abdul Rahman Baba",
      "position": "DF",
      "club": "PAOK"
    },
    {
      "name": "Jerome Opoku",
      "position": "DF",
      "club": "Istanbul Basaksehir"
    },
    {
      "name": "Kojo Peprah Oppong",
      "position": "DF",
      "club": "Nice"
    },
    {
      "name": "Derrick Luckassen",
      "position": "DF",
      "club": "Pafos"
    },
    {
      "name": "Marvin Senaya",
      "position": "DF",
      "club": "Auxerre"
    },
    {
      "name": "Caleb Yirenkyi",
      "position": "MF",
      "club": "Nordsjaelland"
    },
    {
      "name": "Thomas Partey",
      "position": "MF",
      "club": "Villarreal"
    },
    {
      "name": "Abdul Fatawu",
      "position": "MF",
      "club": "Leicester City"
    },
    {
      "name": "Kwasi Sibo",
      "position": "MF",
      "club": "Oviedo"
    },
    {
      "name": "Antoine Semenyo",
      "position": "MF",
      "club": "Manchester City"
    },
    {
      "name": "Elisha Owusu",
      "position": "MF",
      "club": "Auxerre"
    },
    {
      "name": "Augustine Boakye",
      "position": "MF",
      "club": "Saint-Etienne"
    },
    {
      "name": "Kamaldeen Sulemana",
      "position": "MF",
      "club": "Atalanta"
    },
    {
      "name": "Jordan Ayew",
      "position": "FW",
      "club": "Leicester City"
    },
    {
      "name": "Brandon Thomas-Asante",
      "position": "FW",
      "club": "Coventry City"
    },
    {
      "name": "Christopher Bonsu Baah",
      "position": "FW",
      "club": "Al-Qadsiah"
    },
    {
      "name": "Inaki Williams",
      "position": "FW",
      "club": "Athletic Bilbao"
    },
    {
      "name": "Ernest Nuamah",
      "position": "FW",
      "club": "Lyon"
    },
    {
      "name": "Prince Kwabena Adu",
      "position": "FW",
      "club": "Viktoria Plzen"
    }
  ],
  "panama": [
    {
      "name": "Luis Mej?a",
      "position": "GK",
      "club": "Nacional"
    },
    {
      "name": "C?sar Samudio",
      "position": "GK",
      "club": "Marath?n"
    },
    {
      "name": "Orlando Mosquera",
      "position": "GK",
      "club": "Al-Fayha"
    },
    {
      "name": "C?sar Blackman",
      "position": "DF",
      "club": "Slovan Bratislava"
    },
    {
      "name": "Jos? C?rdoba",
      "position": "DF",
      "club": "Norwich City"
    },
    {
      "name": "Edgardo Fari?a",
      "position": "DF",
      "club": "FC Pari Nizhniy Novgorod"
    },
    {
      "name": "Roderick Miller",
      "position": "DF",
      "club": "Turan Tovuz"
    },
    {
      "name": "Fidel Escobar",
      "position": "DF",
      "club": "Saprissa"
    },
    {
      "name": "Jiovany Ramos",
      "position": "DF",
      "club": "Puerto Cabello"
    },
    {
      "name": "Eric Davis",
      "position": "DF",
      "club": "Plaza Amador"
    },
    {
      "name": "Andr?s Andrade",
      "position": "DF",
      "club": "LASK"
    },
    {
      "name": "Jorge Guti?rrez",
      "position": "DF",
      "club": "Deportivo La Guaira"
    },
    {
      "name": "Amir Murillo",
      "position": "DF",
      "club": "Beşiktaş"
    },
    {
      "name": "Cristian Mart?nez",
      "position": "MF",
      "club": "Ironi Kiryat Shmona"
    },
    {
      "name": "Jos? Luis Rodr?guez",
      "position": "MF",
      "club": "Ju?rez"
    },
    {
      "name": "Adalberto Carrasquilla",
      "position": "MF",
      "club": "UNAM"
    },
    {
      "name": "Yoel B?rcenas",
      "position": "MF",
      "club": "Mazatl?n"
    },
    {
      "name": "Carlos Harvey",
      "position": "MF",
      "club": "Minnesota United"
    },
    {
      "name": "An?bal Godoy",
      "position": "MF",
      "club": "San Diego"
    },
    {
      "name": "C?sar Yanis",
      "position": "MF",
      "club": "Cobresal"
    },
    {
      "name": "Azar?as Londo?o",
      "position": "MF",
      "club": "Universidad Cat?lica de Chile"
    },
    {
      "name": "Alberto Quintero",
      "position": "MF",
      "club": "CD Plaza Amador"
    },
    {
      "name": "Tom?s Rodr?guez",
      "position": "FW",
      "club": "Deportivo Saprissa"
    },
    {
      "name": "Ismael D?az",
      "position": "FW",
      "club": "Le?n"
    },
    {
      "name": "Jos? Fajardo",
      "position": "FW",
      "club": "Universidad Cat?lica"
    },
    {
      "name": "Cecilio Waterman",
      "position": "FW",
      "club": "Universidad de Concepci?n"
    }
  ]
};
