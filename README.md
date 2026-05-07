# CalMinder — 개인 캘린더 웹 애플리케이션

KOSTA 교육 과정 중 개발한 바닐라 JavaScript 기반 캘린더 웹앱입니다.  
일정 관리와 D-Day 카운트다운 기능을 제공합니다.

**라이브 데모**: https://tjrqh.github.io/kosta/htmlProject

## 주요 기능

- **월간 캘린더** — 그리드 형태의 월별 일정 뷰
- **D-Day 관리** — 특정 날짜까지 남은 일수 표시 및 사이드바 목록
- **일정 추가** — 제목, 날짜, 타입(D-Day / 일반), 메모 입력 모달
- **일정 상세** — 팝업으로 일정 확인 및 삭제
- **미니 캘린더** — 사이드바에서 날짜 빠른 탐색
- **월 이동** — 이전/다음 버튼 및 마우스 휠 지원
- **데이터 저장** — localStorage 기반 영구 저장

## 기술 스택

| 분류 | 기술 |
|------|------|
| 마크업 | HTML5 |
| 스타일 | CSS3 (모듈별 분리) |
| 로직 | Vanilla JavaScript (ES6+) |
| 저장 | localStorage |

외부 라이브러리 없이 순수 웹 기술만으로 구현했습니다.

## 실행 방법

```bash
git clone https://github.com/tjrqh/kosta.git
cd kosta/htmlProject
open index.html
```

## 파일 구조

```
htmlProject/
├── index.html     # 메인 페이지
├── app.js         # 캘린더 로직 (상태 관리, 렌더링, 이벤트 처리)
└── css/
    ├── base.css
    ├── header.css
    ├── sidebar.css
    ├── calendar.css
    ├── modal.css
    └── responsive.css
```
