// DOM이 로드된 후 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {

    // --- 전역 변수 및 요소 가져오기 ---
    const genreSelect = document.getElementById('genre');
    const ageSelect = document.getElementById('age');
    const completedCheckbox = document.getElementById('completed');
    const webtoonContainer = document.getElementById('webtoon-container');
    const avgRatingEl = document.getElementById('avg-rating');
    const completionRateEl = document.getElementById('completion-rate');
    const freeRateEl = document.getElementById('free-rate');
    const rankingListEl = document.getElementById('rankingList');
    const ctxGenre = document.getElementById('genreChart');
    const ctxRating = document.getElementById('ratingChart');
    const searchInput = document.getElementById("searchInput");
    const resultsContainer = document.getElementById('resultsContainer');
    const modal = document.getElementById("resultsModal");
    const closeModal = document.getElementById("closeModal");

    console.log(
  document.getElementById("searchInput"),
  document.getElementById("resultsModal"),
  document.getElementById("closeModal"),
  document.getElementById("resultsContainer")
);


    let genreChartInstance, ratingChartInstance;

    // --- 함수 정의 ---

    // 1. 모든 장르 가져오기
    function getAllGenres(data) {
        const genres = new Set();
        data.forEach(w => {
            if (w.genre) {
                w.genre.forEach(g => genres.add(g.trim()));
            }
        });
        return Array.from(genres).sort();
    }

    // 2. 모든 연령 등급 가져오기
    function getAllAges(data) {
        const ages = new Set();
        data.forEach(w => {
            if (w.age) {
                ages.add(w.age.trim());
            }
        });
        return Array.from(ages).sort();
    }

    // 3. 필터 옵션 채우기
    function fillOptions() {
        const genres = getAllGenres(webtoonsData.webtoons);
        genres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            genreSelect.appendChild(opt);
        });

        const ages = getAllAges(webtoonsData.webtoons);
        ages.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            ageSelect.appendChild(opt);
        });
    }

    // 4. 웹툰 데이터 필터링
    function filterWebtoons() {
        const genreFilter = genreSelect.value;
        const ageFilter = ageSelect.value;
        const completedOnly = completedCheckbox.checked;

        return webtoonsData.webtoons.filter(w => {
            const checkGenre = genreFilter === 'all' || (w.genre && w.genre.includes(genreFilter));
            const checkAge = ageFilter === 'all' || w.age === ageFilter;
            const checkComplete = !completedOnly || w.completed;
            return checkGenre && checkAge && checkComplete;
        });
    }

    // 5. 필터링된 웹툰 목록 표시
    function displayWebtoons(filteredData) {
        webtoonContainer.innerHTML = ''; // 기존 목록 초기화

        if (filteredData.length === 0) {
            webtoonContainer.innerHTML = '<p class="no-data">검색 결과가 없습니다.</p>';
            return;
        }

        filteredData.forEach(w => {
            const card = document.createElement('div');
            card.className = 'webtoon-card';
            card.innerHTML = `
                <a href="${w.link || '#'}" target="_blank">
                    <img src="${w.img}" alt="${w.title}" onerror="this.src='https://via.placeholder.com/150x150?text=No+Image'">
                    <div class="webtoon-info">
                        <h4 class="webtoon-title">${w.title}</h4>
                        <p class="webtoon-author">${w.author}</p>
                    </div>
                </a>
            `;
            webtoonContainer.appendChild(card);
        });
    }

    // 6. 요약 정보 업데이트
    function updateSummary(filtered) {
        if (filtered.length === 0) {
            avgRatingEl.innerHTML = '--';
            completionRateEl.innerHTML = '--';
            freeRateEl.innerHTML = '--';
            return;
        }

        const avgRating = (filtered.reduce((acc, v) => acc + (v.rating || 0), 0) / filtered.length).toFixed(2);
        const completionRatio = (filtered.filter(w => w.completed).length / filtered.length * 100).toFixed(1) + '%';
        const freeRatio = (filtered.filter(w => w.free).length / filtered.length * 100).toFixed(1) + '%';

        avgRatingEl.innerHTML = avgRating;
        completionRateEl.innerHTML = completionRatio;
        freeRateEl.innerHTML = freeRatio;
    }

    // 7. 차트 업데이트
    function updateCharts(filtered) {
        // 장르 차트
        const genreCountMap = {};
        filtered.forEach(w => {
            if (w.genre) {
                w.genre.forEach(g => {
                    genreCountMap[g] = (genreCountMap[g] || 0) + 1;
                });
            }
        });
        const genreLabels = Object.keys(genreCountMap).sort();
        const genreCounts = genreLabels.map(g => genreCountMap[g]);

        if (genreChartInstance) genreChartInstance.destroy();
        genreChartInstance = new Chart(ctxGenre, {
            type: 'bar',
            data: {
                labels: genreLabels.length > 0 ? genreLabels : ['데이터 없음'],
                datasets: [{
                    label: '장르별 웹툰 수',
                    data: genreCounts.length > 0 ? genreCounts : [0],
                    backgroundColor: '#5bc0be'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // 평점 차트
        const buckets = Array(10).fill(0);
        filtered.forEach(w => {
            if (w.rating) {
                let idx = Math.min(9, Math.floor(w.rating - 1));
                if(idx >= 0) buckets[idx]++;
            }
        });
        const ratingLabels = ['1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10', '10'];

        if (ratingChartInstance) ratingChartInstance.destroy();
        ratingChartInstance = new Chart(ctxRating, {
            type: 'bar',
            data: {
                labels: ratingLabels,
                datasets: [{
                    label: '평점 분포',
                    data: buckets,
                    backgroundColor: '#ef476f'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    // 8. 랭킹 업데이트
    function updateRanking(filtered) {
        rankingListEl.innerHTML = '';
        const sorted = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        sorted.slice(0, 10).forEach((w, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="rank-num">${i + 1}</span><a href="${w.link || '#'}" target="_blank">${w.title}</a> <span class="rank-rating">${(w.rating || 0).toFixed(2)}</span>`;
            rankingListEl.appendChild(li);
        });

        if (filtered.length === 0) {
            rankingListEl.innerHTML = '<li>데이터 없음</li>';
        }
    }

    // 9. 모든 UI 렌더링을 통합하는 함수
    function renderAll() {
        const filtered = filterWebtoons();
        displayWebtoons(filtered);
        updateSummary(filtered);
        updateCharts(filtered);
        updateRanking(filtered);
    }

    searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();

    // 검색어가 없으면 모달 닫기
    if (!keyword) {
        modal.style.display = 'none';
        resultsContainer.innerHTML = '';
        return;
    }

    // 검색 결과 필터링
    const filtered = webtoonsData.webtoons.filter(w =>
        w.title.toLowerCase().includes(keyword) ||
        w.author.toLowerCase().includes(keyword)
    );

    // 모달 열기
    modal.style.display = 'block';
    resultsContainer.innerHTML = '';

    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    filtered.forEach(w => {
        const card = document.createElement('div');
        card.className = 'search-card';
        card.innerHTML = `
        <img src="${w.img || 'https://via.placeholder.com/150'}" alt="${w.title}">
        <div class="info">
            <h4>${w.title}</h4>
            <p>${w.author}</p>
        </div>
        `;
        resultsContainer.appendChild(card);
    });
    });

    // 닫기 버튼
    closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    searchInput.value = '';
    });

    // 모달 밖 클릭 시 닫기
    window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        searchInput.value = '';
    }
});

    // --- 초기화 및 이벤트 리스너 설정 ---
    fillOptions();

    
});
/* ========================== */
/* 👇 [추가 코드 시작] 작은 수 데이터 표시용 플러그인 👇 */
/* ========================== */
Chart.register({
    id: 'valueLabelPlugin',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value > 0) { // 0 이상인 경우만 표시
                        ctx.fillStyle = '#333';
                        ctx.font = 'bold 12px Noto Sans KR';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        const position = element.tooltipPosition();
                        ctx.fillText(value, position.x, position.y - 5);
                    }
                });
            }
        });
    }
});
/* ========================== */
/* 👆 [추가 코드 끝] 👆 */
/* ========================== */


