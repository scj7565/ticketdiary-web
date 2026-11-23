// 티켓 상세: 다이어리에서 선택한 티켓(sessionStorage의 ticketId)을 찾아 표시하고 수정, 삭제
// 공연 당일까지 "예정"(D-n), 다음 날부터 "관람 완료"(D+n)로 화면 전환

const ticketEl = document.querySelector("#ticket");
const messageEl = document.querySelector("#message");

const modalBox = document.querySelector("#modal-box");
const dateSelect = document.querySelector("#ticket-date");
const gradeSelect = document.querySelector("#ticket-grade");
const seatInput = document.querySelector("#ticket-seat");
const priceText = document.querySelector("#ticket-price");

let tickets = []; // 저장된 전체 티켓
let ticket = null; // 현재 표시 중인 티켓 (tickets 안의 같은 객체)
let grades = []; // 수정 창에 표시하는 좌석 등급과 가격

// 티켓의 내용을 화면에 채우기
function render() {
  const concert = ticket.concert;

  const poster = document.querySelector("#ticket-poster");
  poster.innerHTML = "";
  if (concert.poster) {
    const img = document.createElement("img");
    img.src = concert.poster;
    img.alt = concert.prfnm + " 포스터";
    poster.appendChild(img);
  } else {
    poster.innerText = "포스터 없음";
  }

  const status = document.querySelector("#status");
  status.innerText = statusText(ticket);
  if (isUpcoming(ticket)) {
    status.classList.add("upcoming");
  } else {
    status.classList.remove("upcoming");
  }

  document.querySelector("#ticket-name").innerText = concert.prfnm;
  document.querySelector("#ticket-day").innerText = formatDate(ticket.date);
  document.querySelector("#ticket-venue").innerText = concert.fcltynm;

  let seatText = ticket.grade;
  if (ticket.grade !== "" && ticket.seat !== "") {
    seatText += " ";
  }
  seatText += ticket.seat;
  if (seatText === "") {
    seatText = "입력 안 함";
  }
  document.querySelector("#ticket-seat-text").innerText = seatText;

  if (ticket.price === null) {
    document.querySelector("#ticket-price-text").innerText = "입력 안 함";
  } else {
    document.querySelector("#ticket-price-text").innerText = formatPrice(ticket.price) + "원";
  }

  // 오른쪽 칸: 공연 전 체크리스트, 공연 후 셋리스트
  if (isUpcoming(ticket)) {
    document.querySelector("#checklist-section").classList.remove("hidden");
    document.querySelector("#setlist-section").classList.add("hidden");
  } else {
    document.querySelector("#checklist-section").classList.add("hidden");
    document.querySelector("#setlist-section").classList.remove("hidden");
  }
  renderChecklist();
  renderSetlist();

  // 아래 글 칸: 공연 전 메모, 공연 후 후기
  const box = document.querySelector("#write-box");
  if (isUpcoming(ticket)) {
    document.querySelector("#write-title").innerText = "메모";
    box.value = ticket.memo;
    box.placeholder = "자유롭게 적어 주세요.";
  } else {
    document.querySelector("#write-title").innerText = "후기";
    box.value = ticket.review;
    box.placeholder = "공연은 어땠나요?";
  }
  document.querySelector("#write-saved").innerText = "";
}

// 목록 한 줄 생성, 글, "완료" 버튼(체크리스트만), "삭제" 버튼 포함
function createRow(text, done, onToggle, onDelete) {
  const li = document.createElement("li");

  const content = document.createElement("span");
  content.classList.add("row-text");
  content.innerText = text;
  if (done) {
    content.classList.add("completed");
  }
  li.appendChild(content);

  const buttons = document.createElement("div");
  buttons.classList.add("row-buttons");

  if (onToggle !== null) {
    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.classList.add("button");
    completeButton.innerText = "완료";
    completeButton.addEventListener("click", function () {
      content.classList.toggle("completed");
      onToggle(content.classList.contains("completed"));
    });
    buttons.appendChild(completeButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add("button");
  deleteButton.innerText = "삭제";
  deleteButton.addEventListener("click", onDelete);
  buttons.appendChild(deleteButton);

  li.appendChild(buttons);
  return li;
}

// 체크리스트(준비물) 화면 출력
function renderChecklist() {
  const list = document.querySelector("#checklist");
  list.innerHTML = "";
  ticket.checklist.forEach(function (item) {
    const row = createRow(
      item.text,
      item.done,
      function (done) {
        item.done = done;
        saveTickets(tickets);
      },
      function () {
        ticket.checklist.splice(ticket.checklist.indexOf(item), 1);
        saveTickets(tickets);
        renderChecklist();
      }
    );
    list.appendChild(row);
  });
}

// 셋리스트(곡 목록) 화면 출력
function renderSetlist() {
  const list = document.querySelector("#setlist");
  list.innerHTML = "";
  ticket.setlist.forEach(function (song, index) {
    const row = createRow(index + 1 + ". " + song, false, null, function () {
      ticket.setlist.splice(index, 1); // 같은 곡이 두 번 있을 수 있어 순서 번호로 삭제
      saveTickets(tickets);
      renderSetlist();
    });
    list.appendChild(row);
  });
}

// 수정 창을 현재 티켓의 값으로 채우고 열기
function openModal() {
  fillDateOptions(dateSelect, ticket.concert, ticket.date);
  grades = fillGradeOptions(gradeSelect, priceText, ticket.concert, ticket.grade);
  seatInput.value = ticket.seat;
  modalBox.classList.add("active");
}

// 수정한 내용 저장
function saveEdit() {
  if (dateSelect.value === "") {
    alert("관람일을 선택해 주세요.");
    return;
  }
  ticket.date = dateSelect.value;
  ticket.grade = gradeSelect.value;
  ticket.price = getSelectedPrice(gradeSelect, grades);
  ticket.seat = seatInput.value.trim();
  saveTickets(tickets);
  modalBox.classList.remove("active");
  render();
}

// 확인 후 티켓 삭제, 다이어리로 복귀
function deleteTicket() {
  if (!confirm("이 티켓을 삭제할까요? 삭제하면 되돌릴 수 없습니다.")) {
    return;
  }
  tickets.splice(tickets.indexOf(ticket), 1);
  saveTickets(tickets);
  location.href = "diary.html";
}

// 페이지가 열리면 저장된 티켓에서 다이어리에서 선택한 티켓 찾기
document.addEventListener("DOMContentLoaded", function () {
  tickets = loadTickets();
  const id = sessionStorage.getItem("ticketId");
  const found = tickets.filter(function (t) {
    return t.id === id;
  });

  if (found.length === 0) {
    messageEl.classList.remove("hidden");
    return;
  }
  ticket = found[0];

  // 이전에 저장한 티켓에 없는 항목은 빈 값으로 시작
  if (ticket.review === undefined) {
    ticket.review = "";
  }
  if (ticket.memo === undefined) {
    ticket.memo = "";
  }
  if (ticket.checklist === undefined) {
    ticket.checklist = [];
  }
  if (ticket.setlist === undefined) {
    ticket.setlist = [];
  } else if (typeof ticket.setlist === "string") {
    // 예전에 글 한 덩어리로 저장한 셋리스트는 줄마다 곡 하나로 분리
    ticket.setlist = ticket.setlist.split("\n").filter(function (line) {
      return line.trim() !== "";
    });
  }

  ticketEl.classList.remove("hidden");
  render();
});

// 곡을 셋리스트에 추가, 입력칸에서 Enter를 눌러도 "추가" 버튼의 click 발생
document.querySelector("#song-add").addEventListener("click", function (e) {
  e.preventDefault(); // 페이지 새로고침 방지
  const input = document.querySelector("#song-input");
  const song = input.value.trim();
  if (song === "") {
    return;
  }
  ticket.setlist.push(song);
  saveTickets(tickets);
  input.value = "";
  renderSetlist();
});

// 준비물 추가
document.querySelector("#check-add").addEventListener("click", function (e) {
  e.preventDefault();
  const input = document.querySelector("#check-input");
  const text = input.value.trim();
  if (text === "") {
    return;
  }
  ticket.checklist.push({ text: text, done: false });
  saveTickets(tickets);
  input.value = "";
  renderChecklist();
});

// 메모, 후기의 "저장" 버튼: 글 상자 내용을 티켓에 저장
document.querySelector("#write-save").addEventListener("click", function () {
  const box = document.querySelector("#write-box");
  if (isUpcoming(ticket)) {
    ticket.memo = box.value;
  } else {
    ticket.review = box.value;
  }
  saveTickets(tickets);
  document.querySelector("#write-saved").innerText = "저장했습니다.";
});

document.querySelector("#edit-button").addEventListener("click", openModal);
document.querySelector("#delete-button").addEventListener("click", deleteTicket);
document.querySelector("#modal-save").addEventListener("click", saveEdit);
document.querySelector("#modal-close").addEventListener("click", function () {
  modalBox.classList.remove("active");
});
gradeSelect.addEventListener("change", function () {
  showPrice(gradeSelect, priceText, grades);
});
