// 공연 찾기: 공연 목록을 불러와 표시하고 검색어로 필터링

const keywordInput = document.querySelector("#keyword");
const countText = document.querySelector("#count");
const gridEl = document.querySelector("#grid");
const listEl = document.querySelector("#list");
const moreButton = document.querySelector("#more");

const GRID_SIZE = 10; // 검색 전 표시하는 포스터 수
const PAGE_SIZE = 20; // 검색 결과를 한 번에 표시하는 공연 수

let concerts = []; // 불러온 전체 공연
let matches = []; // 검색어에 맞는 공연
let shown = 0; // 지금까지 화면에 출력한 공연 수

// 포스터 칸 생성, 포스터가 없으면 "포스터 없음" 표시
function createPoster(concert) {
  const poster = document.createElement("div");
  poster.classList.add("poster");
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    img.loading = "lazy"; // 화면에 가까워졌을 때 불러오기
    poster.appendChild(img);
  } else {
    poster.innerText = "포스터 없음";
  }
  return poster;
}

// 검색 전 포스터 한 장(포스터와 아래의 작은 글자) 생성, 누르면 티켓 추가 창 열림
function createCard(concert) {
  const li = document.createElement("li");

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("poster-card");
  button.addEventListener("click", function () {
    openModal(concert);
  });

  const title = document.createElement("span");
  title.classList.add("card-title");
  title.innerText = concert.prfnm;

  const date = document.createElement("span");
  date.classList.add("card-date");
  date.innerText = concert.prfpdfrom + " ~ " + concert.prfpdto;

  button.appendChild(createPoster(concert));
  button.appendChild(title);
  button.appendChild(date);
  li.appendChild(button);
  return li;
}

// 공연 한 건을 목록 항목으로 생성
function createItem(concert) {
  const li = document.createElement("li");
  li.classList.add("concert");

  const info = document.createElement("div");
  info.classList.add("info");

  const title = document.createElement("h2");
  title.innerText = concert.prfnm;

  const detail = document.createElement("p");
  detail.classList.add("detail");
  detail.innerText = concert.prfpdfrom + " ~ " + concert.prfpdto + ", " + concert.fcltynm;

  info.appendChild(title);
  info.appendChild(detail);

  const add = document.createElement("button");
  add.type = "button";
  add.classList.add("button", "add-button");
  add.innerText = "티켓 추가";
  add.addEventListener("click", function () {
    openModal(concert);
  });

  li.appendChild(createPoster(concert));
  li.appendChild(info);
  li.appendChild(add);
  return li;
}

// 검색어에 맞는 공연 중 PAGE_SIZE건씩만 화면에 출력, 많은 공연을 한꺼번에 출력하면 느려지기 때문
function renderMore() {
  const next = matches.slice(shown, shown + PAGE_SIZE);
  next.forEach(function (concert) {
    listEl.appendChild(createItem(concert));
  });
  shown += next.length;

  if (matches.length === 0) {
    countText.innerText = "조건에 맞는 공연이 없습니다.";
  } else {
    countText.innerText = "공연 " + matches.length + "건 중 " + shown + "건 표시";
  }

  if (shown >= matches.length) {
    moreButton.classList.add("hidden");
  } else {
    moreButton.classList.remove("hidden");
  }
}

// 공연을 무작위로 섞어 GRID_SIZE건을 선택해 포스터 칸에 출력, 페이지를 열 때 한 번만 실행
function renderGrid() {
  const picks = concerts.slice().sort(function () {
    return Math.random() - 0.5;
  });
  picks.slice(0, GRID_SIZE).forEach(function (concert) {
    gridEl.appendChild(createCard(concert));
  });
}

// 검색어가 없으면 포스터 모음, 있으면 검색 결과 목록 표시
function render() {
  const keyword = keywordInput.value.trim().toLowerCase();

  if (keyword === "") {
    gridEl.classList.remove("hidden");
    listEl.classList.add("hidden");
    moreButton.classList.add("hidden");
    countText.innerText = "포스터를 누르면 티켓을 추가할 수 있습니다.";
    return;
  }

  gridEl.classList.add("hidden");
  listEl.classList.remove("hidden");

  matches = concerts.filter(function (c) {
    return c.prfnm.toLowerCase().includes(keyword) || c.fcltynm.toLowerCase().includes(keyword);
  });

  listEl.innerHTML = "";
  shown = 0;
  renderMore();
}

// ---------- 티켓 추가 창 ----------

const modalBox = document.querySelector("#modal-box");
const dateSelect = document.querySelector("#ticket-date");
const gradeSelect = document.querySelector("#ticket-grade");
const seatInput = document.querySelector("#ticket-seat");
const priceText = document.querySelector("#ticket-price");

let selectedConcert = null; // 창에서 티켓을 추가할 공연
let grades = []; // 선택한 공연의 좌석 등급과 가격

// 선택한 공연의 정보를 채우고 창 열기
function openModal(concert) {
  selectedConcert = concert;

  const poster = document.querySelector("#modal-poster");
  poster.innerHTML = "";
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    poster.appendChild(img);
  } else {
    poster.innerText = "포스터 없음";
  }

  document.querySelector("#modal-name").innerText = concert.prfnm;
  document.querySelector("#modal-detail").innerText =
    concert.prfpdfrom + " ~ " + concert.prfpdto + ", " + concert.fcltynm;

  fillDateOptions(dateSelect, concert, "");
  grades = fillGradeOptions(gradeSelect, priceText, concert, "");
  seatInput.value = "";

  modalBox.classList.add("active");
}

// 입력한 내용으로 티켓을 저장하고 내 다이어리로 이동
function addTicket() {
  if (dateSelect.value === "") {
    alert("관람일을 선택해 주세요.");
    return;
  }

  const tickets = loadTickets();
  // 같은 공연, 같은 날짜의 티켓이 이미 있으면 안내 (추가는 막지 않음)
  const same = tickets.filter(function (t) {
    return t.concert.mt20id === selectedConcert.mt20id && t.date === dateSelect.value;
  });
  if (same.length > 0 && !confirm("같은 공연, 같은 날짜의 티켓이 이미 있습니다. 그래도 추가할까요?")) {
    return;
  }

  tickets.push({
    id: String(new Date().getTime()),
    concert: selectedConcert,
    date: dateSelect.value,
    grade: gradeSelect.value,
    price: getSelectedPrice(gradeSelect, grades),
    seat: seatInput.value.trim(),
  });
  saveTickets(tickets);

  // 방금 추가한 티켓이 보이도록 다이어리의 탭을 "전체"로 초기화
  sessionStorage.setItem("diaryTab", "tab-all");
  location.href = "diary.html";
}

gradeSelect.addEventListener("change", function () {
  showPrice(gradeSelect, priceText, grades);
});
document.querySelector("#modal-close").addEventListener("click", function () {
  modalBox.classList.remove("active");
});
document.querySelector("#modal-add").addEventListener("click", addTicket);

// 공연 목록을 불러와 화면 출력
function init() {
  loadConcerts()
    .then(function (data) {
      concerts = data;
      renderGrid();
      render();
    })
    .catch(function () {
      countText.innerText = "공연 목록을 불러오지 못했습니다. Live Server로 열었는지 확인해 주세요.";
    });
}

keywordInput.addEventListener("input", render);
moreButton.addEventListener("click", renderMore);

init();
