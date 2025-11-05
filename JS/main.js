// DOM이 로드된 후 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {

    // --- 전역 변수 및 요소 가져오기 ---
    const genreSelect = document.getElementById('genre');
    const ageSelect = document.getElementById('age');
    const avgRatingEl = document.getElementById('avg-rating');
    const completionRateEl = document.getElementById('completion-rate');
    const freeRateEl = document.getElementById('free-rate');
    const rankingListEl = document.getElementById('rankingList');
    const searchInput = document.getElementById("searchInput");
    const resultsContainer = document.getElementById('resultsContainer');
    const modal = document.getElementById("resultsModal");
    const closeModal = document.getElementById("closeModal");
    const webtoonDetail = document.getElementById('webtoonDetail');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // --- 데이터 관련 함수 ---
    function getAllGenres(data) {
            const genres = new Set();

            //  data가 undefined일 때 에러 방지
            if (!data || !Array.isArray(data)) return [];

            data.forEach(w => {
                if (Array.isArray(w.genre)) {
                w.genre.forEach(g => genres.add(g.trim()));
                } else if (typeof w.genre === "string") {
                genres.add(w.genre.trim());
                }
            });

            // return 누락 금지
            return Array.from(genres).sort();
            }

            function getAllAges(data) {
            const ages = new Set();

            if (!data || !Array.isArray(data)) return [];

            data.forEach(w => {
                if (w.age) ages.add(w.age.trim());
            });

            return Array.from(ages).sort();
         }

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

    // --- 필터 및 검색 통합 함수 ---
   function filterWebtoons() {
  const completedOnly = document.getElementById('completed').checked;
  const incompleteOnly = document.getElementById('incomplete').checked;
  const keyword = searchInput.value.trim().toLowerCase();

  return webtoonsData.webtoons.filter(w => {
    const matchGenre =
      genreSelect.value === 'all' ||
      (w.genre && w.genre.includes(genreSelect.value));
    const matchAge =
      ageSelect.value === 'all' || w.age === ageSelect.value;
    const matchKeyword =
      w.title.toLowerCase().includes(keyword) ||
      w.author.toLowerCase().includes(keyword);

    //  문자열과 불린 모두 대응
    const isCompleted = String(w.completed).toLowerCase().trim() === 'true';


    //  완결 / 미완결 / 전체 모드 확실히 분기
    let matchCompletion = true;

    if (completedOnly && !incompleteOnly) {
      matchCompletion = isCompleted; // 완결만
    } else if (!completedOnly && incompleteOnly) {
      matchCompletion = !isCompleted; // 미완결만
    } else {
      matchCompletion = true; // 둘 다 or 둘 다 해제 = 전체
    }
    
    return matchGenre && matchAge && matchKeyword && matchCompletion;
  });
}

    // 검색 결과 표시
    function showSearchResults(filteredData) {
    
    const keyword = searchInput.value.trim();

    //  '*' 입력 시 전체 웹툰 표시
    if (keyword === "*") {
        filteredData = webtoonsData.webtoons;
    }

    resultsContainer.innerHTML = "";
    webtoonDetail.classList.add("hidden");

    if (filteredData.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">검색 결과가 없습니다.</p>';
        modal.style.display = "block";
        return;
    }

    filteredData.forEach(w => {
        const item = document.createElement("div");
        item.classList.add("webtoon-item");
        item.innerHTML = `
        <img src="${w.img}" alt="${w.title}" 
            onerror="this.src='https://via.placeholder.com/150x150?text=No+Image'">
        <div>
            <strong>${w.title}</strong><br>
            <small>${w.author}</small>
            <
        </div>
        `;

        //  리스트 클릭 시 오른쪽 상세영역 업데이트
        item.addEventListener("click", () => showWebtoonDetail(w));
        resultsContainer.appendChild(item);
    });

    modal.style.display = "block";
    }

    // 상세보기 업데이트
  function showWebtoonDetail(w) {
  webtoonDetail.classList.remove("hidden");
  webtoonDetail.innerHTML = `
    <div class="modal-detail-view">
      <!-- 왼쪽 썸네일 -->
      <div class="modal-left">
        <img src="${w.img}" alt="${w.title}"></br></br>
        <a href="${w.link}" target="_blank" class="webtoon-link">웹툰 보러가기</a>
      </div>

      <!-- 오른쪽 텍스트 -->
      <div class="modal-right">
        <h2>${w.title}</h2>
        <p>작가: ${w.author}</p>
        <p>장르: ${Array.isArray(w.genre) ? w.genre.join(', ') : w.genre}</p>
        <p>⭐ 평점: ${w.rating ? w.rating : '정보 없음'}</p>
        <p>${w.description || '설명 정보가 없습니다.'}</p>
      </div>
    </div>
  `;
}
    // 모달 닫기
    closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    });



    // --- 요약 정보 ---
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

    // --- 차트 ---
//  차트 업데이트 함수
function updateCharts(filtered) {
  const ctxGenre = document.getElementById('genreChart');
  const ctxRating = document.getElementById('ratingChart');

  if (!ctxGenre || !ctxRating) {
    console.error("❌ 차트 캔버스를 찾을 수 없습니다.");
    return;
  }

  const genreCtx = ctxGenre.getContext('2d');
  const ratingCtx = ctxRating.getContext('2d');

  // === 장르별 데이터 집계 ===
  const genreMap = {};
  filtered.forEach(w => {
    if (!w.genre) return;
    w.genre.forEach(g => {
      if (!genreMap[g])
        genreMap[g] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
      genreMap[g].count++;
      genreMap[g].sum += w.rating;
      genreMap[g].min = Math.min(genreMap[g].min, w.rating);
      genreMap[g].max = Math.max(genreMap[g].max, w.rating);
    });
  });

  const genreLabels = Object.keys(genreMap);
  const genreCounts = genreLabels.map(g => genreMap[g].count);
  const avgRatings = genreLabels.map(g => (genreMap[g].sum / genreMap[g].count).toFixed(2));
  const minRatings = genreLabels.map(g => genreMap[g].min.toFixed(2));
  const maxRatings = genreLabels.map(g => genreMap[g].max.toFixed(2));

  // === 체크박스 상태 읽기 ===
  const avgToggle = document.getElementById('avgRatingToggle').checked;
  const minToggle = document.getElementById('minRatingToggle').checked;
  const maxToggle = document.getElementById('maxRatingToggle').checked;

  // === 차트 제목 변경 ===
  const chartTitle = document.querySelector('.chart-container h3');
  if (avgToggle || minToggle || maxToggle) {
    chartTitle.textContent = "장르별 평점 비교";
  } else {
    chartTitle.textContent = "장르별 웹툰 수";
  }

  // === 차트 데이터 구성 ===
  let datasets = [];

  if (!avgToggle && !minToggle && !maxToggle) {
    // 기본 웹툰 수
    datasets = [
      {
        label: '웹툰 수',
        data: genreCounts,
        backgroundColor: '#5bc0be'
      }
    ];
  } else {
    // 체크된 평점 통계만 표시
    if (avgToggle) {
      datasets.push({
        label: '평균 평점',
        data: avgRatings,
        backgroundColor: '#118ab2'
      });
    }
    if (minToggle) {
      datasets.push({
        label: '최소 평점',
        data: minRatings,
        backgroundColor: '#ef476f'
      });
    }
    if (maxToggle) {
      datasets.push({
        label: '최대 평점',
        data: maxRatings,
        backgroundColor: '#ffd166'
      });
    }
  }

  // === 기존 장르 차트 제거 후 새로 생성 ===
  if (window.dashboardGenreChart) window.dashboardGenreChart.destroy();

  window.dashboardGenreChart = new Chart(genreCtx, {
    type: 'bar',
    data: {
      labels: genreLabels,
      datasets: datasets

    },
    options: {
      responsive: true,
      layout: {
      padding: {
        top: 10 // ⬅ 그래프 위쪽 여백 확보 (20~40 사이로 조정 가능)
      }
    },
      plugins: { legend: { display: true } },
      scales: {
        y: {
          beginAtZero: true,
          max: (avgToggle || minToggle || maxToggle) ? 12 : undefined
        }
      }
    }
  });

  // === 평점 분포 차트 (오른쪽 그래프 유지) ===
  const buckets = Array(10).fill(0);
  filtered.forEach(w => {
    const idx = Math.max(0, Math.min(9, Math.floor(w.rating)));
    buckets[idx]++;
  });

  if (window.dashboardRatingChart) window.dashboardRatingChart.destroy();

  window.dashboardRatingChart = new Chart(ratingCtx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
      datasets: [
        { label: '평점 분포', data: buckets, backgroundColor: '#ef476f' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

//  필터 함수 — 완결/미완결 적용
function filterWebtoons() {
  const completedOnly = document.getElementById('completed')?.checked || false;
  const incompleteOnly = document.getElementById('incomplete')?.checked || false;
  const keyword = (searchInput?.value || "").trim().toLowerCase();

  return webtoonsData.webtoons.filter(w => {
    const matchGenre =
      genreSelect.value === 'all' ||
      (w.genre && w.genre.includes(genreSelect.value));
    const matchAge =
      ageSelect.value === 'all' || w.age === ageSelect.value;
    const matchKeyword =
      w.title.toLowerCase().includes(keyword) ||
      w.author.toLowerCase().includes(keyword);

    const isCompleted = String(w.completed).toLowerCase().trim() === 'true';

    let matchCompletion = true;
    if (completedOnly && !incompleteOnly) matchCompletion = isCompleted;
    else if (!completedOnly && incompleteOnly) matchCompletion = !isCompleted;
    else matchCompletion = true;

    return matchGenre && matchAge && matchKeyword && matchCompletion;
  });
}

// 전체 렌더링 함수
function renderDashboardAll() {
  const filtered = filterWebtoons();
  updateCharts(filtered);
}

//  필터 / 체크박스 이벤트 연결
['genre', 'age', 'completed', 'incomplete', 'avgRatingToggle', 'minRatingToggle', 'maxRatingToggle']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => renderDashboardAll());
    }
  });

//  페이지 로드시 초기 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderDashboardAll();
});



    // --- 랭킹 ---
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

    // --- 전체 렌더링 ---
    function renderAll() {
        const filtered = filterWebtoons();
        updateSummary(filtered);
        updateCharts(filtered);
        updateRanking(filtered);
    }

    // --- 검색 입력 시 모달 표시 ---
    searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    if (keyword === '') {
        modal.style.display = 'none';
        return;
    }

    const filtered = filterWebtoons();
    showSearchResults(filtered); // 모달 안에 결과 표시
});


    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        searchInput.value = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            searchInput.value = '';
        }
    });

// -- 숫자 표시 플러그인 --

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
                        ctx.fillText(value, position.x, position.y - -1); // 👈 숫자 위치 조정
                    }
                });
            }
        });
    }
});
// ============================

    ['avgRatingToggle', 'minRatingToggle', 'maxRatingToggle'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => {
    const filtered = filterWebtoons();
    updateCharts(filtered);
  });
});



  const consonantRanges = {
    'ㄱ': ['가', '나'],
    'ㄴ': ['나', '다'],
    'ㄷ': ['다', '라'],
    'ㄹ': ['라', '마'],
    'ㅁ': ['마', '바'],
    'ㅂ': ['바', '사'],
    'ㅅ': ['사', '아'],
    'ㅇ': ['아', '자'],
    'ㅈ': ['자', '차'],
    'ㅊ': ['차', '카'],
    'ㅋ': ['카', '타'],
    'ㅌ': ['타', '파'],
    'ㅍ': ['파', '하'],
    'ㅎ': ['하', '힣']
  };

// 통합 클릭 핸들러
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // 모든 버튼 active 해제
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const type = btn.dataset.type;
    const value = btn.textContent;
    let filteredData = [];

    if (type === 'korean') {
      const range = consonantRanges[value];
      if (!range) return;
      const [start, end] = range;
      filteredData = webtoonsData.webtoons.filter(w => {
        const first = w.title.charAt(0);
        return first >= start && first < end;
      });
    } else if (type === 'number') {
      filteredData = webtoonsData.webtoons.filter(w => {
        return w.title.charAt(0) === value;
      });
    } 

    //  모달창에 결과 표시 (기존 검색 UI 재활용)
    showSearchResults(filteredData);
  });
  });

    // 초기화
    fillOptions();
    renderAll();

    // 필터 변경 시 갱신
    genreSelect.addEventListener('change', renderAll);
    ageSelect.addEventListener('change', renderAll);
    
});


   






