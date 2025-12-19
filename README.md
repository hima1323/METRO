## Delhi Metro Route Planner (C++)

This is a C++ console application that takes the **source** and **destination** stations of the Delhi Metro and shows:

- **Cheapest route** (minimum fare)
- **Fastest route** (shortest distance)
- **Estimated travel time** for each route
- **Alternate route suggestions** (cost-based vs distance-based)
- **Round-trip options** (cheapest and fastest there-and-back)

Internally, the metro network is modeled as a **graph**:

- **Nodes**: metro stations (with line colors)
- **Edges**: connections between stations with **cost** and **distance**
- Algorithms: Dijkstra-style shortest path on cost and distance

### Build & Run (macOS / Linux)

From the `METRO` directory:

```bash
cd /Users/prince_13/Documents/farzi/METRO
g++ project.cpp -std=c++17 -o project
./project
```

Make sure the following files stay in the **same folder** as `project.cpp` / `project`:

- `Home.txt`
- `map.txt`
- `Exit.txt`

These are used to show the menu, map, and exit screen.

### Main Features

- **List stations** with numeric IDs
- **View network** of all station connections (cost + distance)
- **Cheapest path**: minimum fare between two stations
- **Fastest path**: minimum distance between two stations
- **Time estimates**: distance converted to minutes using an average speed
- **Alternate routes**:
  - After cheapest route, optionally show an alternate shortest-distance route
  - After fastest route, optionally show an alternate cheapest-cost route
- **Round trip**:
  - Cheapest round trip (outbound + return by minimum cost)
  - Fastest round trip (outbound + return by minimum distance)

### Menu Options (in the app)

- `1` – Display list of stations
- `2` – See network of stations
- `3` – Complete map of metro lines (ASCII map)
- `4` – Cheapest way to reach your destination
- `5` – Fastest way to reach your destination
- `6` – Cheapest round-trip (there and back)
- `7` – Fastest round-trip (there and back)
- `-1` – Add stations (admin only)
- `0` – Exit

### Repository

This code is intended to be pushed to the GitHub repository [`hima1323/METRO`](https://github.com/hima1323/METRO).
