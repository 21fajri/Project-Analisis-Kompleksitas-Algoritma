var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let isAddingDigital = false;
let performanceChartInstance = null;
let iterativeTime = 0;
let recursiveTime = 0;
let peminjamanChartInstance = null;
let isSelectionMode = false;
let selectedItems = [];
let allNewsData = [];
let newsPointer = 0;
function openReturnModal() {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById('returnModal');
        const listContainer = document.getElementById('return-list-container');
        if (!modal || !listContainer)
            return;
        const res = yield fetch("/api/books/borrowed");
        const borrowed = yield res.json();
        listContainer.innerHTML = '';
        if (borrowed.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-slate-400 text-sm py-10 font-bold">Tidak ada buku dipinjam</p>';
        }
        else {
            borrowed.forEach((book) => {
                listContainer.insertAdjacentHTML('beforeend', `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div class="flex items-center gap-3">
                        <img src="${book.image_url}" class="w-12 h-12 rounded-xl object-cover shadow-sm">
                        <div class="flex flex-col">
                            <span class="text-xs font-black text-slate-800 line-clamp-1 uppercase">${book.title}</span>
                            <span class="text-[8px] text-indigo-500 font-bold uppercase">${book.type}</span>
                        </div>
                    </div>
                    <button onclick="processReturn(${book.id})" 
                            class="bg-white text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                        Kembalikan
                    </button>
                </div>
            `);
            });
        }
        modal.classList.remove('hidden');
    });
}
function closeReturnModal() {
    var _a;
    (_a = document.getElementById('returnModal')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
}
function processReturn(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm("Apakah Anda yakin ingin mengembalikan buku ini?"))
            return;
        try {
            const response = yield fetch(`/api/books/return?id=${id}`, { method: "DELETE" });
            if (response.ok) {
                showToast("Berhasil!", "Buku telah dikembalikan.");
                closeReturnModal();
                renderBooks();
                renderDigitalBooks();
                renderAllBooksSorted();
                renderBorrowedList();
                updateBorrowedBadge();
            }
        }
        catch (e) {
            console.error("Gagal mengembalikan:", e);
        }
    });
}
window.openReturnModal = openReturnModal;
window.closeReturnModal = closeReturnModal;
window.processReturn = processReturn;
function processBorrow(id, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const confirmBorrow = confirm(`Apakah anda ingin meminjam buku ini?`);
        if (!confirmBorrow)
            return;
        try {
            const response = yield fetch("/api/books/borrow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ book_id: id, type: type })
            });
            if (response.ok) {
                showToast("Berhasil!", "Buku telah dipindahkan ke daftar pinjaman.");
                yield renderBooks();
                yield renderDigitalBooks();
                yield renderAllBooksSorted();
                yield renderBorrowedList();
                yield updateBorrowedBadge();
                yield updateLoyaltyInfo();
            }
        }
        catch (error) {
            console.error("Gagal meminjam:", error);
        }
    });
}
function fetchInitialNews() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("/api/external-news");
            allNewsData = yield response.json();
            displayRotatedNews();
        }
        catch (error) {
            console.error("Gagal mengambil berita:", error);
        }
    });
}
function displayRotatedNews() {
    const container = document.getElementById('scroll-news');
    if (!container || allNewsData.length === 0)
        return;
    container.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const index = (newsPointer + i) % allNewsData.length;
            const news = allNewsData[index];
            const newsHtml = `
                <div class="group bg-white/50 p-4 rounded-3xl border border-white/80 hover:bg-white hover:shadow-xl transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-2" 
                     onclick="window.open('${news.link}', '_blank')">
                    <div class="relative h-32 rounded-2xl overflow-hidden mb-4 shadow-inner">
                        <img src="${news.image_url || 'https://wallpapercave.com/wp/wp6617374.jpg'}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                    <h4 class="font-bold text-xs text-slate-800 line-clamp-2">${news.title}</h4>
                    <p class="text-[9px] text-slate-400 mt-2">Anime Update • Baru Saja</p>
                </div>`;
            container.insertAdjacentHTML('beforeend', newsHtml);
        }
        container.classList.remove('opacity-0', 'translate-y-2');
        newsPointer = (newsPointer + 1) % allNewsData.length;
    }, 500);
}
function renderBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('scroll-fisik');
        if (!container)
            return;
        try {
            const response = yield fetch("/api/books");
            const books = yield response.json();
            const limitedBooks = books.slice(0, 100);
            container.innerHTML = '';
            limitedBooks.forEach((book) => {
                container.insertAdjacentHTML('beforeend', createBookCard(book, "Physical"));
            });
        }
        catch (error) {
            console.error("Gagal memuat buku fisik:", error);
        }
    });
}
function renderDigitalBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('scroll-digital-new');
        if (!container)
            return;
        try {
            const response = yield fetch("/api/digital-books");
            const books = yield response.json();
            const limitedBooks = books.slice(0, 100);
            container.innerHTML = '';
            limitedBooks.forEach((book) => {
                container.insertAdjacentHTML('beforeend', createBookCard(book, "Digital"));
            });
        }
        catch (error) {
            console.error("Gagal memuat buku digital:", error);
        }
    });
}
function createBookCard(book, type) {
    const isDigital = type === "Digital";
    const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=random&color=fff&size=170&font-size=0.35&bold=true`;
    return `
    <div onclick="handleCardClick(${book.id}, ${isDigital}, this)" 
         class="book-card group relative snap-start shrink-0 w-[130px] bg-white rounded-2xl shadow-sm border-2 border-transparent overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
         id="book-${isDigital ? 'd' : 'p'}-${book.id}">
        
        <div class="selection-overlay absolute inset-0 z-30 bg-red-500/20 hidden items-center justify-center border-4 border-red-500 rounded-2xl">
            <div class="bg-white rounded-full p-1 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        </div>

        <div class="absolute top-2 left-2 z-10">
            <span class="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${isDigital ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}">
                ${isDigital ? 'E-BOOK' : 'PHYSICAL'}
            </span>
        </div>

        <div class="h-[170px] w-full bg-slate-100 overflow-hidden">
            <img src="${book.image_url}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${fallbackImage}';">
        </div>

        <div class="p-3 bg-white">
            <h4 class="font-black text-[11px] text-slate-800 line-clamp-1 uppercase">${book.title}</h4>
            <p class="text-[9px] font-bold text-slate-400 mt-1 truncate">${isDigital ? 'DIGITAL' : book.author.toUpperCase()}</p>
        </div>
    </div>`;
}
function renderAllBooksSorted() {
    return __awaiter(this, arguments, void 0, function* (order = 'asc') {
        const container = document.getElementById('scroll-all-books');
        if (!container)
            return;
        try {
            const [resFisik, resDigital] = yield Promise.all([
                fetch("/api/books"),
                fetch("/api/digital-books")
            ]);
            const fisik = yield resFisik.json();
            const digital = yield resDigital.json();
            let allBooks = [
                ...fisik.map(b => (Object.assign(Object.assign({}, b), { type: "Physical" }))),
                ...digital.map(b => (Object.assign(Object.assign({}, b), { type: "Digital" })))
            ];
            allBooks.sort((a, b) => {
                const titleA = a.title.toUpperCase();
                const titleB = b.title.toUpperCase();
                if (order === 'asc') {
                    return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
                }
                else {
                    return titleA > titleB ? -1 : titleA < titleB ? 1 : 0;
                }
            });
            const limitedBooks = allBooks.slice(0, 100);
            container.innerHTML = '';
            limitedBooks.forEach(book => {
                container.insertAdjacentHTML('beforeend', createBookCard(book, book.type));
            });
        }
        catch (error) {
            console.error("Gagal menggabungkan data:", error);
        }
    });
}
function addNewBook() {
    return __awaiter(this, void 0, void 0, function* () {
        const titleInput = document.getElementById('titleInput');
        const authorInput = document.getElementById('authorInput');
        const imageInput = document.getElementById('imageInput');
        const title = titleInput.value;
        const author = authorInput.value;
        const image_url = imageInput.value;
        const endpoint = isAddingDigital ? "/api/digital-books/add" : "/api/books/add";
        if (!title || !author || !image_url) {
            alert("Harap isi semua kolom!");
            return;
        }
        const newBook = { title, author, image_url };
        try {
            const response = yield fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBook)
            });
            if (response.ok) {
                const btn = document.getElementById('btnSimpanBuku');
                const modal = document.getElementById('bookModal');
                if (isAddingDigital) {
                    yield renderDigitalBooks();
                }
                else {
                    yield renderBooks();
                }
                modal === null || modal === void 0 ? void 0 : modal.classList.add('hidden');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = "Berhasil Disimpan! ✓";
                    btn.classList.replace('bg-blue-600', 'bg-green-500');
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.replace('bg-green-500', 'bg-blue-600');
                    }, 2000);
                }
                alert(isAddingDigital ? "Buku Digital Berhasil Ditambah!" : "Buku Fisik Berhasil Ditambah!");
                titleInput.value = '';
                authorInput.value = '';
                imageInput.value = '';
                yield renderAllBooksSorted();
                renderDashboard();
            }
        }
        catch (error) {
            console.error("Gagal menambah buku:", error);
        }
    });
}
function confirmDelete(id_1) {
    return __awaiter(this, arguments, void 0, function* (id, isDigital = false) {
        if (confirm(`Apakah Anda yakin ingin menghapus buku ${isDigital ? 'digital' : 'fisik'} ini?`)) {
            try {
                const endpoint = isDigital ? `/api/digital-books/delete?id=${id}` : `/api/books/delete?id=${id}`;
                const response = yield fetch(endpoint, { method: "DELETE" });
                if (response.ok) {
                    if (isDigital) {
                        yield renderDigitalBooks();
                    }
                    else {
                        yield renderBooks();
                    }
                    yield renderAllBooksSorted();
                    renderDashboard();
                    showToast("Dihapus!", "Buku berhasil dihapus dari database.");
                }
                else {
                    alert("Gagal menghapus buku.");
                }
            }
            catch (error) {
                console.error("Error saat menghapus:", error);
            }
        }
    });
}
window.confirmDelete = confirmDelete;
function setupModal() {
    const modal = document.getElementById('bookModal');
    const modalContent = document.getElementById('modalContent');
    const openBtn = document.getElementById('openModalBtn');
    const openBtnDigital = document.getElementById('openModalBtnDigital');
    const closeBtn = document.getElementById('closeModalBtn');
    const overlay = document.getElementById('closeModalOverlay');
    function toggleModal(isOpen) {
        if (isOpen) {
            modal === null || modal === void 0 ? void 0 : modal.classList.remove('hidden');
            setTimeout(() => {
                modalContent === null || modalContent === void 0 ? void 0 : modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent === null || modalContent === void 0 ? void 0 : modalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
        else {
            modalContent === null || modalContent === void 0 ? void 0 : modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent === null || modalContent === void 0 ? void 0 : modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal === null || modal === void 0 ? void 0 : modal.classList.add('hidden'), 300);
        }
    }
    openBtn === null || openBtn === void 0 ? void 0 : openBtn.addEventListener('click', () => {
        isAddingDigital = false;
        toggleModal(true);
    });
    openBtnDigital === null || openBtnDigital === void 0 ? void 0 : openBtnDigital.addEventListener('click', () => {
        isAddingDigital = true;
        toggleModal(true);
    });
    closeBtn === null || closeBtn === void 0 ? void 0 : closeBtn.addEventListener('click', () => toggleModal(false));
    overlay === null || overlay === void 0 ? void 0 : overlay.addEventListener('click', () => toggleModal(false));
}
function showToast(title, message, duration = 3000) {
    const toast = document.getElementById('toast-notification');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-message');
    if (!toast || !tTitle || !tMsg)
        return;
    tTitle.innerText = title;
    tMsg.innerText = message;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, duration);
}
function resetDigitalDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm("Hapus semua data Buku Digital saja?"))
            return;
        try {
            const response = yield fetch("/api/digital-books/delete-all", { method: "DELETE" });
            if (response.ok) {
                showToast("Digital Reset!", "Hanya buku digital yang dikosongkan.");
                yield renderDigitalBooks();
                yield renderAllBooksSorted();
                yield renderDashboard();
                yield updateTotalBooksStat();
                window.location.reload();
            }
        }
        catch (error) {
            showToast("Gagal!", "Terjadi kesalahan.");
        }
    });
}
function resetDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm("PERINGATAN ⚠️ : Semua data buku, daftar pinjaman, dan POIN LOYALITAS akan dihapus permanen!"))
            return;
        try {
            yield fetch("/api/books/delete-all", { method: "DELETE" });
            yield fetch("/api/digital-books/delete-all", { method: "DELETE" });
            yield fetch("/api/stats/reset-all", { method: "DELETE" });
            showToast("Sistem Bersih!", "Semua data dan poin telah kembali ke nol.");
            const pointsDisplay = document.getElementById('loyalty-points');
            const badge = document.getElementById('borrowed-count-badge');
            if (pointsDisplay)
                pointsDisplay.innerText = "0";
            if (badge)
                badge.innerText = "0";
            yield renderBooks();
            yield renderDigitalBooks();
            yield renderAllBooksSorted();
            yield renderBorrowedList();
            yield renderDashboard();
            yield updateLoyaltyInfo();
            window.location.reload();
        }
        catch (error) {
            console.error("Gagal melakukan reset total:", error);
        }
    });
}
function resetPhysicalDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm("Hapus semua data Buku Fisik saja?"))
            return;
        try {
            const response = yield fetch("/api/books/delete-all", { method: "DELETE" });
            if (response.ok) {
                showToast("Physical Reset!", "Hanya buku fisik yang dikosongkan.");
                yield renderBooks();
                yield renderAllBooksSorted();
                yield renderDashboard();
                yield updateTotalBooksStat();
                window.location.reload();
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
window.resetPhysicalDatabase = resetPhysicalDatabase;
function generate5kData() {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btnGenerateRandom');
        if (!btn)
            return;
        btn.disabled = true;
        const originalContent = btn.innerHTML;
        btn.innerHTML = "Sabar Ya!";
        try {
            const response = yield fetch("/api/books/generate", { method: "POST" });
            const result = yield response.json();
            if (response.ok) {
                alert(`Berhasil! 5.000 buku dibuat dalam ${result.duration} detik.`);
                iterativeTime = result.duration;
                updatePerformanceChart();
                btn.innerHTML = `Selesai (${result.duration} Detik)`;
                btn.classList.replace('bg-amber-500', 'bg-green-500');
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.classList.replace('bg-green-500', 'bg-amber-500');
                    btn.disabled = false;
                }, 3000);
                yield renderBooks();
                yield renderAllBooksSorted();
                yield renderDashboard();
            }
        }
        catch (error) {
            console.error("Gagal:", error);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    });
}
function generateDigitalData() {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = document.getElementById('btnGenerateDigital');
        if (!btn)
            return;
        btn.disabled = true;
        const originalContent = btn.innerHTML;
        btn.innerHTML = "Sabar Ya!";
        try {
            const res = yield fetch("/api/digital-books/generate", { method: "POST" });
            const result = yield res.json();
            if (res.ok) {
                alert(`Rekursif Selesai! 5.000 buku digital dibuat dalam ${result.duration} detik.`);
                recursiveTime = result.duration;
                updatePerformanceChart();
                btn.innerHTML = `Selesai (${result.duration} Detik)`;
                btn.classList.replace('bg-indigo-500', 'bg-green-500');
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.classList.replace('bg-green-500', 'bg-indigo-500');
                    btn.disabled = false;
                }, 3000);
                yield renderDigitalBooks();
                yield renderDashboard();
                yield renderAllBooksSorted();
            }
        }
        catch (e) {
            console.error("Gagal generate digital:", e);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    });
}
window.generateDigitalData = generateDigitalData;
function renderDashboard() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("/api/dashboard");
            const json = yield res.json();
            const statNumber = document.getElementById('statNumber');
            const peakValue = document.getElementById('peakValue');
            const totalPeriod = document.getElementById('totalPeriod');
            if (json.chart.data.length > 0) {
                statNumber.innerText = json.chart.data[json.chart.data.length - 1].toString();
                peakValue.innerText = json.meta.peak_value.toString();
                totalPeriod.innerText = `${json.meta.total_5min} Buku`;
            }
            const canvas = document.getElementById('peminjamanChart');
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return;
            if (peminjamanChartInstance)
                peminjamanChartInstance.destroy();
            peminjamanChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: json.chart.labels,
                    datasets: [{
                            data: json.chart.data,
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            fill: true,
                            backgroundColor: 'rgba(99, 102, 241, 0.05)',
                            stepped: true,
                            pointRadius: 0
                        }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 800 },
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, beginAtZero: true }
                    }
                }
            });
        }
        catch (e) {
            console.error(e);
        }
    });
}
const inputCari = document.getElementById('searchInput');
inputCari === null || inputCari === void 0 ? void 0 : inputCari.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const semuaBuku = document.querySelectorAll('.book-card');
    semuaBuku.forEach((buku) => {
        var _a;
        const element = buku;
        const text = ((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        if (text.includes(keyword)) {
            element.style.display = "";
            element.classList.remove('hidden');
        }
        else {
            element.classList.add('hidden');
        }
    });
});
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const btnOpen = document.getElementById('btnOpenSidebar');
const btnClose = document.getElementById('btnCloseSidebar');
const mainContent = document.getElementById('mainContent');
const mainFooter = document.getElementById('mainFooter');
function updatePerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext('2d');
    if (!ctx)
        return;
    if (performanceChartInstance)
        performanceChartInstance.destroy();
    performanceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Iteratif', 'Rekursif'],
            datasets: [{
                    label: 'Waktu (Detik)',
                    data: [iterativeTime, recursiveTime],
                    backgroundColor: ['#f59e0b', '#6366f1'],
                    borderRadius: 12,
                    barThickness: 40
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false }
                },
                x: { grid: { display: false } }
            }
        }
    });
    document.getElementById('iterativeTimeDisplay').innerText = iterativeTime.toFixed(3);
    document.getElementById('recursiveTimeDisplay').innerText = recursiveTime.toFixed(3);
}
function toggleSidebar() {
    sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.toggle('-translate-x-full');
    overlay === null || overlay === void 0 ? void 0 : overlay.classList.toggle('hidden');
    if (window.innerWidth > 1024) {
        mainContent === null || mainContent === void 0 ? void 0 : mainContent.classList.toggle('lg:ml-72');
        mainFooter === null || mainFooter === void 0 ? void 0 : mainFooter.classList.toggle('lg:ml-72');
    }
}
[btnOpen, btnClose, overlay].forEach((el) => {
    el === null || el === void 0 ? void 0 : el.addEventListener('click', toggleSidebar);
});
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        if (document.getElementById('particles-js')) {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 30, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#6366f1" },
                    "opacity": { "value": 0.2 },
                    "size": { "value": 2 },
                    "line_linked": { "enable": true, "distance": 150, "color": "#6366f1", "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": 1 }
                }
            });
        }
        if (document.getElementById('particles-background')) {
            particlesJS('particles-background', {
                "particles": {
                    "number": {
                        "value": 100,
                        "density": { "enable": true, "value_area": 800 }
                    },
                    "color": { "value": "#6366f1" },
                    "shape": {
                        "type": "circle",
                    },
                    "opacity": {
                        "value": 0.4,
                        "random": true
                    },
                    "size": {
                        "value": 3,
                        "random": true
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 150,
                        "color": "#6366f1",
                        "opacity": 0.2,
                        "width": 1
                    },
                    "move": {
                        "enable": true,
                        "speed": 1.5,
                        "direction": "none",
                        "random": true,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false
                    }
                },
                "interactivity": {
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "grab"
                        },
                        "onclick": {
                            "enable": true,
                            "mode": "push"
                        }
                    },
                    "modes": {
                        "grab": {
                            "distance": 200,
                            "line_linked": { "opacity": 0.5 }
                        },
                        "push": { "particles_nb": 4 }
                    }
                },
                "retina_detect": true
            });
        }
    }
}
function setupSlider(containerId, prevBtnId, nextBtnId) {
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (!container || !prevBtn || !nextBtn)
        return;
    const scrollAmount = 200;
    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
}
function renderBorrowedList() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('borrowed-list-container');
        if (!container)
            return;
        const res = yield fetch("/api/books/borrowed");
        const borrowed = yield res.json();
        container.innerHTML = '';
        borrowed.forEach((book) => {
            container.insertAdjacentHTML('beforeend', `
            <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                <img src="${book.image_url}" class="w-10 h-10 rounded-lg object-cover">
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-800 uppercase line-clamp-1">${book.title}</span>
                    <span class="text-[8px] text-indigo-500 font-bold uppercase">${book.type}</span>
                </div>
            </div>
        `);
        });
    });
}
function updateBorrowedBadge() {
    return __awaiter(this, void 0, void 0, function* () {
        const badge = document.getElementById('borrowed-count-badge');
        if (!badge)
            return;
        try {
            const response = yield fetch("/api/books/borrowed-count");
            const data = yield response.json();
            badge.innerText = data.total_borrowed.toString();
            badge.classList.add('scale-125', 'bg-emerald-500');
            setTimeout(() => {
                badge.classList.remove('scale-125', 'bg-emerald-500');
            }, 300);
        }
        catch (error) {
            console.error("Gagal mengambil badge pinjaman:", error);
        }
    });
}
function handleCardClick(id, isDigital, element) {
    const type = isDigital ? "Digital" : "Physical";
    if (isSelectionMode) {
        const overlay = element.querySelector('.selection-overlay');
        const index = selectedItems.findIndex(item => item.id === id && item.isDigital === isDigital);
        if (index > -1) {
            selectedItems.splice(index, 1);
            overlay === null || overlay === void 0 ? void 0 : overlay.classList.add('hidden');
        }
        else {
            selectedItems.push({ id, isDigital });
            overlay === null || overlay === void 0 ? void 0 : overlay.classList.remove('hidden');
        }
    }
    else {
        processBorrow(id, type);
    }
}
window.handleCardClick = handleCardClick;
function toggleDeleteMode(active) {
    isSelectionMode = active;
    selectedItems = [];
    const deleteCountElem = document.getElementById('delete-count');
    if (deleteCountElem)
        deleteCountElem.innerText = "0";
    const btnToggle = document.getElementById('btn-toggle-delete');
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const btnCancel = document.getElementById('btn-cancel-delete');
    if (active) {
        btnToggle === null || btnToggle === void 0 ? void 0 : btnToggle.classList.add('hidden');
        btnConfirm === null || btnConfirm === void 0 ? void 0 : btnConfirm.classList.remove('hidden');
        btnConfirm === null || btnConfirm === void 0 ? void 0 : btnConfirm.classList.add('flex');
        btnCancel === null || btnCancel === void 0 ? void 0 : btnCancel.classList.remove('hidden');
        btnCancel === null || btnCancel === void 0 ? void 0 : btnCancel.classList.add('flex');
    }
    else {
        btnToggle === null || btnToggle === void 0 ? void 0 : btnToggle.classList.remove('hidden');
        btnToggle === null || btnToggle === void 0 ? void 0 : btnToggle.classList.add('flex');
        btnConfirm === null || btnConfirm === void 0 ? void 0 : btnConfirm.classList.add('hidden');
        btnConfirm === null || btnConfirm === void 0 ? void 0 : btnConfirm.classList.remove('flex');
        btnCancel === null || btnCancel === void 0 ? void 0 : btnCancel.classList.add('hidden');
        btnCancel === null || btnCancel === void 0 ? void 0 : btnCancel.classList.remove('flex');
        const overlays = document.querySelectorAll('.selection-overlay');
        overlays.forEach(o => o.classList.add('hidden'));
        const cards = document.querySelectorAll('.book-card');
        cards.forEach(c => c.classList.replace('border-red-500', 'border-transparent'));
    }
}
function executeBulkDelete() {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedItems.length === 0)
            return;
        if (!confirm(`Hapus ${selectedItems.length} buku yang dipilih?`))
            return;
        for (const item of selectedItems) {
            const endpoint = item.isDigital ? `/api/digital-books/delete?id=${item.id}` : `/api/books/delete?id=${item.id}`;
            yield fetch(endpoint, { method: "DELETE" });
        }
        alert("Buku terpilih berhasil dihapus!");
        window.location.reload();
    });
}
function updateTotalBooksStat() {
    return __awaiter(this, void 0, void 0, function* () {
        const display = document.getElementById('total-buku-display');
        if (!display)
            return;
        try {
            const response = yield fetch("/api/stats/total-books");
            const data = yield response.json();
            display.innerText = data.total.toLocaleString('id-ID');
        }
        catch (error) {
            console.error("Gagal mengambil statistik buku:", error);
        }
    });
}
function sendHeartbeat() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fetch("/api/stats/active-visitors");
        }
        catch (e) {
            console.error("Heartbeat failed");
        }
    });
}
function updateActiveVisitors() {
    return __awaiter(this, void 0, void 0, function* () {
        const display = document.getElementById('active-visitors-display');
        if (!display)
            return;
        try {
            const response = yield fetch("/api/stats/active-visitors");
            const data = yield response.json();
            display.innerText = data.active_now.toString();
        }
        catch (error) {
            console.error("Gagal mengambil data pengunjung:", error);
        }
    });
}
function renderExternalNews() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('scroll-news');
        if (!container)
            return;
        try {
            const response = yield fetch("/api/external-news");
            const articles = yield response.json();
            container.innerHTML = '';
            articles.slice(0, 3).forEach((news) => {
                const newsHtml = `
                <div class="group bg-white/50 p-4 rounded-3xl border border-white/80 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" 
                     onclick="window.open('${news.link}', '_blank')"> <div class="relative h-32 rounded-2xl overflow-hidden mb-4 shadow-inner">
                        <img src="${news.image_url || 'https://placehold.co/600x400?text=No+Image'}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"> <div class="absolute top-2 left-2">
                            <span class="text-[7px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-black">Berita Luar</span>
                        </div>
                    </div>
                    <h4 class="font-bold text-xs text-slate-800 leading-snug line-clamp-2">${news.title}</h4>
                    <p class="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${news.pubDate || 'Baru Saja'} </p>
                </div>`;
                container.insertAdjacentHTML('beforeend', newsHtml);
            });
        }
        catch (error) {
            console.error("Gagal memuat berita:", error);
        }
    });
}
function updateLoyaltyInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const pointsDisplay = document.getElementById('loyalty-points');
        const recTimeDisplay = document.getElementById('fib-rec-time');
        const iterTimeDisplay = document.getElementById('fib-iter-time');
        if (!pointsDisplay)
            return;
        try {
            const response = yield fetch("/api/stats/loyalty");
            const data = yield response.json();
            pointsDisplay.innerText = data.points.toLocaleString('id-ID');
            if (recTimeDisplay)
                recTimeDisplay.innerText = data.recursive_sec.toFixed(6) + " s";
            if (iterTimeDisplay)
                iterTimeDisplay.innerText = data.iterative_sec.toFixed(6) + " s";
        }
        catch (error) {
            console.error("Gagal memuat poin loyalitas:", error);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    (_a = document.getElementById('btn-toggle-delete')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => toggleDeleteMode(true));
    (_b = document.getElementById('btn-cancel-delete')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => toggleDeleteMode(false));
    (_c = document.getElementById('btn-confirm-delete')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', executeBulkDelete);
    (_d = document.getElementById('btnResetData')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', resetDatabase);
    (_e = document.getElementById('btnResetDigital')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', resetDigitalDatabase);
    (_f = document.getElementById('btnGenerateRandom')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', generate5kData);
    (_g = document.getElementById('btnGenerateDigital')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', generateDigitalData);
    (_h = document.getElementById('btnSimpanBuku')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', addNewBook);
    const btnSortAsc = document.getElementById('sort-asc');
    const btnSortDesc = document.getElementById('sort-desc');
    btnSortAsc === null || btnSortAsc === void 0 ? void 0 : btnSortAsc.addEventListener('click', () => {
        btnSortAsc.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        btnSortDesc === null || btnSortDesc === void 0 ? void 0 : btnSortDesc.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        renderAllBooksSorted('asc');
    });
    btnSortDesc === null || btnSortDesc === void 0 ? void 0 : btnSortDesc.addEventListener('click', () => {
        btnSortDesc.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        btnSortAsc === null || btnSortAsc === void 0 ? void 0 : btnSortAsc.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        renderAllBooksSorted('desc');
    });
    updateTotalBooksStat();
    renderAllBooksSorted('asc');
    setupModal();
    initParticles();
    fetchInitialNews();
    renderDashboard();
    renderDigitalBooks();
    renderBooks();
    updatePerformanceChart();
    sendHeartbeat();
    updateBorrowedBadge();
    renderExternalNews();
    displayRotatedNews();
    setInterval(() => {
        renderDashboard();
        updateActiveVisitors();
        updateTotalBooksStat();
        updateActiveFooter();
        updateBorrowedBadge();
        updateLoyaltyInfo();
    }, 1000);
    setupSlider('scroll-fisik', 'btn-prev-fisik', 'btn-next-fisik');
    setupSlider('scroll-digital', 'btn-prev-digital', 'btn-next-digital');
    setupSlider('scroll-digital-new', 'btn-prev-digital-new', 'btn-next-digital-new');
    const btnSimpan = document.getElementById('btnSimpanBuku');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', addNewBook);
    }
});
window.switchPage = (pageId) => {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.classList.remove('hidden');
        if (pageId === 'home') {
            setTimeout(() => {
                renderDashboard();
            }, 50);
        }
    }
};
function updateActiveFooter() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('#mainFooter a');
    navLinks.forEach((link) => {
        const anchor = link;
        const href = anchor.getAttribute('href') || '';
        const isHomePath = (currentPath === '/' || currentPath.endsWith('index.html'));
        const isHomeButton = (href === 'index.html' || href === '/');
        const isHomeActive = isHomePath && isHomeButton;
        const isOtherPageActive = href !== '#' && href !== '/' && currentPath.endsWith(href);
        if (isHomeActive || isOtherPageActive) {
            anchor.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-200', 'border-indigo-500');
            anchor.classList.remove('bg-white', 'text-slate-600', 'border-transparent');
            const icon = anchor.querySelector('svg');
            if (icon) {
                icon.classList.add('text-indigo-200');
                icon.classList.remove('text-slate-400');
            }
        }
        else {
            anchor.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-200', 'border-indigo-500');
            anchor.classList.add('bg-white', 'text-slate-600', 'border-transparent');
            const icon = anchor.querySelector('svg');
            if (icon) {
                icon.classList.add('text-slate-400');
                icon.classList.remove('text-indigo-200');
            }
        }
    });
}
window.addEventListener('DOMContentLoaded', updateActiveFooter);
export {};
//# sourceMappingURL=index.js.map