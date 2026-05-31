# 🏆 World Cup 2026 Bracket Pool

A premium, visually stunning, interactive web application to run a World Cup 2026 predictor tournament pool with your friends. 

This project is fully initialized and hosted at [ashish-world-cup-2026](https://github.com/ashishfernandez/ashish-world-cup-2026).

---

## ⚽ Rules & Points Engine

This predictor pool is configured using the **Option A Progressive System** plus a custom **Golden Boot Bonus**:

*   **Group Stage Qualifiers:** Predict which teams advance to the Round of 32. Worth **5 points** per correct team (Max: 160 points).
*   **Round of 32:** Predict the winners of the 16 matches. Worth **10 points** per correct pick (Max: 160 points).
*   **Round of 16:** Predict the winners of the 8 matches. Worth **20 points** per correct pick (Max: 160 points).
*   **Quarterfinals:** Predict the 4 semi-finalists. Worth **40 points** per correct pick (Max: 160 points).
*   **Semifinals:** Predict the 2 finalists. Worth **80 points** per correct pick (Max: 160 points).
*   **3rd Place Match:** Predict the 3rd place winner. Worth **40 points** (Max: 40 points).
*   **Championship Final:** Predict the World Cup Champion. Worth **160 points** (Max: 160 points).
*   **Golden Boot Bonus:** Predict the tournament's top scorer. Worth **100 points** (Max: 100 points).

### 🎯 Total Possible Points: 1,100 Pts

> [!IMPORTANT]
> **The "Any-Path" Rule:** Points in the knockout rounds are awarded for a correct team *regardless* of whether they got to that stage via your predicted path. If your predicted team reaches a round, you get the points!

---

## ✨ Features

1.  **Glassmorphic Dark Mode UI:** Ultra-premium aesthetics utilizing deep space-indigo background gradients, glowing borders, custom typography (Outfit & Inter), and micro-animations.
2.  **Interactive Bracket Sheet:** Click on any team slot inside the horizontal scrollable bracket tree to instantly advance that team to the next round with full tree cleanup logic.
3.  **Group Standings Builder:** Drag or sort the standings of Groups A through L to automatically feed and populate the Round of 32 knockout grid.
4.  **Admin Simulator Panel:** A floating console where you can simulate match results or enter official outcomes to watch the friends leaderboard dynamically update and re-rank with CSS transitions!
5.  **Pre-loaded Friends Brackets:** Comes pre-loaded with predictions for 4 friends (**Alex**, **Jordan**, **Taylor**, and **Morgan**) so you can immediately see the rankings and simulated point shifts in action.

---

## 🛠️ Tech Stack & Architecture

To achieve extreme performance, fluid visuals, and zero-configuration setups:
*   **Core Logic:** Modular state-driven Vanilla JavaScript (`app.js`)
*   **Styling & FX:** High-fidelity Vanilla CSS3 (`styles.css`) using custom HSL color tokens and ambient filter effects
*   **Layout Structure:** HTML5 Semantic Grid Layouts (`index.html`)

---

## 🚀 How to Run Locally

Since this app is fully client-side and requires no compile steps or dependencies, you can open and run it instantly:

1.  Clone this repository:
    ```bash
    git clone https://github.com/ashishfernandez/ashish-world-cup-2026.git
    ```
2.  Open the directory:
    ```bash
    cd ashish-world-cup-2026
    ```
3.  Launch **`index.html`** in any web browser, or use a local development server like Live Server or Vite:
    ```bash
    npx serve .
    ```

---

## 👥 Managing Predictions
*   Select your friend from the **"Editing Bracket For"** dropdown on the **Bracket Sheet** or **Group Stages** tabs to modify their predictions.
*   Go to the **Admin Control** tab to simulate tournament outcomes!
