// src/pages/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import CategorySidebar from '../../components/CategorySidebar/CategorySidebar';
import NomineeCard from '../../components/NomineeCard/NomineeCard';
import './Dashboard.css';

const Dashboard = () => {
  const [nomineesData, setNomineesData] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      category: "philanthropist",
      votes: 1845,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      gender: "female",
      trending: true,
    },
    // ... more nominee data
  ]);

  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'all',
    sort: 'recent',
    search: ''
  });

  useEffect(() => {
    // Initialize dashboard
    updateStats();
    setupEventListeners();
  }, []);

  const updateStats = () => {
    // Calculate total votes
    const totalVotes = nomineesData.reduce(
      (sum, nominee) => sum + nominee.votes,
      0
    );
    
    // Update DOM elements if needed
    const totalVotesElement = document.getElementById("total-votes");
    if (totalVotesElement) totalVotesElement.textContent = totalVotes.toLocaleString();
    
    const totalNomineesElement = document.getElementById("total-nominees");
    if (totalNomineesElement) totalNomineesElement.textContent = nomineesData.length;
    
    // Set total categories (count unique categories)
    const uniqueCategories = new Set(
      nomineesData.map((nominee) => nominee.category)
    );
    const totalCategoriesElement = document.getElementById("total-categories");
    if (totalCategoriesElement) totalCategoriesElement.textContent = uniqueCategories.size;
  };

  const setupEventListeners = () => {
    // Header scroll effect
    const contentArea = document.querySelector(".content-area");
    const header = document.getElementById("header");
    const SCROLL_THRESHOLD = 100;

    const handleHeaderOnScroll = () => {
      const scrollTop = contentArea ? contentArea.scrollTop : window.scrollY;
      if (scrollTop > SCROLL_THRESHOLD) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    if (contentArea) {
      contentArea.addEventListener("scroll", handleHeaderOnScroll, {
        passive: true,
      });
    } else {
      window.addEventListener("scroll", handleHeaderOnScroll, {
        passive: true,
      });
    }
  };

  const navigateToCategory = (category) => {
    setActiveCategory(category);
    
    // Update UI to show category page
    const dashboardSection = document.getElementById("dashboard");
    const categoryPage = document.getElementById("category-page");
    
    if (dashboardSection && categoryPage) {
      if (category === 'dashboard') {
        dashboardSection.style.display = "block";
        categoryPage.style.display = "none";
      } else {
        dashboardSection.style.display = "none";
        categoryPage.style.display = "block";
      }
    }
  };

  const handleVote = (nomineeId) => {
    setNomineesData(prevData => 
      prevData.map(nominee => 
        nominee.id === nomineeId 
          ? { ...nominee, votes: nominee.votes + 1 }
          : nominee
      )
    );
    
    // Show confirmation
    const nominee = nomineesData.find(n => n.id === nomineeId);
    if (nominee) {
      alert(`Vote recorded for ${nominee.name}!`);
    }
    
    // Update stats
    updateStats();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Filter nominees based on current filters
  const filteredNominees = nomineesData.filter(nominee => {
    if (filters.gender !== 'all' && nominee.gender !== filters.gender) return false;
    if (filters.search && !nominee.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Sort nominees based on current sort filter
  const sortedNominees = [...filteredNominees].sort((a, b) => {
    switch (filters.sort) {
      case 'recent': return b.id - a.id;
      case 'votes': return b.votes - a.votes;
      case 'trending': 
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return b.votes - a.votes;
      default: return 0;
    }
  });

  // Get popular nominees (top 5 by votes)
  const popularNominees = [...nomineesData]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  // Get recent nominees (last 5 added, simulated by id)
  const recentNominees = [...nomineesData]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  return (
    <div className="main-container">
      <CategorySidebar 
        activeCategory={activeCategory}
        onCategoryChange={navigateToCategory}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      <div className="content-area">
        {/* Dashboard Section */}
        <section className="dashboard-section" id="dashboard">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-card" onClick={() => navigateToCategory('all')}>
                <div className="stat-icon">
                  <i className="fas fa-vote-yea"></i>
                </div>
                <div className="stat-value" id="total-votes">
                  {nomineesData.reduce((sum, nominee) => sum + nominee.votes, 0).toLocaleString()}
                </div>
                <div className="stat-label">Total Votes</div>
              </div>

              <div className="stat-card" onClick={() => navigateToCategory('all')}>
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-value" id="total-nominees">
                  {nomineesData.length}
                </div>
                <div className="stat-label">Total Nominees</div>
              </div>

              <div className="stat-card" onClick={() => navigateToCategory('all')}>
                <div className="stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-value" id="total-categories">
                  {new Set(nomineesData.map(nominee => nominee.category)).size}
                </div>
                <div className="stat-label">Award Categories</div>
              </div>
            </div>

            {/* Most Popular Votes */}
            <div className="voting-section">
              <div className="section-header">
                <h2 className="section-title">Most Popular Votes</h2>
              </div>

              <div className="nominees-scroller">
                {popularNominees.map(nominee => (
                  <NomineeCard 
                    key={nominee.id} 
                    nominee={nominee} 
                    onVote={handleVote}
                  />
                ))}
              </div>
            </div>

            {/* Most Recent Votes */}
            <div className="voting-section">
              <div className="section-header">
                <h2 className="section-title">Most Recent Votes</h2>
              </div>

              <div className="nominees-scroller">
                {recentNominees.map(nominee => (
                  <NomineeCard 
                    key={nominee.id} 
                    nominee={nominee} 
                    onVote={handleVote}
                  />
                ))}
              </div>
            </div>

            {/* All Votes */}
            <div className="voting-section">
              <div className="section-header">
                <h2 className="section-title">All Votes</h2>
              </div>

              <div className="all-votes-grid">
                {nomineesData.slice(0, 15).map(nominee => (
                  <NomineeCard 
                    key={nominee.id} 
                    nominee={nominee} 
                    onVote={handleVote}
                  />
                ))}
              </div>

              <div className="view-more">
                <button className="btn btn-outline" onClick={() => navigateToCategory('all')}>
                  View More Votes
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Category Page (Hidden by default) */}
        <section className="category-page" id="category-page" style={{ display: 'none' }}>
          <div className="category-header">
            <h1 className="category-title" id="category-title">
              {activeCategory === 'all' ? 'All Categories' : activeCategory}
            </h1>
            <p className="category-description" id="category-description">
              {/* Category description would go here */}
            </p>

            <div className="filter-controls">
              <select 
                className="filter-select" 
                id="gender-filter"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select 
                className="filter-select" 
                id="sort-filter"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="votes">Highest Votes</option>
                <option value="trending">Trending</option>
                <option value="all">All</option>
              </select>

              <div className="search-bar">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search nominees..."
                  id="nominee-search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="all-votes-grid" id="category-nominees">
            {sortedNominees.map(nominee => (
              <NomineeCard 
                key={nominee.id} 
                nominee={nominee} 
                onVote={handleVote}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;