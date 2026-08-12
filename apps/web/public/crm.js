const ORACLE_DATA =
  window.ORACLE_DATA_BASE ||
  "./data";

const $ = (id) => document.getElementById(id);
const WC = [39.9607, -75.6055];

function miles(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = r(b[0] - a[0]);
  const dLng = r(b[1] - a[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

const store = { properties: [], permits: [], contractors: [] };
const leads = JSON.parse(localStorage.getItem("roofing-leads") || "[]");
let pin = WC.slice();

const map = L.map("map").setView(WC, 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);
const pinMarker = L.marker(pin, { draggable: true }).addTo(map);
pinMarker.on("dragend", () => {
  const ll = pinMarker.getLatLng();
  pin = [ll.lat, ll.lng];
});
map.on("click", (e) => {
  pin = [e.latlng.lat, e.latlng.lng];
  pinMarker.setLatLng(pin);
});
const layer = L.layerGroup().addTo(map);

function saveLeads() {
  localStorage.setItem("roofing-leads", JSON.stringify(leads));
  renderLeads();
}

function renderLeads() {
  $("leads").innerHTML = leads
    .map(
      (l) =>
        `<div class="lead"><strong>${l.address}</strong><br>${l.upi}<br>
        <button data-del="${l.id}">Remove</button></div>`,
    )
    .join("");
  $("leads").onclick = (ev) => {
    const id = ev.target.getAttribute("data-del");
    if (!id) return;
    const i = leads.findIndex((x) => x.id === id);
    if (i >= 0) leads.splice(i, 1);
    saveLeads();
  };
}

function search() {
  const radius = Number($("radius").value);
  const age = Number($("age").value);
  const openOnly = $("open").checked;
  const byProp = new Map();
  for (const p of store.permits) {
    const arr = byProp.get(p.propertyId) ?? [];
    arr.push(p);
    byProp.set(p.propertyId, arr);
  }
  const hits = store.properties
    .map((p) => ({
      p,
      d: miles(pin, [p.lat, p.lng]),
      permits: byProp.get(p.propertyId) ?? [],
    }))
    .filter((h) => h.d <= radius)
    .filter((h) => {
      if (openOnly) {
        return h.permits.some((x) => x.status === "open");
      }
      if (!age) return true;
      return h.p.roofAgeYears != null && h.p.roofAgeYears >= age;
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 80);

  layer.clearLayers();
  L.circle(pin, { radius: radius * 1609.34, color: "#3a7", fillOpacity: 0.05 }).addTo(layer);
  hits.forEach((h) => {
    L.circleMarker([h.p.lat, h.p.lng], { radius: 5, color: "#c45c26" })
      .bindPopup(`${h.p.address}<br>${h.p.upi}`)
      .addTo(layer);
  });
  $("hits").innerHTML = hits
    .map(
      (h) => `<div class="hit" data-id="${h.p.propertyId}">
        <strong>${h.p.address}</strong> · ${h.d.toFixed(1)} mi<br>
        roof ${h.p.roofAgeYears ?? "?"}y · ${h.permits.filter((x) => x.status === "open").length} open
        <button data-lead="${h.p.propertyId}">Add lead</button>
      </div>`,
    )
    .join("");
  $("hits").onclick = (ev) => {
    const id = ev.target.getAttribute("data-lead");
    if (!id) return;
    const h = hits.find((x) => x.p.propertyId === id);
    if (!h) return;
    if (leads.some((l) => l.id === id)) return;
    leads.push({
      id,
      address: h.p.address,
      upi: h.p.upi,
      createdAt: new Date().toISOString(),
    });
    saveLeads();
  };
  $("status").textContent = `${hits.length} matches near pin`;
}

async function boot() {
  store.properties = await (await fetch(`${ORACLE_DATA}/properties.json`)).json();
  store.permits = await (await fetch(`${ORACLE_DATA}/permits.json`)).json();
  try {
    store.contractors = await (await fetch(`${ORACLE_DATA}/contractors.json`)).json();
  } catch {
    store.contractors = [];
  }
  $("status").textContent = `${store.properties.length} Oracle properties loaded`;
  renderLeads();
  search();
}

$("usePin").onclick = search;
$("gps").onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      pin = [pos.coords.latitude, pos.coords.longitude];
      pinMarker.setLatLng(pin);
      map.setView(pin, 12);
      search();
    },
    () => {
      $("status").textContent = "GPS denied; using pin";
    },
  );
};
$("ask").onclick = () => {
  const q = $("q").value.toLowerCase();
  $("open").checked = q.includes("open") && q.includes("permit");
  if (q.includes("five miles") || q.includes("5 miles")) $("radius").value = 5;
  if (q.includes("15")) $("age").value = "15";
  search();
  $("agent").textContent = `Used Oracle Chester artifacts (not a separate vector store). Open-permit filter uses county Act 247 / EnerGov / health GIS; municipal roofing UCC is not in the public harvest. ${$("status").textContent}`;
};

boot();
