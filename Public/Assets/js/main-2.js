// Sample nominee data
       async function fetchTopNominees() {
  const { data, error } = await window.supabase
    .from("nominees")
    .select("*")
    .order("votes", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching top nominees:", error);
    return [];
  }

  // Normalize like dashboard-2.js
  return data.map(n => {
    const rawCategory = String(n.category || n.category_name || "").trim();
    const slug = rawCategory
      .toLowerCase()
      .replace(/\s*&\s*/g, "-and-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      ...n,
      image: n.image || n.image_url || n.photo || n.picture || "",
      category_slug: slug
    };
  });
}


        // Category vote targets
const categoryTargets = {
    "Content Creation": 50000,
    "Music & Entertainment": 50000,
    "Business & Entrepreneurship": 45000,
    "Philanthropy": 40000,
    "Innovation": 42000,
    "Community Leadership": 38000
};

        // DOM Elements
        const header = document.getElementById('header');
        const nomineesScroller = document.getElementById('nominees-scroller');
        const scrollLeftBtn = document.getElementById('scroll-left');
        const scrollRightBtn = document.getElementById('scroll-right');
        const votesCount = document.getElementById('votes-count');
        const nomineesCount = document.getElementById('nominees-count');
        const daysLeft = document.getElementById('days-left');

        // Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize hero slider
    initHeroSlider();
    
    // Initialize nominee cards
    await initNominees(); // wait until nominees load
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize counters (now uses globalNominees)
    initCounters();
    // Initialize mobile menu
    initMobileMenu(); 
    // Initialize auto-scroll for nominees
    initAutoScroll();
    // Initialize Vote Now button listeners
    initNomineesListeners();
     
});

        // Hero Slider Functionality
        function initHeroSlider() {
            const slides = document.querySelectorAll('.slide');
            let currentSlide = 0;
            
            function nextSlide() {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }
            
            // Change slide every 5 seconds
            setInterval(nextSlide, 5000);
        }

        // Mobile menu toggle
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    const icon = toggle.querySelector('i');

    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times'); // show X when open
    }
  });
}


        // Fetch ALL nominees
async function fetchAllNominees() {
  const { data, error } = await window.supabase
    .from("nominees")
    .select("*")
    .order("votes", { ascending: false });

  if (error) {
    console.error("Error fetching nominees:", error);
    return [];
  }

  return data.map(n => {
    const rawCategory = String(n.category || n.category_name || "").trim();
    const slug = rawCategory
      .toLowerCase()
      .replace(/\s*&\s*/g, "-and-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return {
      ...n,
      image: n.image || n.image_url || n.photo || n.picture || "",
      category_slug: slug
    };
  });
}

// Initialize nominees
async function initNominees() {
  const nominees = await fetchAllNominees();
  globalNominees = nominees;

  nomineesScroller.innerHTML = "";

  // show only top 10 in the scroller
  nominees.slice(0, 10).forEach(nominee => {
    const percentage = Math.min(100, (nominee.votes / (nominee.categoryTarget || 50000)) * 100);

    const card = document.createElement("div");
    card.className = "nominee-card";

    card.innerHTML = `
      <div class="nominee-card-inner">
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
          <p class="nominee-category">${nominee.category}</p>
          <p class="nominee-description">
            ${nominee.description || nominee.bio || "No description available"}
          </p>
          <div class="vote-info">
            <div class="vote-bar-container">
              <div class="vote-bar">
                <div class="vote-fill" style="width: ${percentage}%"></div>
              </div>
              <div class="vote-count">${nominee.votes.toLocaleString()}</div>
            </div>
          </div>
          <button class="btn btn-outline vote-btn" data-id="${nominee.id}">Vote Now</button>
        </div>
      </div>
    `;

    nomineesScroller.appendChild(card);
  });
  // Attach listener for Vote Now buttons on homepage nominees
function initNomineesListeners() {
  nomineesScroller.addEventListener('click', (e) => {
    const btn = e.target.closest('.vote-btn');
    if (!btn) return;

    const nomineeId = btn.dataset.id;

    if (window.openVotingModal) {
      // Call the global function from dashboard-2.js
      window.openVotingModal(nomineeId);
    } else {
      console.warn('Voting modal function not available. Make sure dashboard-2.js is loaded or modal HTML exists on this page.');
    }
  });
}

}

        // Scroll Animations
        function initScrollAnimations() {
            const animatedElements = document.querySelectorAll('.about-content, .about-image,.mobile-about-image, .about-company-image, .about-company-content, .nominees-header, .view-all-btn, .categories-header, .category-card, .voting-content');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                    }
                });
            }, {
                threshold: 0.1
            });
            
            animatedElements.forEach(element => {
                observer.observe(element);
            });
            
            // Header scroll effect
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
            
        }

        // Counter Animation
        // Counter Animation (uses globalNominees now)
function initCounters() {
  const totalVotes = globalNominees.reduce((sum, nominee) => sum + nominee.votes, 0);
  animateValue(votesCount, 0, totalVotes, 2000);

  animateValue(nomineesCount, 0, globalNominees.length, 1300)
            
            // Days left doesn't need animation
          startCountdown("2025-12-01T00:00:00"); // <-- set your real deadline here
        }

        function startCountdown(deadline) {
  function updateCountdown() {
    const end = new Date(deadline).getTime();
    const now = Date.now();
    const diff = end - now;

    let days = 0;
    if (diff > 0) {
      days = Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    const current = parseInt(daysLeft.textContent) || 0;
    animateValue(daysLeft, current, days, 1000); // animate to new value
  }

  updateCountdown(); // run immediately
  // Update every hour (or faster if you want smoother ticking)
  setInterval(updateCountdown, 1500 * 60 * 60);
}
        
        // Reuse your animateValue function
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

        // Auto-scroll and manual scroll for nominees
        function initAutoScroll() {
  let autoScrollInterval;
  let userInteracting = false;
  let isTouching = false;
  let startX = 0;
  let scrollStart = 0;
  let scrollWidth= 3000;

  function startAutoScroll() {
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(() => {
      if (userInteracting) return; // pause during interaction

      // Loop back to start when reaching the end
      if (
        nomineesScroller.scrollLeft + nomineesScroller.clientWidth >=
        nomineesScroller.scrollWidth - 3
      ) {
        nomineesScroller.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        nomineesScroller.scrollBy({ left: 410, behavior: "smooth" });
      }
    }, 3000);
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }

  function resetAfterInteraction() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      userInteracting = false;
      startAutoScroll();
    }, 2000);
  }

  // Start auto scroll
  startAutoScroll();

  // Pause when hovering (desktop)
  nomineesScroller.addEventListener("mouseenter", () => {
    userInteracting = true;
    stopAutoScroll();
  });
  nomineesScroller.addEventListener("mouseleave", () => {
    userInteracting = false;
    startAutoScroll();
  });

  // Pause while scrolling manually
   let scrollTimeout;
  nomineesScroller.addEventListener("scroll", () => {
    if (!isTouching) {
      userInteracting = true;
      stopAutoScroll();

      // Seamless loop correction
      if (nomineesScroller.scrollLeft >= scrollWidth) {
        nomineesScroller.scrollLeft -= scrollWidth;
      }
      if (nomineesScroller.scrollLeft < 0) {
        nomineesScroller.scrollLeft += scrollWidth;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        userInteracting = false;
        startAutoScroll();
      }, 2000);
    }
  });

  // Scroll buttons
  scrollLeftBtn.addEventListener("click", () => {
    userInteracting = true;
    stopAutoScroll();
    nomineesScroller.scrollBy({ left: -370, behavior: "smooth" });
    resetAfterInteraction();
  });
  scrollRightBtn.addEventListener("click", () => {
    userInteracting = true;
    stopAutoScroll();
    nomineesScroller.scrollBy({ left: 370, behavior: "smooth" });
    resetAfterInteraction();
  });

  // --- Touch support (swipe on mobile) ---
nomineesScroller.addEventListener("touchstart", (e) => {
    isTouching = true;
    userInteracting = true;
    stopAutoScroll();
    startX = e.touches[0].pageX;
    scrollStart = nomineesScroller.scrollLeft;
  });

  nomineesScroller.addEventListener("touchmove", (e) => {
    if (!isTouching) return;
    const x = e.touches[0].pageX;
    const delta = startX - x;
    nomineesScroller.scrollLeft = scrollStart + delta;
  });

  nomineesScroller.addEventListener("touchend", () => {
    isTouching = false;
    resetAfterInteraction();
  });
}

// Add to your existing JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize sponsors animation
        initSponsorsAnimation();
    });

    function initSponsorsAnimation() {
        const sponsorsHeader = document.querySelector('.sponsors-header');
        
        // Observer for animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.1 });
        
        if (sponsorsHeader) {
            observer.observe(sponsorsHeader);
        }
        
        // Infinite loop reset (handled by CSS but adding JS fallback)
        const sponsorsSlide = document.querySelector('.sponsors-slide');
        
        if (sponsorsSlide) {
            sponsorsSlide.addEventListener('animationiteration', () => {
                // This ensures smooth continuous looping
                sponsorsSlide.style.animation = 'none';
                setTimeout(() => {
                    sponsorsSlide.style.animation = '';
                }, 10);
            });
        }
      }
      // Snap categories to nearest card after scroll ends (optional)
const catScroller = document.querySelector('.categories-grid.scroll-container');
let scrollTimeout;

catScroller.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const cardWidth = catScroller.querySelector('.category-card').offsetWidth + 16; // card width + gap
    const scrollPosition = catScroller.scrollLeft;
    const nearestCard = Math.round(scrollPosition / cardWidth) * cardWidth;
    catScroller.scrollTo({ left: nearestCard, behavior: 'smooth' });
  }, 150);
});

// ===== Countdown Timer =====
// Animate numbers (count up/down smoothly)
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value.toString().padStart(2, "0");
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function initCountdown(targetDate) {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  let lastValues = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  function updateCountdown() {
    const now = new Date().getTime();
    const end = new Date(targetDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      ["days","hours","minutes","seconds"].forEach(id => {
        document.getElementById(id).textContent = "00";
      });
      clearInterval(timer);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Animate only if value changed
    if (days !== lastValues.days) animateValue(daysEl, lastValues.days, days, 700);
    if (hours !== lastValues.hours) animateValue(hoursEl, lastValues.hours, hours, 1000);
    if (minutes !== lastValues.minutes) animateValue(minutesEl, lastValues.minutes, minutes, 1100);
    if (seconds !== lastValues.seconds) animateValue(secondsEl, lastValues.seconds, seconds, 1100);

    lastValues = { days, hours, minutes, seconds };
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

// Example start (set your end date)
document.addEventListener("DOMContentLoaded", () => {
  initCountdown("2025-10-03T00:00:00");
});

