// 공통 함수: 여러 페이지에서 공용

// 공연 데이터 불러오기, 공연 데이터 fetch는 이 함수 한 곳에서만 사용
function loadConcerts() {
  return fetch("data/concerts.json").then(function (response) {
    if (!response.ok) {
      throw new Error("공연 데이터를 불러오지 못했습니다.");
    }
    return response.json();
  });
}

// ---------- 티켓 저장 (localStorage) ----------
// 티켓 한 장: { id, concert(공연 정보 전체), date("2026-11-20"), grade, price(숫자 또는 null), seat }

// 저장된 티켓 배열 불러오기, 저장된 것이 없으면 빈 배열
function loadTickets() {
  let tickets;
  if (localStorage.getItem("tickets") === null) {
    tickets = [];
  } else {
    tickets = JSON.parse(localStorage.getItem("tickets"));
  }
  return tickets;
}

// 티켓 배열을 글자로 바꿔 저장
function saveTickets(tickets) {
  localStorage.setItem("tickets", JSON.stringify(tickets));
}

// ---------- 날짜 ----------

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// Date를 "2026-11-20" 형식의 글로 변환, 사용자 컴퓨터의 날짜 기준
function toDateText(date) {
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return date.getFullYear() + "-" + month + "-" + day;
}

// "2026.11.20"(공연 데이터) 또는 "2026-11-20"(티켓) 형식의 글을 Date로 변환
function parseDate(text) {
  const parts = text.split(".").join("-").split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// "2026-11-20" → "2026.11.20 (금)"
function formatDate(dateText) {
  return dateText.split("-").join(".") + " (" + WEEKDAYS[parseDate(dateText).getDay()] + ")";
}

// 관람일까지 남은 날수, 오늘이면 0, 지났으면 음수
function daysUntil(dateText) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(dateText).getTime() - today.getTime()) / 86400000);
}

// 공연 당일까지 "예정", 다음 날부터 "관람 완료", 저장하지 않고 열 때마다 계산
function isUpcoming(ticket) {
  return daysUntil(ticket.date) >= 0;
}

// "D-3", "D-day", "D+5"처럼 티켓의 상태 글 생성
function statusText(ticket) {
  const days = daysUntil(ticket.date);
  if (days === 0) {
    return "D-day";
  }
  if (days > 0) {
    return "D-" + days;
  }
  return "D+" + -days;
}

// ---------- 가격 ----------

// 55000 → "55,000"
function formatPrice(price) {
  const text = String(price);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    if (i > 0 && (text.length - i) % 3 === 0) {
      result += ",";
    }
    result += text.charAt(i);
  }
  return result;
}

// "R석 150,000원, S석 110,000원" 같은 가격 안내 글을 [{ name, price }] 목록으로 변환
function parsePrices(guidance) {
  const result = [];
  const pieces = guidance.split("원"); // "R석 150,000", ", S석 110,000", ""
  pieces.forEach(function (piece) {
    let text = piece.trim();
    if (text.indexOf(",") === 0) {
      text = text.slice(1).trim(); // 앞의 쉼표 제거
    }
    const space = text.lastIndexOf(" "); // 등급 이름과 가격 사이의 공백
    if (space > 0) {
      result.push({
        name: text.slice(0, space).trim(),
        price: Number(text.slice(space + 1).split(",").join("")),
      });
    }
  });
  return result;
}

// ---------- 티켓 입력 칸(공연 찾기의 추가 창, 티켓 상세의 수정 창이 공용) ----------

// 공연 기간의 날짜를 하루씩 관람일 선택 목록으로 생성, selected는 미리 선택할 날짜
function fillDateOptions(select, concert, selected) {
  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.innerText = "관람일";
  select.appendChild(first);

  const last = parseDate(concert.prfpdto);
  for (let day = parseDate(concert.prfpdfrom); day <= last; day.setDate(day.getDate() + 1)) {
    const option = document.createElement("option");
    option.value = toDateText(day);
    option.innerText = formatDate(option.value);
    select.appendChild(option);
  }
  select.value = selected;
}

// 공연의 가격 안내에서 좌석 등급 선택 목록을 생성하고 등급 목록(grades) 반환
// selected는 미리 선택할 등급
function fillGradeOptions(select, priceEl, concert, selected) {
  const grades = parsePrices(concert.pcseguidance || "");
  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.innerText = "좌석 등급";
  select.appendChild(first);

  grades.forEach(function (grade) {
    const option = document.createElement("option");
    option.value = grade.name;
    option.innerText = grade.name;
    select.appendChild(option);
  });
  select.value = selected;

  if (grades.length === 0) {
    priceEl.innerText = "가격 안내가 없는 공연입니다.";
  } else {
    showPrice(select, priceEl, grades);
  }
  return grades;
}

// 선택한 좌석 등급의 가격(숫자) 반환, 등급을 선택하지 않았으면 null
// select.options의 0번은 "좌석 등급" 안내이므로 등급 목록은 selectedIndex - 1번
function getSelectedPrice(select, grades) {
  if (select.selectedIndex < 1) {
    return null;
  }
  return grades[select.selectedIndex - 1].price;
}

// 선택한 좌석 등급의 가격 표시
function showPrice(select, priceEl, grades) {
  const price = getSelectedPrice(select, grades);
  if (price === null) {
    priceEl.innerText = "";
  } else {
    priceEl.innerText = "가격 " + formatPrice(price) + "원";
  }
}
