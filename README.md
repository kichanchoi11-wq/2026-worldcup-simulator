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
FOOTBALL_DATA_API_KEY=
GEMINI_API_KEY=
```

`FOOTBALL_DATA_API_KEY`가 없으면 실시간 데이터 API는 안내 메시지를 반환하며, 앱은 중단되지 않습니다. 외부 API 키는 Next.js API Route에서만 사용합니다.

## Vercel 배포

GitHub 저장소를 Vercel에 연결한 뒤 환경변수를 등록하세요. Vercel은 Next.js 프로젝트를 자동 감지합니다.

## 데이터 원칙

- 종료된 실제 경기는 AI 예측이나 사용자 입력으로 덮어쓰지 않습니다.
- 출처 URL, 업데이트 날짜, 신뢰도 필드가 없는 선수·감독·전술·포메이션 정보는 확정 정보로 표시하지 않습니다.
- 공개 조 편성으로 확인한 국가명은 표시하되, 공식 출처 재확인이 필요한 항목은 수동 확인 상태로 구분합니다.
- 공식 3위 배정표가 없으면 32강 3위 자리를 임의 배정하지 않습니다.
- 브라우저 저장소 전체 삭제를 쓰지 않고 목적별 저장 키만 삭제합니다.
