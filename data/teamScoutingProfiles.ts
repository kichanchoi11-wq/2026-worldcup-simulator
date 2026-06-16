import type { SourceMeta } from "@/types/football";
import type { PlayerPosition } from "@/types/team";

export type ScoutPlayer = {
  name: string;
  position: PlayerPosition;
  club: string | null;
  role: "핵심 선수" | "주목 선수" | "주전 후보";
  note: string;
};

export type TeamScoutingProfile = {
  teamId: string;
  coachName: string | null;
  coachNationality: string | null;
  coachAppointedDate?: string | null;
  confederation: string;
  powerIndex: string;
  recentAchievements: string[];
  recentFormation: string;
  expectedFormation: string;
  tacticalKeywords: string[];
  players: ScoutPlayer[];
  strengths: string[];
  weaknesses: string[];
  squadSourcePath: string;
  sources: SourceMeta[];
  lastUpdated: string;
};

type Seed = Omit<TeamScoutingProfile, "sources" | "lastUpdated"> & {
  extraSources?: SourceMeta[];
};

const lastChecked = "2026-06-16";
const fourFourTwoBase = "https://www.fourfourtwo.com/team";

const fifaScheduleSource: SourceMeta = {
  sourceName: "FIFA World Cup 26 match schedule",
  sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule",
  lastUpdated: lastChecked,
  isOfficial: true,
  confidence: "공식 확인",
  sourceLevel: "공식 확인",
  sourceNotes: "조 편성과 경기 일정 확인용 공식 출처"
};

const squadReferenceSource: SourceMeta = {
  sourceName: "2026 FIFA World Cup squads reference",
  sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads",
  lastUpdated: lastChecked,
  isOfficial: false,
  confidence: "분석 참고",
  sourceLevel: "참고 자료",
  sourceNotes: "감독 및 최종 명단 교차 확인용 참고 자료"
};

const koreaManagerReferenceSource: SourceMeta = {
  sourceName: "Current national team managers reference",
  sourceUrl: "https://en.wikipedia.org/wiki/List_of_current_national_association_football_team_managers",
  lastUpdated: lastChecked,
  isOfficial: false,
  confidence: "신뢰도 높음",
  sourceLevel: "신뢰도 높음",
  sourceNotes: "대한민국 현 감독 Hong Myung-bo와 2024-07-07 Yonhap 선임 보도, FIFA 팀 프로필 교차 확인용 참고 출처"
};

const koreaCzechiaMatchSource: SourceMeta = {
  sourceName: "The Guardian South Korea 2-1 Czechia live report",
  sourceUrl: "https://www.theguardian.com/football/live/2026/jun/12/fifa-world-cup-2026-live-south-korea-v-czechia-updates-kor-vs-cze-group-a-match-score-latest",
  lastUpdated: "2026-06-12",
  isOfficial: false,
  confidence: "신뢰도 높음",
  sourceLevel: "신뢰도 높음",
  sourceNotes: "2026-06-12 체코전 선발 3-4-3, 득점 흐름, 카드 없음, 전술 메모 확인용"
};

function squadGuideSource(path: string): SourceMeta {
  const sourceUrl = path.startsWith("https://") ? path : `${fourFourTwoBase}/${path}`;

  return {
    sourceName: "FourFourTwo World Cup 2026 squad guide",
    sourceUrl,
    lastUpdated: lastChecked,
    isOfficial: false,
    confidence: "신뢰도 높음",
    sourceLevel: "신뢰도 높음",
    sourceNotes: "최종/최근 명단, 감독, 스타 플레이어, 최근 결과와 전술 무드 확인용"
  };
}

function player(name: string, position: PlayerPosition, club: string | null, role: ScoutPlayer["role"], note: string): ScoutPlayer {
  return { name, position, club, role, note };
}

function makeProfile({ extraSources = [], ...seed }: Seed): TeamScoutingProfile {
  return {
    ...seed,
    sources: [fifaScheduleSource, squadGuideSource(seed.squadSourcePath), squadReferenceSource, ...extraSources],
    lastUpdated: lastChecked
  };
}

const seeds: Seed[] = [
  {
    teamId: "mexico",
    coachName: "Javier Aguirre",
    coachNationality: "Mexico",
    confederation: "CONCACAF",
    powerIndex: "홈 이점이 큰 중상위권",
    recentAchievements: ["2025 CONCACAF Nations League 우승", "2025 Gold Cup 우승", "월드컵 공동 개최국"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["중원 압박", "측면 크로스", "전환 속도", "노련한 경기 운영"],
    players: [
      player("Guillermo Ochoa", "GK", "AEL Limassol", "핵심 선수", "큰 경기 경험과 박스 안 선방"),
      player("Edson Alvarez", "MF", "Fenerbahce", "핵심 선수", "수비형 미드필더의 볼 회수와 커버"),
      player("Santiago Gimenez", "FW", "Milan", "핵심 선수", "박스 안 마무리와 전방 압박"),
      player("Johan Vasquez", "DF", "Genoa", "주전 후보", "왼발 센터백 빌드업"),
      player("Alexis Vega", "FW", "Toluca", "주목 선수", "개인 돌파와 세트피스 킥")
    ],
    strengths: ["홈 관중과 고지대 적응", "경험 많은 골키퍼와 수비형 미드필더", "측면에서 박스로 넣는 패턴"],
    weaknesses: ["강한 전방 압박을 받을 때 후방 빌드업이 흔들릴 수 있음", "득점 의존도가 특정 공격수에게 몰릴 수 있음"],
    squadSourcePath: "mexico-world-cup-2026-squad"
  },
  {
    teamId: "south-africa",
    coachName: "Hugo Broos",
    coachNationality: "Belgium",
    confederation: "CAF",
    powerIndex: "조별리그 다크호스",
    recentAchievements: ["CAF 예선 조 1위로 본선 진출", "2023 AFCON 3위"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["중원 활동량", "역습", "세컨드볼", "낮은 블록"],
    players: [
      player("Ronwen Williams", "GK", "Mamelodi Sundowns", "핵심 선수", "페널티와 근거리 선방 강점"),
      player("Teboho Mokoena", "MF", "Mamelodi Sundowns", "핵심 선수", "중거리 슈팅과 전진 패스"),
      player("Themba Zwane", "MF", "Mamelodi Sundowns", "핵심 선수", "하프스페이스 연결"),
      player("Percy Tau", "FW", "Qatar SC", "주목 선수", "왼발 돌파와 마무리"),
      player("Evidence Makgopa", "FW", "Orlando Pirates", "주전 후보", "전방 높이와 압박")
    ],
    strengths: ["선수 간 호흡이 좋은 국내파 중심 구조", "중원 세컨드볼 회수", "골키퍼 안정감"],
    weaknesses: ["라인을 올렸을 때 뒷공간 관리", "상대가 측면을 빠르게 전환하면 풀백 보호가 필요"],
    squadSourcePath: "south-africa-world-cup-2026-squad"
  },
  {
    teamId: "korea-republic",
    coachName: "Hong Myung-bo",
    coachNationality: "South Korea",
    coachAppointedDate: "2024-07-08",
    confederation: "AFC",
    powerIndex: "16강 경쟁권",
    recentAchievements: ["2026 월드컵 체코전 2-1 승리", "아시아 최종예선 무패 통과", "2022 월드컵 16강"],
    recentFormation: "3-4-3",
    expectedFormation: "3-4-3",
    tacticalKeywords: ["3-4-3 윙백 운용", "손흥민 전환", "김민재 수비 리더십", "이강인 창의성", "황인범 빌드업"],
    players: [
      player("Son Heung-min", "FW", "Los Angeles FC", "핵심 선수", "역습 마무리와 왼쪽 하프스페이스 침투"),
      player("Kim Min-jae", "DF", "Bayern Munich", "핵심 선수", "수비 라인 리더와 전진 수비"),
      player("Lee Kang-in", "MF", "Paris Saint-Germain", "핵심 선수", "세트피스와 좁은 공간 패스"),
      player("Hwang In-beom", "MF", "Feyenoord", "핵심 선수", "전개 템포와 중원 압박 회피"),
      player("Hwang Hee-chan", "MF", "Wolverhampton Wanderers", "주목 선수", "전방 압박과 박스 침투")
    ],
    strengths: ["3백 전환 시 김민재 중심의 수비 안정", "황인범의 전개와 2선 침투", "손흥민·이강인의 순간 창의성"],
    weaknesses: ["윙백 뒤 공간 노출", "상대 세트피스와 롱스로인 대응", "중원 압박이 풀릴 때 수비 간격 확대"],
    squadSourcePath: "south-korea-world-cup-2026-squad",
    extraSources: [koreaManagerReferenceSource, koreaCzechiaMatchSource]
  },
  {
    teamId: "czechia",
    coachName: "Miroslav Koubek",
    coachNationality: "Czechia",
    confederation: "UEFA",
    powerIndex: "피지컬 기반 중위권",
    recentAchievements: ["UEFA 예선 통과", "20년 만의 월드컵 복귀"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["제공권", "직선 전개", "세트피스", "중원 피지컬"],
    players: [
      player("Tomas Soucek", "MF", "West Ham United", "핵심 선수", "박스 침투와 제공권"),
      player("Patrik Schick", "FW", "Bayer Leverkusen", "핵심 선수", "왼발 마무리"),
      player("Adam Hlozek", "FW", "Hoffenheim", "주목 선수", "2선 침투와 연계"),
      player("Ladislav Krejci", "DF", "Girona", "주전 후보", "왼발 수비 전개"),
      player("Matej Kovar", "GK", "Bayer Leverkusen", "주전 후보", "후방 빌드업 관여")
    ],
    strengths: ["세트피스와 박스 안 높이", "중원 몸싸움", "직선적인 전개"],
    weaknesses: ["빠른 측면 전환에 수비 라인이 벌어질 수 있음", "볼 소유가 길어질 때 창의성 부족"],
    squadSourcePath: "czech-republic-world-cup-2026-squad"
  },
  {
    teamId: "canada",
    coachName: "Jesse Marsch",
    coachNationality: "United States",
    confederation: "CONCACAF",
    powerIndex: "스피드 기반 중상위권",
    recentAchievements: ["월드컵 공동 개최국", "2024 Copa America 4강"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["전방 압박", "측면 속도", "직선 역습", "강한 전환"],
    players: [
      player("Alphonso Davies", "DF", "Bayern Munich", "핵심 선수", "왼쪽 측면 전진과 회복 속도"),
      player("Jonathan David", "FW", "Juventus", "핵심 선수", "전방 압박과 결정력"),
      player("Tajon Buchanan", "MF", "Villarreal", "주목 선수", "측면 1대1 돌파"),
      player("Stephen Eustaquio", "MF", "Porto", "핵심 선수", "중원 배급과 세트피스"),
      player("Ismael Kone", "MF", "Sassuolo", "주전 후보", "전진 운반")
    ],
    strengths: ["측면 속도", "전방 압박 후 빠른 슈팅", "홈 대륙 적응"],
    weaknesses: ["압박이 풀리면 수비 간격이 커질 수 있음", "센터백 뒷공간 관리"],
    squadSourcePath: "canada-world-cup-2026-squad"
  },
  {
    teamId: "bosnia-and-herzegovina",
    coachName: "Sergej Barbarez",
    coachNationality: "Bosnia and Herzegovina",
    confederation: "UEFA",
    powerIndex: "경험과 피지컬의 중위권",
    recentAchievements: ["UEFA 예선 통과", "2014 이후 월드컵 복귀"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["장신 공격수", "세트피스", "중원 전진 패스", "블록 수비"],
    players: [
      player("Edin Dzeko", "FW", "Fenerbahce", "핵심 선수", "타깃 플레이와 연계"),
      player("Ermedin Demirovic", "FW", "Stuttgart", "핵심 선수", "압박과 박스 침투"),
      player("Amar Dedic", "DF", "Marseille", "주목 선수", "오른쪽 전진성"),
      player("Benjamin Tahirovic", "MF", "Brondby", "주전 후보", "중원 볼 운반"),
      player("Nikola Vasilj", "GK", "St. Pauli", "주전 후보", "골문 안정감")
    ],
    strengths: ["전방 타깃과 세트피스", "피지컬 경합", "경험 많은 공격진"],
    weaknesses: ["라인 간격이 벌어질 때 속도 대응", "전방 자원 의존도"],
    squadSourcePath: "bosnia-world-cup-2026-squad"
  },
  {
    teamId: "qatar",
    coachName: "Julen Lopetegui",
    coachNationality: "Spain",
    confederation: "AFC",
    powerIndex: "조직력 기반 도전자",
    recentAchievements: ["AFC 아시안컵 우승 경험", "AFC 예선 통과"],
    recentFormation: "3-5-2",
    expectedFormation: "3-5-2",
    tacticalKeywords: ["3백 빌드업", "전방 투톱", "중원 밀집", "역습"],
    players: [
      player("Akram Afif", "FW", "Al Sadd", "핵심 선수", "창의적인 최종 패스와 득점"),
      player("Almoez Ali", "FW", "Al Duhail", "핵심 선수", "박스 안 움직임"),
      player("Hassan Al-Haydos", "MF", "Al Sadd", "주목 선수", "경험과 세트피스"),
      player("Boualem Khoukhi", "DF", "Al Sadd", "주전 후보", "후방 전개"),
      player("Lucas Mendes", "DF", "Al Wakrah", "주전 후보", "수비 리더십")
    ],
    strengths: ["오래 맞춘 공격 조합", "3백 안정감", "역습 첫 패스"],
    weaknesses: ["강한 압박을 받을 때 탈압박", "측면 뒷공간"],
    squadSourcePath: "qatar-world-cup-2026-squad"
  },
  {
    teamId: "switzerland",
    coachName: "Murat Yakin",
    coachNationality: "Switzerland",
    confederation: "UEFA",
    powerIndex: "토너먼트 경험이 풍부한 상위권 견제팀",
    recentAchievements: ["유로 2024 8강", "최근 월드컵 연속 본선"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["3백 안정감", "중원 컨트롤", "측면 윙백", "세트피스"],
    players: [
      player("Granit Xhaka", "MF", "Bayer Leverkusen", "핵심 선수", "경기 조율과 전진 패스"),
      player("Manuel Akanji", "DF", "Manchester City", "핵심 선수", "후방 빌드업"),
      player("Breel Embolo", "FW", "Monaco", "핵심 선수", "전방 버티기와 침투"),
      player("Ruben Vargas", "MF", "Sevilla", "주목 선수", "측면 가속"),
      player("Gregor Kobel", "GK", "Borussia Dortmund", "주전 후보", "박스 안 선방")
    ],
    strengths: ["전술 유연성", "경험 많은 중원", "세트피스 수비"],
    weaknesses: ["수비 라인을 끌어올렸을 때 뒷공간", "전방 결정력 기복"],
    squadSourcePath: "switzerland-world-cup-2026-squad"
  },
  {
    teamId: "brazil",
    coachName: "Carlo Ancelotti",
    coachNationality: "Italy",
    confederation: "CONMEBOL",
    powerIndex: "우승 후보권",
    recentAchievements: ["월드컵 5회 우승", "CONMEBOL 예선 통과"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["개인 돌파", "중원 균형", "측면 공격", "박스 압박"],
    players: [
      player("Alisson", "GK", "Liverpool", "핵심 선수", "후방 안정감"),
      player("Marquinhos", "DF", "Paris Saint-Germain", "핵심 선수", "수비 리더십"),
      player("Casemiro", "MF", "Manchester United", "핵심 선수", "중원 보호"),
      player("Vinicius Junior", "FW", "Real Madrid", "핵심 선수", "왼쪽 돌파와 마무리"),
      player("Raphinha", "FW", "Barcelona", "주목 선수", "오른쪽 컷인과 압박")
    ],
    strengths: ["측면 1대1 파괴력", "경험 많은 수비축", "다양한 공격 카드"],
    weaknesses: ["강한 압박 속 중원 연결이 끊길 때", "풀백 뒤 공간"],
    squadSourcePath: "brazil-world-cup-2026-squad"
  },
  {
    teamId: "morocco",
    coachName: "Mohamed Ouahbi",
    coachNationality: "Morocco",
    confederation: "CAF",
    powerIndex: "상위권 다크호스",
    recentAchievements: ["2022 월드컵 4위", "CAF 예선 통과"],
    recentFormation: "4-1-4-1",
    expectedFormation: "4-1-4-1",
    tacticalKeywords: ["낮은 블록", "빠른 측면 전환", "강한 풀백", "세트피스"],
    players: [
      player("Achraf Hakimi", "DF", "Paris Saint-Germain", "핵심 선수", "오른쪽 전진과 세트피스"),
      player("Yassine Bounou", "GK", "Al Hilal", "핵심 선수", "큰 경기 선방"),
      player("Sofyan Amrabat", "MF", "Fenerbahce", "핵심 선수", "중원 압박과 보호"),
      player("Brahim Diaz", "MF", "Real Madrid", "주목 선수", "하프스페이스 창의성"),
      player("Youssef En-Nesyri", "FW", "Fenerbahce", "핵심 선수", "제공권과 박스 침투")
    ],
    strengths: ["측면 전환 속도", "수비 블록 응집력", "큰 경기 경험"],
    weaknesses: ["상대가 먼저 득점하면 공격 전개가 단조로워질 수 있음", "중앙 창의성 의존"],
    squadSourcePath: "morocco-world-cup-2026-squad"
  },
  {
    teamId: "haiti",
    coachName: "Sebastien Migne",
    coachNationality: "France",
    confederation: "CONCACAF",
    powerIndex: "역습형 도전자",
    recentAchievements: ["CONCACAF 예선 통과", "1974 이후 월드컵 복귀"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["직선 역습", "전방 피지컬", "중원 활동량", "낮은 블록"],
    players: [
      player("Duckens Nazon", "FW", "Kayserispor", "핵심 선수", "전방 득점원"),
      player("Frantzdy Pierrot", "FW", "AEK Athens", "핵심 선수", "피지컬과 박스 침투"),
      player("Danley Jean Jacques", "MF", "Philadelphia Union", "주목 선수", "중원 에너지"),
      player("Johny Placide", "GK", "Bastia", "주전 후보", "경험 많은 골키퍼"),
      player("Ricardo Ade", "DF", "LDU Quito", "주전 후보", "수비 경합")
    ],
    strengths: ["전방 피지컬", "역습 첫 패스", "활동량"],
    weaknesses: ["장시간 수비 시 집중력", "세트피스 수비"],
    squadSourcePath: "haiti-world-cup-2026-squad"
  },
  {
    teamId: "scotland",
    coachName: "Steve Clarke",
    coachNationality: "Scotland",
    confederation: "UEFA",
    powerIndex: "조직력 기반 중상위권",
    recentAchievements: ["UEFA 예선 통과", "유로 본선 연속 진출 경험"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["3백 블록", "측면 크로스", "중원 압박", "세트피스"],
    players: [
      player("Andrew Robertson", "DF", "Liverpool", "핵심 선수", "왼쪽 크로스와 리더십"),
      player("Scott McTominay", "MF", "Napoli", "핵심 선수", "박스 침투 득점"),
      player("John McGinn", "MF", "Aston Villa", "핵심 선수", "압박과 전진 운반"),
      player("Billy Gilmour", "MF", "Napoli", "주목 선수", "패스 연결"),
      player("Che Adams", "FW", "Torino", "주전 후보", "전방 연계")
    ],
    strengths: ["중원 몸싸움", "좌측 전개", "세트피스"],
    weaknesses: ["빠른 뒷공간 수비", "점유가 길어질 때 찬스 품질"],
    squadSourcePath: "scotland-world-cup-2026-squad"
  },
  {
    teamId: "united-states",
    coachName: "Mauricio Pochettino",
    coachNationality: "Argentina",
    confederation: "CONCACAF",
    powerIndex: "홈 이점과 압박을 가진 상위권 도전자",
    recentAchievements: ["월드컵 공동 개최국", "CONCACAF 주요 대회 우승 경험"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["전방 압박", "운동량", "측면 속도", "세트피스"],
    players: [
      player("Christian Pulisic", "FW", "Milan", "핵심 선수", "왼쪽 돌파와 마무리"),
      player("Antonee Robinson", "DF", "Fulham", "핵심 선수", "왼쪽 전진과 크로스"),
      player("Weston McKennie", "MF", "Juventus", "핵심 선수", "박스 침투와 활동량"),
      player("Tyler Adams", "MF", "Bournemouth", "주전 후보", "수비형 미드필더 보호"),
      player("Folarin Balogun", "FW", "Monaco", "주목 선수", "뒷공간 침투")
    ],
    strengths: ["운동량과 압박", "측면 속도", "홈 관중"],
    weaknesses: ["밀집 수비 공략", "중앙 수비 조합 안정성"],
    squadSourcePath: "united-states-world-cup-2026-squad"
  },
  {
    teamId: "paraguay",
    coachName: "Gustavo Alfaro",
    coachNationality: "Argentina",
    confederation: "CONMEBOL",
    powerIndex: "수비 조직력 기반 도전자",
    recentAchievements: ["CONMEBOL 예선 통과", "월드컵 복귀"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["낮은 블록", "강한 경합", "빠른 역습", "세트피스"],
    players: [
      player("Miguel Almiron", "MF", "Atlanta United", "핵심 선수", "전환 속도와 전진 운반"),
      player("Julio Enciso", "FW", "Brighton & Hove Albion", "핵심 선수", "중거리 슈팅과 창의성"),
      player("Gustavo Gomez", "DF", "Palmeiras", "핵심 선수", "수비 리더십"),
      player("Diego Gomez", "MF", "Brighton & Hove Albion", "주목 선수", "박스 침투"),
      player("Ramon Sosa", "FW", "Nottingham Forest", "주목 선수", "측면 스피드")
    ],
    strengths: ["수비 밀도", "세트피스", "전환 속도"],
    weaknesses: ["점유 상황의 창의성", "먼저 실점했을 때 공격 카드"],
    squadSourcePath: "paraguay-world-cup-2026-squad"
  },
  {
    teamId: "australia",
    coachName: "Tony Popovic",
    coachNationality: "Australia",
    confederation: "AFC",
    powerIndex: "피지컬과 조직력의 중위권",
    recentAchievements: ["AFC 예선 통과", "2022 월드컵 16강"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["공중전", "세트피스", "중원 활동량", "직선 전개"],
    players: [
      player("Mathew Ryan", "GK", "Lens", "핵심 선수", "경험 많은 골문 리더"),
      player("Harry Souttar", "DF", "Leicester City", "핵심 선수", "제공권과 세트피스"),
      player("Jackson Irvine", "MF", "St. Pauli", "핵심 선수", "활동량과 리더십"),
      player("Riley McGree", "MF", "Middlesbrough", "주목 선수", "2선 침투"),
      player("Nestory Irankunda", "FW", "Bayern Munich", "주목 선수", "폭발적인 스피드")
    ],
    strengths: ["세트피스 높이", "경합", "활동량"],
    weaknesses: ["빠른 패스 조합 대응", "수비 전환 속도"],
    squadSourcePath: "australia-world-cup-2026"
  },
  {
    teamId: "turkiye",
    coachName: "Vincenzo Montella",
    coachNationality: "Italy",
    confederation: "UEFA",
    powerIndex: "창의적인 공격 자원 보유 중상위권",
    recentAchievements: ["유로 2024 8강", "UEFA 예선 통과"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["중앙 창의성", "왼발 킥", "전환 공격", "높은 템포"],
    players: [
      player("Hakan Calhanoglu", "MF", "Inter", "핵심 선수", "전개와 세트피스 킥"),
      player("Arda Guler", "MF", "Real Madrid", "핵심 선수", "최종 패스와 왼발 슈팅"),
      player("Kenan Yildiz", "FW", "Juventus", "주목 선수", "개인 돌파"),
      player("Orkun Kokcu", "MF", "Benfica", "주전 후보", "전진 패스"),
      player("Kerem Akturkoglu", "FW", "Benfica", "주목 선수", "측면 침투")
    ],
    strengths: ["2선 창의성", "세트피스", "다양한 슈팅 옵션"],
    weaknesses: ["감정적인 경기 흐름", "라인 간격 관리"],
    squadSourcePath: "turkiye-world-cup-2026-squad"
  },
  {
    teamId: "germany",
    coachName: "Julian Nagelsmann",
    coachNationality: "Germany",
    confederation: "UEFA",
    powerIndex: "우승 후보권",
    recentAchievements: ["월드컵 4회 우승", "UEFA 예선 통과"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["게겐프레싱", "점유 지배", "2선 창의성", "전방 압박"],
    players: [
      player("Florian Wirtz", "MF", "Liverpool", "핵심 선수", "2선 창의성과 최종 패스"),
      player("Jamal Musiala", "MF", "Bayern Munich", "핵심 선수", "좁은 공간 드리블"),
      player("Joshua Kimmich", "MF", "Bayern Munich", "핵심 선수", "전개와 리더십"),
      player("Antonio Rudiger", "DF", "Real Madrid", "핵심 선수", "수비 강도"),
      player("Kai Havertz", "MF", "Arsenal", "주목 선수", "전방 연계와 침투")
    ],
    strengths: ["압박 회수 후 빠른 찬스", "2선 창의성", "점유율 장악"],
    weaknesses: ["높은 라인 뒤 공간", "중앙 수비 조합의 순간 집중"],
    squadSourcePath: "germany-world-cup-2026-squad"
  },
  {
    teamId: "curacao",
    coachName: "Dick Advocaat",
    coachNationality: "Netherlands",
    confederation: "CONCACAF",
    powerIndex: "역사적 첫 본선 도전자",
    recentAchievements: ["사상 첫 월드컵 본선 진출", "CONCACAF 예선 무패 흐름"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["네덜란드계 기술", "중원 압박", "역습", "경험 활용"],
    players: [
      player("Leandro Bacuna", "MF", "Bandirmaspor", "핵심 선수", "리더십과 전진 패스"),
      player("Eloy Room", "GK", "Vitesse", "핵심 선수", "경험 많은 골키퍼"),
      player("Juninho Bacuna", "MF", "Birmingham City", "주목 선수", "중원 운반"),
      player("Rangelo Janga", "FW", "Nea Salamis", "주전 후보", "전방 피지컬"),
      player("Kenji Gorre", "FW", "Nacional", "주목 선수", "측면 돌파")
    ],
    strengths: ["기술 좋은 중원", "첫 본선의 동기부여", "경험 많은 감독"],
    weaknesses: ["대회 경험 부족", "강팀 상대로 장시간 수비 부담"],
    squadSourcePath: "curacao-world-cup-2026-squad"
  },
  {
    teamId: "ivory-coast",
    coachName: "Emerse Fae",
    coachNationality: "Ivory Coast",
    confederation: "CAF",
    powerIndex: "아프리카 상위권",
    recentAchievements: ["2023 AFCON 우승", "CAF 예선 통과"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["강한 피지컬", "중원 압박", "측면 돌파", "수비 안정"],
    players: [
      player("Franck Kessie", "MF", "Al Ahli", "핵심 선수", "중원 힘과 박스 침투"),
      player("Ousmane Diomande", "DF", "Sporting CP", "핵심 선수", "센터백 빌드업"),
      player("Evan Ndicka", "DF", "Roma", "핵심 선수", "왼발 수비"),
      player("Ibrahim Sangare", "MF", "Nottingham Forest", "주전 후보", "볼 회수"),
      player("Amad Diallo", "FW", "Manchester United", "주목 선수", "오른쪽 창의성")
    ],
    strengths: ["중원 피지컬", "센터백 자원", "측면 개인 능력"],
    weaknesses: ["중앙 공격수 결정력 기복", "빠른 패스 조합 대응"],
    squadSourcePath: "ivory-coast-world-cup-2026-squad"
  },
  {
    teamId: "ecuador",
    coachName: "Sebastian Beccacece",
    coachNationality: "Argentina",
    confederation: "CONMEBOL",
    powerIndex: "젊고 강한 중상위권",
    recentAchievements: ["CONMEBOL 예선 통과", "최근 월드컵 연속 경쟁력"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["중원 압박", "빠른 수비 전환", "왼쪽 빌드업", "피지컬"],
    players: [
      player("Moises Caicedo", "MF", "Chelsea", "핵심 선수", "볼 회수와 압박 저항"),
      player("Piero Hincapie", "DF", "Bayer Leverkusen", "핵심 선수", "왼발 센터백 전개"),
      player("Enner Valencia", "FW", "Internacional", "핵심 선수", "전방 경험과 마무리"),
      player("Willian Pacho", "DF", "Paris Saint-Germain", "주전 후보", "수비 속도"),
      player("Kendry Paez", "MF", "Chelsea", "주목 선수", "창의적인 전진 패스")
    ],
    strengths: ["중원 압박", "젊은 수비 라인 속도", "피지컬 경합"],
    weaknesses: ["공격 마무리 일관성", "어린 자원의 경험 변수"],
    squadSourcePath: "ecuador-world-cup-2026-squad"
  },
  {
    teamId: "netherlands",
    coachName: "Ronald Koeman",
    coachNationality: "Netherlands",
    confederation: "UEFA",
    powerIndex: "우승 후보권 인접",
    recentAchievements: ["2022 월드컵 8강", "유로 2024 4강"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["점유 전개", "강한 센터백", "측면 침투", "세트피스"],
    players: [
      player("Virgil van Dijk", "DF", "Liverpool", "핵심 선수", "수비 리더십"),
      player("Frenkie de Jong", "MF", "Barcelona", "핵심 선수", "탈압박과 전개"),
      player("Cody Gakpo", "FW", "Liverpool", "핵심 선수", "왼쪽 컷인과 마무리"),
      player("Xavi Simons", "MF", "RB Leipzig", "주목 선수", "2선 창의성"),
      player("Memphis Depay", "FW", "Corinthians", "주전 후보", "전방 연계")
    ],
    strengths: ["센터백 퀄리티", "중원 탈압박", "측면 공격 다양성"],
    weaknesses: ["상대가 낮게 내려설 때 중앙 침투", "부상 변수"],
    squadSourcePath: "netherlands-world-cup-2026-squad"
  },
  {
    teamId: "japan",
    coachName: "Hajime Moriyasu",
    coachNationality: "Japan",
    confederation: "AFC",
    powerIndex: "아시아 최상위권",
    recentAchievements: ["2022 월드컵 16강", "AFC 예선 강세"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["빠른 패스", "측면 윙백", "전방 압박", "교체 자원"],
    players: [
      player("Wataru Endo", "MF", "Liverpool", "핵심 선수", "중원 보호와 압박"),
      player("Takefusa Kubo", "MF", "Real Sociedad", "핵심 선수", "오른쪽 창의성"),
      player("Kaoru Mitoma", "FW", "Brighton & Hove Albion", "핵심 선수", "왼쪽 1대1 돌파"),
      player("Hidemasa Morita", "MF", "Sporting CP", "주전 후보", "패스 연결"),
      player("Ritsu Doan", "MF", "Freiburg", "주목 선수", "왼발 슈팅")
    ],
    strengths: ["압박과 탈압박", "유럽파 두께", "전술 유연성"],
    weaknesses: ["제공권 수비", "피지컬 경합이 많은 경기"],
    squadSourcePath: "japan-world-cup-2026-squad"
  },
  {
    teamId: "sweden",
    coachName: "Graham Potter",
    coachNationality: "England",
    confederation: "UEFA",
    powerIndex: "강한 투톱을 가진 중상위권",
    recentAchievements: ["UEFA 예선 통과", "월드컵 복귀"],
    recentFormation: "4-4-2",
    expectedFormation: "4-4-2",
    tacticalKeywords: ["투톱", "측면 크로스", "전방 압박", "직선 전개"],
    players: [
      player("Alexander Isak", "FW", "Newcastle United", "핵심 선수", "침투와 마무리"),
      player("Viktor Gyokeres", "FW", "Arsenal", "핵심 선수", "피지컬과 득점력"),
      player("Dejan Kulusevski", "MF", "Tottenham Hotspur", "핵심 선수", "오른쪽 운반"),
      player("Anthony Elanga", "FW", "Newcastle United", "주목 선수", "측면 속도"),
      player("Lucas Bergvall", "MF", "Tottenham Hotspur", "주목 선수", "중원 전진성")
    ],
    strengths: ["강력한 전방 조합", "측면 속도", "피지컬"],
    weaknesses: ["중원 수적 열세", "라인 사이 공간"],
    squadSourcePath: "sweden-world-cup-2026-squad"
  },
  {
    teamId: "tunisia",
    coachName: "Sabri Lamouchi",
    coachNationality: "France",
    confederation: "CAF",
    powerIndex: "수비 조직력 기반 도전자",
    recentAchievements: ["CAF 예선 통과", "최근 월드컵 연속 본선 경험"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["낮은 블록", "중원 경합", "전환", "세트피스"],
    players: [
      player("Ellyes Skhiri", "MF", "Eintracht Frankfurt", "핵심 선수", "중원 보호"),
      player("Montassar Talbi", "DF", "Lorient", "핵심 선수", "센터백 리더"),
      player("Aissa Laidouni", "MF", "Al Wakrah", "주전 후보", "활동량"),
      player("Hannibal Mejbri", "MF", "Burnley", "주목 선수", "전진성과 압박"),
      player("Youssef Msakni", "FW", "Al Arabi", "핵심 선수", "경험과 개인 능력")
    ],
    strengths: ["수비 밀도", "중원 활동량", "세트피스"],
    weaknesses: ["득점 루트 다양성", "상대가 빠르게 전환할 때 측면 보호"],
    squadSourcePath: "tunisia-world-cup-2026-squad"
  },
  {
    teamId: "belgium",
    coachName: "Rudi Garcia",
    coachNationality: "France",
    confederation: "UEFA",
    powerIndex: "상위권 경험팀",
    recentAchievements: ["최근 월드컵 연속 본선", "유럽 상위권 전력 유지"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["2선 창의성", "측면 드리블", "박스 타깃", "점유 전개"],
    players: [
      player("Kevin De Bruyne", "MF", "Manchester City", "핵심 선수", "최종 패스와 경기 조율"),
      player("Romelu Lukaku", "FW", "Napoli", "핵심 선수", "전방 피지컬"),
      player("Jeremy Doku", "FW", "Manchester City", "주목 선수", "측면 1대1"),
      player("Youri Tielemans", "MF", "Aston Villa", "주전 후보", "중거리 패스"),
      player("Thibaut Courtois", "GK", "Real Madrid", "핵심 선수", "골문 안정감")
    ],
    strengths: ["개인 능력", "2선 패스", "박스 안 타깃"],
    weaknesses: ["수비 전환 속도", "세대교체 구간의 조직력"],
    squadSourcePath: "belgium-world-cup-2026-squad"
  },
  {
    teamId: "egypt",
    coachName: "Hossam Hassan",
    coachNationality: "Egypt",
    confederation: "CAF",
    powerIndex: "살라 중심의 도전자",
    recentAchievements: ["CAF 예선 통과", "아프리카 전통 강호"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["오른쪽 전환", "살라 활용", "중원 블록", "역습"],
    players: [
      player("Mohamed Salah", "FW", "Liverpool", "핵심 선수", "오른쪽 컷인과 득점"),
      player("Omar Marmoush", "FW", "Manchester City", "핵심 선수", "전방 속도와 침투"),
      player("Mostafa Mohamed", "FW", "Nantes", "주전 후보", "전방 제공권"),
      player("Trezeguet", "MF", "Al Ahly", "주목 선수", "측면 활동량"),
      player("Mohamed Elneny", "MF", "Al Jazira", "주전 후보", "중원 균형")
    ],
    strengths: ["살라의 결정력", "빠른 역습", "전방 스피드"],
    weaknesses: ["특정 공격 루트 의존", "상대 강한 압박 시 빌드업"],
    squadSourcePath: "egypt-world-cup-2026-squad"
  },
  {
    teamId: "iran",
    coachName: "Amir Ghalenoei",
    coachNationality: "Iran",
    confederation: "AFC",
    powerIndex: "경험 많은 아시아 강호",
    recentAchievements: ["AFC 예선 통과", "최근 월드컵 연속 본선"],
    recentFormation: "4-4-2",
    expectedFormation: "4-4-2",
    tacticalKeywords: ["투톱", "직선 역습", "세트피스", "중앙 밀집"],
    players: [
      player("Mehdi Taremi", "FW", "Inter", "핵심 선수", "연계와 마무리"),
      player("Sardar Azmoun", "FW", "Shabab Al Ahli", "핵심 선수", "전방 움직임"),
      player("Alireza Jahanbakhsh", "MF", "Heerenveen", "주목 선수", "오른쪽 킥"),
      player("Saeid Ezatolahi", "MF", "Shabab Al Ahli", "주전 후보", "중원 피지컬"),
      player("Hossein Kanaanizadegan", "DF", "Persepolis", "주전 후보", "수비 경합")
    ],
    strengths: ["전방 투톱 경험", "세트피스", "수비 블록"],
    weaknesses: ["빠른 측면 전환 대응", "템포를 높인 경기에서 중원 간격"],
    squadSourcePath: "iran-world-cup-2026-squad"
  },
  {
    teamId: "new-zealand",
    coachName: "Darren Bazeley",
    coachNationality: "England",
    confederation: "OFC",
    powerIndex: "피지컬 기반 도전자",
    recentAchievements: ["OFC 예선 통과", "월드컵 본선 복귀"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["전방 타깃", "세트피스", "직선 전개", "낮은 블록"],
    players: [
      player("Chris Wood", "FW", "Nottingham Forest", "핵심 선수", "전방 타깃과 마무리"),
      player("Liberato Cacace", "DF", "Empoli", "핵심 선수", "왼쪽 전진"),
      player("Marko Stamenic", "MF", "Olympiacos", "주목 선수", "중원 활동량"),
      player("Sarpreet Singh", "MF", "Hansa Rostock", "주전 후보", "패스와 킥"),
      player("Ryan Thomas", "MF", "PEC Zwolle", "주전 후보", "경험과 연결")
    ],
    strengths: ["제공권", "세트피스", "수비 집중력"],
    weaknesses: ["강팀 상대로 점유율 확보", "전환 수비 속도"],
    squadSourcePath: "new-zealand-world-cup-2026-squad"
  },
  {
    teamId: "spain",
    coachName: "Luis de la Fuente",
    coachNationality: "Spain",
    confederation: "UEFA",
    powerIndex: "우승 후보권",
    recentAchievements: ["유로 2024 우승", "UEFA Nations League 우승 경험"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["점유 지배", "측면 1대1", "중앙 조합", "전방 압박"],
    players: [
      player("Lamine Yamal", "FW", "Barcelona", "핵심 선수", "오른쪽 1대1과 창의성"),
      player("Pedri", "MF", "Barcelona", "핵심 선수", "중앙 조율"),
      player("Rodri", "MF", "Manchester City", "핵심 선수", "중원 지배"),
      player("Nico Williams", "FW", "Athletic Club", "주목 선수", "왼쪽 돌파"),
      player("Dani Olmo", "MF", "Barcelona", "주전 후보", "하프스페이스 침투")
    ],
    strengths: ["점유와 압박", "양쪽 윙어의 1대1", "중원 컨트롤"],
    weaknesses: ["역습 뒷공간", "상대가 낮게 내려설 때 박스 안 타깃"],
    squadSourcePath: "spain-world-cup-2026-squad"
  },
  {
    teamId: "cape-verde",
    coachName: "Bubista",
    coachNationality: "Cape Verde",
    confederation: "CAF",
    powerIndex: "역사적 첫 본선 도전자",
    recentAchievements: ["사상 첫 월드컵 본선 진출", "CAF 예선 돌파"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["측면 속도", "중원 활동량", "역습", "세트피스"],
    players: [
      player("Ryan Mendes", "FW", "Kocaelispor", "핵심 선수", "경험과 마무리"),
      player("Garry Rodrigues", "FW", "Ankaragucu", "주목 선수", "측면 돌파"),
      player("Vozinha", "GK", "Chaves", "주전 후보", "골문 경험"),
      player("Jamiro Monteiro", "MF", "San Jose Earthquakes", "핵심 선수", "중원 전개"),
      player("Jovane Cabral", "FW", "Estrela Amadora", "주목 선수", "스피드와 슈팅")
    ],
    strengths: ["전환 속도", "측면 개인 능력", "첫 본선의 에너지"],
    weaknesses: ["강팀 압박 대응", "토너먼트 경험 부족"],
    squadSourcePath: "cape-verde-world-cup-2026-squad"
  },
  {
    teamId: "saudi-arabia",
    coachName: "Georgios Donis",
    coachNationality: "Greece",
    confederation: "AFC",
    powerIndex: "경험 많은 아시아 중상위권",
    recentAchievements: ["AFC 예선 통과", "2022 월드컵 아르헨티나전 승리 경험"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["중원 압박", "측면 전환", "세트피스", "빠른 라인"],
    players: [
      player("Salem Al-Dawsari", "FW", "Al Hilal", "핵심 선수", "왼쪽 돌파와 큰 경기 득점"),
      player("Firas Al-Buraikan", "FW", "Al Ahli", "핵심 선수", "전방 마무리"),
      player("Saud Abdulhamid", "DF", "Roma", "주목 선수", "오른쪽 활동량"),
      player("Mohammed Kanno", "MF", "Al Hilal", "주전 후보", "중원 피지컬"),
      player("Hassan Tambakti", "DF", "Al Hilal", "주전 후보", "수비 경합")
    ],
    strengths: ["리그 기반 조직력", "측면 스피드", "전환 공격"],
    weaknesses: ["높은 라인 뒤 공간", "강한 피지컬 팀 상대 제공권"],
    squadSourcePath: "saudi-arabia-world-cup-2026-squad"
  },
  {
    teamId: "uruguay",
    coachName: "Marcelo Bielsa",
    coachNationality: "Argentina",
    confederation: "CONMEBOL",
    powerIndex: "상위권 압박팀",
    recentAchievements: ["CONMEBOL 예선 상위권", "2024 Copa America 3위"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["맨투맨 압박", "높은 강도", "직선 전환", "중원 에너지"],
    players: [
      player("Federico Valverde", "MF", "Real Madrid", "핵심 선수", "중원 에너지와 슈팅"),
      player("Darwin Nunez", "FW", "Liverpool", "핵심 선수", "침투와 압박"),
      player("Ronald Araujo", "DF", "Barcelona", "핵심 선수", "수비 속도"),
      player("Manuel Ugarte", "MF", "Manchester United", "핵심 선수", "볼 회수"),
      player("Giorgian de Arrascaeta", "MF", "Flamengo", "주목 선수", "창의적인 패스")
    ],
    strengths: ["압박 강도", "중원 에너지", "직선적인 공격"],
    weaknesses: ["압박이 풀렸을 때 뒷공간", "높은 템포 유지 체력"],
    squadSourcePath: "uruguay-world-cup-2026-squad"
  },
  {
    teamId: "france",
    coachName: "Didier Deschamps",
    coachNationality: "France",
    confederation: "UEFA",
    powerIndex: "우승 후보권",
    recentAchievements: ["2022 월드컵 준우승", "2018 월드컵 우승"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["빠른 전환", "음바페 활용", "중원 피지컬", "수비 안정"],
    players: [
      player("Kylian Mbappe", "FW", "Real Madrid", "핵심 선수", "왼쪽 침투와 결정력"),
      player("Ousmane Dembele", "FW", "Paris Saint-Germain", "핵심 선수", "양발 드리블"),
      player("Aurelien Tchouameni", "MF", "Real Madrid", "핵심 선수", "중원 보호"),
      player("Mike Maignan", "GK", "Milan", "주전 후보", "후방 안정감"),
      player("Antoine Griezmann", "MF", "Atletico Madrid", "주목 선수", "공격 연결과 위치 선정")
    ],
    strengths: ["전환 속도", "공격진 깊이", "수비 피지컬"],
    weaknesses: ["점유를 강요받을 때 박스 안 해법", "부상 변수"],
    squadSourcePath: "france-world-cup-2026-squad"
  },
  {
    teamId: "senegal",
    coachName: "Pape Thiaw",
    coachNationality: "Senegal",
    confederation: "CAF",
    powerIndex: "아프리카 상위권",
    recentAchievements: ["2021 AFCON 우승", "최근 월드컵 본선 경쟁력"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["측면 속도", "수비 피지컬", "역습", "세트피스"],
    players: [
      player("Sadio Mane", "FW", "Al Nassr", "핵심 선수", "왼쪽 침투와 마무리"),
      player("Kalidou Koulibaly", "DF", "Al Hilal", "핵심 선수", "수비 리더"),
      player("Edouard Mendy", "GK", "Al Ahli", "주전 후보", "골문 경험"),
      player("Nicolas Jackson", "FW", "Chelsea", "주목 선수", "전방 압박"),
      player("Pape Matar Sarr", "MF", "Tottenham Hotspur", "주목 선수", "중원 활동량")
    ],
    strengths: ["피지컬과 스피드", "경험 많은 수비축", "전환 공격"],
    weaknesses: ["중앙 창의성 기복", "상대 밀집 수비 공략"],
    squadSourcePath: "senegal-world-cup-2026-squad"
  },
  {
    teamId: "iraq",
    coachName: "Graham Arnold",
    coachNationality: "Australia",
    confederation: "AFC",
    powerIndex: "전환과 열정의 도전자",
    recentAchievements: ["AFC 예선 통과", "아시안컵 경쟁력"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["전방 타깃", "측면 돌파", "중원 압박", "세트피스"],
    players: [
      player("Aymen Hussein", "FW", "Al Khor", "핵심 선수", "전방 득점원"),
      player("Ali Jasim", "FW", "Como", "주목 선수", "측면 돌파"),
      player("Zidane Iqbal", "MF", "Utrecht", "핵심 선수", "중원 전개"),
      player("Mohanad Ali", "FW", "Al Shorta", "주전 후보", "박스 침투"),
      player("Jalal Hassan", "GK", "Al Zawraa", "주전 후보", "골문 경험")
    ],
    strengths: ["전방 타깃", "강한 응집력", "세트피스"],
    weaknesses: ["압박 회피", "라인 사이 수비"],
    squadSourcePath: "iraq-world-cup-2026-squad"
  },
  {
    teamId: "norway",
    coachName: "Stale Solbakken",
    coachNationality: "Norway",
    confederation: "UEFA",
    powerIndex: "초대형 공격 듀오 보유팀",
    recentAchievements: ["UEFA 예선 통과", "오랜 월드컵 공백 이후 복귀"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["홀란 타깃", "외데고르 전개", "직선 침투", "세트피스"],
    players: [
      player("Erling Haaland", "FW", "Manchester City", "핵심 선수", "세계 최상급 박스 결정력"),
      player("Martin Odegaard", "MF", "Arsenal", "핵심 선수", "최종 패스와 압박"),
      player("Alexander Sorloth", "FW", "Atletico Madrid", "주전 후보", "전방 피지컬"),
      player("Antonio Nusa", "FW", "RB Leipzig", "주목 선수", "측면 속도"),
      player("Sander Berge", "MF", "Fulham", "주전 후보", "중원 피지컬")
    ],
    strengths: ["최상급 스트라이커", "2선 창의성", "세트피스 높이"],
    weaknesses: ["수비 라인 속도", "공격 핵심 선수 의존"],
    squadSourcePath: "norway-world-cup-2026-squad"
  },
  {
    teamId: "argentina",
    coachName: "Lionel Scaloni",
    coachNationality: "Argentina",
    confederation: "CONMEBOL",
    powerIndex: "디펜딩 챔피언 우승 후보",
    recentAchievements: ["2022 월드컵 우승", "2024 Copa America 우승"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["전술 유연성", "메시 중심 연결", "중원 압박", "박스 침투"],
    players: [
      player("Lionel Messi", "FW", "Inter Miami", "핵심 선수", "창의성과 마무리"),
      player("Emiliano Martinez", "GK", "Aston Villa", "핵심 선수", "큰 경기 선방"),
      player("Julian Alvarez", "FW", "Atletico Madrid", "핵심 선수", "전방 압박과 침투"),
      player("Enzo Fernandez", "MF", "Chelsea", "핵심 선수", "중원 전개"),
      player("Alexis Mac Allister", "MF", "Liverpool", "주목 선수", "압박과 연결")
    ],
    strengths: ["전술 유연성", "큰 경기 경험", "중원 밸런스"],
    weaknesses: ["메시 의존 구간", "고강도 압박을 장시간 받을 때 체력 변수"],
    squadSourcePath: "argentina-world-cup-2026-squad"
  },
  {
    teamId: "algeria",
    coachName: "Vladimir Petkovic",
    coachNationality: "Switzerland",
    confederation: "CAF",
    powerIndex: "기술 좋은 북아프리카 강호",
    recentAchievements: ["CAF 예선 통과", "AFCON 우승 경험 보유 세대"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["측면 창의성", "중원 전개", "역습", "세트피스"],
    players: [
      player("Riyad Mahrez", "FW", "Al Ahli", "핵심 선수", "오른쪽 왼발 창의성"),
      player("Ismael Bennacer", "MF", "Milan", "핵심 선수", "중원 탈압박"),
      player("Ramy Bensebaini", "DF", "Borussia Dortmund", "주전 후보", "왼쪽 수비와 제공권"),
      player("Houssem Aouar", "MF", "Al Ittihad", "주목 선수", "전진 패스"),
      player("Amine Gouiri", "FW", "Marseille", "주목 선수", "전방 연계")
    ],
    strengths: ["기술 좋은 2선", "세트피스", "측면 전환"],
    weaknesses: ["수비 전환 속도", "강한 피지컬 팀 상대 중원 경합"],
    squadSourcePath: "algeria-world-cup-2026-squad"
  },
  {
    teamId: "austria",
    coachName: "Ralf Rangnick",
    coachNationality: "Germany",
    confederation: "UEFA",
    powerIndex: "고강도 압박 중상위권",
    recentAchievements: ["유로 2024 인상적 조별리그", "UEFA 예선 통과"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["전방 압박", "빠른 전환", "세컨드볼", "조직력"],
    players: [
      player("David Alaba", "DF", "Real Madrid", "핵심 선수", "수비 리더와 빌드업"),
      player("Marcel Sabitzer", "MF", "Borussia Dortmund", "핵심 선수", "중원 압박과 슈팅"),
      player("Konrad Laimer", "MF", "Bayern Munich", "핵심 선수", "압박과 커버"),
      player("Christoph Baumgartner", "MF", "RB Leipzig", "주목 선수", "2선 침투"),
      player("Marko Arnautovic", "FW", "Inter", "주전 후보", "전방 피지컬")
    ],
    strengths: ["압박 구조", "전환 속도", "중원 활동량"],
    weaknesses: ["압박이 풀렸을 때 뒷공간", "전방 결정력 기복"],
    squadSourcePath: "austria-world-cup-2026-squad"
  },
  {
    teamId: "jordan",
    coachName: "Jamal Sellami",
    coachNationality: "Morocco",
    confederation: "AFC",
    powerIndex: "역습형 다크호스",
    recentAchievements: ["2023 AFC Asian Cup 준우승", "사상 첫 월드컵 본선"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["빠른 역습", "측면 돌파", "3백 블록", "세트피스"],
    players: [
      player("Mousa Al-Taamari", "FW", "Rennes", "핵심 선수", "오른쪽 돌파와 슈팅"),
      player("Yazan Al-Naimat", "FW", "Al Ahli", "핵심 선수", "전방 침투"),
      player("Noor Al-Rawabdeh", "MF", "Selangor", "주전 후보", "중원 활동량"),
      player("Nizar Al-Rashdan", "MF", "Al Faisaly", "주목 선수", "전환 패스"),
      player("Yazid Abu Layla", "GK", "Al Faisaly", "주전 후보", "골문 경험")
    ],
    strengths: ["빠른 전환", "측면 에이스", "조직적인 3백"],
    weaknesses: ["장시간 수비 부담", "강한 압박 회피"],
    squadSourcePath: "jordan-world-cup-2026-squad"
  },
  {
    teamId: "portugal",
    coachName: "Roberto Martinez",
    coachNationality: "Spain",
    confederation: "UEFA",
    powerIndex: "우승 후보권",
    recentAchievements: ["UEFA Nations League 우승 경험", "유로 우승 경험 세대 유지"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["점유 전개", "2선 창의성", "측면 공격", "세트피스"],
    players: [
      player("Cristiano Ronaldo", "FW", "Al Nassr", "핵심 선수", "박스 안 결정력"),
      player("Bruno Fernandes", "MF", "Manchester United", "핵심 선수", "최종 패스와 슈팅"),
      player("Bernardo Silva", "MF", "Manchester City", "핵심 선수", "점유와 압박 회피"),
      player("Rafael Leao", "FW", "Milan", "주목 선수", "왼쪽 1대1"),
      player("Joao Cancelo", "DF", "Al Hilal", "주전 후보", "인버티드 풀백 전개")
    ],
    strengths: ["스쿼드 깊이", "2선 창의성", "세트피스와 박스 결정력"],
    weaknesses: ["수비 전환 시 풀백 뒤 공간", "공격 자원 조합 선택 변수"],
    squadSourcePath: "portugal-world-cup-2026-squad"
  },
  {
    teamId: "dr-congo",
    coachName: "Sebastien Desabre",
    coachNationality: "France",
    confederation: "CAF",
    powerIndex: "피지컬과 전환의 도전자",
    recentAchievements: ["CAF 예선 통과", "AFCON 상위권 경쟁력"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["강한 피지컬", "측면 전환", "전방 타깃", "수비 경합"],
    players: [
      player("Chancel Mbemba", "DF", "Marseille", "핵심 선수", "수비 리더"),
      player("Yoane Wissa", "FW", "Newcastle United", "핵심 선수", "측면과 중앙 득점"),
      player("Cedric Bakambu", "FW", "Betis", "주전 후보", "전방 경험"),
      player("Arthur Masuaku", "DF", "Besiktas", "주목 선수", "왼쪽 킥과 크로스"),
      player("Gael Kakuta", "MF", "Esteghlal", "주목 선수", "창의적인 왼발")
    ],
    strengths: ["피지컬 경합", "측면 공격", "센터백 리더십"],
    weaknesses: ["점유 안정성", "수비 간격 유지"],
    squadSourcePath: "dr-congo-world-cup-2026-squad"
  },
  {
    teamId: "uzbekistan",
    coachName: "Fabio Cannavaro",
    coachNationality: "Italy",
    confederation: "AFC",
    powerIndex: "첫 본선의 조직적 도전자",
    recentAchievements: ["사상 첫 월드컵 본선 진출", "AFC 예선 돌파"],
    recentFormation: "3-4-2-1",
    expectedFormation: "3-4-2-1",
    tacticalKeywords: ["3백 안정", "빠른 측면", "전방 피지컬", "중원 조직력"],
    players: [
      player("Eldor Shomurodov", "FW", "Roma", "핵심 선수", "전방 경험과 마무리"),
      player("Abbosbek Fayzullaev", "MF", "CSKA Moscow", "핵심 선수", "창의적인 2선"),
      player("Abdukodir Khusanov", "DF", "Manchester City", "핵심 선수", "수비 속도"),
      player("Oston Urunov", "MF", "Persepolis", "주목 선수", "전진 운반"),
      player("Odiljon Hamrobekov", "MF", "Pakhtakor", "주전 후보", "중원 균형")
    ],
    strengths: ["조직력", "젊은 센터백", "2선 창의성"],
    weaknesses: ["본선 경험 부족", "강한 전방 압박 대응"],
    squadSourcePath: "uzbekistan-world-cup-2026-squad"
  },
  {
    teamId: "colombia",
    coachName: "Nestor Lorenzo",
    coachNationality: "Argentina",
    confederation: "CONMEBOL",
    powerIndex: "상위권 다크호스",
    recentAchievements: ["2024 Copa America 준우승", "CONMEBOL 예선 상위권"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["측면 돌파", "2선 창의성", "강한 전환", "세트피스"],
    players: [
      player("Luis Diaz", "FW", "Liverpool", "핵심 선수", "왼쪽 돌파와 득점"),
      player("James Rodriguez", "MF", "Leon", "핵심 선수", "최종 패스와 세트피스"),
      player("Jhon Arias", "MF", "Fluminense", "핵심 선수", "활동량과 연결"),
      player("Jhon Cordoba", "FW", "Krasnodar", "주전 후보", "전방 피지컬"),
      player("Daniel Munoz", "DF", "Crystal Palace", "주목 선수", "오른쪽 전진")
    ],
    strengths: ["측면 개인 능력", "2선 패스", "세트피스"],
    weaknesses: ["중앙 수비 뒷공간", "감정적인 경기 흐름 관리"],
    squadSourcePath: "colombia-world-cup-2026-squad"
  },
  {
    teamId: "england",
    coachName: "Thomas Tuchel",
    coachNationality: "Germany",
    confederation: "UEFA",
    powerIndex: "우승 후보권",
    recentAchievements: ["유로 2024 준우승", "최근 메이저 대회 상위권"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["2선 스타", "점유 전개", "세트피스", "강한 압박"],
    players: [
      player("Jude Bellingham", "MF", "Real Madrid", "핵심 선수", "박스 침투와 리더십"),
      player("Harry Kane", "FW", "Bayern Munich", "핵심 선수", "득점과 연계"),
      player("Bukayo Saka", "FW", "Arsenal", "핵심 선수", "오른쪽 1대1"),
      player("Phil Foden", "MF", "Manchester City", "주목 선수", "중앙 창의성"),
      player("Declan Rice", "MF", "Arsenal", "핵심 선수", "중원 보호")
    ],
    strengths: ["스쿼드 깊이", "2선 결정력", "세트피스"],
    weaknesses: ["왼쪽 수비 밸런스", "점유 우위에서 템포가 느려질 수 있음"],
    squadSourcePath: "https://www.fourfourtwo.com/features/england-world-cup-2026-squad-thomas-tuchel-roster-line-up-xi-final-uk"
  },
  {
    teamId: "croatia",
    coachName: "Zlatko Dalic",
    coachNationality: "Croatia",
    confederation: "UEFA",
    powerIndex: "토너먼트 경험의 상위권",
    recentAchievements: ["2018 월드컵 준우승", "2022 월드컵 3위"],
    recentFormation: "4-3-3",
    expectedFormation: "4-3-3",
    tacticalKeywords: ["중원 점유", "경기 관리", "전환 지연", "세트피스"],
    players: [
      player("Luka Modric", "MF", "Real Madrid", "핵심 선수", "경기 조율"),
      player("Josko Gvardiol", "DF", "Manchester City", "핵심 선수", "수비와 전진"),
      player("Mateo Kovacic", "MF", "Manchester City", "핵심 선수", "탈압박"),
      player("Andrej Kramaric", "FW", "Hoffenheim", "주전 후보", "전방 연계"),
      player("Mario Pasalic", "MF", "Atalanta", "주목 선수", "박스 침투")
    ],
    strengths: ["중원 경험", "경기 템포 조절", "토너먼트 노하우"],
    weaknesses: ["공격진 속도", "노련한 주축의 체력 변수"],
    squadSourcePath: "croatia-world-cup-2026-squad"
  },
  {
    teamId: "ghana",
    coachName: "Carlos Queiroz",
    coachNationality: "Portugal",
    confederation: "CAF",
    powerIndex: "피지컬과 개인 능력의 도전자",
    recentAchievements: ["CAF 예선 통과", "월드컵 본선 경험 풍부"],
    recentFormation: "4-2-3-1",
    expectedFormation: "4-2-3-1",
    tacticalKeywords: ["전환 속도", "중원 피지컬", "측면 돌파", "세트피스"],
    players: [
      player("Mohammed Kudus", "MF", "West Ham United", "핵심 선수", "중앙과 측면 돌파"),
      player("Thomas Partey", "MF", "Arsenal", "핵심 선수", "중원 피지컬"),
      player("Jordan Ayew", "FW", "Leicester City", "주전 후보", "전방 경험"),
      player("Inaki Williams", "FW", "Athletic Club", "주목 선수", "뒷공간 침투"),
      player("Antoine Semenyo", "FW", "Bournemouth", "주목 선수", "피지컬과 슈팅")
    ],
    strengths: ["전환 공격", "중원 힘", "개인 돌파"],
    weaknesses: ["수비 조직력 유지", "세트피스 수비 집중"],
    squadSourcePath: "ghana-world-cup-2026-squad"
  },
  {
    teamId: "panama",
    coachName: "Thomas Christiansen",
    coachNationality: "Spain",
    confederation: "CONCACAF",
    powerIndex: "조직적인 다크호스",
    recentAchievements: ["CONCACAF 예선 통과", "2018 이후 월드컵 복귀"],
    recentFormation: "3-4-3",
    expectedFormation: "3-4-3",
    tacticalKeywords: ["3백 전환", "측면 윙백", "중원 활동량", "역습"],
    players: [
      player("Adalberto Carrasquilla", "MF", "Pumas UNAM", "핵심 선수", "중원 전개와 압박"),
      player("Michael Amir Murillo", "DF", "Marseille", "핵심 선수", "오른쪽 전진"),
      player("Jose Fajardo", "FW", "UCV", "주전 후보", "전방 움직임"),
      player("Anibal Godoy", "MF", "Nashville SC", "주전 후보", "중원 경험"),
      player("Fidel Escobar", "DF", "Deportivo Saprissa", "핵심 선수", "수비 리더")
    ],
    strengths: ["조직적인 3백", "측면 윙백 전진", "중원 활동량"],
    weaknesses: ["강한 압박을 받을 때 전개", "상대가 빠르게 측면을 바꿀 때"],
    squadSourcePath: "panama-world-cup-2026-squad"
  }
];

export const teamScoutingProfiles: Record<string, TeamScoutingProfile> = Object.fromEntries(
  seeds.map((seed) => [seed.teamId, makeProfile(seed)])
);
