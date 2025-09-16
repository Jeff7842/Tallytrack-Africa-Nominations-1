// Sample nominee data
        const nominees = [
            {
                name: "Ama Mensah",
                category: "Content Creation",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "CC-2023",
                gender: "female",
                bio: "Creative content creator with over 1M followers across platforms. Known for her engaging educational content.",
                votes: 12500,
        categoryTarget: 50000
            },
            {
                name: "Kwame Osei",
                category: "Music & Entertainment",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "ME-1845",
                gender: "male",
                bio: "Award-winning musician with 3 albums. His fusion of traditional and modern sounds has captivated audiences.",
                votes: 38000,
        categoryTarget: 50000
            },
            {
                name: "Ngozi Adeyemi",
                category: "Business & Entrepreneurship",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "BE-3621",
                gender: "female",
                bio: "Founder of a successful tech startup that employs over 200 people across Africa. Revolutionizing e-commerce.",
                votes: 35000,
        categoryTarget: 43000
            },
            {
                name: "David Chukwu",
                category: "Philanthropy",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "PH-4592",
                gender: "male",
                bio: "Established 5 schools in rural communities. His foundation has provided education to over 10,000 children.",
                votes: 18000,
        categoryTarget: 40000
            },
            {
                name: "Fatima Diallo",
                category: "Innovation",
                image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "IN-7351",
                gender: "female",
                bio: "Developed a revolutionary water purification system that's being used in 12 countries across Africa.",
                votes: 27000,
        categoryTarget: 42000
            },
            {
                name: "Joseph Banda",
                category: "Community Leadership",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "CL-6284",
                gender: "male",
                bio: "Community organizer who has transformed his neighborhood through youth programs and economic initiatives.",
                votes: 10300,
        categoryTarget: 38000
            },
            {
                name: "Sarah Johnson",
                category: "Content Creation",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "CC-1923",
                gender: "female",
                bio: "Popular science communicator with viral educational videos. Making complex topics accessible to all.",
                votes: 32000,
        categoryTarget: 50000
            },
            {
                name: "Tunde Williams",
                category: "Music & Entertainment",
                image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "ME-2753",
                gender: "male",
                bio: "Actor and director known for groundbreaking films that showcase African stories to global audiences.",
                votes: 27500,
        categoryTarget: 50000
            },
            {
                name: "Chinedu Okoro",
                category: "Business & Entrepreneurship",
                image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "BE-4826",
                gender: "male",
                bio: "Built a sustainable agriculture business that supports smallholder farmers across West Africa.",
                votes: 18023,
        categoryTarget: 45000
            },
            {
                name: "Amina Soumah",
                category: "Philanthropy",
                image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                id: "PH-5567",
                gender: "female",
                bio: "Founded healthcare initiatives that have provided medical services to over 50,000 people in remote areas.",
            
                votes: 22000,
        categoryTarget: 40000
            },
        ];

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
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize hero slider
            initHeroSlider();
            
            // Initialize nominee cards
            initNominees();
            
            // Initialize scroll animations
            initScrollAnimations();
            
            // Initialize counter animations
            initCounters();
            
            // Initialize auto-scroll for nominees
            initAutoScroll();
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

        // Initialize Nominees
        // Initialize Nominees
// Initialize Nominees
function initNominees() {
    nominees.forEach(nominee => {
        const card = document.createElement('div');
        card.className = 'nominee-card';
        
        // Calculate percentage for the vote bar
        const percentage = Math.min(100, (nominee.votes / nominee.categoryTarget) * 100);
        
        card.innerHTML = `
            <div class="nominee-card-inner">
                <img src="${nominee.image}" alt="${nominee.name}" class="nominee-image">
                <div class="nominee-content">
                    <h3 class="nominee-name">
                        ${nominee.name}
                        <i class="fas fa-${nominee.gender}"></i>
                    </h3>
                    <p class="nominee-category">${nominee.category}</p>
                    <div class="nominee-id">
                        <i class="fas fa-id-card"></i>
                        <span>${nominee.id}</span>
                    </div>
                    <p class="nominee-details">${nominee.bio}</p>
                    
                    <!-- Vote information placed above the vote button -->
                    <div class="vote-info">
                        <div class="vote-bar-container">
                            <div class="vote-bar">
                                <div class="vote-fill" style="width: 0%"></div>
                            </div>
                            <div class="vote-count">${nominee.votes.toLocaleString()}</div>
                        </div>
                        <div class="vote-target">${Math.round(percentage)}% of ${nominee.categoryTarget.toLocaleString()} target</div>
                    </div>
                    
                    <button class="btn btn-outline">Vote Now</button>
                </div>
            </div>
        `;
        
        nomineesScroller.appendChild(card);
        
        // Animate the vote bar after a short delay
        setTimeout(() => {
            const voteFill = card.querySelector('.vote-fill');
            voteFill.style.width = `${percentage}%`;
        }, 500);
    });
}

        // Scroll Animations
        function initScrollAnimations() {
            const animatedElements = document.querySelectorAll('.about-content, .about-image, .about-company-image, .about-company-content, .nominees-header, .view-all-btn, .categories-header, .category-card, .voting-content');
            
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
        function initCounters() {
             // Calculate total votes across all nominees
    const totalVotes = nominees.reduce((sum, nominee) => sum + nominee.votes, 0);
            // Animate votes count
            animateValue(votesCount, 0, totalVotes, 2000);
            
            // Animate nominees count
            animateValue(nomineesCount, 0, nominees.length, 1300);
            
            // Days left doesn't need animation
            animateValue(daysLeft,0, textContent = '14',1000);
        }
        
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
            
            function startAutoScroll() {
                autoScrollInterval = setInterval(() => {
                    nomineesScroller.scrollBy({ left: 370, behavior: 'smooth' });
                }, 3000);
            }
            
            function stopAutoScroll() {
                clearInterval(autoScrollInterval);
            }
            
            // Start auto-scroll
            startAutoScroll();
            
            // Pause auto-scroll when user interacts
            nomineesScroller.addEventListener('mouseenter', stopAutoScroll);
            nomineesScroller.addEventListener('mouseleave', startAutoScroll);
            
            // Manual scroll controls
            scrollLeftBtn.addEventListener('click', () => {
                nomineesScroller.scrollBy({ left: -370, behavior: 'smooth' });
            });
            
            scrollRightBtn.addEventListener('click', () => {
                nomineesScroller.scrollBy({ left: 370, behavior: 'smooth' });
            });
        }