// 누락 데이터 기본값 처리 함수
function normalizeData(webtoons) {
    return webtoons.map(w => ({
        id: w.id,
        title: w.title,
        author: w.author,
        genre: (w.genre && w.genre.length > 0) ? w.genre : ['정보없음'],
        rating: w.rating || 0,
        completed: typeof w.completed === 'boolean'
        ? w.completed
        : String(w.completed).toLowerCase().trim() === 'true',
        age: w.age || '정보없음',
        free: (typeof w.free === 'boolean') ? w.free : false,
        link: w.link || '#',
        
    }));
}

// 데이터 변수
const dashboardWebtoonsRaw = webtoonsData.webtoons;
const dashboardGenres = webtoonsData.genres;
const dashboardAges = webtoonsData.ages;

// normalize 누락처리 포함 최종 데이터
const dashboardWebtoons = normalizeData(dashboardWebtoonsRaw);


// 필터링 함수
function filterDashboardWebtoons() {
    const genreValue = document.getElementById('genre').value;
    const ageValue = document.getElementById('age').value;
    const completedChecked = document.getElementById('completed').checked;
     const incompleteChecked = document.getElementById('incomplete')?.checked || false;

    return dashboardWebtoons.filter(w => {
    const genreOk = (genreValue === 'all') || w.genre.includes(genreValue);
    const ageOk = (ageValue === 'all') || w.age === ageValue;

    //  완결 / 미완결 체크 로직
    let completionOk = true;
    if (completedChecked && !incompleteChecked) {
      completionOk = w.completed === true; // 완결만
    } else if (!completedChecked && incompleteChecked) {
      completionOk = w.completed === false; // 미완결만
    } else {
      completionOk = true; // 둘 다 체크 or 둘 다 해제 → 전체
    }

    return genreOk && ageOk && completionOk;
  });
}

// 요약 카드 업데이트
function updateDashboardSummary(filtered) {
    const avgRating = filtered.length ? (filtered.reduce((sum, w) => sum + w.rating, 0) / filtered.length).toFixed(2) : "--";
    const completedRatio = filtered.length ? (filtered.filter(w => w.completed).length / filtered.length * 100).toFixed(1) + "%" : "--";
    const freeRatio = filtered.length ? (filtered.filter(w => w.free).length / filtered.length * 100).toFixed(1) + "%" : "--";

    document.getElementById('avg-rating').innerHTML = `${avgRating}`;
    document.getElementById('completion-rate').innerHTML = `${completedRatio}`;
    document.getElementById('free-rate').innerHTML = `${freeRatio}`;
}


let dashboardGenreChart, dashboardRatingChart;

// 차트 업데이트
// function updateDashboardCharts(filtered) {
//   const ctxGenre = document.getElementById('genreChart');
//   const ctxRating = document.getElementById('ratingChart');

//   // 디버깅 로그
//   console.log("ctxGenre:", ctxGenre, "ctxRating:", ctxRating);
//   if (!ctxGenre || !ctxRating) {
//     console.error("❌ 캔버스 요소를 찾지 못했습니다. HTML id 확인!");
//     return;
//   }

//   const genreCtx = ctxGenre.getContext('2d');
//   const ratingCtx = ctxRating.getContext('2d');

//   // 기존 장르별 통계 로직
//   const genreMap = {};
//   filtered.forEach(w => {
//     if (!w.genre) return;
//     w.genre.forEach(g => {
//       if (!genreMap[g]) genreMap[g] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
//       genreMap[g].sum += w.rating;
//       genreMap[g].count++;
//       genreMap[g].min = Math.min(genreMap[g].min, w.rating);
//       genreMap[g].max = Math.max(genreMap[g].max, w.rating);
//     });
//   });

//   const labels = Object.keys(genreMap);
//   const avg = labels.map(g => (genreMap[g].sum / genreMap[g].count).toFixed(2));
//   const min = labels.map(g => genreMap[g].min.toFixed(2));
//   const max = labels.map(g => genreMap[g].max.toFixed(2));

//   if (window.dashboardGenreChart) window.dashboardGenreChart.destroy();
//   window.dashboardGenreChart = new Chart(genreCtx, {
//     type: 'bar',
//     data: {
//       labels,
//       datasets: [
//         { label: '평균 평점', data: avg, backgroundColor: '#5bc0be' },
//         { label: '최소 평점', data: min, backgroundColor: '#ef476f' },
//         { label: '최대 평점', data: max, backgroundColor: '#ffd166' }
//       ]
//     },
//     options: {
//       responsive: true,
//       plugins: { legend: { display: true } },
//       scales: { y: { beginAtZero: true, max: 10 } }
//     }
//   });

//   // 평점 분포 그래프 유지
//   const buckets = Array(10).fill(0);
//   filtered.forEach(w => {
//     const idx = Math.max(0, Math.min(9, Math.floor(w.rating)));
//     buckets[idx]++;
//   });

//   if (window.dashboardRatingChart) window.dashboardRatingChart.destroy();
//   window.dashboardRatingChart = new Chart(ratingCtx, {
//     type: 'bar',
//     data: {
//       labels: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
//       datasets: [{ label: '평점 분포', data: buckets, backgroundColor: '#118ab2' }]
//     },
//     options: {
//       responsive: true,
//       plugins: { legend: { display: false } },
//       scales: { y: { beginAtZero: true } }
//     }
//   });
// }

// 인기 랭킹 업데이트
// function updateDashboardRanking(filtered) {
//     const rankingList = document.getElementById('rankingList');
//     rankingList.innerHTML = '';
//     const sorted = filtered.slice().sort((a, b) => b.rating - a.rating).slice(0, 10);
//     if (sorted.length === 0) {
//         const li = document.createElement('li');
//         li.style.color = '#ef476f';
//         li.textContent = '데이터 없음';
//         rankingList.appendChild(li);
//         return;
//     }
//     sorted.forEach((w, i) => {
//         const li = document.createElement('li');
//         li.innerHTML = `<span class="rank-num">${i + 1}</span><a href="${w.link}" target="_blank">${w.title}</a> (${w.rating.toFixed(2)})`;
//         rankingList.appendChild(li);
//     });
// }

// 전체 렌더링
function renderDashboardAll() {
    const filtered = filterDashboardWebtoons();
    updateDashboardSummary(filtered);
    updateDashboardCharts(filtered);
    updateDashboardRanking(filtered);
}

// 이벤트 리스너 등록
document.getElementById('genre').addEventListener('change', renderDashboardAll);
document.getElementById('age').addEventListener('change', renderDashboardAll);
document.getElementById('completed').addEventListener('change', renderDashboardAll);
document.getElementById('incomplete').addEventListener('change', renderDashboardAll);

// 초기화
fillDashboardOptions();
renderDashboardAll();