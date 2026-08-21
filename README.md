# StarCraft 1 상성 훈련소

Brood War의 피해 타입과 유닛 크기 상성을 연습하는 정적 웹앱입니다.

## 파일 구조

- `index.html` — 화면 구조와 CSS/JS 파일 연결
- `css/styles.css` — 전체 UI 스타일
- `js/data.js` — 피해 타입, 유닛 크기, 종족, 유닛 데이터
- `js/ui.js` — 공통 DOM/배지 표시 유틸리티
- `js/quiz.js` — 문제 생성, 채점, 오답 복습, 기록 저장
- `js/catalog.js` — 유닛 도감 렌더링, 검색, 종족 필터
- `js/app.js` — 각 기능 초기화만 담당

## 어디를 수정하면 되나요?

- 유닛 크기/공격 타입/유닛 추가: `js/data.js`
- 퀴즈 방식/정답 처리/기록: `js/quiz.js`
- 유닛 검색/필터/도감 카드: `js/catalog.js`
- 색상/레이아웃/반응형 디자인: `css/styles.css`
- 화면의 고정 문구나 섹션: `index.html`

빌드 과정은 없습니다. 정적 웹 서버나 GitHub Pages에서 `index.html`을 열면 동작합니다.
