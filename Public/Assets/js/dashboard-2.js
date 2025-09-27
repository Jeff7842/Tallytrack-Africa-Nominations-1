// Dashboard JavaScript with Supabase integration

// DOM Elements
const header = document.getElementById("header");
const contentArea = document.querySelector(".content-area");
const SCROLL_THRESHOLD = 100;
const categorySidebar = document.getElementById("category-sidebar");
const dashboardSection = document.getElementById("dashboard");
const categoryPage = document.getElementById("category-page");
const categoryTitle = document.getElementById("category-title");
const categoryDescription = document.getElementById("category-description");
const popularScroller = document.querySelectorAll(".nominees-scroller")[0];
const recentScroller = document.querySelectorAll(".nominees-scroller")[1];
const allVotesGrid = document.querySelector(".all-votes-grid");
const categoryNomineesGrid = document.getElementById("category-nominees");
const categoryItems = document.querySelectorAll(".category-item");
const genderFilter = document.getElementById("gender-filter");
const sortFilter = document.getElementById("sort-filter");
const searchInput = document.getElementById("nominee-search");

// Global variables
let nomineesData = [];
let currentCategory = "dashboard";

// Initialize the dashboard
async function initDashboard() {
  try {
    // Show loaders while fetching
    showStatLoaders();                 // <-- new: show stat skeletons
    showLoaders(allVotesGrid, 9);
    showLoaders(popularScroller, 5);
    showLoaders(recentScroller, 5);

    // Load nominees from Supabase
    await loadNominees();
    
    // Update stats
    updateStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Populate initial views
    updateDashboardViews();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    // Fallback to sample data if Supabase fails
    loadSampleData();
  }
  function showLoaders(container, count = 6) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="loader-card" aria-hidden="true">
        <div class="photo loader-shimmer"></div>
        <div class="meta">
          <div class="line name"></div>
          <div class="line category"></div>
          <div class="line votes"></div>
          <div class="line bar"></div>
          <div class="action"></div>
        </div>
      </div>
    `;
  }
}

}

/* ---------- Stats skeleton helpers ---------- */

function showStatLoaders() {
  const ids = ['total-votes', 'total-nominees', 'total-categories'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // If the page already has loader spans (from the HTML change above), do nothing.
    // Otherwise insert loader placeholders (safe fallback).
    if (!el.querySelector('.stat-loader-number')) {
      el.innerHTML = `
        <span class="stat-loader-icon" aria-hidden="true"></span>
        <span class="stat-loader-number" aria-hidden="true"></span>
        <span class="stat-value-text" style="display:none" aria-hidden="false">0</span>
      `;
    }
    el.setAttribute('aria-busy', 'true');
    // remove any pre-existing 'loaded' class
    el.classList.remove('loaded');
  });
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  // Ensure there's a visible text span to receive the number
  let textSpan = el.querySelector('.stat-value-text');
  if (!textSpan) {
    textSpan = document.createElement('span');
    textSpan.className = 'stat-value-text';
    el.appendChild(textSpan);
  }
  // put the formatted value
  textSpan.textContent = value;
  textSpan.style.display = ''; // show it

  // remove the loader placeholders if present
  el.querySelectorAll('.stat-loader-number, .stat-loader-icon').forEach(n => n.remove());

  // mark as loaded for any CSS hooks
  el.classList.add('loaded');
  el.setAttribute('aria-busy', 'false');
}

// Load nominees from Supabase
async function loadNominees() {
  const { data, error } = await window.supabase
    .from('nominees')
    .select('*')
    .order('votes', { ascending: false });

  if (error) {
    console.error("Error loading nominees:", error);
    throw error;
  }


  // Normalize fields so rest of code can rely on `image` and `category_slug`
  nomineesData = data.map(n => {
    const rawCategory = String(n.category || n.category_name || '').trim();
    const slug = rawCategory
      .toLowerCase()
      .replace(/\s*&\s*/g, '-and-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // optional mapping if DB stores full display names
    const map = {
      'philanthropist-of-the-year': 'philanthropist',
      'brand-ambassador-of-the-year': 'ambassador',
      // add more mappings if you need them
    };

    return {
      ...n,
      image: n.image || n.image_url || n.photo || n.picture || '',
      category_slug: map[slug] || slug || '',
    };
  });

  // ✅ Now that nomineesData is ready, check URL params
  const params = new URLSearchParams(window.location.search);
  const nomineeId = params.get("nominee");
  if (nomineeId) {
    console.log("Auto-opening nominee from link:", nomineeId);
    openVotingModal(nomineeId);
  }

  // Fill your nominees grid
  populateGrid(categoryNomineesGrid, nomineesData);

  // ✅ Update sidebar counts
  updateSidebarCounts();
  return data;
}


// Fallback to sample data
function loadSampleData() {
  nomineesData = [
    // Your existing sample data here
  ];
  updateStats();
  updateDashboardViews();
}

// Update statistics
function updateStats() {
  // Calculate total votes
  const totalVotes = nomineesData.reduce(
    (sum, nominee) => sum + nominee.votes,
    0
  );
  document.getElementById("total-votes").textContent =
    totalVotes.toLocaleString();

  // Set total nominees
  document.getElementById("total-nominees").textContent =
    nomineesData.length;

  // Set total categories (count unique categories)
  const uniqueCategories = new Set(
    nomineesData.map((nominee) => nominee.category)
  );
  document.getElementById("total-categories").textContent =
    uniqueCategories.size;
}

// Update dashboard views
function updateDashboardViews() {
  // Populate popular votes (top 5 by votes)
  const popularNominees = [...nomineesData]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);
  populateScroller(popularScroller, popularNominees);

  // Populate recent votes (last 5 added, simulated by id)
  const recentNominees = [...nomineesData]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);
  populateScroller(recentScroller, recentNominees);

  // Populate all votes (first 15)
  const allNominees = nomineesData.slice(0, 15);
  populateGrid(allVotesGrid, allNominees);
}

window.openVotingModal = function(nomineeId) {
  // Make sure both are compared as strings
  const nominee = nomineesData.find(n => String(n.id) === String(nomineeId));
  
  if (!nominee) {
    console.warn('Nominee not found for id', nomineeId, 'Available:', nomineesData.map(n => n.id));
    return;
  }

  const votingModal = document.getElementById('voting-modal');
  votingModal.querySelector('.nominee-image').src = nominee.image || '';
  votingModal.querySelector('.nominee-image').alt = nominee.name || '';
  votingModal.querySelector('.nominee-name').textContent = nominee.name || '';
  votingModal.querySelector('.nominee-category').textContent = getCategoryName(nominee.category_slug || nominee.category);
  votingModal.querySelector('.nominee-id span').textContent = nominee.id || 'N/A';

  // Reset votes + phone
  const voteInput = document.getElementById("vote-count");
  const summaryVotes = document.getElementById("summary-votes");
  const totalAmount = document.getElementById("total-amount");
  let votes = 1;
  voteInput.value = votes;
  summaryVotes.textContent = String(votes);
  totalAmount.textContent = `KES ${votes * 10}`;
  const phone = document.getElementById('phone');
  if (phone) phone.value = '';

  votingModal.classList.add('active');
}


// Populate a scroller with nominee cards
function populateScroller(scroller, nominees) {
  scroller.innerHTML = "";

  nominees.forEach((nominee) => {
    const percentage = Math.round((nominee.votes / 100000) * 100);

    const card = document.createElement("div");
    card.className = "nominee-card";
    card.innerHTML = `
      <div class="nominee-photo">
  ${
    nominee.image
      ? `<img src="${nominee.image}" alt="${nominee.name}" class="nominee-image" onerror="this.style.display='none'; this.parentElement.querySelector('.placeholder').style.display='flex';">
         <div class="placeholder" style="display:none;"><i class="fas fa-user fa-3x"></i></div>`
      : `<div class="placeholder"><i class="ti ti-user-filled"></i></div>`
  }
</div>
      <div class="nominee-content">
        <h3 class="nominee-name">${nominee.name}</h3>
        <p class="nominee-category">${getCategoryName(nominee.category_slug)}</p>
        <div class="vote-count">
          <i class="fas fa-vote-yea"></i>
          <span>${nominee.votes.toLocaleString()} votes</span>
        </div>
        <div class="share-link share-button" data-id="${nominee.id}">
       <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-copy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg> Copy
       </div>
        <div class="vote-bar">
          <div class="vote-fill" style="width: ${percentage}%"></div>
        </div>
        <button class="vote-btn" data-id="${nominee.id }">Vote Now</button>
      </div>
      <div class="nominee-description">
        <p>${nominee.description || "No description available"}</p>
      </div>
    `;

    scroller.appendChild(card);
  });
}

// Populate a grid with nominee cards
function populateGrid(grid, nominees) {
  grid.innerHTML = "";

  nominees.forEach((nominee) => {
    const percentage = Math.round((nominee.votes / 100000) * 100);

    const card = document.createElement("div");
    card.className = "nominee-card";
    card.innerHTML = `
      <div class="nominee-photo">
  ${
    nominee.image
      ? `<img src="${nominee.image}" alt="${nominee.name}" class="nominee-image" onerror="this.style.display='none'; this.parentElement.querySelector('.placeholder').style.display='flex';">
         <div class="placeholder" style="display:none;"><i class="ti ti-user-filled"></i></div>`
      : `<div class="placeholder"><i class="ti ti-user-filled"></i></div>`
  }
</div>
      <div class="nominee-content">
        <h3 class="nominee-name">${nominee.name}</h3>
        <p class="nominee-category">${getCategoryName(nominee.category_slug)}</p>
        <div class="vote-count">
          <i class="fas fa-vote-yea"></i>
          <span>${nominee.votes.toLocaleString()} votes</span>
        </div>
        <div class="share-link share-button" data-id="${nominee.id}">
  <svg  xmlns="http://www.w3.org/2000/svg" style="top:-30px;" width="24"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-copy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg> Copy
</div>

        <div class="vote-bar">
          <div class="vote-fill" style="width: ${percentage}%"></div>
        </div>
        <button class="vote-btn" data-id="${nominee.id}">Vote Now</button>
      </div>
      
    `;

    grid.appendChild(card);
  });
}



// --- Data normalization helpers ---
function toSlug(val) {
  if (!val) return "";
  return String(val).toLowerCase().trim()
    .replace(/\s*&\s*/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function normalizeCategory(c) {
  const s = toSlug(c);
  const map = {
    "philanthropist-of-the-year": "philanthropist",
    "artist-of-the-year": "artist",
    "brand-ambassador-of-the-year": "brand-ambassador",
    "blogger-of-the-year": "blogger",
    "content-creator-of-the-year": "content-creator",
    "entrepreneur-of-the-year": "entrepreneur",
    "youth-leader-of-the-year": "youth-leader",
    "Tech-and-Craft-of-the-year": "Tech-and-Craft",
    "innovator-of-the-year": "innovator",
    "comedian-of-the-year": "comedian",
    "community-champion-of-the-year": "community-champion",
    "influencer-of-the-year": "influencer",
    "mc-of-the-year": "mc",
    "dj-of-the-year": "dj",
    "podcast-of-the-year": "podcast",
    "facebook-page-of-the-year": "facebook",
    "tiktok-page-of-the-year": "tiktok",
    "ceo-of-the-year": "ceo",
    "media-personality-of-the-year": "media",

    // ✅ Added missing ones
    "chef-of-the-year": "chef",
    "makeup-artist-of-the-year": "makeup-artist",
    "fashion-designer-of-the-year": "fashion-designer",
    "fitness-trainer-of-the-year": "fitness-trainer",
    "photographer-of-the-year": "photographer",
    "stylist-of-the-year": "stylist",
    "restaurant-of-the-year": "restaurant",
    "barber-of-the-year": "barber",
    "hairdresser-of-the-year": "hairdresser",
    "hotels-of-the-year": "Hotels",
  };

  return map[s] || s; // fallback if slug is already normalized
}



// Get full category name from slug
function getCategoryName(slug) {
  const categoryMap = {
    philanthropist: "Philanthropist of the Year",
    artist: "Artist of the Year",
    "brand-ambassador": "Brand Ambassador of the Year",
    blogger: "Blogger of the Year",
    "content-creator": "Content Creator of the Year",
    entrepreneur: "Entrepreneur of the Year",
    "youth-leader": "Youth Leader of the Year",
    "Tech-and-Craft": "Tech and Craft of the Year",
    innovator: "Innovator of the Year",
    comedian: "Comedian of the Year",
    "community-champion": "Community Champion of the Year",
    influencer: "Influencer of the Year",
    mc: "MC of the Year",
    dj: "DJ of the Year",
    podcast: "Podcast of the Year",
    facebook: "Facebook Page of the Year",
    tiktok: "Tiktok Page of the Year",
    ceo: "CEO of the Year",
    media: "Media Personality of the Year",

    // ✅ Added missing ones
    chef: "Chef of the Year",
    "makeup-artist": "Makeup Artist of the Year",
    "fashion-designer": "Fashion Designer of the Year",
    "fitness-trainer": "Fitness Trainer of the Year",
    photographer: "Photographer of the Year",
    stylist: "Stylist / Fashion Brand / Designer of the Year",
    restaurant: "Restaurant of the Year",
    barber: "Barber of the Year",
    hairdresser: "Hairdresser of the Year",
    hotels: "Hotels of the Year",
  };

  return categoryMap[slug] || "Category";
}


// Category descriptions
const categoryDescriptions = {
  all: "Browse all nominees across every category in the TallyTrack Africa Awards.",

  philanthropist:
    "Recognizing individuals who have demonstrated exceptional generosity and commitment to charitable causes, making a significant impact on communities across Africa.",

  artist:
    "Honoring artists who inspire through creativity, masterful expression, and the power to move audiences with their work.",

  "brand-ambassador":
    "Celebrating personalities who have excelled in representing brands with authenticity, positively influencing public perception and engagement.",

  blogger:
    "Honoring writers who create compelling, informative, and engaging content that resonates with audiences and contributes to the digital conversation.",

  "content-creator":
    "Acknowledging creators who produce innovative and impactful digital content across various platforms, inspiring and entertaining diverse audiences.",

  entrepreneur:
    "Recognizing visionary business leaders who have demonstrated innovation, growth, and significant impact in their industries and communities.",

  "youth-leader":
    "Celebrating young individuals who have shown exceptional leadership qualities, inspiring positive change and empowering their peers.",

  innovator:
    "Honoring those who have developed groundbreaking ideas, technologies, or solutions that address challenges and create new opportunities.",

  comedian:
    "Acknowledging comedic talents who have brought joy and laughter to audiences through exceptional performance and original content.",
  "Tech-and-Craft":
  "Celebrating visionaries who merge innovation with craftsmanship, creating practical solutions,and impactful technologies that shape everyday life .",
  "community-champion":
    "Recognizing individuals dedicated to serving their communities, driving positive change, and improving the lives of others.",

  influencer:
    "Celebrating social media personalities who have built engaged communities and used their platforms to positively influence and inspire.",

  mc:
    "Celebrating MCs who bring events to life with charm, flawless coordination, and the ability to keep audiences engaged from start to finish.",

  dj: 
    "Honoring disc jockeys who have demonstrated exceptional skill in music selection, mixing, and creating memorable experiences for audiences.",

  podcast:
    "Recognizing outstanding podcast creators who have produced engaging audio content that informs, entertains, and builds community.",
  
  facebook:
    "Celebrating Facebook pages that have excelled in community building, engagement, and content quality on the platform.",

  tiktok:
    "Celebrating TikTok creators who inspire trends, spark conversations, and bring communities together through authentic and creative content.",

  ceo:
    "Celebrating visionary leadership, innovation, and lasting impact on business growth and community development in Africa.",

  media:
    "Recognizing media personalities who captivate audiences with their voice, charisma, and creativity, using their platforms to inform, and spark meaningful conversations.",

  chef:
    "Honoring emerging and young chefs who showcase creativity, skill, and cultural pride while shaping the future of culinary arts in Africa.",

  "makeup-artist":
    "Recognizing makeup artists who bring artistry, creativity, and innovation to beauty and fashion through their exceptional talent.",

  barber:
    "Celebrating barbers who demonstrate precision, creativity, and influence, transforming grooming into an art form.",

  stylist:
    "Acknowledging fashion stylists, brands, and designers who push boundaries with bold, creative, and expressive designs that inspire.",

  "fitness-trainer":
    "Honoring fitness trainers who empower individuals to achieve wellness goals through expertise, motivation, and consistency.",

  restaurant:
    "Celebrating restaurants that redefine dining experiences with innovation, creativity, and cultural pride.",

  hotels:
    "Recognizing hotels that deliver outstanding service, unique experiences, and excellence in hospitality.",

  hairdresser:
    "Acknowledging hairdressers who combine technical skill, creativity, and innovation to inspire confidence and beauty.",
};


// Navigate to a category page
async function navigateToCategory(category) {
  // Remove active state from all category items
  categoryItems.forEach((i) => i.classList.remove("active"));
  const target = document.querySelector(`.category-item[data-category="${category}"]`);
  if (target) target.classList.add("active");

  currentCategory = category;



  if (category === "dashboard") {
    dashboardSection.style.display = "block";
    categoryPage.style.display = "none";
    updateDashboardViews();
  } else {
    dashboardSection.style.display = "none";
    categoryPage.style.display = "block";

    // Update title + description
    categoryTitle.textContent =
      category === "all" ? "All Categories" : getCategoryName(category);
    categoryDescription.textContent = categoryDescriptions[category];

    // Filter nominees by category
    let filteredNominees =
      category === "all"
        ? [...nomineesData]
        : nomineesData.filter((nominee) => nominee.category_slug === category);

    // Apply filters (sort + gender + search)
    filteredNominees = applyFilters(filteredNominees);

    // Populate grid
    populateGrid(categoryNomineesGrid, filteredNominees);
  }

  // 🔥 Always scroll to top when entering a new category
  if (contentArea) {
    contentArea.scrollTo({ top: 0, behavior: "auto" });
  }
  // Also ensure full page scroll resets in case contentArea doesn't handle it
  window.scrollTo({ top: 0, behavior: "auto" });
}

// Apply filters to nominees
function applyFilters(nominees) {
  // Gender filter
  const genderValue = genderFilter.value;
  if (genderValue !== "all") {
    nominees = nominees.filter(nominee => nominee.gender === genderValue);
  }

  // Sort filter
  const sortValue = sortFilter.value;
  switch (sortValue) {
    case "recent":
      nominees.sort((a, b) => b.id - a.id);
      break;
    case "votes":
      nominees.sort((a, b) => b.votes - a.votes);
      break;
    case "trending":
      nominees.sort((a, b) => {
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return b.votes - a.votes;
      });
      break;
    case "all":
    default:
      // leave nominees as-is
      break;
  }

  // Search filter
  const searchValue = searchInput.value.toLowerCase();
  if (searchValue) {
    nominees = nominees.filter((nominee) =>
      nominee.name.toLowerCase().includes(searchValue)
    );
  }

  return nominees;
}


// Set up event listeners
function setupEventListeners() {
  // Header scroll effect
  if (contentArea) {
    contentArea.addEventListener("scroll", handleHeaderOnScroll, {
      passive: true,
    });
  } else {
    window.addEventListener("scroll", handleHeaderOnScroll, {
      passive: true,
    });
  }

  // Category item clicks
  categoryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.getAttribute("data-category");
      navigateToCategory(category);
    });
  });

  // Filter changes
  genderFilter.addEventListener("change", updateCategoryFilters);
  sortFilter.addEventListener("change", updateCategoryFilters);
  searchInput.addEventListener("input", updateCategoryFilters);

  // Initialize sidebar toggle
  const sidebar = document.getElementById("category-sidebar");
  const toggle = document.getElementById("sidebar-toggle");

  if (toggle) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      const icon = toggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-chevron-left");
        icon.classList.toggle("fa-chevron-right");
      }
    });
  }
}

// Update category filters
function updateCategoryFilters() {
  // Navigate to category with updated filters
  navigateToCategory(currentCategory);
}

function handleHeaderOnScroll() {
  const scrollTop = contentArea ? contentArea.scrollTop : window.scrollY;
  // toggle class based on threshold
  if (scrollTop > SCROLL_THRESHOLD) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

function updateSidebarCounts() {
  // Count nominees by category
  const counts = nomineesData.reduce((acc, nominee) => {
    const cat = nominee.category.toLowerCase().replace(/\s+/g, "-");
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Update sidebar items
  document.querySelectorAll(".category-item").forEach(item => {
    const category = item.getAttribute("data-category");
    const nameSpan = item.querySelector(".category-name span");

    if (!nameSpan) return;

    // Remove old badge if it exists
    const oldBadge = nameSpan.querySelector(".count-badge");
    if (oldBadge) oldBadge.remove();

    if (category === "all") {
      // Total nominees
      const total = nomineesData.length;
      nameSpan.innerHTML = `All Categories<span class="count-badge">${total}</span>`;
    } else if (counts[category]) {
      // Category-specific count
      const label = nameSpan.textContent.trim();
      nameSpan.innerHTML = `${label} <span class="count-badge">${counts[category]}</span>`;
    }
  });
}


// Initialize the dashboard when the DOM is loaded
document.addEventListener("DOMContentLoaded", initDashboard);

// Voting Modal Logic
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const votingModal = document.getElementById('voting-modal');
  const successModal = document.getElementById('success-modal');
  const errorModal = document.getElementById('error-modal');
  const closeVoting = document.getElementById('close-voting');
  const voteInput   = document.getElementById("vote-count");
  const incrementBtn = document.getElementById('increment-votes');
  const decrementBtn = document.getElementById('decrement-votes');
  const voteCount = document.getElementById('vote-count');
  const summaryVotes = document.getElementById('summary-votes');
  const totalAmount = document.getElementById('total-amount');
  const proceedBtn = document.getElementById('proceed-payment');
  const successBtn = document.getElementById('success-button');
  const tryAgainBtn = document.getElementById('try-again');
 
  document.addEventListener('click', (e) => {
  const share = e.target.closest('.share-link');
  if (!share) return;

  const nomineeId = share.dataset.id;
  const url = `${window.location.origin}${window.location.pathname}?nominee=${nomineeId}`;

  navigator.clipboard.writeText(url).then(() => {
    showCopyAlert("Link copied successfully!");
    
  }).catch(() => {
    showCopyAlert("Failed to copy link", true);
  });
  function showCopyAlert(message, isError = false) {
  const container = document.getElementById("copy-alert-container");

  if (!container) {
    console.error("❌ copy-alert-container not found in DOM.");
    return;
  }

  // Limit stack size (FIFO)
  if (container.children.length >= 10) {
    container.removeChild(container.firstChild);
  }

  // Create new alert element
  const alertBox = document.createElement("div");
  alertBox.className = `copy-alert ${isError ? "error" : ""}`;
  alertBox.innerHTML = `
    <i class="fa-solid ${isError ? "fa-circle-xmark" : "fa-check-circle"}"></i>
    <span>${message}</span>
  `;

  // Append to container
  container.appendChild(alertBox);

  // Animate in
  requestAnimationFrame(() => alertBox.classList.add("show"));

  // Auto remove after 3.0s
  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => alertBox.remove(), 400);
  }, 3000);
}

});
  
  // Vote counter variables
  let votes = 1;
  const votePrice = 10;
  let currentNomineeId = null;

  // --- helpers ---
  const clamp = v => Math.max(1, Math.floor(Number.isFinite(v) ? v : 1));
  const readVotes = () => clamp(parseInt(voteInput.value, 10));
  const updateVoteCounter = () => {
    voteInput.value = votes;
    summaryVotes.textContent = String(votes);
    totalAmount.textContent  = `KES ${votes * votePrice}`;
  };

  // Open the voting modal from any "Vote Now" button
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.vote-btn');
  if (!btn) return;

const id = btn.dataset.id;
  const nominee = nomineesData.find(n => n.id === id);
  if (!nominee) {
    console.warn('Nominee not found for id', id);
    return;
  }

  currentNomineeId = id;

  const modal = document.getElementById('voting-modal');
  modal.querySelector('.nominee-image').src = nominee.image || '';
  modal.querySelector('.nominee-image').alt = nominee.name || '';
  modal.querySelector('.nominee-name').textContent = nominee.name || '';
  modal.querySelector('.nominee-category').textContent = getCategoryName(nominee.category_slug || nominee.category);
  modal.querySelector('.nominee-id span').textContent = nominee.id || 'N/A';

  // reset counters & phone input
  votes = 1;
  voteInput.value = votes;
  summaryVotes.textContent = String(votes);
  totalAmount.textContent = `KES ${votes * votePrice}`;
  const phone = document.getElementById('phone');
  if (phone) phone.value = '';

  modal.classList.add('active');
});
  
  // Close voting modal
  closeVoting.addEventListener('click', () => {
    votingModal.classList.remove('active');
  });
  
  // Increment votes
  incrementBtn.addEventListener('click', () => {
    votes = readVotes() + 1;
    updateVoteCounter();
  });
  
  // Decrement votes (minimum 1)
  decrementBtn.addEventListener('click', () => {
    votes = readVotes();
    if (votes > 1) votes -= 1;
    updateVoteCounter();
  });

  // --- input validation: integers only, min=1 ---
  voteInput.addEventListener('keydown', (e) => {
    const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
    if (allowed.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
    if (/^\d$/.test(e.key)) return;  // digits only
    e.preventDefault();
  });

  voteInput.addEventListener('input', () => {
    // strip non-digits (handles paste)
    voteInput.value = voteInput.value.replace(/[^\d]/g, '');
    votes = readVotes();
    updateVoteCounter();
  });

  voteInput.addEventListener('blur', () => {
    votes = readVotes();
    updateVoteCounter();
  });
  
  // Proceed to payment
  proceedBtn.addEventListener('click', async () => {
    // Validate phone number
    const phoneInput = document.getElementById('phone');
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber || !/^07\d{8}$/.test(phoneNumber)) {
      return;
    }

    try {
    const res = await fetch("/functions/v1/verify-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captchaToken,
        nominee_id: currentNomineeId,
        voter_phone: phoneNumber,
        votes_count: votes
      })
    })
  const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    console.log("Vote success:", data)
    document.getElementById("voting-modal").classList.remove("active")
    document.getElementById("success-modal").classList.add("active")

  } catch (err) {
    console.error("Vote error:", err)
    document.getElementById("voting-modal").classList.remove("active")
    document.getElementById("error-modal").classList.add("active")
  }

    // Show loading state
    proceedBtn.classList.add('btn-loading');
    
    try {
      // In a real implementation, you would call your M-Pesa API here
      // For now, we'll simulate the payment process
      
      // Record the vote in the database
      const { data, error } = await window.supabase
        .from('votes')
        .insert([
          { 
            nominee_id: currentNomineeId, 
            phone_number: phoneNumber,
            votes_count: votes,
            amount_paid: votes * votePrice,
            status: 'completed'
          }
        ]);
      
      if (error) throw error;
      
      // Update the nominee's vote count
      const { error: updateError } = await window.supabase
        .from('nominees')
        .update({ votes: nomineesData.find(n => n.id === currentNomineeId).votes + votes })
        .eq('id', currentNomineeId);
      
      if (updateError) throw updateError;
      
      // Refresh the nominees data
      await loadNominees();
      
      // Show success modal
      votingModal.classList.remove('active');
      successModal.classList.add('active');
      
    } catch (error) {
      console.error('Payment error:', error);
      // Show error modal
      votingModal.classList.remove('active');
      errorModal.classList.add('active');
    } finally {
      // Remove loading state
      proceedBtn.classList.remove('btn-loading');
    }
  });

  proceedBtn.addEventListener('click', (e) => {
  e.preventDefault();

});

// processVotePayment now accepts captcha token
async function processVotePayment(captchaToken) {
  const phoneInput = document.getElementById('phone');
  const phoneNumber = phoneInput.value.trim();

  if (!phoneNumber || !/^07\d{8}$/.test(phoneNumber)) {
    alert('Please enter a valid phone number (07XXXXXXXX)');
    return;
  }

  const proceedBtn = document.getElementById('proceed-payment');
  proceedBtn.classList.add('btn-loading');

  try {
    // --- Optional: Verify captchaToken server-side before voting ---

    // Save vote in Supabase
    const { error } = await window.supabase.from('votes').insert([
      { 
        nominee_id: currentNomineeId, 
        phone_number: phoneNumber,
        votes_count: votes,
        amount_paid: votes * 10,
        status: 'completed',
        captcha_token: captchaToken // save for audit if needed
      }
    ]);
    if (error) throw error;

    // Update nominee votes
    const nominee = nomineesData.find(n => n.id === currentNomineeId);
    const { error: updateError } = await window.supabase
      .from('nominees')
      .update({ votes: nominee.votes + votes })
      .eq('id', currentNomineeId);
    if (updateError) throw updateError;

    await loadNominees();

    // Show success modal
    document.getElementById('voting-modal').classList.remove('active');
    document.getElementById('success-modal').classList.add('active');

  } catch (err) {
    console.error("Vote payment error:", err);
    document.getElementById('voting-modal').classList.remove('active');
    document.getElementById('error-modal').classList.add('active');
  } finally {
    proceedBtn.classList.remove('btn-loading');
  }
}
  
  // Success button action
  successBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    // Refresh the view to show updated vote counts
    if (currentCategory === 'dashboard') {
      updateDashboardViews();
    } else {
      navigateToCategory(currentCategory);
    }
  });
  
  // Try again button action
  tryAgainBtn.addEventListener('click', () => {
    errorModal.classList.remove('active');
    votingModal.classList.add('active');
  });
  
  // Close modals when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target === votingModal) votingModal.classList.remove('active');
    if (e.target === successModal) successModal.classList.remove('active');
    if (e.target === errorModal) errorModal.classList.remove('active');
  });
});

// Show stacked toast with FIFO removal
function showVoteError(message) {
  const container = document.getElementById("toast-container");

  // If too many toasts, remove the oldest (FIFO)
  if (container.children.length >= 5) { // allow max 5 stacked
    container.removeChild(container.firstChild);
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = "vote-toast";
  toast.innerHTML = `<i class="ti ti-exclamation-circle"></i><span>${message}</span>`;

  // Append at the bottom (push older ones down)
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add("show"));

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}


document.addEventListener("DOMContentLoaded", () => {
  const paymentBtn = document.getElementById("proceed-payment");
  const phoneInput = document.getElementById("phone");
  const votingModal = document.getElementById("voting-modal"); // your modal wrapper

  if (paymentBtn && phoneInput) {
    paymentBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const phone = phoneInput.value.trim();
      const isValid = phone !== "" && (/^(?:07\d{8}|2547\d{8})$/.test(phone));

      // Reset animation so it re-triggers each press
      phoneInput.classList.remove("invalid");
      void phoneInput.offsetWidth; // force reflow
      if (!isValid) {
        phoneInput.classList.add("invalid");
        showVoteError("Please enter a valid Mpesa number");
        return;
      }

      // ✅ If valid, clear error and continue
      phoneInput.classList.remove("invalid");
      console.log("Proceeding to payment for:", phone);
    });

    // Live validation (removes red border when valid)
    phoneInput.addEventListener("input", () => {
      const phone = phoneInput.value.trim();
      const isValid = phone !== "" && (/^(?:07\d{8}|2547\d{8})$/.test(phone));
      if (isValid) {
        phoneInput.classList.remove("invalid");
      }
    });
  }

  // ✅ Reset on modal close
  if (votingModal && phoneInput) {
    // If using Bootstrap modal
    votingModal.addEventListener("hidden.bs.modal", () => {
      phoneInput.classList.remove("invalid");
      phoneInput.value = ""; // optional: also clear input value
    });

    // If modal is toggled with .show/.hide classes instead of Bootstrap
    const observer = new MutationObserver(() => {
      if (!votingModal.classList.contains("show")) {
        phoneInput.classList.remove("invalid");
        phoneInput.value = ""; // optional
      }
    });
    observer.observe(votingModal, { attributes: true, attributeFilter: ["class"] });
  }
});
// Called when Turnstile challenge is solved
/*const SECRET_KEY =process.env.CLOUDFLARE_SECRET_KEY || process.env.cloudflare_secrete_key;;

async function validateTurnstile(token, remoteip) {
const formData = new FormData();
formData.append('secret', SECRET_KEY);
formData.append('response', token);
formData.append('remoteip', remoteip);

      try {
          const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              body: formData
          });

          const result = await response.json();
          return result;
      } catch (error) {
          console.error('Turnstile validation error:', error);
          return { success: false, 'error-codes': ['internal-error'] };
      }

    } */
// === Turnstile verification + enable button flow ===

// Read backend URL from environment (Vite: import.meta.env)
const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
  ? import.meta.env.VITE_BACKEND_URL
  : window.BACKEND_URL || 'https://your-backend.example.com';

// UI elements
const votingModal = document.getElementById('voting-modal');
const proceedBtn = document.getElementById('proceed-payment');
const feedbackEl = document.getElementById('vote-feedback');

// Local token storage (keeps last token until used)
let captchaToken = null;

// Called whenever you open the voting modal
function openVotingModal() {
  // Reset previous token and disable proceed button
  captchaToken = null;
  setProceedDisabled(true);
  clearFeedback();

  // Show modal (your show logic may differ)
  votingModal.setAttribute('aria-hidden', 'false');
  votingModal.style.display = 'block';
}

// Called when modal closes / cancels
function closeVotingModal() {
  votingModal.setAttribute('aria-hidden', 'true');
  votingModal.style.display = 'none';
  // Optionally clear Turnstile widget if you want (see notes)
}

// Helper: enable/disable proceed button and keep aria state
function setProceedDisabled(isDisabled) {
  proceedBtn.disabled = isDisabled;
  proceedBtn.setAttribute('aria-disabled', String(isDisabled));
  if (isDisabled) proceedBtn.classList.add('disabled');
  else proceedBtn.classList.remove('disabled');
}

// Helper: show messages to user
function showFeedback(msg, isError = true) {
  feedbackEl.textContent = msg || '';
  feedbackEl.style.color = isError ? '#e03' : '#0a0';
}

function clearFeedback() {
  feedbackEl.textContent = '';
}

// ------------- Turnstile callback (called by widget) -------------
// Cloudflare Turnstile will call window.onTurnstileSuccess(token)
window.onTurnstileSuccess = async function(token) {
  // token is the short string produced by Turnstile in the browser
  // temporarily disable proceed button while we verify with our server
  setProceedDisabled(true);
  showFeedback('Verifying you are human... please wait', false);

  try {
    // POST to your server for verification (server holds the secret)
    const res = await fetch(`${BACKEND_URL}/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      // verification failed
      captchaToken = null;
      setProceedDisabled(true);
      showFeedback('Captcha verification failed — try again.');
      // optional: reset widget if API available
      if (window.turnstile && typeof window.turnstile.reset === 'function') {
        try { window.turnstile.reset(); } catch(e){ /* ignore */ }
      }
      return;
    }

    // Verified by server — enable proceed and keep token for submit
    captchaToken = token;
    setProceedDisabled(false);
    showFeedback('Verified. You may proceed to payment.', false);
  } catch (err) {
    console.error('verify-turnstile error', err);
    captchaToken = null;
    setProceedDisabled(true);
    showFeedback('Verification error — check your connection and try again.');
  }
};

// global variable to store the active token
  let currentTurnstileToken = null;

  // This function is called by the Turnstile widget when the user completes the challenge.
  // Cloudflare docs: set `data-callback="onTurnstileSuccess"`
  window.onTurnstileSuccess = function(token) {
    currentTurnstileToken = token;
    // enable vote buttons
    document.querySelectorAll(".vote-btn").forEach(b => {
      b.disabled = false;
      b.dataset.captcha = token; // optional: store token on button
    });
  };

  // Optional: make sure to disable vote buttons initially
  document.querySelectorAll(".vote-btn").forEach(b => {
    b.disabled = true;
    b.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      // gather data from the modal / nominee card
      const nominee_id = btn.getAttribute("data-nominee-code-uuid"); // wire this in your DOM
      const nominee_code = btn.getAttribute("nominee-id");
      const nominee_name = btn.getAttribute("nominee-name");
      const voter_phone = document.getElementById("phone").value.trim(); // example input
      const votes_count = Number(document.getElementById("vote-count").value) || 1;

      if (!currentTurnstileToken) {
        alert("Please complete the captcha.");
        return;
      }

      // disable while sending
      btn.disabled = true;
      btn.textContent = "Voting...";

      const payload = {
        nominee_id,
        nominee_code,
        nominee_name,
        voter_phone,
        votes_count,
        amount_theoretical: votes_count * 10, // example
        turnstile_token: currentTurnstileToken
      };

      try {
        const resp = await fetch("/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();

        if (resp.ok && json.success) {
          await loadNominees();

    // Show success modal
    document.getElementById('voting-modal').classList.remove('active');
    document.getElementById('success-modal').classList.add('active');
          // optional: close modal, refresh your UI
        } else {
          console.error("Vote failed:", json);
          document.getElementById('voting-modal').classList.remove('active');
    document.getElementById('error-modal').classList.add('active');
        }
      } catch (err) {
        console.error(err);
        alert("Network error");
      } finally {
        // clear token (Turnstile tokens are one-time use). Render widget again if needed.
        currentTurnstileToken = null;
        
    proceedBtn.classList.remove('btn-loading');
        // reset widget: for Turnstile you can call turnstile.reset() if you kept widget id reference.
        // If you used default embed, you might just reload widget container or prompt user to redo it.
      }
    });
  });
/*/ ------------- Proceed to pay click handler -------------
proceedBtn.addEventListener('click', async function (e) {
  e.preventDefault();

  // Ensure captchaToken exists (should, if we enabled the button)
  if (!captchaToken) {
    showFeedback('Please complete the captcha first.');
    setProceedDisabled(true);
    return;
  }

  // Example payload: include nominee_id, phone, votes_count etc.
  const payload = {
    token: captchaToken,
    nominee_id: window.currentNomineeId || null,
    voter_phone: window.currentVoterPhone || null,
    votes_count: window.currentVotesCount || 1
  };

  // Disable button while we create the vote record
  setProceedDisabled(true);
  showFeedback('Recording vote and starting payment...');

  try {
    const res = await fetch(`${BACKEND_URL}/submit-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      // show server-provided message if present
      showFeedback(json.error || 'Failed to submit vote. Try again.');
      // optionally reset captcha if you want user to re-verify
      captchaToken = null;
      return;
    }

    // Success: server created pending vote record (you will handle MPESA next)
    showFeedback('Vote recorded. Proceeding to payment...', false);
    // optionally redirect to payment flow or trigger STK push
    // e.g. startMpesaFlow(json.vote.id)
  } catch (err) {
    console.error('submit-vote error', err);
    showFeedback('Network error while submitting vote. Try again.');
  } finally {
    // leave button disabled to avoid double clicks; re-enable if you want:
    // setProceedDisabled(false);
  }
});*/

