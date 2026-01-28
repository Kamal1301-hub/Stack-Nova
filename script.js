// --- State Management ---
const state = {
    currentReport: {
        image: null,
        lat: null,
        lng: null,
        type: 'Lake',
        coverage: 0,
        healthScore: 0,
        status: 'Healthy',
        timestamp: null
    },
    reports: JSON.parse(localStorage.getItem('reports') || '[]')
};

let mobilenetModel;
async function loadModel() {
    console.log("Loading MobileNet...");
    mobilenetModel = await mobilenet.load();
    console.log("MobileNet Loaded.");
}

// --- One-time Reset for Demo Data ---
if (!localStorage.getItem('demo_cleared')) {
    localStorage.removeItem('reports');
    localStorage.setItem('demo_cleared', 'true');
    window.location.reload();
}

// --- Navigation ---
// --- Navigation ---
function navigateTo(pageId) {
    const target = document.getElementById(pageId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Update Nav Buttons Highlights (Optional: could use IntersectionObserver for scroll spy)
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Simple active state mapping
    if (pageId === 'home') document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
    if (pageId === 'map') {
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active');
        setTimeout(initMap, 500); // Init map after scroll starts
    }
    if (pageId === 'dashboard') {
        document.querySelector('.nav-btn:nth-child(3)').classList.add('active');
        renderDashboard();
    }
}

// --- Camera & File Handling ---
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileElem');
const gallery = document.getElementById('gallery');
const submitBtn = document.getElementById('submitBtn');

function handleFiles(files) {
    const file = files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            state.currentReport.image = reader.result;

            // Show preview
            gallery.innerHTML = `<img src="${reader.result}" alt="Preview">`;

            // Enable submit if location is ready
            checkSubmitReady();
        }

        // Trigger Location Capture
        getLocation();
    }
}

// --- Geolocation ---
function getLocation() {
    const status = document.getElementById('geoStatus');

    if (!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported by your browser';
    } else {
        status.textContent = '📍 Locating...';
        navigator.geolocation.getCurrentPosition(success, error);
    }

    function success(position) {
        state.currentReport.lat = position.coords.latitude;
        state.currentReport.lng = position.coords.longitude;
        status.innerHTML = `<i class='bx bxs-map-pin'></i> Location Locked: ${state.currentReport.lat.toFixed(4)}, ${state.currentReport.lng.toFixed(4)}`;
        status.style.background = '#d1fae5'; // Emerald 100
        status.style.color = '#065f46';
        checkSubmitReady();
    }

    function error() {
        status.innerHTML = `<i class='bx bxs-error-circle'></i> Unable to get location`;
        status.style.background = '#fee2e2'; // Red 100
        status.style.color = '#991b1b';
        // Allow submission even without location for demo purposes? 
        // Let's set a default location for demo (e.g., a lake in a city)
        state.currentReport.lat = 22.5726; // Default Kolkata
        state.currentReport.lng = 88.3639;
        status.innerHTML = `<i class='bx bxs-error-circle'></i> Location failed. Using Demo.`;
        checkSubmitReady();
    }
}

function checkSubmitReady() {
    if (state.currentReport.image && state.currentReport.lat) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Analyze & Submit";
    }
}

function showValidationMessage(message, type) {
    const validationMsg = document.getElementById('validationStatus');
    validationMsg.textContent = message;
    validationMsg.style.display = 'block';
    validationMsg.className = 'validation-message'; // Reset classes

    if (type === 'error') {
        validationMsg.classList.add('error');
    } else if (type === 'success') {
        validationMsg.classList.add('success');
    } else if (type === 'loading') {
        validationMsg.classList.add('loading');
    }
    // Add a timeout to hide messages after a few seconds, except for loading
    if (type !== 'loading') {
        setTimeout(() => {
            validationMsg.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }
}

// --- AI Analysis Simulation ---
async function submitReport() {
    const btn = document.getElementById('submitBtn');
    const validationMsg = document.getElementById('validationStatus');

    if (!mobilenetModel) {
        showValidationMessage("AI Model is still loading... Please wait a few seconds and try again.", "loading");
        return;
    }

    btn.textContent = "Analyzing Image Content...";
    btn.disabled = true;
    showValidationMessage("AI is validating image content...", "loading");

    // First, validate if it's a water body
    const imgElement = gallery.querySelector('img');
    if (!imgElement) {
        showValidationMessage("Please upload an image first.", "error");
        btn.disabled = false;
        btn.textContent = "Analyze & Submit";
        return;
    }

    try {
        const predictions = await mobilenetModel.classify(imgElement);
        console.log('Predictions: ', predictions);

        const waterKeywords = [
            'water', 'river', 'lake', 'ocean', 'sea', 'pond', 'canal', 'stream',
            'shore', 'beach', 'seashore', 'lakeside', 'dam', 'dock', 'pier',
            'bridge', 'valley', 'nature', 'landscape', 'waterfall', 'estuary', 'bay',
            'swamp', 'marsh', 'wetland', 'reservoir', 'delta', 'harbor', 'marina',
            'raft', 'boat', 'ship', 'canoe', 'kayak', 'pier', 'wharf', 'fountain'
        ];

        const isWaterBody = predictions.some(p =>
            waterKeywords.some(kw => p.className.toLowerCase().includes(kw))
        );

        if (!isWaterBody) {
            showValidationMessage("❌ Error: Valid water body not detected. Please upload a photo of a lake, river, or pond.", "error");
            btn.disabled = false;
            btn.textContent = "Analyze & Submit";
            return;
        }

        showValidationMessage("✅ Image Validated: Water body detected.", "success");
        btn.textContent = "Processing AI Analysis...";
    } catch (err) {
        console.error("AI Validation error:", err);
        showValidationMessage("Validation bypass: Model error. Proceeding with analysis...", "loading");
    }

    // Immediate AI Analysis (Calculated locally)
    // Clear validation message before navigating
    validationMsg.style.display = 'none';

    // Mock AI Logic
    // Random coverage between 0 and 100
    const coverage = Math.floor(Math.random() * 100);

    let score = 0;
    let status = '';
    let color = '';

    // "Water Body Health Score Logic"
    if (coverage <= 10) {
        score = 90 + Math.floor(Math.random() * 10); // 90-100
        status = 'Healthy';
        color = 'green';
    } else if (coverage <= 30) {
        score = 60 + Math.floor(Math.random() * 29); // 60-89
        status = 'Warning';
        color = 'yellow';
    } else if (coverage <= 60) {
        score = 30 + Math.floor(Math.random() * 29); // 30-59
        status = 'Critical';
        color = 'orange';
    } else {
        score = Math.floor(Math.random() * 30); // <30
        status = 'Emergency';
        color = 'red';
    }

    // Update State
    state.currentReport.coverage = coverage;
    state.currentReport.healthScore = score;
    state.currentReport.status = status;
    state.currentReport.timestamp = new Date().toISOString();
    state.currentReport.type = document.getElementById('waterType').value;

    // Save to LocalStorage
    state.reports.push({ ...state.currentReport }); // copy
    localStorage.setItem('reports', JSON.stringify(state.reports));

    // Display Results
    displayResults(state.currentReport);

    // Update Dashboard & Map
    renderDashboard();
    updateMapMarkers('all');

    // Reset Form for next time
    resetForm();

    // Navigate
    navigateTo('analysis');
}

function displayResults(report) {
    const img = document.getElementById('analyzedImage');
    if (report.image) {
        img.src = report.image;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    document.getElementById('healthScoreDisplay').textContent = report.healthScore;
    document.getElementById('coverageDisplay').textContent = `${report.coverage}%`;
    document.getElementById('healthStatus').textContent = `Status: ${report.status}`;

    // Dynamic styling
    const ring = document.getElementById('healthRing');
    const advisory = document.getElementById('advisoryText');

    // Reset colors
    ring.style.borderColor = 'var(--primary-color)';

    if (report.status === 'Healthy') {
        ring.style.borderColor = '#2E8B57';
        advisory.textContent = "No immediate action required. Water body is in good condition.";
    } else if (report.status === 'Warning') {
        ring.style.borderColor = '#FFD700';
        advisory.textContent = "Monitor closely. Early signs of Eichhornia detected.";
    } else if (report.status === 'Critical') {
        ring.style.borderColor = '#FF8C00';
        advisory.textContent = "Cleanup Recommended! Infestation is spreading.";
    } else {
        ring.style.borderColor = '#DC143C';
        advisory.textContent = "URGENT ACTION REQUIRED. Ecosystem failure imminent.";
    }
}


function resetForm() {
    gallery.innerHTML = '';
    fileInput.value = '';
    submitBtn.disabled = true;
    // reset currentReport state partially
    state.currentReport = { ...state.currentReport, image: null };
}

// --- Map Integration ---
let map;
let markers = [];
let markerGroup; // Layer group for auto-zoom

// --- City Selector Logic ---
const indianCities = {
    "Delhi": [28.6139, 77.2090],
    "Mumbai": [19.0760, 72.8777],
    "Bangalore": [12.9716, 77.5946],
    "Kolkata": [22.5726, 88.3639],
    "Chennai": [13.0827, 80.2707],
    "Hyderabad": [17.3850, 78.4867],
    "Pune": [18.5204, 73.8567],
    "Ahmedabad": [23.0225, 72.5714],
    "Jaipur": [26.9124, 75.7873],
    "Surat": [21.1702, 72.8311],
    "Lucknow": [26.8467, 80.9462],
    "Kanpur": [26.4499, 80.3319],
    "Nagpur": [21.1458, 79.0882],
    "Patna": [25.5941, 85.1376],
    "Indore": [22.7196, 75.8577],
    "Bhopal": [23.2599, 77.4126],
    "Visakhapatnam": [17.6868, 83.2185],
    "Vadodara": [22.3072, 73.1812],
    "Ludhiana": [30.9010, 75.8573],
    "Agra": [27.1767, 78.0081],
    "Nashik": [19.9975, 73.7898],
    "Ranchi": [23.3441, 85.3096],
    "Raipur": [21.2514, 81.6296],
    "Meerut": [28.9845, 77.7064],
    "Rajkot": [22.3039, 70.8022],
    "Varanasi": [25.3176, 82.9739],
    "Srinagar": [34.0837, 74.7973],
    "Aurangabad": [19.8762, 75.3433],
    "Dhanbad": [23.7957, 86.4304],
    "Amritsar": [31.6340, 74.8723],
    "Allahabad": [25.4358, 81.8463],
    "Gwalior": [26.2183, 78.1828],
    "Jabalpur": [23.1815, 79.9864],
    "Coimbatore": [11.0168, 76.9558],
    "Vijayawada": [16.5062, 80.6480],
    "Jodhpur": [26.2389, 73.0243],
    "Madurai": [9.9252, 78.1198],
    "Kota": [25.2138, 75.8648],
    "Guwahati": [26.1445, 91.7362]
};

function populateCities() {
    const select = document.getElementById('cityFilter');
    if (!select) return;

    // Clear and populate
    select.innerHTML = '<option value="">Select City / State</option>';
    Object.keys(indianCities).sort().forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}

function flyToCity(cityName) {
    if (!cityName) {
        map._cityViewActive = false;
        map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
        return;
    }

    const coords = indianCities[cityName];
    if (coords && map) {
        map._cityViewActive = true;
        map.flyTo(coords, 12, { animate: true, duration: 1.5 });
    }
}

function initMap() {
    if (map) {
        map.invalidateSize();
        updateMapMarkers('all'); // Always refresh markers when re-initializing
        return;
    }

    const container = document.getElementById('map-container');
    if (!container) return;

    map = L.map('map-container').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markerGroup = L.featureGroup().addTo(map);

    updateMapMarkers('all');
}

function updateMapMarkers(filter) {
    if (!markerGroup) return;

    // Clear existing
    markerGroup.clearLayers();
    markers = [];

    state.reports.forEach(report => {
        if (filter === 'critical' && report.status !== 'Critical' && report.status !== 'Emergency') {
            return;
        }

        let color = 'green';
        if (report.status === 'Warning') color = 'gold';
        if (report.status === 'Critical') color = 'orange';
        if (report.status === 'Emergency') color = 'red';

        // AI Infestation Zone (Real Geography Area)
        // Calculated radius: coverage % * 10km (max 100km radius for visualization)
        const zoneRadius = (report.coverage || 10) * 800;

        // Add a primary area circle (The AI-Detected Zone)
        const areaCircle = L.circle([report.lat, report.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3, // Soft heatmap feel
            weight: 2,
            radius: zoneRadius
        });

        // Add a core center marker
        const corePoint = L.circleMarker([report.lat, report.lng], {
            radius: 5,
            color: color,
            fillColor: 'white',
            fillOpacity: 1,
            weight: 2
        });

        const popupContent = `
            <div class="map-popup">
                <span class="badge ${report.status.toLowerCase()}">AI Detected: ${report.status}</span>
                <h4>${report.type} Infestation</h4>
                <p><strong>Predicted Coverage:</strong> ${report.coverage}%</p>
                <p><strong>Impact Area:</strong> ~${(zoneRadius / 1000).toFixed(1)} km radius</p>
                <img src="${report.image}" width="120" style="margin-top:8px;border-radius:8px;">
            </div>
        `;

        areaCircle.bindPopup(popupContent);
        corePoint.bindPopup(popupContent);

        markerGroup.addLayer(areaCircle);
        markerGroup.addLayer(corePoint);
        markers.push(areaCircle);
    });

    if (markers.length > 0 && !map._cityViewActive) {
        map.fitBounds(markerGroup.getBounds(), { padding: [80, 80] });
    } else if (!map._cityViewActive) {
        map.setView([20.5937, 78.9629], 5);
    }
}

function filterMap(type) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

    if (type === 'all') {
        document.querySelector('.filter-chip:nth-child(1)').classList.add('active');
        updateMapMarkers('all');
    } else {
        document.querySelector('.filter-chip:nth-child(2)').classList.add('active');
        updateMapMarkers('critical');
    }
}

// --- Dashboard Logic ---
function renderDashboard() {
    const list = document.getElementById('dashboardList');
    const statsContainer = document.getElementById('dashStats');
    if (!list || !statsContainer) return;

    list.innerHTML = '';

    // Calculate Stats
    const total = state.reports.length;
    const priority1 = state.reports.filter(r => r.status === 'Emergency' || r.status === 'Critical').length;
    const cleared = state.reports.filter(r => r.coverage < 10).length;

    statsContainer.innerHTML = `
        <div class="dash-stat">
            <span class="label">Total Incidents</span>
            <span class="value">${total}</span>
        </div>
        <div class="dash-stat critical">
            <span class="label">Priority Action</span>
            <span class="value">${priority1}</span>
        </div>
        <div class="dash-stat resolved">
            <span class="label">Healthy Zones</span>
            <span class="value">${cleared}</span>
        </div>
    `;

    // Sort by Coverage (Desc)
    const sortedReports = [...state.reports].sort((a, b) => b.coverage - a.coverage);

    if (sortedReports.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:2rem;">No reports found in the database.</p>';
        return;
    }

    sortedReports.forEach((report, index) => {
        const item = document.createElement('div');
        const statusClass = report.status.toLowerCase();

        item.className = `dashboard-item ${statusClass}`;

        const date = new Date(report.timestamp).toLocaleDateString();

        item.innerHTML = `
            <img src="${report.image}" class="item-thumb" alt="Water Body">
            <div class="item-main">
                <span class="badge ${statusClass}">${report.status}</span>
                <h4>${report.type} at Lat: ${report.lat.toFixed(2)}, Lng: ${report.lng.toFixed(2)}</h4>
                <small><i class='bx bx-calendar'></i> Reported ${date} • <strong>${report.coverage}% Coverage</strong></small>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm btn-primary" onclick="alert('Dispatch team notified!')">Dispatch</button>
                <button class="btn btn-sm btn-secondary" onclick="resolveReport(${index})">Clear</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function resolveReport(index) {
    if (confirm("Mark this zone as cleared? It will be archived.")) {
        state.reports.splice(index, 1);
        localStorage.setItem('reports', JSON.stringify(state.reports));
        renderDashboard();
        updateMapMarkers('all');
    }
}

function filterDash() {
    const q = document.getElementById('dashSearch').value.toLowerCase();
    const items = document.querySelectorAll('.dashboard-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(q) ? 'grid' : 'none';
    });
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.reports));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ecoguard_reports.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}




// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    populateCities(); // Init dropdown
    initMap(); // Init map for scroll-based layout
    renderDashboard(); // Ensure dashboard is populated on load
    // initComparisonSlider(); // Removed


    loadModel(); // Load MobileNet in background
});
