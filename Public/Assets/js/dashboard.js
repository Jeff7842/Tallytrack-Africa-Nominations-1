// Dashboard JavaScript
// Manages the dashboard and category pages, including data rendering and interactions

      // Sample nominee data
      const nomineesData = [
        {
          id: 1,
          name: "Sarah Johnson",
          category: "philanthropist",
          description: "Sarah has dedicated her life to philanthropic efforts, founding multiple charities that focus on education and healthcare in underserved communities across Africa.",
          votes: 1845,
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
          gender: "female",
          trending: true,
        },
        {
          id: 2,
          name: "Michael Chen",
          category: "content-creator",
          description: "Michael is a renowned content creator known for his engaging videos and tutorials that have amassed a large following on various social media platforms, inspiring many young creators.",
          votes: 1623,
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
          gender: "male",
          trending: true,
        },
        {
          id: 3,
          name: "Amina Okeke",
          category: "entrepreneur",
          description: "Amina is a successful entrepreneur who has launched several innovative startups that have disrupted traditional markets, creating jobs and driving economic growth in her community.",
          votes: 1532,
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
          gender: "female",
          trending: true,
        },
        {
          id: 4,
          name: "David Wilson",
          category: "innovator",
          description: "David is an innovator in the tech space, having developed cutting-edge solutions that address real-world problems, earning him recognition and awards in the technology sector.",
          votes: 1421,
          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
          gender: "male",
          trending: false,
        },
        {
          id: 5,
          name: "Lisa Rodriguez",
          category: "community-champion",
          description: "Lisa has been a tireless community champion, leading initiatives that promote social justice, environmental sustainability, and community development, making a lasting impact on the lives of many.",
          votes: 1387,
          image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
          gender: "female",
          trending: true,
        },
        {
          id: 6,
          name: "James Taylor",
          category: "blogger",
          description: "James is a popular blogger whose insightful articles and reviews on technology and lifestyle have garnered a loyal readership, influencing trends and opinions in the digital space.",
          votes: 1324,
          image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
          gender: "male",
          trending: false,
        },
        {
          id: 7,
          name: "Fatima Ndiaye",
          category: "influencer",
          description: "Fatima is a leading social media influencer known for her authentic content and strong engagement with her audience, using her platform to advocate for positive change and inspire others.",
          votes: 1289,
          image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
          gender: "female",
          trending: true,
        },
        {
          id: 8,
          name: "Brian Ochieng",
          category: "comedian",
          votes: 1215,
          image: "https://images.unsplash.com/photo-1552058544-f2b08422138a",
          gender: "male",
          trending: false,
        },
        {
          id: 9,
          name: "Nadia Kamau",
          category: "youth-leader",
          votes: 1187,
          image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db1604",
          gender: "female",
          trending: true,
        },
        {
          id: 10,
          name: "Thomas Müller",
          category: "ambassador",
          description: "Thomas has been a dedicated brand ambassador, consistently promoting our values and engaging with the community through various campaigns and events.",
          votes: 1154,
          image: "https://images.unsplash.com/photo-1508341591423-4347099e1f19",
          gender: "male",
          trending: false,
        },
        {
          id: 11,
          name: "Chloe Smith",
          category: "dj",
          votes: 1098,
          image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8",
          gender: "female",
          trending: false,
        },
        {
          id: 12,
          name: "Kwame Mensah",
          category: "podcast",
          votes: 1054,
          image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4",
          gender: "male",
          trending: false,
        },
        {
          id: 13,
          name: "Emily Wong",
          category: "facebook",
          votes: 987,
          image: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
          gender: "female",
          trending: false,
        },
        {
          id: 14,
          name: "Paul Kibet",
          category: "philanthropist",
          votes: 954,
          image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
          gender: "male",
          trending: false,
        },
        {
          id: 15,
          name: "Zara Mohammed",
          category: "content-creator",
          votes: 921,
          image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
          gender: "female",
          trending: false,
        },
      ];

      // Category descriptions
      const categoryDescriptions = {
        all: "Browse all nominees across every category in the TallyTrack Africa Awards.",
        philanthropist:
          "Recognizing individuals who have demonstrated exceptional generosity and commitment to charitable causes, making a significant impact on communities across Africa.",
        ambassador:
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
        "community-champion":
          "Recognizing individuals dedicated to serving their communities, driving positive change, and improving the lives of others.",
        influencer:
          "Celebrating social media personalities who have built engaged communities and used their platforms to positively influence and inspire.",
        dj: "Honoring disc jockeys who have demonstrated exceptional skill in music selection, mixing, and creating memorable experiences for audiences.",
        podcast:
          "Recognizing outstanding podcast creators who have produced engaging audio content that informs, entertains, and builds community.",
        facebook:
          "Celebrating Facebook pages that have excelled in community building, engagement, and content quality on the platform.",
      };

      // DOM Elements
      const header = document.getElementById("header");
      const contentArea = document.querySelector(".content-area"); // the actual scroller
      const SCROLL_THRESHOLD = 100;
      const categorySidebar = document.getElementById("category-sidebar");
      const dashboardSection = document.getElementById("dashboard");
      const categoryPage = document.getElementById("category-page");
      const categoryTitle = document.getElementById("category-title");
      const categoryDescription = document.getElementById( "category-description");
      const popularScroller = document.querySelectorAll(".nominees-scroller")[0];
      const recentScroller = document.querySelectorAll(".nominees-scroller")[1];
      const allVotesGrid = document.querySelector(".all-votes-grid");
      const categoryNomineesGrid = document.getElementById("category-nominees");
      const categoryItems = document.querySelectorAll(".category-item");
      const genderFilter = document.getElementById("gender-filter");
      const sortFilter = document.getElementById("sort-filter");
      const searchInput = document.getElementById("nominee-search");

      // Initialize the dashboard
      function initDashboard() {
        // Update stats
        updateStats();

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

        // Set up event listeners
        setupEventListeners();
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

      // Populate a scroller with nominee cards
      function populateScroller(scroller, nominees) {
        scroller.innerHTML = "";

        nominees.forEach((nominee) => {
          const percentage = Math.round((nominee.votes / 2000) * 100);

          const card = document.createElement("div");
          card.className = "nominee-card";
          card.innerHTML = `
                    <img src="${nominee.image}" alt="${
            nominee.name
          }" class="nominee-image">
                    <div class="nominee-content">
                        <h3 class="nominee-name">${nominee.name}</h3>
                        <p class="nominee-category">${getCategoryName(
                          nominee.category
                        )}</p>
                        <div class="vote-count">
                            <i class="fas fa-vote-yea"></i>
                            <span>${nominee.votes.toLocaleString()} votes</span>
                        </div>
                        <div class="vote-bar">
                            <div class="vote-fill" style="width: ${percentage}%"></div>
                        </div>
                        <button class="vote-btn" data-id="${
                          nominee.id
                        }">Vote Now</button>
                    </div>

                    <!-- Hidden description overlay -->
  <div class="nominee-description">
  
      <p>${nominee.description}</p>
  </div
                `;

          scroller.appendChild(card);
        });
      }

      // Populate a grid with nominee cards
      function populateGrid(grid, nominees) {
        grid.innerHTML = "";

        nominees.forEach((nominee) => {
          const percentage = Math.round((nominee.votes / 2000) * 100);

          const card = document.createElement("div");
          card.className = "nominee-card";
          card.innerHTML = `
                    <img src="${nominee.image}" alt="${
            nominee.name
          }" class="nominee-image">
                    <div class="nominee-content">
                        <h3 class="nominee-name">${nominee.name}</h3>
                        <p class="nominee-category">${getCategoryName(
                          nominee.category
                        )}</p>
                        <div class="vote-count">
                            <i class="fas fa-vote-yea"></i>
                            <span>${nominee.votes.toLocaleString()} votes</span>
                        </div>
                        <div class="vote-bar">
                            <div class="vote-fill" style="width: ${percentage}%"></div>
                        </div>
                        <button class="vote-btn" data-id="${
                          nominee.id
                        }">Vote Now</button>
                    </div>
                `;

          grid.appendChild(card);
        });
      }

      // After nominees are rendered, attach event listeners to Vote buttons
document.querySelectorAll(".vote-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const nomineeId = e.target.getAttribute("data-id");
    const nomineeName = e.target
      .closest(".nominee-content")
      .querySelector(".nominee-name").innerText;
    const nomineeCategory = e.target
      .closest(".nominee-content")
      .querySelector(".nominee-category").innerText;

    // Fill modal details
    document.getElementById("nomineeName").innerText = nomineeName;
    document.getElementById("voteModal").style.display = "block";

    // (Optional) store the nominee ID in a hidden input for backend use
    document.getElementById("voteModal").setAttribute("data-id", nomineeId);
  });
});


      // Get full category name from slug
      function getCategoryName(slug) {
        const categoryMap = {
          philanthropist: "Philanthropist of the Year",
          ambassador: "Brand Ambassador of the Year",
          blogger: "Blogger of the Year",
          "content-creator": "Content Creator of the Year",
          entrepreneur: "Entrepreneur of the Year",
          "youth-leader": "Youth Leader of the Year",
          innovator: "Innovator of the Year",
          comedian: "Comedian of the Year",
          "community-champion": "Community Champion of the Year",
          influencer: "Influencer of the Year",
          dj: "DJ of the Year",
          podcast: "Podcast of the Year",
          facebook: "Facebook Page of the Year",
        };

        return categoryMap[slug] || "Category";
      }

      // Navigate to a category page
      function navigateToCategory(category) {
          // Update active state in sidebar
    categoryItems.forEach(i => i.classList.remove('active'));
    const target = document.querySelector(`.category-item[data-category="${category}"]`);
    if (target) target.classList.add('active');

        // Update UI to show category page
        dashboardSection.style.display = "none";
        categoryPage.style.display = "block";

        // Set category title and description
        categoryTitle.textContent =
          category === "all" ? "All Categories" : getCategoryName(category);
        categoryDescription.textContent = categoryDescriptions[category];

        // Filter nominees by category
        let filteredNominees =
          category === "all"
            ? [...nomineesData]
            : nomineesData.filter((nominee) => nominee.category === category);

        // Apply additional filters
        filteredNominees = applyFilters(filteredNominees);

        // Populate the category grid
        populateGrid(categoryNomineesGrid, filteredNominees);
      }

      // Apply filters to nominees
      function applyFilters(nominees) {
        // Gender filter
        const genderValue = genderFilter.value;
        if (genderValue !== "all") {
          nominees = nominees.filter(
            (nominee) => nominee.gender === genderValue
          );
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
          default:
            // No sorting
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
        window.addEventListener("scroll", () => {
          if (window.scrollY > 100) {
            header.classList.add("scrolled");
          } else {
            header.classList.remove("scrolled");
          }
        });

        // Category item clicks
        categoryItems.forEach((item) => {
          item.addEventListener("click", () => {
            const category = item.getAttribute("data-category");

            // Update active state
            categoryItems.forEach((i) => i.classList.remove("active"));
            item.classList.add("active");

            if (category === "dashboard") {
              // Show dashboard again
              dashboardSection.style.display = "block";
              categoryPage.style.display = "none";
            } else {
              // Navigate to category page
              navigateToCategory(category);
            }
          });
        });

        // Filter changes
        genderFilter.addEventListener("change", updateCategoryFilters);
        sortFilter.addEventListener("change", updateCategoryFilters);
        searchInput.addEventListener("input", updateCategoryFilters);

        // Vote button clicks
        document.querySelectorAll(".vote-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const nomineeId = e.target.getAttribute("data-id");
    const nomineeName = e.target
      .closest(".nominee-content")
      .querySelector(".nominee-name").innerText;
    const nomineeCategory = e.target
      .closest(".nominee-content")
      .querySelector(".nominee-category").innerText;

    /* Fill modal details
    document.getElementById("nomineeName").innerText = nomineeName;
    document.getElementById("voteModal").style.display = "block";

    // (Optional) store the nominee ID in a hidden input for backend use
    document.getElementById("voteModal").setAttribute("data-id", nomineeId);*/
  });
});
      }

      // Update category filters
      function updateCategoryFilters() {
        // Get current category
        const activeCategory = document
          .querySelector(".category-item.active")
          .getAttribute("data-category");

        // Navigate to category with updated filters
        navigateToCategory(activeCategory);
      }

      // Initialize the dashboard when the DOM is loaded
      document.addEventListener("DOMContentLoaded", initDashboard);
    
    




      const sidebar = document.getElementById("category-sidebar");
      const toggle = document.getElementById("sidebar-toggle");

      toggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        toggle.querySelector("i").classList.toggle("fa-chevron-left");
        toggle.querySelector("i").classList.toggle("fa-chevron-right");
      });
    
    




      function handleHeaderOnScroll() {
        const scrollTop = contentArea ? contentArea.scrollTop : window.scrollY;
        // toggle class based on threshold
        if (scrollTop > SCROLL_THRESHOLD) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      }

      // Attach listener to contentArea if present, else window
      if (contentArea) {
        contentArea.addEventListener("scroll", handleHeaderOnScroll, {
          passive: true,
        });
      } else {
        window.addEventListener("scroll", handleHeaderOnScroll, {
          passive: true,
        });
      }

      // Run once to set initial state (e.g., on page load or after navigation)
      document.addEventListener("DOMContentLoaded", handleHeaderOnScroll);
    
    




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
            
            // Vote counter variables
            let votes = 1;
            const votePrice = 10;

            // --- helpers ---
  const clamp = v => Math.max(1, Math.floor(Number.isFinite(v) ? v : 1));
  const readVotes = () => clamp(parseInt(voteInput.value, 10));
  const updateVoteCounter = () => {
    voteInput.value = votes;
    summaryVotes.textContent = String(votes);
    totalAmount.textContent  = `KES ${votes * votePrice}`;
  };
            
            
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
            proceedBtn.addEventListener('click', () => {
                // Show loading state
                proceedBtn.classList.add('btn-loading');
                
                // Simulate payment processing
                setTimeout(() => {
                    // For demo purposes, randomly decide success or failure
                    const isSuccess = Math.random() > 0.3;
                    
                    if (isSuccess) {
                        // Show success modal
                        votingModal.classList.remove('active');
                        successModal.classList.add('active');
                    } else {
                        // Show error modal
                        votingModal.classList.remove('active');
                        errorModal.classList.add('active');
                    }
                    
                    // Remove loading state
                    proceedBtn.classList.remove('btn-loading');
                }, 2000);
            });
            
            // Success button action
            successBtn.addEventListener('click', () => {
                successModal.classList.remove('active');
                // In a real scenario, this would redirect to the dashboard
                alert('Redirecting to dashboard...');
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
                resetVotingModal();

            });
        });
    
    
    




// Open the voting modal from any "Vote Now" button (works for scrollers & grids)
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.vote-btn');
  if (!btn) return;

  const id = parseInt(btn.dataset.id, 10);
  const nominee = nomineesData.find(n => n.id === id);
  if (!nominee) return;

  const modal = document.getElementById('voting-modal');

  // Fill modal header using existing elements
  const imgEl = modal.querySelector('.nominee-image');
  const nameEl = modal.querySelector('.nominee-name');
  const catEl  = modal.querySelector('.nominee-category');
  const codeEl = modal.querySelector('.nominee-id span');

  imgEl.src = nominee.image;
  imgEl.alt = nominee.name;
  nameEl.textContent = nominee.name;
  catEl.textContent  = getCategoryName(nominee.category); // you already have this
  codeEl.textContent = `${nominee.category.slice(0,2).toUpperCase()}-${String(id).padStart(4,'0')}`;

  // Store selection if needed later
  modal.dataset.nomineeId = String(id);

  // Ask the modal logic to reset counters etc.
  document.dispatchEvent(new CustomEvent('open-voting-modal'));

  // Show modal (your CSS shows it when .active is present)
  modal.classList.add('active');
});





// Reset everything in the voting modal
const resetVotingModal = () => {
  votes = 1; // reset global votes

  // reset inputs
  voteInput.value = votes;
  summaryVotes.textContent = String(votes);
  totalAmount.textContent  = `KES ${votes * votePrice}`;

  // reset phone field
  const phone = document.getElementById("phone");
  if (phone) phone.value = "";
};
document.addEventListener("open-voting-modal", () => {
  resetVotingModal();
  votingModal.classList.add("active");
});
closeVoting.addEventListener("click", () => {
  resetVotingModal();
  votingModal.classList.remove("active");
});
document.addEventListener("click", (e) => {
  if (e.target === votingModal) {
    resetVotingModal();
    votingModal.classList.remove("active");
  }
});
// OPEN
document.addEventListener("open-voting-modal", () => {
  resetVotingModal(); // reset first
  votingModal.classList.add("active");
});

// CLOSE
closeVoting.addEventListener("click", () => {
  resetVotingModal(); // reset first
  votingModal.classList.remove("active");
});


