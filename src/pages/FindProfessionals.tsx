import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import './FindProfessionals.css';

// Mock data for professionals
const MOCK_PROFESSIONALS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    type: 'coach' as const,
    bio: 'Certified fitness coach with 8+ years experience',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 4.8,
    reviewCount: 156,
    reviewStats: {
      averageRating: 4.8,
      totalReviews: 156,
      recommendedCount: 148,
    },
    specialties: ['HIIT', 'Strength Training', 'Weight Loss'],
    languages: ['English', 'Spanish'],
    hourlyRate: 50,
    responseTime: '2 hours',
    availability: true,
    bookingUrl: '/professional/1',
  },
  {
    id: '2',
    name: 'Dr. Priya Mehta',
    type: 'dietician' as const,
    bio: 'Registered Dietician Nutritionist specializing in sports nutrition',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    rating: 4.9,
    reviewCount: 203,
    reviewStats: {
      averageRating: 4.9,
      totalReviews: 203,
      recommendedCount: 198,
    },
    specialties: ['Sports Nutrition', 'Weight Management', 'Plant-Based Diet'],
    languages: ['English', 'Hindi'],
    hourlyRate: 45,
    responseTime: '1 hour',
    availability: true,
    bookingUrl: '/professional/2',
  },
  {
    id: '3',
    name: 'James Wilson',
    type: 'coach' as const,
    bio: 'Personal trainer focused on functional fitness and mobility',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    rating: 4.7,
    reviewCount: 89,
    reviewStats: {
      averageRating: 4.7,
      totalReviews: 89,
      recommendedCount: 82,
    },
    specialties: ['Functional Fitness', 'Mobility', 'Recovery'],
    languages: ['English'],
    hourlyRate: 55,
    responseTime: '3 hours',
    availability: true,
    bookingUrl: '/professional/3',
  },
  {
    id: '4',
    name: 'Ananya Sharma',
    type: 'coach' as const,
    bio: 'Yoga and mindfulness coach for stress management',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
    rating: 4.6,
    reviewCount: 124,
    reviewStats: {
      averageRating: 4.6,
      totalReviews: 124,
      recommendedCount: 118,
    },
    specialties: ['Yoga', 'Mindfulness', 'Stress Management'],
    languages: ['English', 'Hindi'],
    hourlyRate: 35,
    responseTime: '1 hour',
    availability: true,
    bookingUrl: '/professional/4',
  },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'reviews', label: 'Most Reviews' },
];

const PROFESSIONAL_TYPES = ['All', 'Coach', 'Dietician'];

interface FilterState {
  priceRange: [number, number];
  minRating: number;
  type: string;
}

const FindProfessionals: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [30, 100],
    minRating: 4,
    type: 'All',
  });
  const [activeFilters, setActiveFilters] = useState(0);

  // Filter and sort professionals
  const filtered = useMemo(() => {
    let results = MOCK_PROFESSIONALS.filter((prof) => {
      const matchesSearch =
        prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType =
        filters.type === 'All' ||
        prof.type.toLowerCase() === filters.type.toLowerCase();

      const matchesPrice =
        prof.hourlyRate >= filters.priceRange[0] &&
        prof.hourlyRate <= filters.priceRange[1];

      const matchesRating = prof.rating >= filters.minRating;

      return (
        matchesSearch &&
        matchesType &&
        matchesPrice &&
        matchesRating
      );
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'price-high':
        results.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'reviews':
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'rating':
      default:
        results.sort((a, b) => b.rating - a.rating);
    }

    return results;
  }, [searchQuery, sortBy, filters]);

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (filters.priceRange[0] > 30 || filters.priceRange[1] < 100) count++;
    if (filters.minRating > 4) count++;
    if (filters.type !== 'All') count++;
    setActiveFilters(count);
  }, [filters]);

  const updateFilters = (updater: (prev: FilterState) => FilterState) => {
    setFilters(updater);
  };

  return (
    <div className="find-professionals-container">
      {/* Header */}
      <div className="search-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Find Professionals</h1>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <Input
            type="text"
            placeholder="Search by name, speciality..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="filter-button"
            >
              <Filter size={16} />
              {activeFilters > 0 && (
                <Badge className="ml-1">{activeFilters}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="filter-sheet">
            <SheetHeader>
              <SheetTitle>Filter Professionals</SheetTitle>
            </SheetHeader>

            <div className="filter-content">
              {/* Type Filter */}
              <div className="filter-group">
                <label className="filter-label">Professional Type</label>
                <div className="filter-options">
                  {PROFESSIONAL_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant={filters.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateFilters((f) => ({
                          ...f,
                          type,
                        }))
                      }
                      className="filter-option"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-group">
                <label className="filter-label">
                  Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}/hr
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) =>
                    updateFilters((f) => ({
                      ...f,
                      priceRange: [value[0], value[1]],
                    }))
                  }
                  min={20}
                  max={200}
                  step={10}
                  className="price-slider"
                />
              </div>

              {/* Rating Filter */}
              <div className="filter-group">
                <label className="filter-label">
                  Minimum Rating: {filters.minRating}⭐
                </label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={(value) =>
                    updateFilters((f) => ({
                      ...f,
                      minRating: value[0],
                    }))
                  }
                  min={1}
                  max={5}
                  step={0.5}
                  className="rating-slider"
                />
              </div>

              <Button
                onClick={() =>
                  setFilters({
                    priceRange: [30, 100],
                    minRating: 4,
                    type: 'All',
                  })
                }
                variant="outline"
                className="reset-button"
              >
                Reset Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sort Bar */}
      <div className="sort-bar">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Professionals Grid */}
      <div className="professionals-container">
        {filtered.length > 0 ? (
          <div className="professionals-grid">
            {filtered.map((professional) => (
              <div
                key={professional.id}
                className="professional-card"
                onClick={() => navigate(`/professional/${professional.id}`)}
              >
                <div className="card-header">
                  <img
                    src={professional.avatar}
                    alt={professional.name}
                    className="professional-avatar"
                  />
                  <div className="header-right">
                    <div className="rating-badge">
                      <span className="rating-value">
                        {professional.rating}
                      </span>
                      <span className="star">⭐</span>
                    </div>
                    <span className="review-count">
                      ({professional.reviewCount})
                    </span>
                  </div>
                </div>

                <h3 className="professional-name">{professional.name}</h3>
                <p className="professional-type">
                  {professional.type.charAt(0).toUpperCase() +
                    professional.type.slice(1)}
                </p>

                <p className="professional-bio">
                  {professional.bio}
                </p>

                <div className="specialties-container">
                  {professional.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="specialty-badge">
                      {specialty}
                    </Badge>
                  ))}
                  {professional.specialties.length > 2 && (
                    <Badge variant="outline">
                      +{professional.specialties.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="card-footer">
                  <div className="footer-left">
                    <span className="hourly-rate">
                      ₹{professional.hourlyRate}/hr
                    </span>
                    <span className="response-time">
                      {professional.responseTime}
                    </span>
                  </div>
                  <ChevronDown size={16} className="chevron-icon" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No professionals found matching your criteria.</p>
            <p className="empty-subtext">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindProfessionals;
