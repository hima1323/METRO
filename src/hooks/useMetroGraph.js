import { useState, useCallback, useRef } from 'react';

function buildGraph(city) {
  const graph = {};
  Object.keys(city.stations).forEach(k => { graph[k] = []; });
  (city.edges || []).forEach(([a, b, dist, cost]) => {
    if (!graph[a]) graph[a] = [];
    if (!graph[b]) graph[b] = [];
    graph[a].push({ to: b, dist, cost });
    graph[b].push({ to: a, dist, cost });
  });
  return graph;
}

function getFare(distance) {
  if (distance <= 2) return 10;
  if (distance <= 5) return 20;
  if (distance <= 12) return 30;
  if (distance <= 21) return 40;
  if (distance <= 32) return 50;
  return 60;
}

function dijkstra(graph, start, end, weight) {
  const dist = {}, prev = {}, visited = new Set();
  Object.keys(graph).forEach(k => { dist[k] = Infinity; prev[k] = null; });
  dist[start] = 0;
  const pq = [[0, start]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === end) break;
    (graph[u] || []).forEach(({ to, dist: edgeDist, cost }) => {
      const w = weight === 'cost' ? cost : edgeDist;
      const nd = d + w;
      if (nd < dist[to]) { dist[to] = nd; prev[to] = u; pq.push([nd, to]); }
    });
  }
  if (dist[end] === Infinity) return null;
  const path = []; let cur = end;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  const totalDist = path.reduce((acc, n, i) => {
    if (i === 0) return acc;
    const e = (graph[path[i-1]] || []).find(x => x.to === n);
    return acc + (e ? e.dist : 0);
  }, 0);
  return { path, distance: totalDist, cost: getFare(totalDist) };
}

function bfs(graph, start, end) {
  const prev = {}, visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const u = queue.shift();
    if (u === end) break;
    (graph[u] || []).forEach(({ to }) => {
      if (!visited.has(to)) { visited.add(to); prev[to] = u; queue.push(to); }
    });
  }
  if (!prev[end] && start !== end) return null;
  const path = []; let cur = end;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  const totalDist = path.reduce((acc, n, i) => {
    if (i === 0) return acc;
    const e = (graph[path[i-1]] || []).find(x => x.to === n);
    return acc + (e ? e.dist : 0);
  }, 0);
  return { path, distance: totalDist, cost: getFare(totalDist) };
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function aStar(graph, start, end, stations) {
  const h = (n) => {
    const [la1, lg1] = stations[n]?.[0] || [0,0];
    const [la2, lg2] = stations[end]?.[0] || [0,0];
    return haversine(la1, lg1, la2, lg2);
  };
  const gScore = {}, fScore = {}, prev = {}, open = new Set([start]);
  Object.keys(graph).forEach(k => { gScore[k] = Infinity; fScore[k] = Infinity; prev[k] = null; });
  gScore[start] = 0; fScore[start] = h(start);
  while (open.size) {
    let u = [...open].reduce((a, b) => fScore[a] < fScore[b] ? a : b);
    if (u === end) break;
    open.delete(u);
    (graph[u] || []).forEach(({ to, dist }) => {
      const tg = gScore[u] + dist;
      if (tg < gScore[to]) { prev[to] = u; gScore[to] = tg; fScore[to] = tg + h(to); open.add(to); }
    });
  }
  if (gScore[end] === Infinity) return null;
  const path = []; let cur = end;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  const totalDist = path.reduce((acc, n, i) => {
    if (i === 0) return acc;
    const e = (graph[path[i-1]] || []).find(x => x.to === n);
    return acc + (e ? e.dist : 0);
  }, 0);
  return { path, distance: totalDist, cost: getFare(totalDist) };
}

export function useMetroGraph() {
  const [animatedPath, setAnimatedPath] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimers = useRef([]);

  const findRoute = useCallback((city, src, dest, algo) => {
    if (!city || !src || !dest) return null;
    const graph = buildGraph(city);
    if (algo === 'dijkstra-cost') return dijkstra(graph, src, dest, 'cost');
    if (algo === 'dijkstra-dist') return dijkstra(graph, src, dest, 'dist');
    if (algo === 'bfs') return bfs(graph, src, dest);
    if (algo === 'astar') return aStar(graph, src, dest, city.stations);
    return dijkstra(graph, src, dest, 'cost');
  }, []);

  const animatePath = useCallback((path, delay = 350) => {
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
    setAnimatedPath([]);
    setIsAnimating(true);
    path.forEach((node, i) => {
      const t = setTimeout(() => {
        setAnimatedPath(prev => [...prev, node]);
        if (i === path.length - 1) setIsAnimating(false);
      }, i * delay);
      animTimers.current.push(t);
    });
  }, []);

  const clearAnimation = useCallback(() => {
    animTimers.current.forEach(clearTimeout);
    setAnimatedPath([]);
    setIsAnimating(false);
  }, []);

  return { findRoute, animatePath, clearAnimation, animatedPath, isAnimating };
}
