# 2026 FIFA World Cup Simulator

한국어 기반 2026 FIFA 월드컵 시뮬레이션 웹사이트입니다. API 실제 데이터, AI 예측 데이터, 사용자 입력 데이터, 경우의 수 계산기 데이터를 분리해서 처리합니다.

## 설치

Node.js 20.9 이상을 권장합니다. 이 저장소는 로컬 빌드 재현성을 위해 devDependency로 Node 20 런타임도 고정합니다.

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 환경변수

```bash
API_FOOTBALL_KEY=
API_FOOTBALL_DAILY_LIMIT=100
API_FOOTBALL_DAILY_SOFT_LIMIT=95
API_FOOTBALL_PREDICTION_DETAIL_FIXTURE_LIMIT=1
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
FOOTBALL_DATA_ORG_KEY=
FOOTBALL_DATA_API_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TIMEOUT_MS=15000
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_TIMEOUT_MS=15000
AI_MAX_PAYLOAD_BYTES=30000
PROVIDER_COOLDOWN_MINUTES=30
TAVILY_API_KEY=
EXA_API_KEY=
LATEST_INFO_PROVIDER_PRIORITY=tavily,exa
LATEST_INFO_SEARCH_TIMEOUT_MS=12000
LATEST_INFO_CACHE_TTL_HOURS=6
LATEST_INFO_MATCH_LIMIT=4
ADMIN_PASSWORD=091009
CRON_SECRET=
```

`API_FOOTBALL_KEY`는 API-Football(API-SPORTS) 서버 Route에서만 사용합니다. 브라우저에서 직접 외부 API를 호출하지 않으며, 무료 플랜 보호를 위해 기본 하루 100회 제한과 95회 soft limit을 적용합니다.
`FOOTBALL_DATA_ORG_KEY` 또는 기존 호환 이름 `FOOTBALL_DATA_API_KEY`는 API-Football 실패 시 fallback 용도로만 사용합니다. 두 키가 모두 없어도 저장 캐시와 정적 기본 데이터로 앱은 중단되지 않습니다.
`GROQ_API_KEY`는 경기 예측, 전술 요약, 핵심 선수 분석, 한국어 설명 생성의 1순위 AI Provider입니다. Groq가 실패하거나 429/quota/timeout이면 `OPENROUTER_API_KEY`로 한 번만 fallback하고, 둘 다 실패하면 캐시 또는 규칙 기반 분석을 사용합니다.
`TAVILY_API_KEY`와 `EXA_API_KEY`는 최신 부상, 카드, 체력, 라인업, 뉴스, 감독/전술 변화 검색용입니다. 최신 사실은 검색/API/저장 JSON 출처가 있을 때만 화면에 반영합니다.

## 관리자 인증

- 관리자 검토 모드와 수동 새로고침은 관리자 비밀번호 인증 후 사용할 수 있습니다.
- 기본 비밀번호는 `091009`이며, 운영 배포에서는 Vercel 환경변수 `ADMIN_PASSWORD`로 관리하는 것을 권장합니다.
- 브라우저에는 탭 단위 `sessionStorage` 인증 상태만 저장하고, 서버 API Route는 HttpOnly 쿠키 또는 `x-admin-password` 헤더를 다시 확인합니다.
- `/api/refresh-football-data`와 `/api/cron/update-football-data`는 인증 없이 실행되지 않습니다. Cron은 `CRON_SECRET`이 있으면 `Authorization: Bearer <CRON_SECRET>` 또는 `x-cron-secret` 헤더로도 실행할 수 있습니다.

## Vercel 배포

GitHub 저장소를 Vercel에 연결한 뒤 환경변수를 등록하세요. Vercel은 Next.js 프로젝트를 자동 감지합니다.

## 데이터 원칙

- 종료된 실제 경기는 AI 예측이나 사용자 입력으로 덮어쓰지 않습니다.
- 실제 경기·순위·팀 조회는 API-Football을 우선 사용하고, 실패하거나 부족하면 football-data.org, 서버 캐시, 정적 기본 데이터 순서로 fallback합니다.
- 공개 화면의 버튼은 저장된 데이터를 다시 읽기만 하며, 외부 API 동기화는 관리자 검토 모드의 수동 새로고침 또는 서버 Cron에서만 실행합니다.
- 저장 리소스는 fixtures, standings, teams, players, coaches, lineups, events, injuries, statistics, predictions와 api_sync_logs, api_usage_logs로 분리합니다.
- 출처 URL, 업데이트 날짜, 신뢰도 필드가 없는 선수·감독·전술·포메이션 정보는 확정 정보로 표시하지 않습니다.
- 공개 조 편성으로 확인한 국가명은 표시하되, 공식 출처 재확인이 필요한 항목은 수동 확인 상태로 구분합니다.
- 조 편성은 FIFA World Cup 26 경기 일정 기준으로, 팀 최종 명단과 감독명은 FIFA 최종 명단 공개 자료를 기준으로 표시합니다.
- 국기 이미지는 ISO/지역 코드 기반 FlagCDN 이미지를 사용하며, 이모지 국기는 이미지가 없을 때의 보조 표기로만 둡니다.
- 공식 3위 배정표가 없으면 32강 3위 자리를 임의 배정하지 않습니다.
- 브라우저 저장소 전체 삭제를 쓰지 않고 목적별 저장 키만 삭제합니다.
