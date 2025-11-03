// 샘플 데이터, 실제론 CSV->JSON 변환 권장
const webtoons = [
    { id: 756056, title: "가난을 등에 업은 소녀", author: "B급달궁 / 오은지", genre: ["스토리", "로맨스"], rating: 9.13, completed: true, age: "전체연령가", free: true, link: "#" },
    { id: 670144, title: "가담항설", author: "랑또", genre: ["스토리", "판타지"], rating: 9.98, completed: true, age: "12세 이용가", free: true, link: "#" },
    { id: 732071, title: "가령의 정체불명 이야기", author: "가령", genre: ["옴니버스", "드라마"], rating: 9.95, completed: true, age: "15세 이용가", free: true, link: "#" },
    { id: 703844, title: "가비지타임", author: "2사장", genre: ["스토리", "스포츠"], rating: 9.96, completed: false, age: "전체연령가", free: false, link: "#" },
    { id: 785701, title: "가상&RPG", author: "주다현", genre: ["스토리", "판타지"], rating: 9.91, completed: false, age: "12세 이용가", free: false, link: "#" },
    // 필요 시 데이터 더 추가
];

function getAllGenres(data) {
    const genres = new Set();
    data.forEach(w => w.genre.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
}
function getAllAges(data) {
    const ages = new Set();
    data.forEach(w => ages.add(w.age));
    return Array.from(ages).filter(a => a && typeof a === 'string').sort();
}
// 셀렉트 옵션 생성
function fillOptions() {
    const genreSelect = document.getElementById('genre');
    const ageSelect = document.getElementById('age');
    // 초기화
    genreSelect.innerHTML = '<option value=\"all\" selected>전체</option>';
    ageSelect.innerHTML = '<option value=\"all\" selected>전체</option>';
    getAllGenres(webtoons).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        genreSelect.appendChild(opt);
    });
    getAllAges(webtoons).forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        ageSelect.appendChild(opt);
    });
}

function filterWebtoons() {
    const genreFilter = document.getElementById('genre').value;
    const ageFilter = document.getElementById('age').value;
    const completedOnly = document.getElementById('completed').checked;

    return webtoons.filter(w => {
        const checkGenre = genreFilter === 'all' ? true : w.genre.includes(genreFilter);
        const checkAge = ageFilter === 'all' ? true : w.age === ageFilter;
        const checkComplete = completedOnly ? w.completed : true;
        return checkGenre && checkAge && checkComplete;
    });
}

function updateSummary(filtered) {
    if (filtered.length === 0) {
        document.getElementById('avg-rating').innerHTML = '--';
        document.getElementById('completion-rate').innerHTML = '--';
        document.getElementById('free-rate').innerHTML = '--';
        return;
    }
    const avgRating = (filtered.reduce((acc, v) => acc + v.rating, 0) / filtered.length).toFixed(2);
    const completionRatio = (filtered.filter(w => w.completed).length / filtered.length * 100).toFixed(1) + '%';
    const freeRatio = (filtered.filter(w => w.free).length / filtered.length * 100).toFixed(1) + '%';

    document.getElementById('avg-rating').innerHTML = `${avgRating}`;
    document.getElementById('completion-rate').innerHTML = `${completionRatio}`;
    document.getElementById('free-rate').innerHTML = `${freeRatio}`;
}

function updateCharts(filtered) {
    const genreCountMap = {};
    filtered.forEach(w => {
        w.genre.forEach(g => {
            genreCountMap[g] = (genreCountMap[g] || 0) + 1;
        });
    });

    const genreLabels = Object.keys(genreCountMap).sort();
    const genreCounts = genreLabels.map(g => genreCountMap[g]);
    const buckets = Array(10).fill(0);
    filtered.forEach(w => {
        let idx = Math.min(9, Math.floor(w.rating));
        buckets[idx]++;
    });
    const ratingLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // --- 장르 차트 업데이트 (수정된 부분) ---
    const ctxGenre = document.getElementById('genreChart');
    let existingGenreChart = Chart.getChart(ctxGenre); // 캔버스 ID로 기존 차트 찾기
    if (existingGenreChart) {
        existingGenreChart.destroy(); // 찾았으면 파괴
    }
    new Chart(ctxGenre, {
        type: 'bar',
        data: {
            labels: genreLabels.length > 0 ? genreLabels : ['-'],
            datasets: [{
                label: '웹툰 수',
                data: genreCounts.length > 0 ? genreCounts : [0],
                backgroundColor: '#5bc0be'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // --- 평점 차트 업데이트 (수정된 부분) ---
    const ctxRating = document.getElementById('ratingChart');
    let existingRatingChart = Chart.getChart(ctxRating); // 캔버스 ID로 기존 차트 찾기
    if (existingRatingChart) {
        existingRatingChart.destroy(); // 찾았으면 파괴
    }
    new Chart(ctxRating, {
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
            scales: { y: { beginAtZero: true } }
        }
    });
}


function updateRanking(filtered) {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';
    filtered.sort((a, b) => b.rating - a.rating);
    filtered.slice(0, 10).forEach((w, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class=\"rank-num\">${i + 1}</span><a href=\"${w.link}\" target=\"_blank\">${w.title}</a> (${w.rating.toFixed(2)})`;
        rankingList.appendChild(li);
    });
    // 데이터 없을 경우 메시지
    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.style.color = '#ef476f';
        li.textContent = '데이터 없음';
        rankingList.appendChild(li);
    }
}

function renderAll() {
    const filtered = filterWebtoons();
    updateSummary(filtered);
    updateCharts(filtered);
    updateRanking(filtered);
}

document.getElementById('genre').addEventListener('change', renderAll);
document.getElementById('age').addEventListener('change', renderAll);
document.getElementById('completed').addEventListener('change', renderAll);

fillOptions();
renderAll();

