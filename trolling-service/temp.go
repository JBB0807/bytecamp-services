package main

//uncomment but comment the other one
// import (
// 	"fmt"
// 	"math/rand"
// 	"net/http"
// )

// func main() {
// 	// Predefined list of classes
// 	classes := []string{
// 		"circle-spin-1", "circle-spin-2", "circle-spin-3", "circle-spin-4",
// 		"circle-spin-5", "circle-spin-6", "circle-spin-7", "circle-spin-8",
// 		"circle-grow-1", "circle-pulse-1", "circle-rotate-1-horizontal", "circle-rotate-1-vertical",
// 		"circle-packman-1", "square-spin-1", "square-spin-2", "square-spin-3",
// 		"square-rotate-1-horizontal", "square-rotate-1-vertical", "square-rotate-2", "square-move-1",
// 		"square-move-2", "square-move-3", "square-fill-1", "line-1-horizontal",
// 		"line-1-vertical", "line-2-horizontal", "line-2-vertical", "line-3-horizontal",
// 		"line-3-vertical", "arrow-1-up", "arrow-1-right", "arrow-1-down",
// 		"arrow-1-left", "plus-1", "misc-1-horizontal", "misc-1-vertical",
// 		"typing-1",
// 	}

// 	// Middleware to handle CORS and preflight requests
// 	corsMiddleware := func(next http.Handler) http.Handler {
// 		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			w.Header().Set("Access-Control-Allow-Origin", "*")
// 			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
// 			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

// 			// Handle preflight request
// 			if r.Method == http.MethodOptions {
// 				w.WriteHeader(http.StatusOK)
// 				return
// 			}

// 			next.ServeHTTP(w, r)
// 		})
// 	}

// 	// Handler for the /div endpoint
// 	divHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		w.Header().Set("Content-Type", "text/html")
// 		w.WriteHeader(http.StatusOK)

// 		// Select a random class
// 		randomClass := classes[rand.Intn(len(classes))]

// 		// Return the div with a random class
// 		div := fmt.Sprintf(`<div class="%s"></div>`, randomClass)
// 		w.Write([]byte(div))
// 	})

// 	// Handler for the /random-string endpoint
// 	randomStringHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		w.Header().Set("Content-Type", "application/json")
// 		w.WriteHeader(http.StatusOK)

// 		// Select a random string
// 		randomStrings := []string{"Hello, world!", "Go is awesome!", "Have a great day!", "Keep learning!", "Randomness is fun!"}
// 		randomString := randomStrings[rand.Intn(len(randomStrings))]

// 		// Return the random string as JSON
// 		w.Write([]byte(fmt.Sprintf(`{"random_string": "%s"}`, randomString)))
// 	})

// 	// Create a new ServeMux and apply middleware
// 	mux := http.NewServeMux()
// 	mux.Handle("/div", divHandler)
// 	mux.Handle("/random-string", randomStringHandler)

// 	// Wrap the mux with the CORS middleware
// 	fmt.Println("Server is running on http://localhost:8080")
// 	http.ListenAndServe(":8080", corsMiddleware(mux))
// }
