// 공통 함수: 여러 페이지에서 함께 쓴다.

// 공연 데이터를 불러온다. 공연 데이터 fetch는 이 함수 한 곳에서만 한다.
async function loadConcerts() {
  const response = await fetch("data/concerts.json");
  if (!response.ok) {
    throw new Error("공연 데이터를 불러오지 못했습니다.");
  }
  return response.json();
}
