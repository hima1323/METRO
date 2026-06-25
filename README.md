# India Metro Route Planner 🚇

A modern, high-performance web application to find optimal metro routes across 12 major Indian cities. Built entirely with React, Vite, and Leaflet. 

![India Metro UI](public/screenshots/hero.png)

## 🌟 Features

- **Multi-City Support**: Navigate metro networks in Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Kochi, Jaipur, Lucknow, Ahmedabad, Pune, and Nagpur.
- **Smart Pathfinding algorithms**:
  - **Dijkstra (Min Cost)** - Finds the cheapest route
  - **Dijkstra (Min Distance)** - Finds the shortest route by track length
  - **BFS (Fewest Stops)** - Finds the route with minimum station changes
  - **A* (Heuristic)** - Uses geospatial haversine distance for rapid resolution
- **Interactive Map**: Built on Leaflet with CartoDB Voyager tiles, fully dynamic polylines, and real-time station highlighting.
- **Animated Routes**: Watch your journey map out station-by-station with smooth CSS/JS animations.
- **AI Metro Assistant**:
  - Integrated with **Ollama** (for local Llama 3 models) and **Groq** (for lightning-fast cloud LLM inference).
  - Natural language querying: *"How do I get from India Gate to Red Fort?"*
  - Rule-based fallback if no AI backend is configured.
- **Paradise Stay Theme**: A luxurious, editorial-inspired UI utilizing a deep brown and cream color palette with premium typography (`Playfair Display` & `Inter`) and crisp SVG iconography.

## 🛠 Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Mapping**: Leaflet (`react-leaflet`)
- **Styling**: Vanilla CSS with Design Tokens
- **AI Integration**: Ollama API, Groq API

## 🚀 Quick Start

Ensure you have Node.js (v18+) installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hima1323/METRO.git
   cd METRO
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🤖 AI Assistant Setup

The built-in AI assistant can understand landmarks and station names using natural language.

**Option 1: Ollama (Local & Free)**
1. Install [Ollama](https://ollama.com/).
2. Pull a small model: `ollama run llama3.2`
3. In the app, click the AI FAB (bottom right) > Settings gear.
4. Ensure the backend is set to "Ollama" and the URL is correct.

**Option 2: Groq (Cloud & Fast)**
1. Get a free API key from [Groq](https://console.groq.com/).
2. In the app's AI settings, enter your API key and set the backend to "Groq".

## 📁 Legacy Files

The original C++ terminal-based implementation of this project has been archived in the `/legacy` folder for historical reference.

## 📄 License

This project is open-source.
