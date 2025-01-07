package main

import (
	"fmt"
	"math/rand"
	"net/http"
)

func main() {
	// rand.Seed(time.Now().UnixNano()) // Seed the random number generator

	// Predefined list of classes
	classes := []string{
		"circle-spin-1", "circle-spin-2", "circle-spin-3", "circle-spin-4",
		"circle-spin-5", "circle-spin-6", "circle-spin-7", "circle-spin-8",
		"circle-grow-1", "circle-pulse-1", "circle-rotate-1-horizontal", "circle-rotate-1-vertical",
		"circle-packman-1", "square-spin-1", "square-spin-2", "square-spin-3",
		"square-rotate-1-horizontal", "square-rotate-1-vertical", "square-rotate-2", "square-move-1",
		"square-move-2", "square-move-3", "square-fill-1", "line-1-horizontal",
		"line-1-vertical", "line-2-horizontal", "line-2-vertical", "line-3-horizontal",
		"line-3-vertical", "arrow-1-up", "arrow-1-right", "arrow-1-down",
		"arrow-1-left", "plus-1", "misc-1-horizontal", "misc-1-vertical",
		"typing-1",
	}

	// Handler for the /div endpoint
	http.HandleFunc("/div", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)

		// Select a random class
		randomClass := classes[rand.Intn(len(classes))]

		// Return the div with a random class
		div := fmt.Sprintf(`<div class="%s"></div>`, randomClass)
		w.Write([]byte(div))
	})

	// Handler for the /random-string endpoint
	http.HandleFunc("/random-string", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json") //consider switching to text/plain
		w.WriteHeader(http.StatusOK)

		// Select a random string
		randomStrings := []string{
			"Connecting to hivemind",
			"Contacting aliens",
			"Performing black magic",
			"Booting up skynet",
			"Entering mainframe",
			"Loading quantum detangler",
			"Rebooting Dave's laptop",
			"Performing time warp",
			"Reconfiguring solar system",
			"Insert funny joke here",
			"Loading a sense of humour",
			"Your time is very important to us. Please wait while we ignore you",
			"Please wait while the intern refills the coffee machine",
			"Please wait while we attempt to fix the universe",
			"You are number 2843684714 in the queue",
			"Bypassing control of the matter-antimatter integrator",
			"Running with scissors",
			"Reading Terms and Conditions for you",
			"Mining some bitcoin, one sec",
			"Feel free to spin in your chair",
			"It says gullible on the ceiling",
			"Looking for sense of humour, please hold on",
			"turning it off and on again",
			"being extremely nonchalant",
			"Please wait while we fix the coffee machine",
			"Upgrading Windows, grab a snack",
			"We are cooking right now, please wait",
			"windows xp is rebooting",
			"repositioning bytecamp satellites",
			"Just count to 10",
			"Creating time-loop inversion field",
			"Let's take a mindfulness minute",
			"Computing the secret to life",
			"Please wait for the coffee machine",
			"should we start including ads?",
			"You are number 703 in the queue",
			"One mississippi, two mississippi",
			"Preventing robot uprising",
			"Judging your search history",
			"Simulating progress to keep you entertained",
			"Applying virtual duct tape",
			"cutting corners",
			"Programming so smooth, butter takes notes",
			"Working hard... unlike someone here",
		}
		randomString := randomStrings[rand.Intn(len(randomStrings))]

		// Return the random string as JSON
		w.Write([]byte(fmt.Sprintf(`%s`, randomString)))
	})

	// Start the server
	fmt.Println("trolling service is running on http://localhost:6969")
	http.ListenAndServe(":6969", nil)
}
