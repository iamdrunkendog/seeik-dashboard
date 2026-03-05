# SEEIK Dashboard

SEEIK 키오스크 운영 데이터를 웹에서 빠르게 확인하기 위한 React 기반 대시보드입니다.

이 프로젝트는 과거 Gemini CLI로 초기 골격이 만들어졌고, 현재는 운영 실무에 맞게 구조/문서/기능을 계속 보완하는 상태입니다.

---

## 프로젝트 소개

`seeik-dashboard`는 키오스크 주문 데이터를 기반으로 다음을 한 화면에서 확인할 수 있도록 구성된 내부 운영용 대시보드입니다.

- **매출 요약**: 오늘 매출/객수/컨셉별 구성비
- **일보(Daily Report)**: 월별 일매출 집계, 추정 월매출, 전월/전년 비교, 12개월 추이
- **트랜잭션 조회**: 상세 주문 이력 조회 및 오류 의심건 필터링

메뉴는 상단 내비게이션(매출요약/일보/트랜잭션)으로 분리되어 있으며, 매장 단위로 데이터를 비교할 수 있습니다.

---

## 주요 기능

### 1) 매출 요약 (`/`)
- 매장 선택 토글 (`BLUESQUARE`, `GSartcenter`)
- 오늘 총매출/총객수 카드
- Photo Detail Type 구성비(파이차트 + 표)
- 기간 조회(이번 주/지난 주/이번 달/지난 달 프리셋 포함)
- 기간 요약(총 매출/총 주문)

### 2) 일보 (`/daily-report`)
- 연/월 기준 일별 매출 집계
- 현재 월 기준 **어제까지 실적 기반 추정 월매출** 계산
- 매장별 전월비(MoM), 전년동월비(YoY) 계산
- 최근 12개월 추이 라인차트
- 인쇄 뷰 컴포넌트 분리(`DailyReportPrint`)

### 3) 트랜잭션 (`/transactions`)
- 기간별 상세 트랜잭션 조회
- 매장 다중 선택 필터
- “오류 의심건만 보기” 필터
- 오류 의심 로직(동일 매장/유형 + 20초 이내 연속 생성 건 탐지)

---

## 기술 스택

- **Frontend**: React 19, React Router, React Bootstrap
- **차트**: Chart.js, react-chartjs-2
- **통신**: axios + fetch
- **배포**: GitHub Pages (`gh-pages`)

---

## API 연동

코드 기준 주요 API는 아래 AWS API Gateway 엔드포인트를 사용합니다.

- `https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/default/orders/search`

화면별로 `summary=true/false`, `year/month`, `period=12months_trend` 등 쿼리 파라미터를 달리 사용합니다.

> 참고: 인증 페이지(`LoginPage.js`)는 MD5 해시 전송 기반의 예시 코드가 있으나, 현재 라우팅 기본 흐름에서는 미연결 상태입니다.

---

## 프로젝트 구조

```bash
seeik-dashboard/
├─ public/
├─ src/
│  ├─ App.js                  # 라우팅/네비게이션
│  ├─ SalesSummary.js         # 매출요약 화면
│  ├─ DailyReport.js          # 일보 화면
│  ├─ DailyReportPrint.js     # 일보 인쇄 뷰
│  ├─ Transaction.js          # 트랜잭션 화면
│  ├─ LoginPage.js            # 로그인 페이지(현재 미연결)
│  └─ utils/dateUtils.js      # 날짜/숫자 포맷 유틸
├─ package.json
└─ README.md
```

---

## 실행 방법

### 1) 의존성 설치
```bash
npm install
```

### 2) 개발 서버 실행
```bash
npm start
```
- 기본 주소: `http://localhost:3000`

### 3) 프로덕션 빌드
```bash
npm run build
```

### 4) GitHub Pages 배포
```bash
npm run deploy
```

`package.json` 기준 homepage/public URL은 아래로 설정되어 있습니다.
- `http://iamdrunkendog.github.io/seeik-dashboard`

---

## 향후 개선 포인트

- API URL 및 민감 설정값 `.env` 분리
- 인증 흐름(`LoginPage`) 실제 라우팅 연결
- 오류 의심 로직 고도화(시간/금액/패턴 기반)
- 테스트 코드 보강(핵심 계산 로직 단위 테스트)

---

## 유지보수 메모

- 본 저장소는 실무 데이터 모니터링 목적의 내부 대시보드 성격이 강합니다.
- UI/지표 정의는 운영 요구에 따라 수시로 변경될 수 있습니다.
