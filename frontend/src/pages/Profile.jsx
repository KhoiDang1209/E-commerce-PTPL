// frontend/src/pages/Profile.jsx
import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import { userService } from '../services/userService';
import { ordersService } from '../services/ordersService';
import { referenceService } from '../services/referenceService';
import { useAuth } from '../context/AuthContext';

// Reusable multi-select dropdown (same behavior as in Register page)
const MultiSelect = ({ label, options = [], selected = [], onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = () => setOpen(!open);

  const handleSelect = (value) => {
    if (!onChange) return;
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const findLabel = (val) => {
    const item = options.find((o) => o.id === val);
    return item?.name || item?.title || item?.label || val;
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ marginBottom: '14px', position: 'relative', textAlign: 'left' }}>
      <div style={styles.sectionLabel}>{label}</div>
      <div style={styles.selectShell} onClick={handleToggle}>
        <div style={styles.selectContent}>
          {selected.length === 0 && <span style={styles.placeholder}>{placeholder}</span>}
          {selected.map((val) => (
            <span key={val} style={styles.tag} onClick={(e) => e.stopPropagation()}>
              {findLabel(val)}
              <button
                style={styles.tagClose}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(val);
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <span style={styles.caret}>▾</span>
      </div>
      {open && (
        <div style={styles.dropdown}>
          {options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <div
                key={opt.id || opt.name}
                style={{ ...styles.dropdownItem, ...(active ? styles.dropdownItemActive : {}) }}
                onClick={() => handleSelect(opt.id)}
              >
                <span>{opt.name || opt.title || opt.label}</span>
                {active && <span style={styles.check}>✓</span>}
              </div>
            );
          })}
          {options.length === 0 && <div style={styles.dropdownItem}>No options</div>}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user , setUser} = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dateOfBirth: "",
    country: "",
    preferPlatforms: [],
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Billing address state
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState(null);
  const [billingEditing, setBillingEditing] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [billingForm, setBillingForm] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // Orders (purchase history)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Reference (languages/genres/categories) lookup
  const [refLookup, setRefLookup] = useState({
    languagesById: {},
    genresById: {},
    categoriesById: {},
  });

  // User reference selections (from user_profiles)
  const [refsForm, setRefsForm] = useState({
    langIds: [],
    genreIds: [],
    cateIds: [],
  });
  const [refsSaving, setRefsSaving] = useState(false);
  const [refsError, setRefsError] = useState(null);
  const [refsSuccess, setRefsSuccess] = useState(null);

  // ------------------
  //  NEW: WISHLIST STATES (implemented)
  // ------------------
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  // ---------------------

  // ------------------
  //  NEW: LIBRARY STATES (owned games)
  // ------------------
  const [library, setLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  // ---------------------

  // Backend returns all game fields (g.*) plus wishlist-specific fields
  // No mapping needed - backend already provides all required fields
  const mapWishlistItem = (raw) => raw;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        // backend returns { success: true, data: { profile: { ... } }, message: ... }
        const profileData = data?.data?.profile ?? data?.profile ?? data;
        setProfile(profileData);
        // Format date_of_birth for input field (YYYY-MM-DD format)
        const dateOfBirth = profileData?.date_of_birth 
          ? String(profileData.date_of_birth).slice(0, 10) 
          : '';
        const preferPlatforms = Array.isArray(profileData?.prefer_platforms)
          ? profileData.prefer_platforms
          : [];
        setFormData({
          username: profileData?.username || '',
          email: profileData?.email || '',
          dateOfBirth: dateOfBirth,
          country: profileData?.country || '',
          preferPlatforms,
        });

        // Initialize reference selections from profile
        setRefsForm({
          langIds: Array.isArray(profileData?.prefer_lang_ids) ? profileData.prefer_lang_ids : [],
          genreIds: Array.isArray(profileData?.prefer_genre_ids) ? profileData.prefer_genre_ids : [],
          cateIds: Array.isArray(profileData?.prefer_cate_ids) ? profileData.prefer_cate_ids : [],
        });
      } catch (e) {
        console.error("Error fetching profile:", e);
      } finally {
        setLoading(false);
      }
    };

    // ------------------
    // NEW: Fetch Wishlist (implemented)
    // ------------------
    const fetchWishlist = async () => {
      try {
        const response = await userService.getWishlist();
        // Backend returns: { success: true, data: { games: [...], count, limit, offset }, message }
        // userService.getWishlist() returns response.data, so we get the full response object
        let gamesRaw = [];
        if (response?.data?.games && Array.isArray(response.data.games)) {
          gamesRaw = response.data.games;
        } else if (Array.isArray(response?.data)) {
          gamesRaw = response.data;
        } else if (Array.isArray(response?.games)) {
          gamesRaw = response.games;
        } else if (Array.isArray(response)) {
          gamesRaw = response;
        }

        // Map each item to proper keys (backend returns snake_case, we keep it for consistency)
        const games = gamesRaw.map(mapWishlistItem);

        setWishlist(games);
      } catch (err) {
        console.error("Failed to load wishlist", err);
        setWishlist([]);
      } finally {
        setLoadingWishlist(false);
      }
    };
    // ---------------------

    // ------------------
    // NEW: Fetch Library (owned games)
    // ------------------
    const fetchLibrary = async () => {
      try {
        const response = await userService.getLibrary();
        // Backend returns: { success: true, data: { games: [...], count, limit, offset }, message }
        let gamesRaw = [];
        if (response?.data?.games && Array.isArray(response.data.games)) {
          gamesRaw = response.data.games;
        } else if (Array.isArray(response?.data)) {
          gamesRaw = response.data;
        } else if (Array.isArray(response?.games)) {
          gamesRaw = response.games;
        } else if (Array.isArray(response)) {
          gamesRaw = response;
        }

        // Map each item to proper keys (backend returns snake_case, we keep it for consistency)
        const games = gamesRaw.map((raw) => raw);

        setLibrary(games);
      } catch (err) {
        console.error("Failed to load library", err);
        setLibrary([]);
      } finally {
        setLoadingLibrary(false);
      }
    };
    // ---------------------

    // Billing address: load first saved address (if any)
    const fetchBilling = async () => {
      try {
        setBillingLoading(true);
        setBillingError(null);
        const res = await userService.getBillingAddresses();
        const list = res?.data?.addresses || res?.addresses || [];
        const addr = Array.isArray(list) && list.length > 0 ? list[0] : null;
        setBillingAddress(addr);
        if (addr) {
          setBillingForm({
            fullName: addr.full_name || '',
            line1: addr.line1 || '',
            line2: addr.line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            postalCode: addr.postal_code || '',
            country: addr.country || '',
          });
        }
      } catch (err) {
        console.error('Error fetching billing address:', err);
        setBillingError('Failed to load billing address');
      } finally {
        setBillingLoading(false);
      }
    };

    // Orders (purchase history)
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const res = await ordersService.getOrders();
        const list = res?.data?.orders || res?.orders || [];
        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to load orders';
        setOrdersError(msg);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchProfile();
    fetchWishlist();
    fetchLibrary();
    fetchBilling();
    fetchOrders();
  }, []);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [langsRes, genresRes, categoriesRes] = await Promise.all([
          referenceService.getLanguages(),
          referenceService.getGenres(),
          referenceService.getCategories(),
        ]);

        const normalizeList = (res, key) => {
          const list =
            res?.data?.[key] ||
            res?.[key] ||
            res?.data ||
            res ||
            [];
          return Array.isArray(list) ? list : [];
        };

        const langs = normalizeList(langsRes, 'languages');
        const genres = normalizeList(genresRes, 'genres');
        const categories = normalizeList(categoriesRes, 'categories');

        const langsMap = {};
        langs.forEach((l) => {
          if (l?.id != null) langsMap[l.id] = l.name || l.code || `ID ${l.id}`;
        });
        const genresMap = {};
        genres.forEach((g) => {
          if (g?.id != null) genresMap[g.id] = g.name || `ID ${g.id}`;
        });
        const categoriesMap = {};
        categories.forEach((c) => {
          if (c?.id != null) categoriesMap[c.id] = c.name || `ID ${c.id}`;
        });

        setRefLookup({
          languagesById: langsMap,
          genresById: genresMap,
          categoriesById: categoriesMap,
        });
      } catch (err) {
        // soft-fail; references are optional
        console.error('Failed to load reference data for profile:', err);
      }
    };

    loadReferences();
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const togglePlatform = (platform) => {
    setFormData((prev) => {
      const current = new Set(prev.preferPlatforms || []);
      if (current.has(platform)) {
        current.delete(platform);
      } else {
        current.add(platform);
      }
      return { ...prev, preferPlatforms: Array.from(current) };
    });
  };

  const toggleRefId = (field, id) => {
    setRefsForm((prev) => {
      const current = new Set(prev[field] || []);
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      return { ...prev, [field]: Array.from(current) };
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const updatedData = await userService.updateProfile({
        username: formData.username,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        preferPlatforms: formData.preferPlatforms,
      });

      // backend returns { success: true, data: { profile: { ... } }, message: ... }
      const updatedProfile = updatedData?.data?.profile ?? updatedData?.profile ?? updatedData;

      setProfile(updatedProfile);

      // Format date_of_birth for input field (YYYY-MM-DD format)
      const dateOfBirth = updatedProfile?.date_of_birth 
        ? String(updatedProfile.date_of_birth).slice(0, 10) 
        : '';
      const preferPlatforms = Array.isArray(updatedProfile?.prefer_platforms)
        ? updatedProfile.prefer_platforms
        : [];
      setFormData({
        username: updatedProfile?.username ?? '',
        email: updatedProfile?.email ?? '',
        dateOfBirth: dateOfBirth,
        country: updatedProfile?.country || '',
        preferPlatforms,
      });

      // Keep refsForm in sync if backend changed preferences
      setRefsForm({
        langIds: Array.isArray(updatedProfile?.prefer_lang_ids) ? updatedProfile.prefer_lang_ids : [],
        genreIds: Array.isArray(updatedProfile?.prefer_genre_ids) ? updatedProfile.prefer_genre_ids : [],
        cateIds: Array.isArray(updatedProfile?.prefer_cate_ids) ? updatedProfile.prefer_cate_ids : [],
      });

      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Error updating profile:", e);
      const errorMessage = e?.response?.data?.error?.message || e?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    }
  };

  const handleSaveReferences = async () => {
    try {
      setRefsError(null);
      setRefsSuccess(null);
      setRefsSaving(true);

      const updatedData = await userService.updateProfile({
        // Only preference arrays here; basic user info handled by handleSave
        preferLangIds: refsForm.langIds,
        preferGenreIds: refsForm.genreIds,
        preferCateIds: refsForm.cateIds,
        preferPlatforms: formData.preferPlatforms,
      });

      const updatedProfile = updatedData?.data?.profile ?? updatedData?.profile ?? updatedData;
      setProfile(updatedProfile);

      setRefsForm({
        langIds: Array.isArray(updatedProfile?.prefer_lang_ids) ? updatedProfile.prefer_lang_ids : [],
        genreIds: Array.isArray(updatedProfile?.prefer_genre_ids) ? updatedProfile.prefer_genre_ids : [],
        cateIds: Array.isArray(updatedProfile?.prefer_cate_ids) ? updatedProfile.prefer_cate_ids : [],
      });

      setRefsSuccess('References updated');
      setTimeout(() => setRefsSuccess(null), 2500);
    } catch (e) {
      console.error('Error updating references:', e);
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Failed to update references. Please try again.';
      setRefsError(msg);
    } finally {
      setRefsSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const displayName = (() => {
    if (profile?.username && profile.username.trim() !== '') {
      return profile.username;
    }
  
    if (
      (profile?.firstName && profile.firstName.trim() !== '') ||
      (profile?.lastName && profile.lastName.trim() !== '')
    ) {
      return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    }
  
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
  
    return 'User';
  })();
  

  // Format date_of_birth for display (YYYY-MM-DD -> DD/MM/YYYY or show "Not set")
  const birthDate = profile?.date_of_birth 
    ? (() => {
        const dateStr = String(profile.date_of_birth).slice(0, 10);
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      })()
    : 'Not set';


  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Your Profile</h1>

        <div style={styles.card}>
          <div style={styles.cardLeft}>
            <div style={styles.avatarColumn}>
              <div style={styles.avatarContainer}>
                <span style={styles.avatarIcon}>👤</span>
              </div>
              <div style={styles.avatarName}>{displayName}</div>
            </div>

            <div style={styles.infoColumn}>
              <p style={styles.email}>{profile?.email}</p>
              <p style={styles.birthDate}>Date of Birth: {birthDate}</p>
              <p style={styles.birthDate}>Country: {profile?.country || 'Not set'}</p>
              <p style={styles.role}>Role: {profile?.role || (user?.role ?? 'user')}</p>
              {Array.isArray(profile?.prefer_platforms) && profile.prefer_platforms.length > 0 && (
                <p style={styles.birthDate}>
                  Preferred Platforms: {profile.prefer_platforms.join(', ')}
                </p>
              )}
              <p style={styles.birthDate}>
                Billing:&nbsp;
                {billingLoading
                  ? 'Loading...'
                  : billingAddress
                    ? `${billingAddress.line1 || ''}${billingAddress.city ? ', ' + billingAddress.city : ''}${
                        billingAddress.country ? ', ' + billingAddress.country : ''
                      }`
                    : 'Not set'}
              </p>
            </div>
          </div>

          <div style={styles.cardRight}>
            {!editing ? (
              <>
                <button style={styles.editBtn} onClick={handleEditToggle}>
                  Edit Profile
                </button>
                <button
                  style={{ ...styles.secondarySmallBtn, marginTop: 8 }}
                  onClick={() => setBillingEditing(true)}
                >
                  Edit billing address
                </button>
              </>
            ) : (
              <>
                {error && (
                  <div style={styles.errorMessage}>{error}</div>
                )}
                {success && (
                  <div style={styles.successMessage}>{success}</div>
                )}
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={styles.input}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  style={styles.input}
                />
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  style={styles.input}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 600 }}>
                    Preferred Platforms
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['windows', 'mac', 'linux'].map((p) => (
                      <label key={p} style={{ fontSize: '0.9rem', color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={formData.preferPlatforms?.includes(p)}
                          onChange={() => togglePlatform(p)}
                          style={{ marginRight: 6 }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={styles.actionsRow}>
                  <button style={styles.saveBtn} onClick={handleSave}>Save</button>
                  <button style={styles.cancelBtn} onClick={() => {
                    setEditing(false);
                    setError(null);
                    setSuccess(null);
                  }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>

        {billingEditing && (
          <div style={{ ...styles.section, marginTop: 20 }}>
            <h2 style={styles.sectionTitle}>Edit Billing Address</h2>
            <div style={styles.placeholderBox}>
              {billingError && <div style={styles.errorMessage}>{billingError}</div>}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <input
                  type="text"
                  placeholder="Full name"
                  value={billingForm.fullName}
                  onChange={(e) => setBillingForm({ ...billingForm, fullName: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={billingForm.country}
                  onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Address line 1"
                  value={billingForm.line1}
                  onChange={(e) => setBillingForm({ ...billingForm, line1: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Address line 2"
                  value={billingForm.line2}
                  onChange={(e) => setBillingForm({ ...billingForm, line2: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={billingForm.city}
                  onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="State/Province"
                  value={billingForm.state}
                  onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Postal code"
                  value={billingForm.postalCode}
                  onChange={(e) => setBillingForm({ ...billingForm, postalCode: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.actionsRow}>
                <button
                  style={styles.saveBtn}
                  onClick={async () => {
                    try {
                      setBillingError(null);
                      const payload = {
                        fullName: billingForm.fullName,
                        line1: billingForm.line1,
                        line2: billingForm.line2,
                        city: billingForm.city,
                        state: billingForm.state,
                        postalCode: billingForm.postalCode,
                        country: billingForm.country,
                      };
                      let res;
                      if (billingAddress?.id) {
                        res = await userService.updateBillingAddress(billingAddress.id, payload);
                      } else {
                        res = await userService.createBillingAddress(payload);
                      }
                      const addr = res?.data?.address || res?.address || billingAddress || null;
                      setBillingAddress(addr);
                      setBillingEditing(false);
                    } catch (err) {
                      console.error('Failed to save billing address:', err);
                      const msg =
                        err?.response?.data?.error?.message ||
                        err?.response?.data?.message ||
                        'Failed to save billing address';
                      setBillingError(msg);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => {
                    setBillingEditing(false);
                    setBillingError(null);
                    if (billingAddress) {
                      setBillingForm({
                        fullName: billingAddress.full_name || '',
                        line1: billingAddress.line1 || '',
                        line2: billingAddress.line2 || '',
                        city: billingAddress.city || '',
                        state: billingAddress.state || '',
                        postalCode: billingAddress.postal_code || '',
                        country: billingAddress.country || '',
                      });
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------- */}
        {/* USER REFERENCES (user_profiles) */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Your References</h2>
          <div style={styles.placeholderBox}>
            {refsError && <div style={styles.errorMessage}>{refsError}</div>}
            {refsSuccess && <div style={styles.successMessage}>{refsSuccess}</div>}

            <MultiSelect
              label="Languages"
              options={Object.entries(refLookup.languagesById).map(([id, name]) => ({
                id: Number(id),
                name,
              }))}
              selected={refsForm.langIds}
              onChange={(vals) => setRefsForm((prev) => ({ ...prev, langIds: vals }))}
              placeholder="Select languages"
            />

            <MultiSelect
              label="Genres"
              options={Object.entries(refLookup.genresById).map(([id, name]) => ({
                id: Number(id),
                name,
              }))}
              selected={refsForm.genreIds}
              onChange={(vals) => setRefsForm((prev) => ({ ...prev, genreIds: vals }))}
              placeholder="Select genres"
            />

            <MultiSelect
              label="Categories"
              options={Object.entries(refLookup.categoriesById).map(([id, name]) => ({
                id: Number(id),
                name,
              }))}
              selected={refsForm.cateIds}
              onChange={(vals) => setRefsForm((prev) => ({ ...prev, cateIds: vals }))}
              placeholder="Select categories"
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                style={styles.saveBtn}
                onClick={handleSaveReferences}
                disabled={refsSaving}
              >
                {refsSaving ? 'Saving...' : 'Save preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------- */}
        {/* OWNED GAMES — FULL IMPLEMENTATION */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Owned Games</h2>

          {loadingLibrary ? (
            <div style={styles.placeholderBox}>Loading owned games...</div>
          ) : library.length === 0 ? (
            <div style={styles.placeholderBox}>You don't own any games yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {library.map((game) => (
                <div key={game.app_id} style={styles.gameCard}>
                  <img
                    src={game.header_image || game.background || ''}
                    alt={game.name || 'Game'}
                    style={{ width: "100%", borderRadius: "10px", objectFit: "cover", height: 120 }}
                  />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{game.name || 'Untitled Game'}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                      {game.price_final != null ? (
                        <>
                          <span style={{ color: '#111' }}>${Number(game.price_final).toFixed(2)}</span>
                          {game.price_org && Number(game.price_org) > Number(game.price_final) && (
                            <span style={{ textDecoration: 'line-through', marginLeft: 8, color: '#9ca3af' }}>
                              ${Number(game.price_org).toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : game.price_org ? (
                        `$${Number(game.price_org).toFixed(2)}`
                      ) : (
                        'Price N/A'
                      )}
                    </div>

                    <button
                      style={styles.secondarySmallBtn}
                      onClick={() => window.location.href = `/game/${game.app_id}`}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------- */}
        {/* WISHLIST — FULL IMPLEMENTATION */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Wishlist</h2>

          {loadingWishlist ? (
            <div style={styles.placeholderBox}>Loading wishlist...</div>
          ) : wishlist.length === 0 ? (
            <div style={styles.placeholderBox}>Your wishlist is empty.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {wishlist.map((game) => (
                <div key={game.app_id} style={styles.gameCard}>
                  <img
                    src={game.header_image || game.background || ''}
                    alt={game.name || 'Game'}
                    style={{ width: "100%", borderRadius: "10px", objectFit: "cover", height: 120 }}
                  />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{game.name || 'Untitled Game'}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                      {game.price_final != null ? (
                        <>
                          <span style={{ color: '#111' }}>${Number(game.price_final).toFixed(2)}</span>
                          {game.price_org && Number(game.price_org) > Number(game.price_final) && (
                            <span style={{ textDecoration: 'line-through', marginLeft: 8, color: '#9ca3af' }}>
                              ${Number(game.price_org).toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : game.price_org ? (
                        `$${Number(game.price_org).toFixed(2)}`
                      ) : (
                        'Price N/A'
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={styles.removeBtn}
                        onClick={async () => {
                          try {
                            await userService.removeFromWishlist(game.app_id);
                            setWishlist(prev => prev.filter(g => g.app_id !== game.app_id));
                          } catch (err) {
                            console.error('Failed to remove from wishlist', err);
                          }
                        }}
                      >
                        Remove
                      </button>

                      <button
                        style={styles.secondarySmallBtn}
                        onClick={() => window.location.href = `/game/${game.app_id}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------- */}
        {/* PURCHASE HISTORY */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Purchase History</h2>
          <div style={styles.ordersCard}>
            {ordersLoading ? (
              <div style={styles.ordersMessage}>Loading orders...</div>
            ) : ordersError ? (
              <div style={styles.ordersError}>{ordersError}</div>
            ) : orders.length === 0 ? (
              <div style={styles.ordersMessage}>You have no orders yet.</div>
            ) : (
              <div style={styles.ordersList}>
                {orders.map((order) => (
                  <div key={order.id} style={styles.orderRow}>
                    <div style={styles.orderLeft}>
                      <div style={styles.orderId}>Order #{order.id}</div>
                      <div style={styles.orderMeta}>
                        <span>Status: {order.order_status}</span>
                      </div>
                    </div>
                    <div style={styles.orderRight}>
                      <span style={styles.orderTotal}>
                        {order.total_price != null
                          ? `$${Number(order.total_price).toFixed(2)}`
                          : '$0.00'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

/* CSS-IN-JS STYLES */
const styles = {
  container: {
    padding: "40px 80px",
    backgroundColor: "#fafafa",
    minHeight: "100vh"
  },

  title: {
    fontSize: "2.4rem",
    fontWeight: "700",
    marginBottom: "30px",
    color: "#111"
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: "40px"
  },

  cardLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px"
  },

  avatarColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    minWidth: "100px"
  },

  avatarContainer: {
    width: "80px",
    height: "80px",
    background: "#e5e7eb",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  avatarIcon: {
    fontSize: "40px"
  },

  avatarName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#111",
    textAlign: "center"
  },

  infoColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    justifyContent: "center"
  },

  email: {
    margin: "5px 0",
    fontSize: "1rem",
    color: "#555"
  },

  birthDate: {
    fontSize: "0.9rem",
    color: "#777"
  },

  role: {
    fontSize: "0.95rem",
    color: "#4b5563",
    fontWeight: 600
  },

  cardRight: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  editBtn: {
    padding: "10px 18px",
    background: "linear-gradient(90deg, #ef4444, #dc2626)",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer"
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem"
  },

  actionsRow: {
    display: "flex",
    gap: "10px",
    marginTop: "6px"
  },

  saveBtn: {
    padding: "10px 16px",
    background: "linear-gradient(90deg, #16a34a, #15803d)",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    cursor: "pointer"
  },

  cancelBtn: {
    padding: "10px 16px",
    background: "#ddd",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  section: {
    marginTop: "40px"
  },

  sectionTitle: {
    fontSize: "1.6rem",
    marginBottom: "16px"
  },

  placeholderBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px 24px",
    textAlign: "left",
    color: "#4b5563",
    fontSize: "0.95rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
  },

  // ---------------------------------------
  //  Wishlist styles
  // ---------------------------------------
  gameCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  removeBtn: {
    padding: "8px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },

  secondarySmallBtn: {
    padding: "8px 12px",
    background: "#f3f4f6",
    color: "#111",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer"
  },

  errorMessage: {
    padding: "10px",
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "10px",
    border: "1px solid #fecaca"
  },

  successMessage: {
    padding: "10px",
    background: "#d1fae5",
    color: "#059669",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "10px",
    border: "1px solid #a7f3d0"
  },

  // References / multiselect
  sectionLabel: {
    fontWeight: 600,
    margin: '4px 0 6px',
    color: '#111827',
    fontSize: '0.9rem',
  },
  selectShell: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px',
    background: '#fff',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    position: 'relative',
  },
  selectContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    flex: 1,
  },
  placeholder: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  caret: {
    marginLeft: '8px',
    color: '#6b7280',
    fontSize: '12px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fff',
    maxHeight: '220px',
    overflowY: 'auto',
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem',
  },
  dropdownItemActive: {
    background: '#fef2f2',
    color: '#b91c1c',
  },
  check: {
    marginLeft: '8px',
    fontWeight: 700,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '12px',
  },
  tagClose: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#b91c1c',
    fontSize: '12px',
    lineHeight: 1,
  },

  referencesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  referenceLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: 4,
  },
  referenceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  referenceChip: {
    padding: '4px 8px',
    borderRadius: 999,
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.8rem',
  },
  referenceEmpty: {
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  referencesEditor: {
    marginTop: 12,
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  referencesColumn: {
    flex: '1 1 220px',
  },
  referencesOptions: {
    maxHeight: 180,
    overflowY: 'auto',
    paddingRight: 4,
  },
  referenceOption: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#374151',
    marginBottom: 4,
  },

  // Orders (purchase history)
  ordersCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  ordersMessage: {
    padding: '12px',
    color: '#4b5563',
  },
  ordersError: {
    padding: '12px',
    color: '#dc2626',
    background: '#fee2e2',
    borderRadius: '8px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  orderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderId: {
    fontWeight: 700,
    color: '#111827',
  },
  orderMeta: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  orderRight: {
    fontWeight: 700,
    color: '#111827',
  },
  orderTotal: {
    fontSize: '1rem',
  },
};
