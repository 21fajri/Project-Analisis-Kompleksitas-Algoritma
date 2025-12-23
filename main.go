package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var coverImagePool = []string{
	"https://m.media-amazon.com/images/I/81dae9nZFBS._AC_UF894,1000_QL80_.jpg",
	"https://d1csarkz8obe9u.cloudfront.net/posterpreviews/movie-poster-template-design-21a1c803fe4ff4b858de24f5c91ec57f_screen.jpg?ts=1636996180",
	"https://img.lazcdn.com/g/ff/kf/S121316996c984b42948a4740163fa49d2.jpg_720x720q80.jpg",
	"https://satu.ac.id/bandung/dkv/wp-content/uploads/sites/7/2025/08/Poster-SORE.jpg",
	"https://images-cdn.ubuy.co.id/68901f6ae49b8c404602f009-the-batman-movie-poster-glossy-quality.jpg",
	"https://d1csarkz8obe9u.cloudfront.net/posterpreviews/action-movie-poster-template-design-0f5fff6262fdefb855e3a9a3f0fdd361_screen.jpg?ts=1700270983",
	"https://asset.tabloidbintang.com/img/1762266905_849a0e6c4542d0975d0c.jpeg",
	"https://img.freepik.com/psd-premium/template-poster-film-sinematik-untuk-film-thriller-atau-drama_574474-2444.jpg?semt=ais_hybrid&w=740&q=80",
	"https://upload.wikimedia.org/wikipedia/id/thumb/1/15/Wreckitralphposter.jpeg/250px-Wreckitralphposter.jpeg",
	"https://cdn-web-2.ruangguru.com/landing-pages/assets/833cea83-fa7b-45cf-8186-7df4ef76569d.png",
	"https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRJhoLH8U0IdUaFimdOrZuWO4vOT48y-c-oxxbn5xyMtlgSugJg",
	"https://i.pinimg.com/originals/ee/e7/4d/eee74d7eaa1cb288c295fe79fda2a4db.jpg",
	"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTajk5JDS52aJjou4PLUT-YuLJilCNFcRJtgw&s",
	"https://daengbattala.com/wp-content/uploads/2012/11/WRECKIT-RALPH.jpg",
	"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOP7TaTlktZZdWczNYh9DoJi1HC4NRFM-g7Q&s",
}

var db *sql.DB
var rng *rand.Rand

type Book struct {
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Author   string `json:"author"`
	ImageURL string `json:"image_url"`
}

type Buku struct {
	ID    int    `json:"id"`
	Judul string `json:"judul"`
	Jenis string `json:"jenis"`
}

func recordVisitor(r *http.Request) {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}

	if forward := r.Header.Get("X-Forwarded-For"); forward != "" {
		ip = forward
	}

	query := `
        INSERT INTO visitor_logs (ip_address, last_active) 
        VALUES (?, NOW()) 
        ON DUPLICATE KEY UPDATE last_active = NOW()`

	db.Exec(query, ip)
}

func getRandomCoverURL() string {
	randomIndex := rand.Intn(len(coverImagePool))
	return coverImagePool[randomIndex]
}

func createBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var b Book
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query := "INSERT INTO books (title, author, image_url) VALUES (?, ?, ?)"
	_, err = db.Exec(query, b.Title, b.Author, b.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Buku berhasil ditambahkan"})
}

func createDigitalBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var b Book
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query := "INSERT INTO digital_books (title, author, image_url) VALUES (?, ?, ?)"
	_, err = db.Exec(query, b.Title, b.Author, b.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Buku Digital berhasil ditambahkan"})
}

func getBooks(w http.ResponseWriter, r *http.Request) {
	query := `
        SELECT id, title, author, image_url 
        FROM books 
        WHERE id NOT IN (SELECT book_id FROM borrowed_books WHERE book_type = 'Physical')
    `
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var books []Book
	for rows.Next() {
		var b Book
		err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.ImageURL)
		if err != nil {
			log.Fatal(err)
		}
		books = append(books, b)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(books)
}

func getDashboardData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	query := `
    SELECT 
        DATE_FORMAT(FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(created_at) / 20) * 20), '%H:%i:%s') AS interval_time, 
        COUNT(*) AS total 
    FROM books 
    WHERE created_at >= NOW() - INTERVAL 10 MINUTE
    GROUP BY interval_time
    ORDER BY interval_time ASC
	`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var labels []string
	var counts []int
	var totalAll int
	for rows.Next() {
		var interval string
		var total int
		rows.Scan(&interval, &total)
		labels = append(labels, interval)
		counts = append(counts, total)
		totalAll += total
	}
	json.NewEncoder(w).Encode(map[string]any{
		"chart": map[string]any{
			"labels": labels,
			"data":   counts,
		},
		"meta": map[string]any{
			"total_5min": totalAll,
			"peak_value": getMaxValue(counts),
		},
	})
}

func borrowBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != "POST" {
		return
	}
	var data struct {
		BookID int    `json:"book_id"`
		Type   string `json:"type"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	query := "INSERT INTO borrowed_books (book_id, book_type) VALUES (?, ?)"
	_, err := db.Exec(query, data.BookID, data.Type)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Berhasil meminjam buku"})
}

func getBorrowedBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	query := `
        (SELECT bb.id, b.title, b.image_url, 'Physical' as type FROM borrowed_books bb JOIN books b ON bb.book_id = b.id WHERE bb.book_type = 'Physical')
        UNION
        (SELECT bb.id, d.title, d.image_url, 'Digital' as type FROM borrowed_books bb JOIN digital_books d ON bb.book_id = d.id WHERE bb.book_type = 'Digital')
    `
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var borrowed []map[string]any
	for rows.Next() {
		var id int
		var title, img, bType string
		rows.Scan(&id, &title, &img, &bType)
		borrowed = append(borrowed, map[string]any{
			"id":        id,
			"title":     title,
			"image_url": img,
			"type":      bType,
		})
	}
	json.NewEncoder(w).Encode(borrowed)
}

// MENCARI NILAI TERTINGGI
func getMaxValue(numbers []int) int {
	max := 0
	for _, n := range numbers {
		if n > max {
			max = n
		}
	}
	return max
}

// HANDLER MENGHAPUS SATU BUKU DIGITAL
func deleteDigitalBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID harus disertakan", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("DELETE FROM digital_books WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Buku digital berhasil dihapus"})
}

// HANDLER MENGHAPUS BUKU
func deleteBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID harus disertakan", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("DELETE FROM books WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Buku berhasil dihapus"})
}

// HANDLER MENGHAPUS SEMUA BUKU
func deleteAllBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	_, err := db.Exec("DELETE FROM books")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Semua buku berhasil dihapus"})
}

// HANDLE MENGHAPUS SEMUA BUKU DIGITAL
func deleteAllDigitalBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
	if r.Method == "OPTIONS" {
		return
	}
	_, err := db.Exec("DELETE FROM digital_books")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Semua buku digital berhasil dihapus"})
}

// MEMBUAT 5000 BUKU ITERATIF
func generate5kBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	start := time.Now()
	tx, err := db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	titles := []string{"Misteri", "Teknologi", "Klasik", "Data", "Petualangan", "Dunia"}
	authors := []string{"J.K. Rowling", "George Orwell", "Tolkien", "Asimov", "Harari"}
	batchSize := 5000
	for b := 0; b < 0; b++ {
		query := "INSERT INTO books (title, author, image_url, created_at) VALUES "
		var values []any
		for i := 0; i < batchSize; i++ {
			query += "(?, ?, ?, NOW()),"
			randomTitle := titles[rng.Intn(len(titles))]
			randomAuthor := authors[rng.Intn(len(authors))]
			randomImage := coverImagePool[rng.Intn(len(coverImagePool))]
			bookTitle := fmt.Sprintf("%s %d", randomTitle, (b*batchSize)+i)
			values = append(values, bookTitle, randomAuthor, randomImage)
		}
		query = query[0 : len(query)-1]
		_, err = tx.Exec(query, values...)
		if err != nil {
			tx.Rollback()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	tx.Commit()
	duration := time.Since(start).Seconds()
	json.NewEncoder(w).Encode(map[string]any{
		"status":   "success",
		"duration": duration,
	})
}

// HANDLER GENERATE BUKU DIGITAL SECARA REKURSIF
func generateDigitalRecursive(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	start := time.Now()
	tx, _ := db.Begin()
	insertRecursive(1, 5000, tx)
	tx.Commit()
	duration := time.Since(start).Seconds()
	json.NewEncoder(w).Encode(map[string]any{
		"status":   "success",
		"duration": duration,
		"method":   "recursive",
	})
}

// MENGAMBIL DATA BUKU DIGITAL
func getDigitalBooks(w http.ResponseWriter, r *http.Request) {
	query := `
        SELECT id, title, author, image_url 
        FROM digital_books 
        WHERE id NOT IN (SELECT book_id FROM borrowed_books WHERE book_type = 'Digital')
        ORDER BY id DESC
    `
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var books []Book
	for rows.Next() {
		var b Book
		err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.ImageURL)
		if err != nil {
			log.Fatal(err)
		}
		books = append(books, b)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(books)
}

// FUNGSI REKURSIF //
func insertRecursive(current int, target int, tx *sql.Tx) {
	if current > target {
		return
	}
	titles := []string{"Cyber", "Digital", "Cloud", "AI", "Quantum"}
	randomTitle := titles[rng.Intn(len(titles))]
	bookTitle := fmt.Sprintf("%s Vol.%d", randomTitle, current)
	randomImage := coverImagePool[rng.Intn(len(coverImagePool))]
	query := "INSERT INTO digital_books (title, author, image_url) VALUES (?, 'Digital Library', ?)"
	tx.Exec(query, bookTitle, randomImage)
	insertRecursive(current+1, target, tx)
}

// Handler untuk mengambil total semua buku
func getTotalBooksCount(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	var totalFisik, totalDigital int
	err := db.QueryRow("SELECT COUNT(*) FROM books").Scan(&totalFisik)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = db.QueryRow("SELECT COUNT(*) FROM digital_books").Scan(&totalDigital)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{
		"total": totalFisik + totalDigital,
	})
}

type NewsResponse struct {
	Articles []struct {
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Url         string    `json:"url"`
		UrlToImage  string    `json:"urlToImage"`
		PublishedAt time.Time `json:"publishedAt"`
	} `json:"articles"`
}

func getExternalNews(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	apiKey := "pub_aa1b4b849a5e4fa1b0164210517308e1"
	url := "https://newsdata.io/api/1/news?apikey=" + apiKey + "&q=anime&language=en,id"
	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Gagal koneksi ke server berita", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	var result struct {
		Results []struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			Link        string `json:"link"`
			ImageURL    string `json:"image_url"`
			PubDate     string `json:"pubDate"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		http.Error(w, "Gagal decode data", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(result.Results)
}

func getActiveVisitors(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	recordVisitor(r)
	var count int
	query := "SELECT COUNT(*) FROM visitor_logs WHERE last_active >= NOW() - INTERVAL 15 SECOND"
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"active_now": count})
}

func getBorrowedCount(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM borrowed_books").Scan(&count)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]int{"total_borrowed": count})
}

func returnBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != "DELETE" {
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID kosong", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("DELETE FROM borrowed_books WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Sukses"})
}

func deleteAllBorrowedBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
	if r.Method == "OPTIONS" {
		return
	}
	_, err := db.Exec("DELETE FROM borrowed_books")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Semua data pinjaman berhasil dihapus"})
}

func fibRecursive(n int) int {
	if n <= 1 {
		return n
	}
	return fibRecursive(n-1) + fibRecursive(n-2)
}

func fibIterative(n int) int {
	if n <= 1 {
		return n
	}
	a, b := 0, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

func getLoyaltyStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	var nAsli int
	db.QueryRow("SELECT COUNT(*) FROM borrowed_books").Scan(&nAsli)
	if nAsli == 0 {
		json.NewEncoder(w).Encode(map[string]any{
			"transaction_n": 0,
			"points":        0,
			"recursive_sec": 0,
			"iterative_sec": 0,
		})
		return
	}
	nBenchmark := nAsli
	if nBenchmark < 30 {
		nBenchmark = 30
	} else if nBenchmark > 38 {
		nBenchmark = 38
	}
	startRec := time.Now()
	_ = fibRecursive(nBenchmark)
	durRec := time.Since(startRec).Seconds()
	startIter := time.Now()
	resPoints := fibIterative(nAsli)
	durIter := time.Since(startIter).Seconds()
	json.NewEncoder(w).Encode(map[string]any{
		"transaction_n": nAsli,
		"points":        resPoints,
		"recursive_sec": durRec,
		"iterative_sec": durIter,
	})
}

func resetLoyaltyAndBorrow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != "DELETE" {
		return
	}
	_, err := db.Exec("DELETE FROM borrowed_books")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Semua data berhasil direset"})
}

func main() {
	source := rand.NewSource(time.Now().UnixNano())
	rng = rand.New(source)
	var err error
	db, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/perpustakaan_db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	http.HandleFunc("/api/stats/reset-all", resetLoyaltyAndBorrow)
	http.HandleFunc("/api/stats/loyalty", getLoyaltyStats)
	http.HandleFunc("/api/books/borrowed/delete-all", deleteAllBorrowedBooks)
	http.HandleFunc("/api/books/return", returnBook)
	http.HandleFunc("/api/books/borrowed-count", getBorrowedCount)
	http.HandleFunc("/api/books/borrow", borrowBook)
	http.HandleFunc("/api/books/borrowed", getBorrowedBooks)
	http.HandleFunc("/api/external-news", getExternalNews)
	http.HandleFunc("/api/stats/active-visitors", getActiveVisitors)
	http.HandleFunc("/api/digital-books/delete", deleteDigitalBook)
	http.HandleFunc("/api/digital-books/add", createDigitalBook)
	http.HandleFunc("/api/digital-books/delete-all", deleteAllDigitalBooks)
	http.HandleFunc("/api/digital-books", getDigitalBooks)
	http.HandleFunc("/api/digital-books/generate", generateDigitalRecursive)
	http.HandleFunc("/api/books/generate", generate5kBooks)
	http.HandleFunc("/api/books", getBooks)
	http.HandleFunc("/api/books/add", createBook)
	http.HandleFunc("/api/books/delete", deleteBook)
	http.HandleFunc("/api/books/delete-all", deleteAllBooks)
	http.HandleFunc("/api/dashboard", getDashboardData)
	http.HandleFunc("/api/stats/total-books", getTotalBooksCount)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "pages/index.html")
			return
		}
		if len(r.URL.Path) > 1 && r.URL.Path[len(r.URL.Path)-5:] == ".html" {
			http.ServeFile(w, r, "pages"+r.URL.Path)
			return
		}
		http.FileServer(http.Dir(".")).ServeHTTP(w, r)
	})
	fmt.Println("Server berjalan di http://localhost")
	log.Fatal(http.ListenAndServe(":80", nil))
}
