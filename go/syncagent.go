package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	currentProcess *os.Process // Holds the currently running Flask process
	mutex          sync.Mutex  // Ensures thread-safe operations
	upgrader       = websocket.Upgrader{}
	logClients     = make(map[*websocket.Conn]bool) // Track connected WebSocket clients
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	mutex.Lock()
	defer mutex.Unlock()

	// Parse the uploaded file
	err := r.ParseMultipartForm(10 << 20) // 10MB max size
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Backup the existing file
	if _, err := os.Stat("file.ipynb"); err == nil {
		os.Rename("file.ipynb", "file_backup.ipynb")
	}

	// Save the new file
	out, err := os.Create("file.ipynb")
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		http.Error(w, "Error writing file", http.StatusInternalServerError)
		return
	}

	// Kill the current Flask process (if any)
	if currentProcess != nil {
		currentProcess.Kill()
		currentProcess = nil
	}

	// Start a new Flask process
	cmd := exec.Command("python", "file.ipynb")
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	// Stream logs to WebSocket clients
	go streamLogs(stdout)
	go streamLogs(stderr)

	err = cmd.Start()
	if err != nil {
		http.Error(w, "Error starting Flask server", http.StatusInternalServerError)
		return
	}

	currentProcess = cmd.Process
	w.Write([]byte("File uploaded and Flask server restarted successfully"))
}

func streamLogs(pipe io.ReadCloser) {
	buffer := make([]byte, 1024)
	for {
		n, err := pipe.Read(buffer)
		if err != nil {
			break
		}

		log := string(buffer[:n])
		broadcastLog(log)
	}
}

func broadcastLog(log string) {
	mutex.Lock()
	defer mutex.Unlock()

	for client := range logClients {
		err := client.WriteMessage(websocket.TextMessage, []byte(log))
		if err != nil {
			client.Close()
			delete(logClients, client)
		}
	}
}

func logsWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not open WebSocket connection", http.StatusBadRequest)
		return
	}

	mutex.Lock()
	logClients[conn] = true
	mutex.Unlock()

	// Close connection on exit
	defer func() {
		mutex.Lock()
		delete(logClients, conn)
		mutex.Unlock()
		conn.Close()
	}()
}

func main() {
	http.HandleFunc("/upload", uploadHandler)
	http.HandleFunc("/logs", logsWebSocketHandler)

	fmt.Println("Server starting on port 8080...")
	http.ListenAndServe(":8080", nil)
}
