// 내 다이어리: 저장된 티켓을 탭으로 나누어 표시

const tabButtons = document.querySelectorAll(".tabs button");
const countText = document.querySelector("#count");
const listEl = document.querySelector("#list");

let tickets = []; // 저장된 전체 티켓

// 티켓 한 장을 목록 항목으로 생성, 누르면 티켓 상세 페이지로 이동하고 어떤 티켓인지는 sessionStorage에 저장
function createItem(ticket) {
  const concert = ticket.concert;

  const li = document.createElement("li");
  const link = document.createElement("a");
  link.classList.add("ticket-row");
  link.href = "ticket.html";
  link.addEventListener("click", function () {
    sessionStorage.setItem("ticketId", ticket.id);
  });

  const poster = document.createElement("div");
  poster.classList.add("poster");
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    poster.appendChild(img);
  } else {
    poster.innerText = "포스터 없음";
  }

  const info = document.createElement("div");
  info.classList.add("info");
  const title = document.createElement("h2");
  title.innerText = concert.prfnm;
  const detail = document.createElement("p");
  detail.classList.add("detail");
  detail.innerText = formatDate(ticket.date) + ", " + concert.fcltynm;
  info.appendChild(title);
  info.appendChild(detail);

  const status = document.createElement("span");
  status.classList.add("status");
  if (isUpcoming(ticket)) {
    status.classList.add("upcoming");
  }
  status.innerText = statusText(ticket);

  link.appendChild(poster);
  link.appendChild(info);
  link.appendChild(status);
  li.appendChild(link);
  return li;
}

// 선택한 탭에 맞는 티켓 화면 출력
function render() {
  let tab = sessionStorage.getItem("diaryTab");
  if (tab === null) {
    tab = "tab-all";
  }

  // 선택한 탭에만 current 클래스 추가
  tabButtons.forEach(function (button) {
    if (button.id === tab) {
      button.classList.add("current");
    } else {
      button.classList.remove("current");
    }
  });

  const shown = tickets.filter(function (t) {
    if (tab === "tab-upcoming") {
      return isUpcoming(t);
    }
    if (tab === "tab-done") {
      return !isUpcoming(t);
    }
    return true;
  });

  // 정렬 순서: 예정 먼저(공연이 가까울수록 앞), 그 뒤에 관람 완료(최근에 본 공연일수록 앞)
  // 관람일은 "2026-11-20" 형식이라 글자 비교가 날짜 순서와 동일
  shown.sort(function (a, b) {
    if (isUpcoming(a) !== isUpcoming(b)) {
      return isUpcoming(a) ? -1 : 1;
    }
    if (a.date === b.date) {
      return 0;
    }
    if (isUpcoming(a)) {
      return a.date > b.date ? 1 : -1;
    }
    return a.date < b.date ? 1 : -1;
  });

  listEl.innerHTML = "";
  shown.forEach(function (ticket) {
    listEl.appendChild(createItem(ticket));
  });

  if (tickets.length === 0) {
    countText.innerHTML = '저장된 티켓이 없습니다. <a href="explore.html">공연 찾기</a>에서 추가해 보세요.';
  } else if (shown.length === 0) {
    countText.innerText = "이 탭에 해당하는 티켓이 없습니다.";
  } else {
    countText.innerText = "티켓 " + shown.length + "장";
  }
}

// 탭 클릭 시 선택한 탭을 sessionStorage에 저장하고 다시 출력
tabButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    sessionStorage.setItem("diaryTab", button.id);
    render();
  });
});

// 페이지가 열리면 저장된 티켓 불러오기
document.addEventListener("DOMContentLoaded", function () {
  tickets = loadTickets();
  render();
});
