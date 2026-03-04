'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchAllProfiles } from '@/lib/features/profiles/profilesSlice';
import type { RootState } from '@/lib/store';
import ProfileCard from '@/components/ProfileCard';
import SpaCard from '@/components/SpaCard';
import locationsData from '@/data/counties.json';
import { FiArrowLeft } from 'react-icons/fi';
import { IoStarOutline } from 'react-icons/io5';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import { LuLeaf, LuSpade, LuSearchCheck } from 'react-icons/lu';
import { CgGirl } from 'react-icons/cg';
import { GiSelfLove, GiCurlyMask, GiDualityMask } from 'react-icons/gi';

// Helper to convert URL slug to proper county name
const urlToCounty = (slug: string): string => {
  const decoded = decodeURIComponent(slug).toLowerCase();
  const county = (locationsData as any[]).find(
    (c) => c.name.toLowerCase() === decoded
  );
  return county?.name || slug;
};

// Helper to convert URL slug to proper location name
const urlToLocation = (slug: string): string => {
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ').toLowerCase();
  return decoded;
};

// Helper to convert URL slug to proper area name
const urlToArea = (slug: string): string => {
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ').toLowerCase();
  return decoded;
};

interface Profile {
  _id: string;
  userType: string;
  packageType: string;
  profileImage?: { url: string };
  [key: string]: any;
}

interface Spa extends Profile {}

interface ProfilesByTier {
  elite: Profile[];
  premium: Profile[];
  basic: Profile[];
}

interface SpasByTier {
  elite: Spa[];
  premium: Spa[];
  basic: Spa[];
}

interface RenderSectionProps {
  tier: 'elite' | 'premium' | 'basic';
  icon: React.ReactNode;
  items: Profile[] | Spa[];
  title: string;
  description: string;
  isSpas?: boolean;
}

export default function LocationPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();

  const countySlug = params.county as string;
  const county = urlToCounty(countySlug);

  const { filteredProfiles: allProfiles, loading } = useAppSelector(
    (state: RootState) => state.profiles
  );

  const [bgImage, setBgImage] = useState(
    'https://res.cloudinary.com/dowxcmeyy/image/upload/v1760969542/alchemyst-escorts_e0cdbo.png'
  );
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [areasList, setAreasList] = useState<string[]>([]);
  const [profilesByTier, setProfilesByTier] = useState<ProfilesByTier>({
    elite: [],
    premium: [],
    basic: [],
  });
  const [spasByTier, setSpasByTier] = useState<SpasByTier>({
    elite: [],
    premium: [],
    basic: [],
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // Fetch profiles on mount
  useEffect(() => {
    dispatch(fetchAllProfiles());
    window.scrollTo(0, 0);
  }, [dispatch]);

  // Update background image based on county
  useEffect(() => {
    const countyData = (locationsData as any[]).find(
      (c) => c.name.toLowerCase() === county.toLowerCase()
    );
    setBgImage(
      countyData?.coverImage ||
        'https://res.cloudinary.com/dowxcmeyy/image/upload/v1760969542/alchemyst-escorts_e0cdbo.png'
    );
  }, [county]);

  // Extract locations and areas for this county
  const extractLocationsAndAreas = () => {
    const countyData = (locationsData as any[]).find(
      (c) => c.name.toLowerCase() === county.toLowerCase()
    );

    if (!countyData) {
      setLocationsList([]);
      setAreasList([]);
      return;
    }

    // Get unique locations
    const locs = [...new Set(countyData.sub_counties || [])];
    setLocationsList(locs);

    // Get areas only if no location selected, or specific location's areas
    if (!selectedLocation && countyData.popular_areas) {
      setAreasList(countyData.popular_areas || []);
    } else if (selectedLocation) {
      // For simplicity, use popular areas if location selected
      setAreasList(countyData.popular_areas || []);
    } else {
      setAreasList([]);
    }
  };

  // Filter and categorize profiles/spas
  const filterAndCategorizeProfiles = () => {
    setLocalLoading(true);

    let filtered = allProfiles;

    // Filter by county
    filtered = filtered.filter(
      (profile) =>
        profile.location?.county?.toLowerCase() === county.toLowerCase()
    );

    // Filter by location if selected
    if (selectedLocation && selectedLocation !== 'all') {
      filtered = filtered.filter(
        (profile) =>
          profile.location?.subCounty?.toLowerCase() ===
          selectedLocation.toLowerCase()
      );
    }

    // Filter by area if selected
    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(
        (profile) =>
          profile.location?.area?.toLowerCase() === selectedArea.toLowerCase()
      );
    }

    // Separate into profiles and spas, then by tier
    const newProfiles: ProfilesByTier = { elite: [], premium: [], basic: [] };
    const newSpas: SpasByTier = { elite: [], premium: [], basic: [] };

    filtered.forEach((profile) => {
      const tier = (profile.packageType || 'basic').toLowerCase() as
        | 'elite'
        | 'premium'
        | 'basic';

      if (profile.userType === 'spa') {
        newSpas[tier].push(profile);
      } else {
        newProfiles[tier].push(profile);
      }
    });

    setProfilesByTier(newProfiles);
    setSpasByTier(newSpas);
    setLocalLoading(false);
  };

  // Update locations/areas when county changes
  useEffect(() => {
    extractLocationsAndAreas();
  }, [county, selectedLocation]);

  // Filter when profiles load or selections change
  useEffect(() => {
    filterAndCategorizeProfiles();
  }, [allProfiles, county, selectedLocation, selectedArea]);

  const handleLocationClick = (location: string) => {
    setSelectedLocation(location === selectedLocation ? null : location);
    setSelectedArea(null);
  };

  const handleAreaClick = (area: string) => {
    setSelectedArea(area === selectedArea ? null : area);
  };

  const renderProfileSection = ({
    tier,
    icon,
    items,
    title,
    description,
  }: RenderSectionProps) => {
    if (items.length === 0) return null;

    return (
      <div key={`profiles-${tier}`} className="my-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl text-primary">{icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-text-inverse">{title}</h2>
            <p className="text-text-muted text-sm">{description}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((profile) => (
            <ProfileCard key={profile._id} profile={profile} />
          ))}
        </div>
      </div>
    );
  };

  const renderSpaSection = ({
    tier,
    icon,
    items,
    title,
    description,
  }: RenderSectionProps) => {
    if (items.length === 0) return null;

    return (
      <div key={`spas-${tier}`} className="my-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl text-primary">{icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-text-inverse">{title}</h2>
            <p className="text-text-muted text-sm">{description}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((spa) => (
            <SpaCard key={spa._id} profile={spa} />
          ))}
        </div>
      </div>
    );
  };

  const totalProfiles =
    profilesByTier.elite.length +
    profilesByTier.premium.length +
    profilesByTier.basic.length;
  const totalSpas =
    spasByTier.elite.length +
    spasByTier.premium.length +
    spasByTier.basic.length;

  const getPageTitle = () => {
    if (selectedArea) {
      return `${selectedArea} in ${selectedLocation || county}`;
    }
    if (selectedLocation) {
      return `${selectedLocation}`;
    }
    return `Escorts & Services in ${county}`;
  };

  const getPageSubtitle = () => {
    const baseText = `Premium adult entertainment services`;
    if (selectedArea) {
      return `${baseText} in ${selectedArea}, ${selectedLocation || county}`;
    }
    if (selectedLocation) {
      return `${baseText} in ${selectedLocation}`;
    }
    return `${baseText} in ${county}`;
  };

  const showLoading = (loading && allProfiles.length === 0) || localLoading;
  const showNoResults =
    !showLoading && allProfiles.length > 0 && totalProfiles === 0 && totalSpas === 0;
  const showContent = !showLoading && !showNoResults;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="bg-cover bg-center py-10 px-4 relative"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative container mx-auto max-w-7xl z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-inverse/80 hover:text-text-inverse mb-6 transition-colors"
          >
            <FiArrowLeft />
            Back
          </button>

          <h1 className="text-4xl font-bold text-text-inverse mb-2 capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-lg text-text-inverse/70 capitalize">
            {getPageSubtitle()}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {locationsList.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {selectedLocation ? 'Other Locations' : 'Browse by Location'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {locationsList.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationClick(loc)}
                  className={`px-4 py-1 rounded-full border transition-all text-sm cursor-pointer ${
                    selectedLocation === loc
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-foreground border-border hover:bg-gray-50'
                  }`}
                >
                  {loc}
                </button>
              ))}
              {selectedLocation && (
                <button
                  onClick={() => handleLocationClick('all')}
                  className="px-4 py-1 text-sm rounded-full border border-border bg-white text-foreground hover:bg-gray-50 transition-all cursor-pointer"
                >
                  All Locations
                </button>
              )}
            </div>
          </div>
        )}

        {areasList.length > 0 && (
          <div className="mb-0">
            <h3 className="text-lg font-semibold mb-4">
              {selectedArea ? 'Other Areas' : 'Browse by Area'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {areasList.map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaClick(area)}
                  className={`px-4 py-1 rounded-full border transition-all text-sm cursor-pointer ${
                    selectedArea === area
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-foreground border-border hover:bg-gray-50'
                  }`}
                >
                  {area}
                </button>
              ))}
              {selectedArea && (
                <button
                  onClick={() => handleAreaClick('all')}
                  className="px-4 py-1 text-sm rounded-full border border-border bg-white text-foreground hover:bg-gray-50 transition-all"
                >
                  All Areas
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {showLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : showNoResults ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">
              No profiles found in this location.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              Go Back
            </button>
          </div>
        ) : (
          showContent && (
            <>
              {/* VIP Spas */}
              {renderSpaSection({
                tier: 'elite',
                icon: <IoStarOutline size={30} />,
                items: spasByTier.elite,
                title: 'VIP LUXURY SPAS & PARLORS',
                description: `Step into ultimate luxury with ${selectedArea || selectedLocation || county}'s most exclusive adult entertainment venues. These premium spas offer VIP treatment, elite services, and complete discretion.`,
                isSpas: true,
              })}

              {/* VIP Escorts */}
              {renderProfileSection({
                tier: 'elite',
                icon: <MdOutlineLocalFireDepartment size={30} />,
                items: profilesByTier.elite,
                title: 'VIP ESCORTS & MODELS',
                description: `These are the sexiest call girls, escorts, masseuses and OF models in ${selectedArea || selectedLocation || county}. Step into a world of pleasure with verified profiles.`,
              })}

              {/* Premium Spas */}
              {renderSpaSection({
                tier: 'premium',
                icon: <LuLeaf size={30} />,
                items: spasByTier.premium,
                title: 'PREMIUM RELAXATION SPOTS',
                description: `Discover ${selectedArea || selectedLocation || county}'s finest massage parlors and adult spas with professional services.`,
                isSpas: true,
              })}

              {/* Premium Escorts */}
              {renderProfileSection({
                tier: 'premium',
                icon: <CgGirl size={30} />,
                items: profilesByTier.premium,
                title: 'FEATURED INDEPENDENT MODELS',
                description: `Meet ${selectedArea || selectedLocation || county}'s most sought-after independent escorts with premium companionship services.`,
              })}

              {/* Basic Section Divider */}
              {(profilesByTier.elite.length > 0 ||
                profilesByTier.premium.length > 0) &&
                profilesByTier.basic.length > 0 && (
                  <div className="my-8 border-t border-border pt-8">
                    <h2 className="text-xl font-bold text-center text-muted-foreground mb-4">
                      REGULAR PROFILES
                    </h2>
                  </div>
                )}

              {/* Basic Spas */}
              {renderSpaSection({
                tier: 'basic',
                icon: <LuSpade size={30} />,
                items: spasByTier.basic,
                title: 'QUALITY SPAS & MASSAGE CENTERS',
                description: `Reliable and affordable spa services in ${selectedArea || selectedLocation || county} with verified credentials.`,
                isSpas: true,
              })}

              {/* Basic Escorts */}
              {renderProfileSection({
                tier: 'basic',
                icon: <GiSelfLove size={30} />,
                items: profilesByTier.basic,
                title: 'LOCAL INDEPENDENT SERVICE PROVIDERS',
                description: `Browse through ${selectedArea || selectedLocation || county}'s diverse selection of independent escorts and models.`,
              })}
            </>
          )
        )}

        {/* SEO Content Section */}
        {showContent && (
          <div className="border-t border-border">
            <div className="container mx-auto px-4 pt-10 max-w-7xl max-md:px-2">
              <div className="bg-white rounded-2xl py-8 max-md:py-0">
                <div className="prose prose-lg max-w-none text-gray-700">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 max-md:text-lg">
                    Find the Best Escorts, Call Girls & Adult Services in{' '}
                    <span className="capitalize">
                      {selectedLocation || county}
                    </span>
                  </h2>

                  <p className="text-xl leading-relaxed mb-6 max-md:text-sm">
                    Welcome to Alchemyst's exclusive directory of premium adult
                    entertainment in{' '}
                    <strong className="capitalize">
                      {selectedLocation || county}
                    </strong>
                    . Whether you're looking for <strong>sexy escorts</strong>,{' '}
                    <strong>professional masseuses</strong>,{' '}
                    <strong>exclusive OF-models</strong>, or{' '}
                    <strong>luxurious spas</strong>, we've curated the finest
                    selection of verified service providers.
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 max-md:text-lg max-md:mt-4">
                    Premium Adult Entertainment in{' '}
                    <span className="capitalize">
                      {selectedLocation || county}
                    </span>
                  </h3>

                  <p className="leading-relaxed mb-6">
                    <span className="capitalize">
                      {selectedLocation ? `${selectedLocation}, ${county}` : county}
                    </span>{' '}
                    is known for its vibrant nightlife and adult entertainment
                    scene. Our platform connects you with{' '}
                    <strong>verified independent models</strong>,{' '}
                    <strong>professional escorts</strong>, and{' '}
                    <strong>reputable spas</strong>.
                  </p>

                  <div className="grid md:grid-cols-2 gap-8 my-8">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 max-md:p-4">
                      <h4 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2 max-md:text-lg">
                        <GiCurlyMask />
                        What to Expect in{' '}
                        <span className="capitalize">
                          {selectedLocation || county}
                        </span>
                      </h4>
                      <ul className="space-y-3 text-blue-800">
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Verified Profiles</strong> - All models and
                            spas are thoroughly verified
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Direct Contact</strong> - No middlemen,
                            communicate directly
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Complete Discretion</strong> - Your privacy
                            is our priority
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Competitive Rates</strong> - Fair pricing
                            with no hidden costs
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 max-md:p-4">
                      <h4 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2 max-md:text-lg">
                        <GiDualityMask />
                        Popular Services
                      </h4>
                      <ul className="space-y-3 text-purple-800">
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Escort Services</strong> - Premium companionship
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Therapeutic Massage</strong> - Professional
                            bodywork
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>Spa Experiences</strong> - Luxury adult
                            entertainment
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            <strong>OF-Model Content</strong> - Exclusive digital
                            experiences
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                    How to Connect with{' '}
                    <span className="capitalize">{selectedLocation || county}</span> Service
                    Providers
                  </h3>

                  <p className="leading-relaxed mb-6">
                    Getting in touch with our verified escorts, masseuses, and
                    spas is simple and straightforward. Browse through our
                    carefully curated profiles, check availability, and contact
                    directly via phone or WhatsApp.
                  </p>

                  <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white my-8 max-md:p-4">
                    <h4 className="text-2xl font-bold mb-4 text-center">
                      Join {selectedLocation || county}'s Premier Adult Entertainment
                      Community
                    </h4>
                    <p className="text-lg text-center mb-6 opacity-90 max-md:text-sm">
                      Whether you're a service provider or seeking premium adult
                      entertainment, Alchemyst offers the perfect platform for
                      discreet, professional connections.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => router.push('/sign-up')}
                        className="px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg cursor-pointer"
                      >
                        Find Services
                      </button>
                      <button
                        onClick={() => router.push('/sign-up?type=provider')}
                        className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-primary transition-all cursor-pointer"
                      >
                        List Your Services
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gray-100 rounded-lg border-l-4 border-primary">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <LuSearchCheck />
                      Popular Searches in{' '}
                      <span className="capitalize">{selectedLocation || county}</span>:
                    </h4>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-white px-3 py-1 rounded-full border">
                        escorts {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        call girls {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        massage services {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        spas {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        of-models {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        adult entertainment {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        independent models {selectedLocation || county}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border">
                        hookup {selectedLocation || county}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
