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
    const yearTrendToggle = document.getElementById('yearTrendToggle');
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
    function showSearchResults() {
  //  검색창 + 장르/연령/완결 여부 필터 통합
  let filteredData = filterWebtoons();

  const keyword = searchInput.value.trim();

  // '*' 입력 시 전체 웹툰 표시
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
         onerror="this.src='../img/한교동.png'">  
    <div>
      <strong>${w.title}</strong><br>
      <small>${w.author}</small>
    </div>
  `;
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
      <div class="modal-left" >
        <img src="${w.img}" alt="${w.title}"></br></br>
        <a href="${w.link}" target="_blank" class="webtoon-link" style="background-color: #03C75A; color: white; font-weight: bold; border: 2px solid #03B159; border-radius: 8px; padding: 6px 12px; text-decoration: none;">
                        웹툰 보러가기
                    </a>
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
   // --- 모달 닫기 ---
closeModal.addEventListener("click", () => {
  modal.style.display = "none";

  // 자음/숫자 버튼 상태 초기화
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => btn.classList.remove('active'));
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

  // === 장르 순서 정렬 ===
  const preferredOrder = ["스토리", "옴니버스", "드라마", "에피소드"];
  let genreLabels = Object.keys(genreMap);

  genreLabels.sort((a, b) => {
    const ai = preferredOrder.indexOf(a);
    const bi = preferredOrder.indexOf(b);

    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, "ko");
  });

  // === 집계 데이터 ===
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

// === 평점 분포 / 연도별 서브장르 트렌드 ===
const buckets = Array(10).fill(0);
filtered.forEach(w => {
  const idx = Math.max(0, Math.min(9, Math.floor(w.rating)));
  buckets[idx]++;
});

// 체크박스 상태 확인
const yearTrendToggle = document.getElementById('yearTrendToggle')?.checked ?? false;

if (window.dashboardRatingChart) window.dashboardRatingChart.destroy();

let chartType;
let labels = [];
let ratingDatasets = [];

// === 체크박스 OFF → 평점 분포 ===
if (!yearTrendToggle) {
  chartType = 'bar';
  labels = Array.from({ length: 10 }, (_, i) => `${i}`);
  ratingDatasets = [
    { label: '평점 분포', data: buckets, backgroundColor: '#ef476f' }
  ];
}

// === 체크박스 ON → 연도별 서브장르 트렌드 ===
else {
  chartType = 'line';

  //  데이터: 연도별 여러 장르 동시 표시
 const trendData = [
    { year: 2006, genre: '드라마', count: 1 },
  { year: 2007, genre: '드라마', count: 1 },
  { year: 2008, genre: '드라마', count: 4 },
  { year: 2009, genre: '드라마', count: 3 },
  { year: 2010, genre: '드라마', count: 10 },
  { year: 2011, genre: '드라마', count: 10 },
  { year: 2012, genre: '드라마', count: 13 },
  { year: 2013, genre: '드라마', count: 15 },
  { year: 2014, genre: '드라마', count: 19 },
  { year: 2015, genre: '드라마', count: 17 },
  { year: 2016, genre: '드라마', count: 14 },
  { year: 2017, genre: '드라마', count: 12 },
  { year: 2018, genre: '드라마', count: 14 },
  { year: 2019, genre: '드라마', count: 16 },
  { year: 2020, genre: '드라마', count: 52 },
  { year: 2021, genre: '드라마', count: 61 },
  { year: 2022, genre: '드라마', count: 176 },

  { year: 2007, genre: '로맨스', count: 2 },
  { year: 2008, genre: '로맨스', count: 1 },
  { year: 2009, genre: '로맨스', count: 2 },
  { year: 2011, genre: '로맨스', count: 6 },
  { year: 2012, genre: '로맨스', count: 3 },
  { year: 2013, genre: '로맨스', count: 5 },
  { year: 2014, genre: '로맨스', count: 5 },
  { year: 2015, genre: '로맨스', count: 6 },
  { year: 2016, genre: '로맨스', count: 3 },
  { year: 2017, genre: '로맨스', count: 9 },
  { year: 2018, genre: '로맨스', count: 10 },
  { year: 2019, genre: '로맨스', count: 23 },
  { year: 2020, genre: '로맨스', count: 49 },

  { year: 2007, genre: '판타지', count: 1 },
  { year: 2010, genre: '판타지', count: 1 },
  { year: 2011, genre: '판타지', count: 3 },
  { year: 2013, genre: '판타지', count: 2 },
  { year: 2014, genre: '판타지', count: 3 },
  { year: 2015, genre: '판타지', count: 1 },
  { year: 2017, genre: '판타지', count: 1 },
  { year: 2018, genre: '판타지', count: 4 },
  { year: 2019, genre: '판타지', count: 4 },
  { year: 2020, genre: '판타지', count: 12 },
  { year: 2021, genre: '판타지', count: 8 },
  { year: 2022, genre: '판타지', count: 46 },

  { year: 2008, genre: '스릴러', count: 1 },
  { year: 2010, genre: '스릴러', count: 3 },
  { year: 2011, genre: '스릴러', count: 1 },
  { year: 2013, genre: '스릴러', count: 4 },
  { year: 2014, genre: '스릴러', count: 2 },
  { year: 2015, genre: '스릴러', count: 3 },
  { year: 2016, genre: '스릴러', count: 4 },
  { year: 2018, genre: '스릴러', count: 7 },
  { year: 2019, genre: '스릴러', count: 7 },
  { year: 2020, genre: '스릴러', count: 12 },
  { year: 2021, genre: '스릴러', count: 13 },
  { year: 2022, genre: '스릴러', count: 51 },

  { year: 2008, genre: '개그', count: 2 },
  { year: 2010, genre: '개그', count: 2 },
  { year: 2011, genre: '개그', count: 3 },
  { year: 2012, genre: '개그', count: 4 },
  { year: 2013, genre: '개그', count: 4 },
  { year: 2014, genre: '개그', count: 3 },
  { year: 2015, genre: '개그', count: 3 },
  { year: 2017, genre: '개그', count: 2 },
  { year: 2018, genre: '개그', count: 3 },
  { year: 2019, genre: '개그', count: 6 },
  { year: 2020, genre: '개그', count: 10 },
  { year: 2021, genre: '개그', count: 10 },
  { year: 2022, genre: '개그', count: 46 },

  { year: 2010, genre: '액션', count: 1 },
  { year: 2012, genre: '액션', count: 2 },
  { year: 2013, genre: '액션', count: 2 },
  { year: 2014, genre: '액션', count: 2 },
  { year: 2015, genre: '액션', count: 2 },
  { year: 2016, genre: '액션', count: 3 },
  { year: 2017, genre: '액션', count: 2 },
  { year: 2018, genre: '액션', count: 6 },
  { year: 2019, genre: '액션', count: 4 },
  { year: 2020, genre: '액션', count: 8 },
  { year: 2021, genre: '액션', count: 8 },
  { year: 2022, genre: '액션', count: 40 },

  { year: 2012, genre: '에피소드', count: 1 },
  { year: 2013, genre: '에피소드', count: 1 },
  { year: 2015, genre: '에피소드', count: 1 },
  { year: 2016, genre: '에피소드', count: 2 },
  { year: 2018, genre: '에피소드', count: 3 },
  { year: 2019, genre: '에피소드', count: 2 },
  { year: 2020, genre: '에피소드', count: 7 },
  { year: 2021, genre: '에피소드', count: 9 },
  { year: 2022, genre: '에피소드', count: 24 }
];


  //  장르별로 그룹화
  const genreGroups = {};
  trendData.forEach(d => {
    if (!genreGroups[d.genre]) genreGroups[d.genre] = [];
    genreGroups[d.genre].push({ year: d.year, count: d.count });
  });

  //  연도 오름차순 정렬
  labels = [...new Set(trendData.map(d => d.year))].sort((a, b) => a - b);

  //  랜덤 색상 생성 함수
  const randomColor = () => `hsl(${Math.random() * 360}, 70%, 50%)`;

  //  장르별 데이터셋 생성
  ratingDatasets = Object.entries(genreGroups).map(([genre, data]) => {
    const yearToCount = Object.fromEntries(data.map(d => [d.year, d.count]));
    return {
      label: genre,
      data: labels.map(y => yearToCount[y] ?? null),
      borderColor: randomColor(),
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 3,
    };
  });
}

// === 차트 생성 ===
window.dashboardRatingChart = new Chart(ratingCtx, {
  type: chartType,
  data: { labels, datasets: ratingDatasets },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: yearTrendToggle
          ? '연도별 주요 서브장르 트렌드'
          : '평점 분포',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: yearTrendToggle ? '작품 수(편)' : '작품 수' },
      },
      x: {
        title: { display: true, text: yearTrendToggle ? '연도' : '평점' },
      },
    },
  },
});

}

    if (yearTrendToggle) {
  yearTrendToggle.addEventListener('change', () => {
    const filteredData = filterWebtoons(); 
    updateCharts(filteredData);
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
            li.innerHTML = `<span class="rank-num">${i+1 }</span><a href="${w.link || '#'}" target="_blank">${w.title}</a>&nbsp<span class="rank-rating">(평점 : ${(w.rating || 0).toFixed(2)})</span>`;
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




    ['avgRatingToggle', 'minRatingToggle', 'maxRatingToggle'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => {
    const filtered = filterWebtoons();
    updateCharts(filtered);
  });
});

 // --- 자음/숫자 버튼 필터 (완전 작동 버전) ---
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // 버튼 상태 초기화
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const type = btn.dataset.type;
    const value = btn.textContent.trim();

    // 현재 장르/연령/완결 필터 반영
    const baseFilteredData = filterWebtoons();
    let finalFilteredData = [];

    if (type === 'korean') {
      const consonantRanges = {
        'ㄱ': ['가', '나'], 'ㄴ': ['나', '다'], 'ㄷ': ['다', '라'], 'ㄹ': ['라', '마'],
        'ㅁ': ['마', '바'], 'ㅂ': ['바', '사'], 'ㅅ': ['사', '아'], 'ㅇ': ['아', '자'],
        'ㅈ': ['자', '차'], 'ㅊ': ['차', '카'], 'ㅋ': ['카', '타'], 'ㅌ': ['타', '파'],
        'ㅍ': ['파', '하'], 'ㅎ': ['하', '힣']
      };
      const range = consonantRanges[value];
      if (!range) {
        finalFilteredData = baseFilteredData;
      } else {
        const [start, end] = range;
        finalFilteredData = baseFilteredData.filter(w => {
          const firstChar = w.title?.charAt(0);
          return firstChar >= start && firstChar < end;
        });
      }
    }

    // 숫자 필터
    else if (type === 'number') {
      finalFilteredData = baseFilteredData.filter(w => /^[0-9]/.test(w.title?.trim()));
    }

    function showSearchResults(data) {
  resultsContainer.innerHTML = "";
  webtoonDetail.innerHTML = "";
  webtoonDetail.classList.add("hidden");
  resultsContainer.classList.remove("hidden");

  if (!data || data.length === 0) {
    resultsContainer.innerHTML = '<p class="no-data">검색 결과가 없습니다.</p>';
  } else {
    data.forEach(w => {
      const item = document.createElement("div");
      item.classList.add("webtoon-item");
      item.innerHTML = `
        <img src="${w.img}" alt="${w.title}" onerror="this.src='../img/한교동.png'">
        <div><strong>${w.title}</strong><br><small>${w.author}</small></div>`;
      item.addEventListener("click", () => showWebtoonDetail(w));
      resultsContainer.appendChild(item);
    });
  }
  modal.style.display = "block";
}


    // 결과 표시
    showSearchResults(finalFilteredData);

    // 모달 닫기 시 active 해제
    const handleClose = () => {
      btn.classList.remove('active');
      closeModal.removeEventListener('click', handleClose);
      window.removeEventListener('click', handleOutside);
    };

    const handleOutside = (e) => {
      if (e.target === modal) {
        btn.classList.remove('active');
        window.removeEventListener('click', handleOutside);
      }
    };

    closeModal.addEventListener('click', handleClose);
    window.addEventListener('click', handleOutside);
  });
});


    //  모달 닫기 버튼
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // 새로고침 버튼
  document.getElementById("refreshBtn").addEventListener("click", () => {
  location.reload();
  });

  searchInput.addEventListener("input", () => {
  showSearchResults(filterWebtoons());
});


    // 초기화
    fillOptions();
    renderAll();

    // 필터 변경 시 갱신
    genreSelect.addEventListener('change', renderAll);
    ageSelect.addEventListener('change', renderAll);
    
});


   






