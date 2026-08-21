# StarCraft 1 상성 훈련소

Brood War의 피해 타입과 유닛 크기 상성을 연습하는 정적 웹앱입니다.

## 파일 구조

- `index.html` — 화면 구조와 CSS/JS 파일 연결
- `css/styles.css` — 전체 UI 스타일
- `css/quiz.css` — 퀴즈 대진 선택 UI 스타일
- `js/data.js` — 피해 타입, 유닛 크기, 종족, 유닛 데이터
- `js/ui.js` — 공통 DOM/배지 표시 유틸리티
- `js/quiz.js` — 문제 생성, 6개 종족 대진 필터, 채점, 오답 복습, 기록 저장
- `js/catalog.js` — 유닛 도감 렌더링, 검색, 종족 필터
- `js/app.js` — 각 기능 초기화만 담당

## 어디를 수정하면 되나요?

- 유닛 크기/공격 타입/유닛 추가: `js/data.js`
- 퀴즈 방식/대진 범위/정답 처리/기록: `js/quiz.js`
- 퀴즈 대진 선택 디자인: `css/quiz.css`
- 유닛 검색/필터/도감 카드: `js/catalog.js`
- 전체 색상/레이아웃/반응형 디자인: `css/styles.css`
- 화면의 고정 문구나 섹션: `index.html`

## 유닛 적용 퀴즈 대진

`TvT`, `TvP`, `TvZ`, `PvP`, `PvZ`, `ZvZ` 중 하나를 선택할 수 있습니다. 서로 다른 종족 대진은 양방향 공격 문제가 섞여 나옵니다. 문제를 풀기 전에는 공격 피해 타입과 방어 유닛 크기를 표시하지 않고, 채점 후 해설에서 공개합니다.

빌드 과정은 없습니다. 정적 웹 서버나 GitHub Pages에서 `index.html`을 열면 동작합니다.
