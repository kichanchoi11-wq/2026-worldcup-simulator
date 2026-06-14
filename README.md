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
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
FOOTBALL_DATA_ORG_KEY=
FOOTBALL_DATA_API_KEY=
GEMINI_API_KEY=
```

`API_FOOTBALL_KEY`는 API-Football(API-SPORTS) 서버 Route에서만 사용합니다. 브라우저에서 직접 외부 API를 호출하지 않으며, 무료 플랜 보호를 위해 기본 하루 100회 제한과 95회 soft limit을 적용합니다.
`FOOTBALL_DATA_ORG_KEY` 또는 기존 호환 이름 `FOOTBALL_DATA_API_KEY`는 API-Football 실패 시 fallback 용도로만 사용합니다. 두 키가 모두 없어도 저장 캐시와 정적 기본 데이터로 앱은 중단되지 않습니다.

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
