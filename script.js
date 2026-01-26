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

// --- AI Analysis Simulation ---
function submitReport() {
    const btn = document.getElementById('submitBtn');
    btn.textContent = "Processing AI Model...";
    btn.disabled = true;

    // Simulate Network Delay
    setTimeout(() => {
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

        // Reset Form for next time
        resetForm();

        // Navigate
        navigateTo('analysis');

    }, 2000);
}

function displayResults(report) {
    document.getElementById('analyzedImage').src = report.image;
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
    list.innerHTML = '';

    // Sort by Coverage (Desc)
    const sortedReports = [...state.reports].sort((a, b) => b.coverage - a.coverage);

    if (sortedReports.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:1rem;">No reports yet.</p>';
        return;
    }

    sortedReports.forEach(report => {
        const item = document.createElement('div');
        // Add class based on status for border color
        let statusClass = 'healthy';
        if (report.status === 'Warning') statusClass = 'warning';
        if (report.status === 'Critical' || report.status === 'Emergency') statusClass = 'critical';

        item.className = `dashboard-item ${statusClass}`;

        const date = new Date(report.timestamp).toLocaleDateString();

        item.innerHTML = `
            <div class="item-info">
                <h4>${report.type} (${report.coverage}% Coverage)</h4>
                <small>Reported: ${date} • Status: ${report.status}</small>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="alert('Marked for cleanup crew!')">Cleanup</button>
        `;
        list.appendChild(item);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    populateCities(); // Init dropdown
    initMap(); // Init map for scroll-based layout

    // --- FORWARD COMPATIBILITY: Force refresh if using old dataset ---
    if (state.reports.length < 15) {
        localStorage.removeItem('reports');
        state.reports = [];
    }

    // Check if we need to load demo data
    if (state.reports.length === 0) {
        state.reports = [
            // NORTH
            { lat: 28.6139, lng: 77.2090, coverage: 65, healthScore: 40, status: 'Critical', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=400' },
            { lat: 34.0837, lng: 74.7973, coverage: 45, healthScore: 55, status: 'Warning', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' },
            { lat: 30.7333, lng: 76.7794, coverage: 15, healthScore: 85, status: 'Healthy', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1570191913384-7b068c291244?q=80&w=400' },
            { lat: 26.8467, lng: 80.9462, coverage: 55, healthScore: 45, status: 'Critical', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1621849400072-f554417f7051?q=80&w=400' },
            { lat: 26.4499, lng: 80.3319, coverage: 70, healthScore: 30, status: 'Critical', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1621849400072-f554417f7051?q=80&w=400' },
            { lat: 27.1767, lng: 78.0081, coverage: 40, healthScore: 60, status: 'Warning', type: 'Canal', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1584288019792-50d4c1f8d424?q=80&w=400' },

            // SOUTH
            { lat: 17.4239, lng: 78.4738, coverage: 80, healthScore: 25, status: 'Emergency', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1612450800052-dc3625fdfd2b?q=80&w=400' }, // Hussainsagar
            { lat: 12.9352, lng: 77.6693, coverage: 95, healthScore: 10, status: 'Emergency', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1584288019792-50d4c1f8d424?q=80&w=400' }, // Bellandur 
            { lat: 13.0012, lng: 80.2565, coverage: 45, healthScore: 55, status: 'Warning', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1533514114760-4389f572ae26?q=80&w=400' }, // Chennai Adyar
            { lat: 9.9312, lng: 76.2673, coverage: 5, healthScore: 98, status: 'Healthy', type: 'Canal', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=400' }, // Kerala Backwaters
            { lat: 11.4102, lng: 76.6950, coverage: 20, healthScore: 80, status: 'Healthy', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Ooty
            { lat: 10.2308, lng: 77.4859, coverage: 10, healthScore: 92, status: 'Healthy', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Kodaikanal

            // WEST
            { lat: 19.1176, lng: 72.9060, coverage: 85, healthScore: 20, status: 'Emergency', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1621849400072-f554417f7051?q=80&w=400' }, // Mumbai Powai
            { lat: 18.5384, lng: 73.7820, coverage: 60, healthScore: 40, status: 'Critical', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400' }, // Pune Pashan
            { lat: 23.0225, lng: 72.5714, coverage: 30, healthScore: 70, status: 'Warning', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1584288019792-50d4c1f8d424?q=80&w=400' }, // Ahmedabad
            { lat: 24.5854, lng: 73.7125, coverage: 15, healthScore: 88, status: 'Healthy', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Udaipur Fateh Sagar
            { lat: 21.1702, lng: 72.8311, coverage: 50, healthScore: 50, status: 'Warning', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1584288019792-50d4c1f8d424?q=80&w=400' }, // Surat

            // EAST & NORTHEAST
            { lat: 22.5726, lng: 88.3639, coverage: 40, healthScore: 60, status: 'Warning', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=400' }, // Kolkata Wetlands
            { lat: 25.5941, lng: 85.1376, coverage: 65, healthScore: 35, status: 'Critical', type: 'River', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=400' }, // Patna Ganga
            { lat: 26.1445, lng: 91.7362, coverage: 75, healthScore: 30, status: 'Critical', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1621849400072-f554417f7051?q=80&w=400' }, // Guwahati Deepor Beel
            { lat: 23.3441, lng: 85.3096, coverage: 25, healthScore: 75, status: 'Warning', type: 'Pond', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Ranchi

            // CENTRAL
            { lat: 23.2599, lng: 77.4126, coverage: 30, healthScore: 70, status: 'Warning', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Bhopal Upper Lake
            { lat: 22.7196, lng: 75.8577, coverage: 40, healthScore: 60, status: 'Warning', type: 'Pond', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }, // Indore
            { lat: 21.1458, lng: 79.0882, coverage: 20, healthScore: 80, status: 'Healthy', type: 'Lake', timestamp: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1580196920985-1158659d4fdd?q=80&w=400' }  // Nagpur
        ];
        localStorage.setItem('reports', JSON.stringify(state.reports));
    }
});
