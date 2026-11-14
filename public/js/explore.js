// 공연 찾기: 공연 목록을 불러와 보여 주고, 검색어로 거른다.

const keywordInput = document.getElementById("keyword");
const countText = document.getElementById("count");
const gridEl = document.getElementById("grid");
const listEl = document.getElementById("list");
const moreButton = document.getElementById("more");

const GRID_SIZE = 10; // 검색 전에 보여 주는 포스터 수
const PAGE_SIZE = 20; // 검색 결과를 한 번에 보여 주는 공연 수

let concerts = []; // 불러온 전체 공연
let matches = []; // 검색어에 맞는 공연
let shown = 0; // 지금까지 화면에 그린 공연 수

// 포스터 칸을 만든다. 포스터가 없으면 "포스터 없음"을 적는다.
function createPoster(concert) {
  const poster = document.createElement("div");
  poster.className = "poster";
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    img.loading = "lazy"; // 화면에 가까워졌을 때 불러온다
    poster.appendChild(img);
  } else {
    poster.textContent = "포스터 없음";
  }
  return poster;
}

// 검색 전에 보여 주는 포스터 한 장(포스터와 아래의 작은 글자)을 만든다. 누르면 티켓 추가 창이 열린다.
function createCard(concert) {
  const li = document.createElement("li");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "poster-card";
  button.addEventListener("click", () => openDialog(concert));

  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = concert.prfnm;

  const date = document.createElement("span");
  date.className = "card-date";
  date.textContent = concert.prfpdfrom + " ~ " + concert.prfpdto;

  button.append(createPoster(concert), title, date);
  li.appendChild(button);
  return li;
}

// 공연 한 건을 목록 항목으로 만든다.
function createItem(concert) {
  const li = document.createElement("li");
  li.className = "concert";

  const poster = createPoster(concert);

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h2");
  title.textContent = concert.prfnm;

  const detail = document.createElement("p");
  detail.className = "detail";
  detail.textContent =
    concert.prfpdfrom + " ~ " + concert.prfpdto + " · " + concert.fcltynm;

  info.append(title, detail);

  const add = document.createElement("button");
  add.type = "button";
  add.className = "add-button";
  add.textContent = "티켓 추가";
  add.addEventListener("click", () => openDialog(concert));

  li.append(poster, info, add);
  return li;
}

// 검색어에 맞는 공연 중 PAGE_SIZE건씩만 화면에 그린다. 많은 공연을 한꺼번에 그리면 느려지기 때문이다.
function renderMore() {
  const next = matches.slice(shown, shown + PAGE_SIZE);
  listEl.append(...next.map(createItem));
  shown += next.length;

  countText.textContent =
    matches.length === 0
      ? "조건에 맞는 공연이 없습니다."
      : "공연 " + matches.length + "건 중 " + shown + "건 표시";
  moreButton.hidden = shown >= matches.length;
}

// 공연을 무작위로 섞어 GRID_SIZE건을 골라 포스터 칸에 그린다. 페이지를 열 때 한 번만 한다.
function renderGrid() {
  const picks = [...concerts].sort(() => Math.random() - 0.5).slice(0, GRID_SIZE);
  gridEl.append(...picks.map(createCard));
}

// 검색어가 없으면 포스터 모음을, 있으면 검색 결과 목록을 보여 준다.
function render() {
  const keyword = keywordInput.value.trim().toLowerCase();

  const searching = keyword !== "";
  gridEl.hidden = searching;
  listEl.hidden = !searching;
  if (!searching) {
    countText.textContent = "포스터를 누르면 티켓을 추가할 수 있습니다.";
    moreButton.hidden = true;
    return;
  }

  matches = concerts.filter(
    (c) =>
      c.prfnm.toLowerCase().includes(keyword) ||
      c.fcltynm.toLowerCase().includes(keyword)
  );

  listEl.replaceChildren();
  shown = 0;
  renderMore();
}

// ---------- 티켓 추가 창 ----------

const dialogEl = document.getElementById("ticket-dialog");
const dateSelect = document.getElementById("ticket-date");
const gradeSelect = document.getElementById("ticket-grade");
const seatInput = document.getElementById("ticket-seat");
const priceText = document.getElementById("ticket-price");

// "2026.11.20" 형식의 글을 Date로 바꾼다.
function parseDate(text) {
  const [year, month, day] = text.split(".").map(Number);
  return new Date(year, month - 1, day);
}

// 공연 기간의 날짜를 하루씩 관람일 선택 목록으로 만든다.
function fillDates(concert) {
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "관람일";
  dateSelect.replaceChildren(first);

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const last = parseDate(concert.prfpdto);
  for (let day = parseDate(concert.prfpdfrom); day <= last; day.setDate(day.getDate() + 1)) {
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    const dd = String(day.getDate()).padStart(2, "0");

    const option = document.createElement("option");
    option.value = yyyy + "-" + mm + "-" + dd;
    option.textContent = yyyy + "." + mm + "." + dd + " (" + weekdays[day.getDay()] + ")";
    dateSelect.appendChild(option);
  }
}

// "R석 150,000원, S석 110,000원" 같은 가격 안내 글을 [{ name, price }] 목록으로 바꾼다.
function parsePrices(guidance) {
  const result = [];
  // 등급 이름("1일권"처럼 숫자가 들어가도 됨), 공백, 가격, "원" 순서로 찾는다.
  const pattern = /([^,]+?)\s+([\d,]+)원/g;
  let match;
  while ((match = pattern.exec(guidance)) !== null) {
    result.push({ name: match[1].trim(), price: match[2] });
  }
  return result;
}

// 공연의 가격 안내에서 좌석 등급 선택 목록을 만든다.
function fillGrades(concert) {
  const grades = parsePrices(concert.pcseguidance || "");

  const first = document.createElement("option");
  first.value = "";
  first.textContent = "좌석 등급";
  gradeSelect.replaceChildren(first);

  for (const grade of grades) {
    const option = document.createElement("option");
    option.value = grade.name;
    option.dataset.price = grade.price;
    option.textContent = grade.name;
    gradeSelect.appendChild(option);
  }

  priceText.textContent = grades.length === 0 ? "가격 안내가 없는 공연입니다." : "";
}

// 고른 좌석 등급의 가격을 보여 준다.
function showPrice() {
  const option = gradeSelect.selectedOptions[0];
  priceText.textContent = option && option.dataset.price ? "가격 " + option.dataset.price + "원" : "";
}

// 선택한 공연의 정보를 채우고 창을 연다.
function openDialog(concert) {
  const poster = document.getElementById("dialog-poster");
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    poster.replaceChildren(img);
  } else {
    poster.textContent = "포스터 없음";
  }

  document.getElementById("dialog-name").textContent = concert.prfnm;
  document.getElementById("dialog-detail").textContent =
    concert.prfpdfrom + " ~ " + concert.prfpdto + " · " + concert.fcltynm;

  fillDates(concert);
  fillGrades(concert);
  seatInput.value = "";

  dialogEl.showModal();
}

gradeSelect.addEventListener("change", showPrice);
document.getElementById("dialog-close").addEventListener("click", () => dialogEl.close());

async function init() {
  try {
    concerts = await loadConcerts();
  } catch (error) {
    countText.textContent =
      "공연 목록을 불러오지 못했습니다. Live Server로 열었는지 확인해 주세요.";
    return;
  }
  renderGrid();
  render();
}

keywordInput.addEventListener("input", render);
moreButton.addEventListener("click", renderMore);
// 검색창에서 Enter를 눌러도 페이지가 새로고침되지 않게 한다.
document.getElementById("filter").addEventListener("submit", (e) => e.preventDefault());

init();
