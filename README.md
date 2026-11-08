# 공연 기록 웹페이지

예매한 공연을 티켓 카드로 모아 기록하는 웹 다이어리입니다. 공연 전에는 D-day와 준비물을, 공연 후에는 후기와 셋리스트를 기록하고, 연간 관람 결산을 보여 줍니다.

Node.js(Express) 로컬 서버에서 실행합니다.

## 1. 개요 및 동기

공연을 자주 보는 관객은 예매 내역, 공연 날짜, 다녀온 후의 감상이 예매처·메모장·사진첩 등에 흩어져 있어 한곳에서 돌아보기 어렵다. 본 프로젝트는 공연 하나를 ‘티켓 한 장’으로 보고, 예매부터 관람 후 기록, 연말 결산까지 한 흐름으로 관리하는 웹 다이어리를 만든다.

## 2. 구현 내용

- Node.js(Express) 로컬 서버: 페이지 제공, KOPIS 공연 정보 중계 API
- 공통 레이아웃(헤더 메뉴, 푸터), 반응형 화면
- 공연 찾기(서버 API로 KOPIS 공연 검색·필터)
- 티켓 추가·수정·삭제 및 저장(`localStorage`)
- 티켓 목록(탭, 정렬, 검색)
- 티켓 상세(공연 전/후 화면 자동 전환, 후기·셋리스트·체크리스트)
- 관람 결산(통계, TOP 5, 월별 막대그래프)
- 시작 화면(D-day 카드, 포스터 슬라이드)
- 공연 후 페이지 꾸미기(캔버스에 포스터·스티커 배치, 드래그 이동, 이미지 저장)
- 내 기록 JSON 내보내기·불러오기(백업)

## 3. 구현 방안

### 3.1 서버 구성

KOPIS API는 브라우저에서 직접 호출할 수 없어서(CORS 미허용, 서비스 키 노출) 로컬 Node.js 서버가 대신 호출한다.

| 경로 | 역할 |
|---|---|
| `/` | `public/` 폴더의 페이지 파일 제공(`express.static`) |
| `GET /api/concerts` | KOPIS 공연목록 중계. 검색어·기간·지역을 받아 KOPIS를 호출하고, XML 응답을 JSON으로 바꿔 돌려준다 |
| `GET /api/concerts/:id` | KOPIS 공연상세 중계 |

- KOPIS 서비스 키는 `.env` 파일에 두고, 서버에서만 읽는다. `.env`는 GitHub에 올리지 않는다.
- KOPIS 방화벽이 요청을 무작위로 막는 경우(400 오류)가 있어 서버에서 짧게 쉬었다가 다시 시도한다.

### 3.2 데이터 구성

- **공연 정보:** 두 단계로 구현한다.
  - 1~4주차(페이지 구현): 직접 작성한 샘플 데이터 `public/data/concerts.json`(공연 20~30건)을 `fetch`로 불러온다. 필드 이름(`mt20id`, `prfnm`, `prfpdfrom`, `poster` 등)은 처음부터 KOPIS 응답과 같게 맞춘다.
  - 5주차(서버 연결): 수집 스크립트(`scripts/collect.js`)로 대중음악(콘서트) 장르 실제 공연 약 200~300건을 받아 `concerts.json`을 교체하고, 공연 찾기는 서버의 `/api/concerts`를 호출한다. KOPIS 호출이 실패하면 `concerts.json`을 대신 사용한다.
  - 데이터를 불러오는 코드는 `common.js`의 `loadConcerts()` 한 곳에 모아, 서버 연결 시 이 함수만 바꾸면 되도록 한다.
- **포스터 이미지:** 수집 시 `sharp`로 가로 400px JPEG(품질 75)로 줄여 `public/images/posters/`에 저장하고, 저장소에 함께 커밋한다(장당 약 30~60KB, 전체 약 10~20MB). 같은 사이트의 파일이 되므로 캔버스에 그려도 이미지 저장이 막히지 않고, 다른 컴퓨터에서는 clone만으로 바로 사용할 수 있다.
- **내 기록(쓰기):** 사용자가 추가한 티켓은 객체 배열로 관리하고 `JSON.stringify`로 바꿔 `localStorage`에 저장한다. 페이지가 열리면(`DOMContentLoaded`) `getItem`으로 불러와 `JSON.parse` 후 화면에 표시하고, 삭제는 `indexOf`·`splice`로 처리한다.
- **화면 상태:** 다이어리 목록의 선택한 탭·정렬 방식은 `sessionStorage`에 저장해, 상세 페이지에 다녀와도 같은 화면이 유지되게 한다.
- **공연 전/후 판정:** 관람일과 오늘 날짜(`Date`)를 비교해 ‘예정’ / ‘관람 완료’ 상태를 계산한다(별도 저장 없음).

### 3.3 파일 구성

```
ticketdiary-web/
├── server.js             # Express 서버 (페이지 제공 + /api KOPIS 중계)
├── package.json          # sharp는 수집용이라 devDependencies
├── .env                  # KOPIS_API_KEY (GitHub에 올리지 않음)
├── .env.example          # .env 작성 예시
├── .gitignore            # node_modules, .env
├── scripts/
│   └── collect.js        # KOPIS 공연 데이터·포스터 미리 수집
└── public/
    ├── index.html        # 시작 화면
    ├── explore.html      # 공연 찾기
    ├── diary.html        # 내 티켓 다이어리
    ├── add.html          # 티켓 추가
    ├── ticket.html       # 티켓 상세
    ├── summary.html      # 관람 결산
    ├── decorate.html     # 공연 후 페이지 꾸미기 (선택)
    ├── css/
    │   ├── style.css     # 공통 스타일
    │   └── ...           # 페이지별 css
    ├── js/
    │   ├── common.js     # loadConcerts() 등 데이터 불러오기·저장·날짜 함수
    │   └── ...           # 페이지별 js
    ├── data/
    │   └── concerts.json # 공연 데이터: 샘플 → 5주차에 KOPIS 수집 데이터로 교체 (저장소에 포함)
    └── images/
        ├── posters/      # 줄여서 저장한 공연 포스터 (저장소에 포함)
        └── ...           # 기본 이미지, 아이콘, 스티커
```

## 4. 실행 방법

1. [Node.js](https://nodejs.org) LTS 버전을 설치한다.
2. 저장소를 받고 패키지를 설치한다.
   ```bash
   git clone https://github.com/scj7565/ticketdiary-web.git
   cd ticketdiary-web
   npm install
   ```
3. `.env.example`을 복사해 `.env`를 만들고 KOPIS 서비스 키를 넣는다. 키는 [KOPIS 공연예술통합전산망](https://www.kopis.or.kr)에서 발급받는다.
   ```
   KOPIS_API_KEY=발급받은_키
   ```
   키가 없어도 미리 받아 둔 데이터로 모든 화면이 동작하며, 실시간 공연 검색만 사용할 수 없다.
4. 서버를 실행하고 브라우저에서 http://localhost:3000 을 연다.
   ```bash
   npm start
   ```

### 서버 구축 전 (1~4주차 개발 중)

서버 없이 VS Code의 Live Server로 `public/` 폴더를 열어 실행한다. 공연 데이터는 샘플 `concerts.json`을 사용한다.

### 공연 데이터를 새로 받을 때 (개발용)

공연 데이터(`concerts.json`)와 포스터는 저장소에 이미 들어 있으므로, 실행만 할 때는 이 단계가 필요 없다. 데이터를 갱신할 때만 실행한다.
```bash
npm run collect
```

### 다른 컴퓨터에서 실행할 때

- `npm run collect`는 생략한다. 저장소를 clone하면 데이터와 포스터가 함께 받아진다.
- 수집용 패키지(`sharp`)를 빼고 설치하면 더 빠르다.
  ```bash
  npm install --omit=dev
  ```
- `.env`는 저장소에 없으므로 KOPIS 키를 따로 챙겨 와서 만든다.

## 5. 추진 일정

| 주차 | 기간 | 내용 |
|:---:|:---:|---|
| 1주 | 11.3 ~ 11.9 | GitHub 저장소 생성, 공통 레이아웃·메뉴·CSS |
| 2주 | 11.10 ~ 11.16 | 샘플 공연 데이터(`concerts.json`) 작성, 공연 찾기 페이지(JSON 불러오기, 검색·필터), 티켓 추가 페이지 |
| 3주 | 11.17 ~ 11.23 | `localStorage` 저장, 다이어리 목록(탭·정렬·검색, `sessionStorage`), 티켓 상세(공연 전/후), 수정·삭제 |
| 4주 | 11.24 ~ 11.30 | 결산 페이지, 시작 화면(D-day, 포스터 슬라이드) |
| 5주 | 12.1 ~ 12.7 | Node.js(Express) 로컬 서버 구축, KOPIS 중계 API(`.env`에 키, XML을 JSON으로 변환), 수집 스크립트(실제 공연 데이터, 포스터 축소 저장), 공연 찾기를 서버 API로 연결 |
| 6주 | 12.8 ~ 12.14 | 선택 기능(캔버스 꾸미기, 백업), 오류 점검, README 실행 방법 정리, 시연 캡처·영상, 완료 보고서 작성 |
| 제출 | 12.15 | 완료 보고서 제출 |

---

공연 데이터 출처: [KOPIS 공연예술통합전산망](https://www.kopis.or.kr)
