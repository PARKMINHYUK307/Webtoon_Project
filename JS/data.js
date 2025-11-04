// 누락 데이터 기본값 처리 함수
function normalizeData(webtoons) {
    return webtoons.map(w => ({
        id: w.id,
        title: w.title,
        author: w.author,
        genre: (w.genre && w.genre.length > 0) ? w.genre : ['정보없음'],
        rating: w.rating || 0,
        completed: (typeof w.completed === 'boolean') ? w.completed : false,
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

// select option 채우기
function fillDashboardOptions() {
    const genreSelect = document.getElementById('genre');
    const ageSelect = document.getElementById('age');
    genreSelect.innerHTML = '<option value="all" selected>전체</option>';
    dashboardGenres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        genreSelect.appendChild(opt);
    });

    // 연령가에도 '정보없음' 추가 가능
    ageSelect.innerHTML = '<option value="all" selected>전체</option>';
    const extendedAges = [...new Set([...dashboardAges, '정보없음'])]; // '정보없음' 추가
    extendedAges.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        ageSelect.appendChild(opt);
    });
}

// 필터링 함수
function filterDashboardWebtoons() {
    const genreValue = document.getElementById('genre').value;
    const ageValue = document.getElementById('age').value;
    const completedChecked = document.getElementById('completed').checked;

    return dashboardWebtoons.filter(w => {
        const genreOk = (genreValue === 'all') || w.genre.includes(genreValue);
        const ageOk = (ageValue === 'all') || w.age === ageValue;
        const completedOk = completedChecked ? w.completed : true;
        return genreOk && ageOk && completedOk;
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
// ============================
// ✅ [추가 코드 시작] — 숫자 표시 플러그인
// ============================
Chart.register({
    id: 'valueLabelPlugin',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value > 0) {
                        ctx.fillStyle = '#333';
                        ctx.font = 'bold 12px Noto Sans KR';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        const position = element.tooltipPosition();
                        ctx.fillText(value, position.x, position.y - 10); // 👈 숫자 위치 조정
                    }
                });
            }
        });
    }
});
// ============================
// ✅ [추가 코드 끝]
// ============================

let dashboardGenreChart, dashboardRatingChart;

// 차트 업데이트
function updateDashboardCharts(filtered) {
    const genreCountMap = {};
    filtered.forEach(w => w.genre.forEach(g => {
        genreCountMap[g] = (genreCountMap[g] || 0) + 1;
    }));
    const genreLabels = Object.keys(genreCountMap).sort();
    const genreCounts = genreLabels.map(g => genreCountMap[g]);

    const buckets = Array(10).fill(0);
    filtered.forEach(w => {
        const idx = Math.max(0, Math.min(9, Math.floor(w.rating)));
        buckets[idx]++;
    });
    const ratingLabels = Array.from({ length: 10 }, (_, i) => String(i + 1));

    const ctxGenre = document.getElementById('genreChart').getContext('2d');
    if (dashboardGenreChart) dashboardGenreChart.destroy();
    dashboardGenreChart = new Chart(ctxGenre, {
        type: 'bar',
        data: {
            labels: genreLabels.length ? genreLabels : ['-'],
            datasets: [{
                label: '웹툰 수',
                data: genreCounts.length ? genreCounts : [0],
                backgroundColor: '#5bc0be'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            layout: {
                padding: { top: 25 } // ✅ [추가] 숫자 잘림 방지용 상단 여백
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    const ctxRating = document.getElementById('ratingChart').getContext('2d');
    if (dashboardRatingChart) dashboardRatingChart.destroy();
    dashboardRatingChart = new Chart(ctxRating, {
        type: 'bar',
        data: {
            labels: ratingLabels,
            datasets: [{
                label: '평점 분포',
                data: buckets,
                backgroundColor: '#ef476f'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            layout: {
                padding: { top: 25 } // ✅ [추가] 평점 차트에도 동일 여백
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// 인기 랭킹 업데이트
function updateDashboardRanking(filtered) {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';
    const sorted = filtered.slice().sort((a, b) => b.rating - a.rating).slice(0, 10);
    if (sorted.length === 0) {
        const li = document.createElement('li');
        li.style.color = '#ef476f';
        li.textContent = '데이터 없음';
        rankingList.appendChild(li);
        return;
    }
    sorted.forEach((w, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank-num">${i + 1}</span><a href="${w.link}" target="_blank">${w.title}</a> (${w.rating.toFixed(2)})`;
        rankingList.appendChild(li);
    });
}

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

// 초기화
fillDashboardOptions();
renderDashboardAll();