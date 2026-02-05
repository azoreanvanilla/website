// ========== SECURITY & UTILITY FUNCTIONS ==========

function humanizeStatusKey(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  const normalized = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const acronyms = new Set(['vpd', 'rh', 'co2', 'uv', 'ph']);

  return normalized
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      if (!w) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

// Get translated text using i18n system (without status_ prefix)
function getTranslation(key) {
  if (!window.__TRANSLATIONS) return key;
  const lang = window.__site_lang || 'en';
  const trans = window.__TRANSLATIONS[lang] || window.__TRANSLATIONS.en || {};
  return trans[key] || key;
}

function formatTemplate(template, vars) {
  if (!template || typeof template !== 'string') return '';
  if (!vars || typeof vars !== 'object') return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => {
    if (Object.prototype.hasOwnProperty.call(vars, k)) return String(vars[k]);
    return m;
  });
}

function tFormat(key, vars) {
  return formatTemplate(getTranslation(key), vars);
}

// Get translated status text using i18n system
function getStatusText(statusKey) {
  if (!window.__TRANSLATIONS) return humanizeStatusKey(statusKey);
  const lang = window.__site_lang || 'en';
  const trans = window.__TRANSLATIONS[lang] || window.__TRANSLATIONS.en || {};
  return trans['status_' + statusKey] || trans[statusKey] || humanizeStatusKey(statusKey);
}

// Store current values for re-rendering on language change
let currentGreenhouseValues = { temp: null, humidity: null, vpd: null };
let currentOutdoorValues = { temp: null, humidity: null, vpd: null };
let currentMiFloraValues = {
  first: { moisture_pct: null, conductivity_us_cm: null, illuminance_lux: null },
  second: { moisture_pct: null, conductivity_us_cm: null, illuminance_lux: null }
};

// Function to update statuses when language changes
function updateStatusesOnLanguageChange() {
  // Re-apply all data-i18n translations with current language
  if(window.__applyI18n && window.__TRANSLATIONS && window.__site_lang) {
    window.__applyI18n(window.__TRANSLATIONS[window.__site_lang] || window.__TRANSLATIONS.en);
  }
  
  if (currentGreenhouseValues.temp !== null) {
    updateGaugeStatus(currentGreenhouseValues.temp, currentGreenhouseValues.humidity, currentGreenhouseValues.vpd);
  }
  if (currentOutdoorValues.temp !== null) {
    updateOutdoorGaugeStatus(currentOutdoorValues.temp, currentOutdoorValues.humidity, currentOutdoorValues.vpd);
    updateOutdoorAssessmentStatus(currentOutdoorValues.temp, currentOutdoorValues.humidity, currentOutdoorValues.vpd);
  }

  updateMiFloraGaugeStatus(currentMiFloraValues);
  updateMetricCardRanges();
  updateChartLabels();
  // Update dropdown options translations
  const locationSelect = q('#location-filter');
  if (locationSelect) {
    const options = locationSelect.querySelectorAll('option');
    if (options[0]) options[0].textContent = getTranslation('option_greenhouse');
    if (options[1]) options[1].textContent = getTranslation('option_outdoor');
    if (options[2]) options[2].textContent = getTranslation('option_both');
  }
}

// Expose the function for the HTML language change handler
window.__updateStatusesOnLangChange = updateStatusesOnLanguageChange;

// Vanilla cultivation policies by season
// NOTE: MiFlora targets are provisional and should be calibrated
// to your substrate + sensor placement.
const MIFLORA_TARGETS = {
  soil_moisture_min: 15,
  soil_moisture_max: 35,
  soil_conductivity_min: 200,
  soil_conductivity_max: 900,
  illuminance_min: 5000,
  illuminance_max: 20000
};

const POLICIES = {
  "Dormancy": { m: [12, 1, 2], t_min: 18, t_max: 24, h_min: 65, h_max: 75, dv: 0.7, nv: 0.5, v_tol_day: 0.2, v_tol_night: 0.1, ...MIFLORA_TARGETS },
  "Awakening": { m: [3], t_min: 19, t_max: 27, h_min: 65, h_max: 80, dv: 0.8, nv: 0.6, v_tol_day: 0.2, v_tol_night: 0.1, ...MIFLORA_TARGETS },
  "Stress": { m: [4], t_min: 19, t_max: 27, h_min: 65, h_max: 80, dv: 0.8, nv: 0.6, v_tol_day: 0.2, v_tol_night: 0.1, ...MIFLORA_TARGETS },
  "Flowering": { m: [5, 6, 7], t_min: 22, t_max: 30, h_min: 75, h_max: 85, dv: 0.8, nv: 0.5, v_tol_day: 0.2, v_tol_night: 0.1, ...MIFLORA_TARGETS },
  "Maturation": { m: [8, 9], t_min: 23, t_max: 31, h_min: 70, h_max: 85, dv: 1.1, nv: 0.7, v_tol_day: 0.15, v_tol_night: 0.1, ...MIFLORA_TARGETS },
  "Hardening": { m: [10, 11], t_min: 20, t_max: 26, h_min: 65, h_max: 80, dv: 0.8, nv: 0.6, v_tol_day: 0.2, v_tol_night: 0.1, ...MIFLORA_TARGETS }
};

// Get current policy based on current month
function getCurrentPolicy() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  for (const [name, policy] of Object.entries(POLICIES)) {
    if (policy.m.includes(month)) {
      return { name, policy };
    }
  }
  return { name: "Dormancy", policy: POLICIES.Dormancy };
}

// ========== SUN DATA & DAY/NIGHT DETECTION ==========
// 2025 SUN DATA (Ponta Delgada, Azores) - sunrise/sunset hours
const SUN_DATA = {
  1: {rise: 7.9, set: 17.5}, 2: {rise: 7.6, set: 18.2}, 3: {rise: 6.8, set: 18.8}, 4: {rise: 6.1, set: 19.3},
  5: {rise: 5.6, set: 19.8}, 6: {rise: 5.4, set: 20.3}, 7: {rise: 5.6, set: 20.3}, 8: {rise: 6.0, set: 19.7},
  9: {rise: 6.4, set: 18.9}, 10: {rise: 6.9, set: 18.1}, 11: {rise: 7.4, set: 17.5}, 12: {rise: 7.9, set: 17.4}
};

// Determine if current time is daytime or nighttime
function isDaylight() {
  // Get current time in Azores timezone (UTC-1 in winter, UTC+0 in summer)
  // Azores uses UTC-1 most of the year, UTC+0 during summer (roughly March to October)
  const now = new Date();
  
  // Convert to Azores time (WET - Western European Time)
  // Azores is UTC-1 (standard) or UTC+0 (daylight saving)
  // Create a date formatter for Azores timezone
  const azoresTime = new Date(now.toLocaleString('en-US', { timeZone: 'Atlantic/Azores' }));
  
  const month = azoresTime.getMonth() + 1; // 1-12
  const sun = SUN_DATA[month];
  const currentHour = azoresTime.getHours() + azoresTime.getMinutes() / 60;
  
  return currentHour >= sun.rise && currentHour <= sun.set;
}

// Get appropriate VPD tolerance based on day/night
function getVpdTolerance(policy) {
  return isDaylight() ? policy.v_tol_day : policy.v_tol_night;
}

// ========== METRIC CARD UPDATES ==========
// Update the "What the Numbers Mean" metric cards with policy-based ranges
// Update policy-based metric card ranges (temperature, humidity, VPD ranges)
function updateMetricCardRanges(temp, humidity, vpd) {
  // Only update if we're on a page with these elements
  if(!q('#card-temp-range')) return;
  
  const { name, policy } = getCurrentPolicy();
  const isDay = isDaylight();
  const vpdTol = getVpdTolerance(policy);
  const vpdTarget = isDay ? policy.dv : policy.nv;  // Use nighttime VPD if it's night
  
  // Temperature card
  const tempRangeEl = q('#card-temp-range');
  if(tempRangeEl) {
    tempRangeEl.textContent = policy.t_min + '–' + policy.t_max + '°C (' + Math.round((policy.t_min * 9/5) + 32) + '–' + Math.round((policy.t_max * 9/5) + 32) + '°F)';
  }
  
  // Update current temperature if provided
  const tempCurrentEl = q('#card-temp');
  if(tempCurrentEl && temp !== undefined && temp !== null) {
    tempCurrentEl.textContent = temp.toFixed(1);
  }
  
  const tempGrowthEl = q('#card-temp-growth');
  if(tempGrowthEl) {
    const lowTemp = policy.t_min + 3;
    const highTemp = policy.t_max - 2;
    tempGrowthEl.textContent = tFormat('card_temp_growth_dynamic', { lowTemp, highTemp });
  }
  
  // Humidity card
  const humRangeEl = q('#card-hum-range');
  if(humRangeEl) {
    humRangeEl.textContent = policy.h_min + '–' + policy.h_max + '% (Relative Humidity)';
  }
  
  // Update current humidity if provided
  const humCurrentEl = q('#card-hum');
  if(humCurrentEl && humidity !== undefined && humidity !== null) {
    humCurrentEl.textContent = humidity.toFixed(0);
  }
  
  const humBalanceEl = q('#card-hum-balance');
  if(humBalanceEl) {
    const belowThresh = policy.h_min - 5;
    const aboveThresh = policy.h_max + 5;
    humBalanceEl.textContent = tFormat('card_hum_balance_dynamic', {
      belowThresh,
      aboveThresh,
      hMin: policy.h_min,
      hMax: policy.h_max,
    });
  }
  
  // VPD card - use day or night VPD depending on current time
  const vpdRangeEl = q('#card-vpd-range');
  if(vpdRangeEl) {
    const vpdMin = (vpdTarget - vpdTol).toFixed(1);
    const vpdMax = (vpdTarget + vpdTol).toFixed(1);
    vpdRangeEl.textContent = vpdMin + '–' + vpdMax + ' kPa (Kilopascals)';
  }
  
  // Update current VPD if provided
  const vpdCurrentEl = q('#card-vpd');
  if(vpdCurrentEl && vpd !== undefined && vpd !== null) {
    vpdCurrentEl.textContent = vpd.toFixed(2);
  }
  
  const vpdTooLowEl = q('#card-vpd-too-low');
  if(vpdTooLowEl) {
    const threshold = (vpdTarget - vpdTol - 0.2).toFixed(2);
    vpdTooLowEl.textContent = tFormat('card_vpd_too_low_dynamic', { threshold });
  }
  
  const vpdTooHighEl = q('#card-vpd-too-high');
  if(vpdTooHighEl) {
    const threshold = (vpdTarget + vpdTol + 0.5).toFixed(2);
    vpdTooHighEl.textContent = tFormat('card_vpd_too_high_dynamic', { threshold });
  }
  
  const vpdSweetEl = q('#card-vpd-sweet');
  if(vpdSweetEl) {
    const vpdSweetMin = (vpdTarget - vpdTol).toFixed(1);
    const vpdSweetMax = (vpdTarget + vpdTol).toFixed(1);
    vpdSweetEl.textContent = tFormat('card_vpd_sweet_dynamic', { vpdSweetMin, vpdSweetMax });
  }
  
  const vpdGrowthEl = q('#card-vpd-growth');
  if(vpdGrowthEl) {
    const midVpd = policy.dv.toFixed(2);
    vpdGrowthEl.textContent = tFormat('card_vpd_growth_dynamic', { midVpd });
  }

  // MiFlora metric cards (policy-based targets; current values handled separately)
  const luxRangeEl = q('#card-lux-range');
  if(luxRangeEl) {
    luxRangeEl.textContent = `${policy.illuminance_min}–${policy.illuminance_max} lux`;
  }

  const moistureRangeEl = q('#card-moisture-range');
  if(moistureRangeEl) {
    moistureRangeEl.textContent = `${policy.soil_moisture_min}–${policy.soil_moisture_max}%`;
  }

  const condRangeEl = q('#card-cond-range');
  if(condRangeEl) {
    condRangeEl.textContent = `${policy.soil_conductivity_min}–${policy.soil_conductivity_max} µS/cm`;
  }
}

// Update chart labels with policy-based ranges
function updateChartLabels() {
  const { policy } = getCurrentPolicy();
  const isDay = isDaylight();
  const vpdTol = getVpdTolerance(policy);
  const vpdTarget = isDay ? policy.dv : policy.nv;  // Use nighttime VPD if it's night
  
  const tempLabel = q('#chart-temp-label');
  if(tempLabel) {
    tempLabel.textContent = 'Optimal: ' + policy.t_min + '–' + policy.t_max + '°C';
  }
  
  const humLabel = q('#chart-hum-label');
  if(humLabel) {
    humLabel.textContent = 'Optimal: ' + policy.h_min + '–' + policy.h_max + '%';
  }
  
  const vpdLabel = q('#chart-vpd-label');
  if(vpdLabel) {
    const { name } = getCurrentPolicy();
    const isDay = isDaylight();
    const dayMin = (policy.dv - policy.v_tol_day).toFixed(2);
    const dayMax = (policy.dv + policy.v_tol_day).toFixed(2);
    const nightMin = (policy.nv - policy.v_tol_night).toFixed(2);
    const nightMax = (policy.nv + policy.v_tol_night).toFixed(2);
    const currentMin = (vpdTarget - vpdTol).toFixed(2);
    const currentMax = (vpdTarget + vpdTol).toFixed(2);
    const timeLabel = isDay ? 'Day' : 'Night';
    vpdLabel.textContent = `${name} • ${timeLabel}: ${currentMin}–${currentMax} kPa | Day: ${dayMin}–${dayMax} | Night: ${nightMin}–${nightMax}`;
  }

  updateMiFloraChartTargets(policy);
}

function updateMiFloraChartTargets(policy) {
  const yTop = 20;
  const yBottom = 200;
  const yRange = yBottom - yTop;

  const setBand = ({ bandId, labelId, axisMin, axisMax, targetMin, targetMax, labelText }) => {
    const bandEl = document.getElementById(bandId);
    const labelEl = document.getElementById(labelId);
    if(labelEl) labelEl.textContent = labelText;
    if(!bandEl) return;

    const safeAxisMin = Math.min(axisMin, axisMax);
    const safeAxisMax = Math.max(axisMin, axisMax);
    const range = safeAxisMax - safeAxisMin;
    if(range <= 0) return;

    const clamp = (v) => Math.max(safeAxisMin, Math.min(safeAxisMax, v));
    const tMin = clamp(targetMin);
    const tMax = clamp(targetMax);
    const topVal = Math.max(tMin, tMax);
    const bottomVal = Math.min(tMin, tMax);

    const yFor = (val) => yBottom - ((val - safeAxisMin) / range) * yRange;
    const y1 = yFor(topVal);
    const y2 = yFor(bottomVal);
    const height = Math.max(0, y2 - y1);

    bandEl.setAttribute('y', y1.toFixed(2));
    bandEl.setAttribute('height', height.toFixed(2));
  };

  setBand({
    bandId: 'lux-target-band',
    labelId: 'chart-lux-label',
    axisMin: 0,
    axisMax: 30000,
    targetMin: policy.illuminance_min,
    targetMax: policy.illuminance_max,
    labelText: `${policy.illuminance_min}–${policy.illuminance_max} lux`
  });

  setBand({
    bandId: 'moisture-target-band',
    labelId: 'chart-moisture-label',
    axisMin: 0,
    axisMax: 60,
    targetMin: policy.soil_moisture_min,
    targetMax: policy.soil_moisture_max,
    labelText: `${policy.soil_moisture_min}–${policy.soil_moisture_max}%`
  });

  setBand({
    bandId: 'cond-target-band',
    labelId: 'chart-cond-label',
    axisMin: 0,
    axisMax: 2000,
    targetMin: policy.soil_conductivity_min,
    targetMax: policy.soil_conductivity_max,
    labelText: `${policy.soil_conductivity_min}–${policy.soil_conductivity_max} µS/cm`
  });
}

// Input sanitization helper for safe HTML operations
function sanitizeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

// Parallax hero background, translations, and statistics table logic
const TRANSLATIONS = {
  en: {
    nav_home: 'Home', nav_about: 'Who We Are', nav_visits: 'Visits', nav_invest: 'Investments', nav_stats: 'Statistics', nav_contact: 'Contact',
    logo: 'Baunilha dos Açores',
    hero_title: 'Vanilla & Orchid Plantation — São Miguel, Azores',
    hero_lead: 'Experimentally cultivating vanilla orchids in greenhouse conditions on São Miguel. An experimental vanilla orchid plantation focused on research and education.',
    cta_support: 'Support the Project', cta_visit: 'Plan a Visit',
    project_title: 'Project', project_desc: 'This project explores whether vanilla can thrive in greenhouse conditions on São Miguel Island. We combine small-scale R&D, sustainable methods, and agritourism to build a unique plantation experience.',
    browse_prefix: 'Browse', browse_middle: ', our', browse_or: 'or learn how to', browse_support: 'Support', browse_suffix: 'us.',
    gallery_title: 'Gallery',
    footer_copy: '© Baunilha dos Açores — São Miguel',
    // About
    about_title: 'From Code to Orchids: Our Story', about_lead: 'We\'re building the future of vanilla cultivation in the Azores—one data point, one experiment, one vine at a time.',
    about_vanilla_core: 'After researching what would work here, I looked for something tropical, rare, edible, compact, high-demand. Vanilla emerged as the answer—a totally uncommon plant for the Azores, yet perfectly suited to controlled greenhouse conditions. While the island\'s winter nights drop to 10°C—too cold for outdoor tropical cultivation—that\'s only part of the story. September through April brings persistent strong winds and salty air that vanilla orchids find hostile. Between the cold and the coastal environment, outdoor cultivation is simply impossible. That\'s precisely why greenhouses make sense. We control the environment. Temperature, humidity, light, air quality—these become variables we can manage and optimize. What started as a hobby experiment has become something real. Today, we\'re growing over 200 meters of vanilla vines. It\'s taught me that agriculture, like cybersecurity, demands precision—in temperature, humidity, light, pollination timing. The same mindset applies: observe carefully, measure everything, iterate based on what you learn. We\'re not trying to be experts in everything. We\'re just being rigorous about what we do.',
    about_why_azores_title: 'Why the Azores?', about_why_azores_opening: 'Honestly, the better question is: why is vanilla NOT here already?', about_why_azores_market: 'EU market proximity – Quick shipping to Europe with zero tariffs, no customs delays', about_why_azores_soil: 'Fresh volcanic soil – Naturally nutrient-rich from volcanic geology, excellent for vanilla root systems', about_why_azores_water: 'Clean water abundance – Pure, reliable water supply for irrigation in a climate-stable region', about_why_azores_stability: 'Political stability & EU infrastructure – Safe investment with strong regulations, banking, and logistics', about_why_azores_climate: 'Abundant humidity without tropical extremes', about_why_azores_sustainability: 'Abundant renewable energy (geothermal, wind, hydro, solar)', about_why_azores_agritourism: 'Agri-tourism opportunity – Visitors + vanilla = unique experience', about_why_azores_conclusion: 'No one else is trying vanilla at scale here. That\'s not a coincidence—it\'s our opportunity.',
    about_identity_title: 'Who We Are', about_identity_p1: 'We\'re scientists and engineers who chose to get our hands dirty—literally. We\'re people who believe that agriculture needs the same rigor as software engineering. We\'re residents of the Azores who want to prove that this archipelago can produce something as valuable and rare as vanilla.', about_identity_p2: 'We\'re not romantic about failure, but we\'re resilient about it. We document it. We learn from it. We iterate.', about_identity_p3: 'And we\'re inviting others to join us—whether as visitors exploring the greenhouse, as investors scaling the model, or as researchers contributing to the knowledge base.',
    about_cta_title: 'Visit Us',
    nav_home: 'Home', nav_about: 'Who We Are', nav_visits: 'Visits', nav_invest: 'Investments', nav_stats: 'Statistics', nav_contact: 'Contact',
    about_cta_title: 'Join Us', about_cta_p1: 'Whether you\'re a researcher, an investor, an agriculture enthusiast, or simply curious about how precision technology meets sustainable farming—there\'s a place for you in this story.', about_btn_visit: 'Schedule a Visit', about_btn_invest: 'Learn About Investing', about_btn_contact: 'Get in Touch', contact_label: 'Contact us:',
    // Visits
    visits_title: 'Visit Our Research Farm', visits_intro: 'Discover the secrets of vanilla—the world\'s most labor-intensive spice. Our greenhouse is currently undergoing renovation to create the perfect environment for learning and exploration. Join us for an unforgettable experience combining science, history, and the delicate art of vanilla cultivation.',
    vanilla_experience_title: 'The Vanilla Experience', vanilla_experience_desc: 'Vanilla is not just a flavor—it is a story of patience, precision, and nature\'s mysteries. Most of the world\'s vanilla comes from Madagascar, but few know the intricate process behind its production. In our greenhouse, you will witness firsthand:',
    vanilla_exp_li1: 'The delicate orchid flowers that bloom for only a few hours each year', vanilla_exp_li2: 'The ancient hand-pollination technique that unlocks the spice\'s potential', vanilla_exp_li3: 'The scientific precision required to cultivate vanilla in a temperate climate', vanilla_exp_li4: 'How the Azores\' unique terroir creates a distinct vanilla flavor',
    education_title: 'Education First', education_desc: 'Our tours are designed for curious minds—whether you\'re a culinary enthusiast, a science explorer, or someone fascinated by sustainable agriculture. Each visit combines interactive demonstrations, hands-on learning, and guided discussion:',
    education_li1: 'The Science: Understand the biology of vanilla\'s pollination, the role of IoT sensors, and precision agriculture in the modern era', education_li2: 'The Art: Witness the skill and intuition required for hand pollination and post-harvest curing', education_li3: 'The Story: Learn how vanilla became valuable, its role in global trade, and why it\'s harder to grow than gold', education_li4: 'The Future: Explore how AgTech and sustainability are reshaping specialty agriculture',
    renovation_title: 'Coming Soon: Grand Opening', renovation_desc: 'Our greenhouse is undergoing careful renovation to meet our vision of an educational and research-focused facility. We are installing advanced climate control, IoT monitoring systems, and designing visitor pathways that balance accessibility with plant care.',
    renovation_timeline: 'We expect to welcome our first guests in mid-to-late 2026. Tours will be limited in size to ensure an intimate, high-quality experience.',
    cta_title: 'Join the Waitlist', cta_desc: 'Be among the first to visit when we open our doors. Join our waitlist to receive updates on our opening date, exclusive launch events, and early-visitor opportunities.',
    cta_waitlist: 'Join the Waitlist',
    // Investments
    invest_title: 'Investment Opportunity: Premium Single-Origin Vanilla AgTech', invest_intro: 'Baunilha dos Açores is building a scalable AgTech platform for premium, single-origin vanilla cultivation. We combine cutting-edge IoT precision farming with the unique terroir of the Açores to create a defensible, high-value specialty agriculture brand. Currently in Phase 1 (Research & Development), we are seeking strategic investors and partners to accelerate our path to profitability and market leadership.',
    azores_title: 'Why the Azores?', azores_intro: 'The Azores offer unmatched advantages for premium vanilla cultivation:', azores_terroir_title: 'Unique Volcanic Terroir:', azores_terroir: 'Our location provides distinctive soil composition and microclimate—key factors that define premium vanilla flavor profiles. "Single Origin" vanilla from the Azores becomes a compelling market differentiator.', azores_climate_title: 'Mild Climate & Natural Energy Abundance:', azores_climate: 'The Azores enjoy a mild, temperate climate ideal for controlled greenhouse cultivation. More importantly, the archipelago is naturally abundant in renewable wind and hydroelectric energy resources, providing a consistent, cost-effective power supply for our IoT-enabled operations. This free and constant renewable energy dramatically reduces operational costs while strengthening our carbon-neutral farming narrative.', azores_eu_title: 'EU Regulatory Excellence:', azores_eu: 'Operating within EU standards ensures food safety compliance, sustainability certifications, and access to premium European markets without tariff barriers.', azores_env_title: 'Sustainable Environment:', azores_env: 'The Azores\' focus on renewable energy, water management, and biodiversity aligns with consumer demand for ethically produced, carbon-conscious agricultural products.',
    tech_title: 'The Technology: Precision Farming via IoT', tech_intro: 'We leverage industrial-grade IoT monitoring systems to optimize vanilla cultivation:', tech_climate_title: 'Real-time Climate Control:', tech_climate: 'Automated temperature, humidity, and light sensors maintain precise growing conditions, reducing crop loss and maximizing yield.', tech_analytics_title: 'Predictive Analytics:', tech_analytics: 'Sensor data feeds into machine learning models that forecast plant stress, disease risk, and harvest timing—enabling proactive intervention.', tech_efficiency_title: 'Resource Efficiency:', tech_efficiency: 'Precision irrigation and fertilization minimize water and chemical use, lowering operating costs and environmental impact.', tech_scale_title: 'Scalability DNA:', tech_scale: 'Our tech stack is designed to replicate seamlessly across multiple greenhouses and geographic regions.',
    vision_title: 'The Vision: Building the AgTech Platform', vision_intro: 'Baunilha dos Açores is not just a farm—it is the foundation of a scalable AgTech business model. Our multi-revenue ecosystem includes:', vision_prod_title: 'Premium Vanilla Production & Distribution:', vision_prod: 'Direct-to-consumer and wholesale channels for beans, extracts, and specialty products. Target: high-end culinary, cosmetics, and pharmaceutical markets.', vision_agri_title: 'Agritourism & Education:', vision_agri: 'Guided greenhouse experiences, workshops, and educational partnerships position us as thought leaders in sustainable specialty agriculture.', vision_tech_title: 'Tech Licensing & Consulting:', vision_tech: 'Our IoT platform and farming protocols can be licensed to other specialty crop producers, creating recurring revenue.', vision_part_title: 'Strategic Partnerships:', vision_part: 'Collaboration with research institutions, certification bodies, and premium brands amplifies market reach and credibility.',
    roadmap_title: 'Development Roadmap', phase1_title: 'Phase 1: Research & Development (Current)', phase1_duration: 'Duration:', phase1_dur_val: '24–36 months', phase1_focus: 'Focus:', phase1_focus_val: 'Proof of Concept', phase1_li1: 'Optimize vanilla cultivation protocols for Azores microclimate', phase1_li2: 'Develop and integrate IoT sensor network', phase1_li3: 'Establish baseline yield, quality, and cost metrics', phase1_li4: 'Observe first flowering cycle (Year 2–3) and document pollination success', phase1_li5: 'Obtain EU certifications and sustainability credentials', phase1_li6: 'Create market validation through pilot harvest and partnerships', phase1_li7: 'Build brand identity and digital presence',
    phase2_title: 'Phase 2: Scaling & Infrastructure (2027–2028)', phase2_focus: 'Investment Focus:', phase2_focus_val: 'Expansion & Automation', phase2_trigger: 'Trigger:', phase2_trigger_val: 'Successful first harvest', phase2_li1: 'Scale production using proven protocols from Phase 1', phase2_li2: 'Expand greenhouse footprint (from pilot to commercial-scale production)', phase2_li3: 'Deploy advanced climate control and automation systems', phase2_li4: 'Establish supply chain for inputs (plants, substrate, packaging)', phase2_li5: 'Hire specialized agronomy and operations teams', phase2_li6: 'Launch direct-to-consumer e-commerce and B2B wholesale channels', phase2_li7: 'Prepare for organic and specialty certifications',
    phase3_title: 'Phase 3: Processing & Export (2028–2029)', phase3_focus: 'Investment Focus:', phase3_focus_val: 'Value-Added Products & Market Penetration', phase3_trigger: 'Trigger:', phase3_trigger_val: 'Commercial-scale production achieved', phase3_li1: 'Build on-site processing facility (extraction, dried beans, specialty products)', phase3_li2: 'Establish export logistics for EU and international markets', phase3_li3: 'Scale agritourism operations and develop premium experience packages', phase3_li4: 'Launch licensing program for IoT platform and agronomy protocols', phase3_li5: 'Achieve operational profitability and positive cash flow',
    invest_support_title: 'Investment & Support', invest_support_desc: 'We welcome both strategic investors seeking equity partnerships and supporters interested in donating to our mission. Contact us for detailed financials, cap table, and projected returns.',
    crypto_donations_title: 'Cryptocurrency Donations', crypto_donations_desc: 'You can also support our mission with cryptocurrency:',
    // Contact
    contact_title: 'Contact Us', contact_intro: 'We welcome inquiries about visits, purchases, and partnerships. Reach us by email, phone or social networks.', contact_email_label: 'Email:', contact_phone_label: 'Phone:', contact_address_title: 'Location', contact_address_label: 'Ribeira Grande (Conceição), São Miguel, Azores', contact_map_note: 'Map uses Google Maps embed — replace with your preferred provider if needed.', follow_us_title: 'Follow Us',
    // Statistics
    dashboard_title: 'Research Dashboard', dashboard_subtitle: 'Greenhouse Monitoring & Performance Data', dashboard_intro_why: 'At Baunilha dos Açores, we believe in open science. The data below represents our research on greenhouse conditions for vanilla cultivation in the Azores. This isn\'t just a display; it\'s an invitation to understand our methods.', dashboard_intro_for_researchers: 'For Researchers: Validate our methods. Contribute insights. See how precision climate control enables vanilla cultivation in a temperate climate.', dashboard_intro_for_investors: 'For Investors: Transparency builds trust. Watch our data patterns. Observe how we engineer a microclimate where vanilla orchids thrive—the foundation of our AgTech scalability.', dashboard_intro_for_enthusiasts: 'For Enthusiasts: Witness the delicate dance of environmental control. This is what mastering vanilla\'s \'comfort zone\' looks like in practice.', dashboard_intro_iot: 'Our greenhouse is equipped with environmental sensors. The data below illustrates the conditions we maintain to keep vanilla thriving in the Azores.',
    live_conditions_title: 'Target Greenhouse Conditions',
    metric_temperature: 'Temperature', metric_humidity: 'Humidity', metric_vpd: 'VPD',
    metric_soil_moisture: 'Soil Moisture', metric_soil_conductivity: 'Soil Conductivity', metric_illuminance: 'Illuminance',
    device_first: 'Sensor 1', device_second: 'Sensor 2',
    status_optimal: 'Optimal', status_ideal: 'Ideal',
    status_within_policy: 'Within Policy', status_too_dry: 'Too Dry', status_too_wet: 'Too Wet',
    status_too_dark: 'Too Dark', status_too_bright: 'Too Bright',
    status_cond_low: 'Nutrients Low', status_cond_high: 'Too Salty', status_mixed: 'Mixed Readings',
    temp_range: '18–24°C', hum_range: '65–75%', vpd_range: '',
    plant_status_title: 'Plant Status Indicators', status_growth_phase: 'Optimal Growth Phase', status_transpiration: 'Active Transpiration', status_monitoring: 'Monitoring for Fungi Risk', status_explanation: 'The greenhouse is in an optimal growth window. Current conditions support active nutrient absorption and plant development. VPD is ideal for stomatal function.',
    comparison_title: 'Inside vs. Outside: The Azorean Advantage', comparison_intro: 'The comparison below illustrates why our greenhouse design is a breakthrough for vanilla cultivation in the Azores. Outside, the island\'s temperate climate is beautiful but insufficient for vanilla. Inside, we engineer the tropics.', comp_temperature: 'Temperature', comp_humidity: 'Humidity', comp_vpd: 'VPD', comparison_conclusion: 'Why This Matters: Our greenhouse creates a microclimate that vanilla orchids crave—precision weather engineering. This data validates our competitive edge: we use the Azores\' renewable energy abundance to power climate control that transforms a temperate island into a vanilla paradise.',
    trend_title: '24-Hour Trend: The Daily Rhythm', trend_intro: 'This chart shows the natural oscillations we orchestrate. Notice how temperature dips overnight (we heat to prevent shock) and peaks midday (we ventilate to maintain the ideal range). Humidity follows the inverse: higher when it\'s cooler, managed carefully during warm hours. VPD is our true north—we adjust temperature and humidity in concert to keep VPD in the sweet spot.',
    chart_illuminance_label: 'Illuminance (lux)', chart_soil_moisture_label: 'Soil Moisture (%)', chart_soil_conductivity_label: 'Soil Conductivity (µS/cm)',
    chart_note: '[Interactive chart coming soon — showing Temperature (blue), Humidity (green), VPD (orange) over 24 hours]', trend_rhythm: 'This rhythm mirrors the natural day-night cycle that vanilla expects, even though we\'re controlling every variable. That\'s the essence of our technology.',
    metrics_title: 'What the Numbers Mean: Vanilla Orchid Science',
    card_light_title: 'Illuminance (Light)', card_light_why_title: 'Why It Matters', card_light_why: 'Vanilla is a climbing orchid that prefers bright, filtered light (similar to dappled shade). Too little light slows growth; too much can scorch leaves. We track illuminance to understand seasonal light availability and shading strategy.', card_light_control_title: 'What We Control', card_light_control_shade: 'Shading and greenhouse layout (avoid direct midday burn)', card_light_control_orientation: 'Ventilation and orientation (reduce heat + light stress together)',
    card_soil_moisture_title: 'Soil Moisture', card_soil_moisture_why_title: 'Why It Matters', card_soil_moisture_why: 'Vanilla roots need steady moisture with strong aeration. The MiFlora moisture number is substrate-dependent and needs calibration, but it is still useful for detecting dry-down cycles and irrigation consistency.', card_soil_moisture_note_title: 'Important Note', card_soil_moisture_note: 'Moisture % is not universal across substrates. We treat these ranges as provisional and refine them as we correlate sensor readings with plant response.',
    card_soil_conductivity_title: 'Soil Conductivity', card_soil_conductivity_why_title: 'Why It Matters', card_soil_conductivity_why: 'Conductivity is a proxy for dissolved salts (fertilizer strength). Too low can mean underfeeding; too high can stress orchid roots. Tracking conductivity helps us keep nutrition gentle and consistent.', card_soil_conductivity_control_title: 'What We Control', card_soil_conductivity_control_feed: 'Fertilizer concentration and frequency', card_soil_conductivity_control_flush: 'Flush cycles (prevent salt accumulation)',
    card_temp_title: 'Temperature', card_temp_range: '18–24°C (64–75°F)', card_temp_why_title: 'Why It Matters for Vanilla', card_temp_why: 'Vanilla orchids are children of the tropics. They need consistent warmth to trigger growth and flowering. Temperatures below 18°C stall development; above 32°C, the plant enters stress. Our 24.5°C sweet spot accelerates both vegetative growth and the delicate process of flower maturation.', card_temp_growth_title: 'Growth Signal You\'re Watching', card_temp_growth: 'When temperature is stable in the 24–28°C range, vanilla\'s metabolic engines run at peak efficiency. The plant allocates energy to developing the inflorescence (flower spike)—the precursor to our precious vanilla beans.', card_temp_growth_dynamic: 'When temperature is stable in the {lowTemp}–{highTemp}°C range, vanilla\'s metabolic engines run at peak efficiency. The plant allocates energy to developing the inflorescence (flower spike)—the precursor to our precious vanilla beans.', card_temp_control_title: 'What We Control', card_temp_control_heating: 'Overnight heating (prevents stress from island cool-downs)', card_temp_control_ventilation: 'Daytime ventilation (prevents overheating in summer)', card_temp_control_seasonal: 'Seasonal adjustments (respects flowering cycles)',
    card_hum_title: 'Humidity', card_hum_range: '65–75% (Relative Humidity)', card_hum_why_title: 'Why It Matters for Vanilla', card_hum_why: 'Humidity is the invisible lifeline of vanilla cultivation. At 72% RH, the air holds enough moisture to satisfy the plant\'s aerial roots (yes, vanilla has roots that absorb water and nutrients from humid air!), while remaining dry enough to prevent fungal diseases that plague tropical orchids.', card_hum_balance_title: 'The Balance', card_hum_balance: 'Below 60% RH, the plant desiccates—a death sentence in a greenhouse. Above 90% RH, fungi take over. The 65–85% window is where vanilla orchids achieve the perfect balance of hydration and disease resistance.', card_hum_balance_dynamic: 'Below {belowThresh}% RH, the plant desiccates—a death sentence in a greenhouse. Above {aboveThresh}% RH, fungi take over. The {hMin}–{hMax}% window is where vanilla orchids achieve the perfect balance of hydration and disease resistance.', card_hum_growth_title: 'Growth Signal You\'re Watching', card_hum_growth: 'When humidity is stable in the ideal range, vanilla\'s aerial roots remain plump and functional. The plant\'s stomata (breathing pores) open confidently, allowing photosynthesis to proceed at full capacity. This is when growth happens fastest.', card_hum_control_title: 'What We Control', card_hum_control_misting: 'Smart misting systems (supplement humidity during dry periods)', card_hum_control_ventilation: 'Ventilation scheduling (release excess moisture to prevent fungal blooms)', card_hum_control_dew: 'Dew point monitoring (ensures condensation forms strategically, not randomly)', card_hum_control_circulation: 'Air circulation (prevents stagnant pockets where fungi thrive)',
    card_vpd_title: 'VPD (Vapor Pressure Deficit)', card_vpd_range: '', card_vpd_what_title: 'What Is VPD? (The Science Behind the Number)', card_vpd_what: 'VPD is the "comfort zone" metric. It measures the difference between the amount of moisture the air can hold (at current temperature) and the amount it actually holds (current humidity). Think of it as the "thirst" of the air.', card_vpd_matters_title: 'Why It Matters for Vanilla', card_vpd_matters: 'VPD directly controls how aggressively a plant transpires (releases water through leaves and aerial roots).', card_vpd_too_low: 'VPD too low: The air is so humid that the plant can\'t release water. Roots suffocate. Fungi thrive.', card_vpd_too_low_dynamic: 'VPD too low (< {threshold} kPa): The air is so humid that the plant can\'t release water. Roots suffocate. Fungi thrive.', card_vpd_too_high: 'VPD too high (> 2.0 kPa): The air is so dry that the plant desperately transpires to cool itself. The plant loses water faster than roots can absorb it—inducing drought stress.', card_vpd_too_high_dynamic: 'VPD too high (> {threshold} kPa): The air is so dry that the plant desperately transpires to cool itself. The plant loses water faster than roots can absorb it—inducing drought stress.', card_vpd_sweet: 'VPD in the sweet spot: The plant transpires at the perfect rate. Nutrients move through the plant efficiently. Growth is maximized. The plant is neither drowning nor gasping.', card_vpd_sweet_dynamic: 'VPD in the sweet spot ({vpdSweetMin}–{vpdSweetMax} kPa): The plant transpires at the perfect rate. Nutrients move through the plant efficiently. Growth is maximized. The plant is neither drowning nor gasping.', card_vpd_growth_title: 'Growth Signal You\'re Watching', card_vpd_growth: 'When VPD is 1.2 kPa, the plant is in "active nutrient uptake mode." The transpiration rate is optimal for moving water and dissolved nutrients from the roots to leaves and flowers. This is when the magic happens—when vanilla accumulates the sugars and compounds that will eventually become the vanilla flavor we prize.', card_vpd_growth_dynamic: 'When VPD is {midVpd} kPa, the plant is in "active nutrient uptake mode." The transpiration rate is optimal for moving water and dissolved nutrients from the roots to leaves and flowers. This is when the magic happens—when vanilla accumulates the sugars and compounds that will eventually become the vanilla flavor we prize.', card_vpd_investor_title: 'Why Investors Should Care', card_vpd_investor: 'VPD is the proxy for crop efficiency. At 1.2 kPa, our energy input (fans, misters, heaters) achieves maximum plant output. This is the data point that proves our climate control is not just precise—it\'s economical.', card_vpd_control_title: 'What We Control', card_vpd_control_coordination: 'Temperature-humidity coordination (maintaining ideal VPD even as outdoor conditions swing)', card_vpd_control_monitoring: 'Active transpiration monitoring (our sensors trigger interventions before stress occurs)', card_vpd_control_seasonal: 'Seasonal VPD targets (adjusted for different growth phases)',
    current_label: 'Current:', data_explorer_title: 'Detailed Data Explorer', data_explorer_intro: 'Filter by date range to examine specific periods. Researchers can use this data to validate growth correlations, identify stress events, or study our climate control algorithms in action.', data_tip: 'Tip: A negative Dew Point depression (difference between air temp and dew point) indicates the air is approaching saturation—useful for predicting condensation events.',
    transparency_title: 'A Note on Transparency & Open Science', transparency_intro: 'This data represents our current research on optimal conditions for vanilla cultivation. We\'re documenting what works. We don\'t cherry-pick results. Our approach is grounded in observation and measurement—understanding the precise environmental parameters that allow vanilla to thrive in our greenhouses on São Miguel.', transparency_why: 'Because we believe that transparency accelerates innovation. Researchers can validate our methods. Investors can build confidence through evidence, not marketing. Enthusiasts can truly understand what it takes to grow vanilla in the Azores.', transparency_why_bold: 'Why?', transparency_conclusion: 'We\'re not just growing vanilla. We\'re proving that precision agriculture—powered by careful measurement, environmental control, and continuous learning—is the foundation of specialty farming. And we\'re building the infrastructure to share our knowledge as we scale.', transparency_contact_link: 'Contact us',
    // Old stats
    stats_title: 'Greenhouse Statistics', from_label: 'From', to_label: 'To', apply: 'Apply', reset: 'Reset',
    col_datetime: 'Datetime', col_temp: 'Temperature (°C)', col_hum: 'Humidity (%)', col_vpd: 'VPD (kPa)', col_dew: 'Dew Point (°C)'
  },
  pt: {
    nav_home: 'Início', nav_about: 'Quem Somos', nav_visits: 'Visitas', nav_invest: 'Investimentos', nav_stats: 'Estatísticas', nav_contact: 'Contacto',
    logo: 'Baunilha dos Açores',
    hero_title: 'Plantação de Baunilha (Orquídea) — São Miguel, Açores',
    hero_lead: 'Cultivo experimental de orquídeas de baunilha em estufa em São Miguel. Uma plantação experimental focada em investigação e educação.',
    cta_support: 'Apoie o Projeto', cta_visit: 'Agende uma Visita',
    project_title: 'Projeto', project_desc: 'Este projeto explora se a baunilha pode prosperar em condições controladas de estufa na Ilha de São Miguel. Combinamos I&D em pequena escala, métodos sustentáveis e agro‑turismo para criar uma experiência única de plantação.',
    browse_prefix: 'Veja', browse_middle: ', as nossas', browse_or: 'ou saiba como', browse_support: 'Apoiar', browse_suffix: 'apoiar.',
    gallery_title: 'Galeria',
    footer_copy: '© Baunilha dos Açores — São Miguel',
    // About
    about_title: 'Do Código às Orquídeas: Nossa História', about_lead: 'Estamos construindo o futuro do cultivo de baunilha nos Açores—um dado, uma experiência, uma vinha por vez.',
    about_the_pivot_title: 'Precisão em Dois Domínios', about_the_pivot_p1: 'Há anos, sonhava em construir algo verdadeiramente raro num paraíso insular do Atlântico. Meu historial em cibersegurança e análise de dados tinha-me ensinado uma lição simples: precisão importa. Um detalhe ignorado torna-se uma vulnerabilidade. Uma suposição errada cria um ponto de falha. Quando comecei a explorar agricultura nos Açores, aquela mesma mentalidade reapareceu: se algo vale a pena fazer, vale a pena fazer com obsessão pela exatidão.', about_the_pivot_p2: 'A baunilha prospera exatamente nas condições que definem os Açores. A humidade elevada, as temperaturas moderadas, o clima atlântico imprevisível—estas são características, não desvantagens. Mas a baunilha é extremamente difícil. Requer precisão em cada variável: temperatura, humidade, luz, fluxo de ar, tempo de polinização. Cibersegurança e cultivo de baunilha partilham um ADN surpreendente: ambos exigem precisão absoluta. O cultivo de baunilha é uma investigação científica desacelerada. Não consegues corrigir uma planta em produção. Não consegues reverter um ciclo de floração fracassado. Mas consegues observar, medir, analisar e iterar. Cada leitura ambiental torna-se dados. Cada tentativa de floração torna-se um conjunto de dados. A lição de cibersegurança traduz-se diretamente: trata a tua estufa como um sistema em teste. Monitora tudo. Regista tudo. Aprenda obsessivamente.',
    about_identity_title: 'Quem Somos', about_identity_p1: 'Sou um engenheiro que decidiu sujar as mãos—literalmente. Acredito que a agricultura precisa do mesmo rigor que a engenharia de software. Sou um residente dos Açores que quer provar que este arquipélago pode produzir algo tão valioso e raro como a baunilha.', about_identity_p2: 'Não sou romântico sobre o fracasso, mas sou resiliente com ele. Documento. Aprendo. Itero.',
    about_why_azores_title: 'Por que os Açores?', about_why_azores_opening: 'Honestamente, a pergunta melhor seria: por que a baunilha ainda NÃO está aqui?', about_why_azores_market: 'Proximidade do mercado europeu – Envios rápidos para a Europa sem tarifas, sem atrasos alfandegários', about_why_azores_soil: 'Solo vulcânico fresco – Naturalmente rico em nutrientes da geologia vulcânica, excelente para sistemas radiculares de baunilha', about_why_azores_water: 'Abundância de água limpa – Fornecimento de água puro e confiável para irrigação numa região climaticamente estável', about_why_azores_stability: 'Estabilidade política e infraestruturas da UE – Investimento seguro com regulações sólidas, banca e logística', about_why_azores_climate: 'Humidade abundante sem extremos tropicais', about_why_azores_sustainability: 'Abundância de energia renovável (geotérmica, eólica, hídrica, solar)', about_why_azores_agritourism: 'Oportunidade de agro-turismo – Visitantes + baunilha = experiência única', about_why_azores_conclusion: 'Ninguém mais está a tentar cultivar baunilha em escala aqui. Não é uma coincidência—é a nossa oportunidade.',
    about_cta_title: 'Comece Sua Jornada', about_cta_p1: 'A curiosidade é o primeiro passo. Se você é um pesquisador, investidor ou alguém fascinado pela convergência de tecnologia e agricultura, há maneiras de se conectar conosco.', about_btn_visit: 'Agende uma Visita', about_btn_invest: 'Saiba Mais Sobre Investimentos', about_btn_contact: 'Entre em Contacto',
    // Visitas
    visits_title: 'Visite Nossa Fazenda de Pesquisa', visits_intro: 'Descubra os segredos da baunilha—a especiaria mais trabalhosa do mundo. Nossa estufa está atualmente passando por uma renovação para criar o ambiente perfeito para aprendizado e exploração. Junte-se a nós para uma experiência inesquecível que combina ciência, história e a delicada arte do cultivo da baunilha.',
    vanilla_experience_title: 'A Experiência Baunilha', vanilla_experience_desc: 'Baunilha não é apenas um sabor—é uma história de paciência, precisão e mistérios da natureza. A maioria da baunilha do mundo vem de Madagascar, mas poucos conhecem o processo intrincado por trás de sua produção. Em nossa estufa, você presenciará em primeira mão:',
    vanilla_exp_li1: 'As delicadas flores de orquídea que florescem por apenas algumas horas a cada ano', vanilla_exp_li2: 'A técnica antiga de polinização manual que desbloqueia o potencial da especiaria', vanilla_exp_li3: 'A precisão científica necessária para cultivar baunilha em um clima temperado', vanilla_exp_li4: 'Como o terroir único dos Açores cria um sabor de baunilha distinto',
    education_title: 'Educação em Primeiro Lugar', education_desc: 'Nossos tours são projetados para mentes curiosas—seja você um entusiasta culinário, um explorador científico ou alguém fascinado pela agricultura sustentável. Cada visita combina demonstrações interativas, aprendizado prático e discussão guiada:',
    education_li1: 'A Ciência: Compreender a biologia da polinização da baunilha, o papel dos sensores IoT e a agricultura de precisão na era moderna', education_li2: 'A Arte: Testemunhar a habilidade e intuição necessárias para polinização manual e cura pós-colheita', education_li3: 'A História: Aprenda como a baunilha se tornou valiosa, seu papel no comércio global e por que é mais difícil de cultivar que ouro', education_li4: 'O Futuro: Explore como AgTech e sustentabilidade estão remodelando a agricultura especializada',
    renovation_title: 'Em Breve: Grande Abertura', renovation_desc: 'Nossa estufa está passando por cuidadosa renovação para atender à nossa visão de uma instalação focada em educação e pesquisa. Estamos instalando controle climático avançado, sistemas de monitoramento IoT e projetando caminhos para visitantes que equilibram acessibilidade com cuidados com as plantas.',
    renovation_timeline: 'Esperamos receber nossos primeiros convidados em meados ou final de 2026. Os tours serão limitados em tamanho para garantir uma experiência íntima e de alta qualidade.',
    cta_title: 'Junte-se à Lista de Espera', cta_desc: 'Seja um dos primeiros a visitar quando abrirmos nossas portas. Junte-se à nossa lista de espera para receber atualizações sobre nossa data de abertura, eventos especiais de lançamento e oportunidades exclusivas de visita para madrugadores.',
    cta_waitlist: 'Junte-se à Lista de Espera',
    // Investments
    invest_title: 'Oportunidade de Investimento: Baunilha AgTech de Origem Única Premium', invest_intro: 'Baunilha dos Açores está a construir uma plataforma AgTech escalável para cultivo de baunilha de origem única e premium. Combinamos agricultura de precisão de ponta com IoT com o terroir único dos Açores para criar uma marca de agricultura especializada defensiva e de alto valor. Atualmente na Fase 1 (Pesquisa e Desenvolvimento), procuramos investidores e parceiros estratégicos para acelerar nosso caminho para rentabilidade e liderança de mercado.',
    azores_title: 'Por que os Açores?', azores_intro: 'Os Açores oferecem vantagens incomparáveis para o cultivo premium de baunilha:', azores_terroir_title: 'Terroir Vulcânico Único:', azores_terroir: 'A nossa localização oferece composição de solo distintiva e microclima—fatores-chave que definem perfis de sabor de baunilha premium. A baunilha "Origem Única" dos Açores torna-se um diferenciador de mercado interessante.', azores_climate_title: 'Clima Temperado & Abundância Natural de Energia:', azores_climate: 'Os Açores desfrutam de um clima temperado ideal para cultivo controlado em estufa. Mais importante ainda, o arquipélago é naturalmente abundante em recursos de energia renovável (vento e hidroelétrica), fornecendo uma fonte de energia consistente e econômica para nossas operações habilitadas por IoT. Esta energia renovável livre e constante reduz dramaticamente os custos operacionais enquanto fortalece nossa narrativa de cultivo com carbono neutro.', azores_eu_title: 'Excelência Regulatória da UE:', azores_eu: 'Operar dentro dos padrões da UE garante conformidade de segurança alimentar, certificações de sustentabilidade e acesso a mercados europeus premium sem barreiras tarifárias.', azores_env_title: 'Ambiente Sustentável:', azores_env: 'O foco dos Açores em energia renovável, gestão de água e biodiversidade alinha-se com a demanda dos consumidores por produtos agrícolas produzidos de forma ética e consciente do carbono.',
    tech_title: 'A Tecnologia: Agricultura de Precisão via IoT', tech_intro: 'Aproveitamos sistemas de monitoramento IoT de grau industrial para otimizar o cultivo de baunilha:', tech_climate_title: 'Controle Climático em Tempo Real:', tech_climate: 'Sensores automatizados de temperatura, umidade e luz mantêm condições de crescimento precisas, reduzindo perdas de colheita e maximizando o rendimento.', tech_analytics_title: 'Análise Preditiva:', tech_analytics: 'Os dados dos sensores alimentam modelos de aprendizado de máquina que preveem estresse das plantas, risco de doenças e tempo de colheita—permitindo intervenção proativa.', tech_efficiency_title: 'Eficiência de Recursos:', tech_efficiency: 'Irrigação e fertilização de precisão minimizam o uso de água e químicos, reduzindo custos operacionais e impacto ambiental.', tech_scale_title: 'DNA de Escalabilidade:', tech_scale: 'Nosso stack de tecnologia é projetado para se replicar perfeitamente em múltiplas estufas e regiões geográficas.',
    vision_title: 'A Visão: Construindo a Plataforma AgTech', vision_intro: 'Baunilha dos Açores não é apenas uma fazenda—é a base de um modelo de negócios AgTech escalável. Nosso ecossistema de múltiplas receitas inclui:', vision_prod_title: 'Produção & Distribuição Premium de Baunilha:', vision_prod: 'Canais diretos ao consumidor e atacadistas para feijões, extratos e produtos especiais. Alvo: mercados culinários, cosméticos e farmacêuticos de alto nível.', vision_agri_title: 'Agroturismo & Educação:', vision_agri: 'Experiências em estufa guiadas, workshops e parcerias educacionais nos posicionam como líderes de pensamento em agricultura especializada sustentável.', vision_tech_title: 'Licenciamento de Tecnologia & Consultoria:', vision_tech: 'Nossa plataforma IoT e protocolos de cultivo podem ser licenciados para outros produtores de culturas especiais, criando receita recorrente.', vision_part_title: 'Parcerias Estratégicas:', vision_part: 'Colaboração com instituições de pesquisa, órgãos de certificação e marcas premium amplifica o alcance de mercado e credibilidade.',
    roadmap_title: 'Roadmap de Desenvolvimento', phase1_title: 'Fase 1: Pesquisa & Desenvolvimento (Atual)', phase1_duration: 'Duração:', phase1_dur_val: '24–36 meses', phase1_focus: 'Foco:', phase1_focus_val: 'Prova de Conceito', phase1_li1: 'Otimizar protocolos de cultivo de baunilha para microclima dos Açores', phase1_li2: 'Desenvolver e integrar rede de sensores IoT', phase1_li3: 'Estabelecer métricas de rendimento, qualidade e custo de base', phase1_li4: 'Observar primeiro ciclo de floração (Ano 2–3) e documentar sucesso de polinização', phase1_li5: 'Obter certificações da UE e credenciais de sustentabilidade', phase1_li6: 'Criar validação de mercado através de colheita piloto e parcerias', phase1_li7: 'Construir identidade de marca e presença digital',
    phase2_title: 'Fase 2: Dimensionamento & Infraestrutura (2027–2028)', phase2_focus: 'Foco de Investimento:', phase2_focus_val: 'Expansão & Automação', phase2_trigger: 'Gatilho:', phase2_trigger_val: 'Primeira colheita bem-sucedida', phase2_li1: 'Dimensionar produção usando protocolos comprovados da Fase 1', phase2_li2: 'Expandir pegada de estufa (de piloto para produção em escala comercial)', phase2_li3: 'Implementar sistemas avançados de controle climático e automação', phase2_li4: 'Estabelecer cadeia de suprimentos para insumos (plantas, substrato, embalagem)', phase2_li5: 'Contratar equipes especializadas de agronomia e operações', phase2_li6: 'Lançar canais de e-commerce direto ao consumidor e atacado B2B', phase2_li7: 'Preparar para certificações orgânicas e especializadas',
    phase3_title: 'Fase 3: Processamento & Exportação (2028–2029)', phase3_focus: 'Foco de Investimento:', phase3_focus_val: 'Produtos de Valor Agregado & Penetração de Mercado', phase3_trigger: 'Gatilho:', phase3_trigger_val: 'Produção em escala comercial alcançada', phase3_li1: 'Construir instalação de processamento no local (extração, feijões secos, produtos especiais)', phase3_li2: 'Estabelecer logística de exportação para mercados da UE e internacionais', phase3_li3: 'Dimensionar operações de agroturismo e desenvolver pacotes de experiência premium', phase3_li4: 'Lançar programa de licenciamento para plataforma IoT e protocolos de agronomia', phase3_li5: 'Alcançar rentabilidade operacional e fluxo de caixa positivo',
    invest_support_title: 'Investimento & Apoio', invest_support_desc: 'Bem-vindas tanto investidores estratégicos que procuram parcerias de capital quanto apoiantes interessados em apoiar nossa missão. Contacte-nos para financeiros detalhados, cap table e retornos projetados.',
    crypto_donations_title: 'Doações em Criptomoedas', crypto_donations_desc: 'Você também pode apoiar nossa missão com criptomoedas:',
    // Contact
    contact_title: 'Contacte-nos', contact_intro: 'Aceitamos pedidos sobre visitas, compras e parcerias. Contacte-nos por email, telefone ou redes sociais.', contact_email_label: 'Email:', contact_phone_label: 'Telefone:', contact_address_title: 'Localização', contact_address_label: 'Ribeira Grande (Conceição), São Miguel, Açores', contact_map_note: 'Mapa incorporado via Google Maps — substitua pelo seu fornecedor preferido se necessário.', follow_us_title: 'Siga-nos',
    // Statistics
    dashboard_title: 'Painel de Pesquisa', dashboard_subtitle: 'Monitorização do Comportamento da Estufa e Dados de Desempenho', dashboard_intro_why: 'Em Baunilha dos Açores, acreditamos na ciência aberta. Os dados abaixo representam a nossa pesquisa sobre condições de estufa para o cultivo de baunilha nos Açores. Isto não é apenas uma exibição; é um convite para compreender os nossos métodos.', dashboard_intro_for_researchers: 'Para Pesquisadores: Validem os nossos métodos. Contribuam com insights. Vejam como o controle climático de precisão permite o cultivo de baunilha num clima temperado.', dashboard_intro_for_investors: 'Para Investidores: A transparência constrói confiança. Acompanhem os nossos padrões de dados. Observem como engenhamos um microclima onde as orquídeas de baunilha prosperam—a base da nossa escalabilidade de AgTech.', dashboard_intro_for_enthusiasts: 'Para Entusiastas: Testemunhem a dança delicada do controle ambiental. É assim que se parece dominar a \'zona de conforto\' da baunilha na prática.', dashboard_intro_iot: 'A nossa estufa está equipada com sensores ambientais. Os dados abaixo ilustram as condições que mantemos para a baunilha prosperar nos Açores.',
    live_conditions_title: 'Condições-Alvo da Estufa',
    metric_temperature: 'Temperatura', metric_humidity: 'Humidade', metric_vpd: 'VPD',
    metric_soil_moisture: 'Humidade do Substrato', metric_soil_conductivity: 'Condutividade do Substrato', metric_illuminance: 'Iluminância',
    device_first: 'Sensor 1', device_second: 'Sensor 2',
    status_optimal: 'Ótimo', status_ideal: 'Ideal',
    status_within_policy: 'Dentro da Política', status_too_dry: 'Muito Seco', status_too_wet: 'Muito Molhado',
    status_too_dark: 'Pouca Luz', status_too_bright: 'Luz Excessiva',
    status_cond_low: 'Nutrientes Baixos', status_cond_high: 'Muito Salgado', status_mixed: 'Leituras Mistas',
    temp_range: '18–24°C', hum_range: '65–75%', vpd_range: '0,4–0,6 kPa',
    plant_status_title: 'Indicadores de Estado da Planta', status_growth_phase: 'Fase de Crescimento Ótima', status_transpiration: 'Transpiração Ativa', status_monitoring: 'Monitorização de Risco de Fungos', status_explanation: 'A estufa está numa janela de crescimento ótima. As condições atuais apoiam a absorção ativa de nutrientes e o desenvolvimento da planta. O VPD é ideal para a função estomatal.',
    comparison_title: 'Interior vs. Exterior: A Vantagem Açoriana', comparison_intro: 'A comparação abaixo ilustra por que a nossa conceção de estufa é uma inovação para o cultivo de baunilha nos Açores. No exterior, o clima temperado da ilha é bonito mas insuficiente para a baunilha. No interior, engenhamos os trópicos.', comp_temperature: 'Temperatura', comp_humidity: 'Humidade', comp_vpd: 'VPD', comparison_conclusion: 'Por que isto é Importante: A nossa estufa cria um microclima que as orquídeas de baunilha desejam—engenharia meteorológica de precisão. Estes dados validam a nossa vantagem competitiva: utilizamos a abundância de energia renovável dos Açores para alimentar o controle climático que transforma uma ilha temperada num paraíso de baunilha.',
    trend_title: 'Tendência de 24 Horas: O Ritmo Diário', trend_intro: 'Este gráfico mostra as oscilações naturais que orquestamos. Reparem como a temperatura desce durante a noite (aquecemos para evitar choque) e atinge o pico ao meio-dia (ventilamos para manter o intervalo ideal). A humidade segue o inverso: mais alta quando está mais frio, controlada cuidadosamente durante as horas quentes. O VPD é a nossa bússola verdadeira—ajustamos a temperatura e a humidade em conjunto para manter o VPD no ponto ideal.',
    chart_illuminance_label: 'Iluminância (lux)', chart_soil_moisture_label: 'Humidade do Substrato (%)', chart_soil_conductivity_label: 'Condutividade do Substrato (µS/cm)',
    chart_note: '[Gráfico interativo em breve — mostrando Temperatura (azul), Humidade (verde), VPD (laranja) em 24 horas]', trend_rhythm: 'Este ritmo espelha o ciclo dia-noite natural que a baunilha espera, mesmo que estejamos a controlar cada variável. Esta é a essência da nossa tecnologia.',
    metrics_title: 'O Que os Números Significam: Ciência das Orquídeas de Baunilha',
    card_light_title: 'Iluminância (Luz)', card_light_why_title: 'Porque Importa', card_light_why: 'A baunilha é uma orquídea trepadeira que prefere luz brilhante e filtrada (como sombra salpicada). Pouca luz reduz o crescimento; luz excessiva pode queimar folhas. Monitorizamos a iluminância para entender a disponibilidade sazonal de luz e a estratégia de sombreamento.', card_light_control_title: 'O Que Controlamos', card_light_control_shade: 'Sombreamento e layout da estufa (evitar queima ao meio-dia)', card_light_control_orientation: 'Ventilação e orientação (reduzir stress de calor + luz em conjunto)',
    card_soil_moisture_title: 'Humidade do Substrato', card_soil_moisture_why_title: 'Porque Importa', card_soil_moisture_why: 'As raízes da baunilha precisam de humidade estável com boa aeração. O valor de humidade do MiFlora depende do substrato e precisa de calibração, mas é útil para detetar ciclos de secagem e consistência de rega.', card_soil_moisture_note_title: 'Nota Importante', card_soil_moisture_note: 'A percentagem de humidade não é universal entre substratos. Tratamos estes intervalos como provisórios e refinamo-los ao correlacionar leituras com a resposta da planta.',
    card_soil_conductivity_title: 'Condutividade do Substrato', card_soil_conductivity_why_title: 'Porque Importa', card_soil_conductivity_why: 'A condutividade é um proxy para sais dissolvidos (força do fertilizante). Muito baixa pode indicar subnutrição; muito alta pode causar stress nas raízes. Monitorizar ajuda a manter a nutrição suave e consistente.', card_soil_conductivity_control_title: 'O Que Controlamos', card_soil_conductivity_control_feed: 'Concentração e frequência de fertilização', card_soil_conductivity_control_flush: 'Ciclos de lavagem (evitar acumulação de sais)',
    card_temp_title: 'Temperatura', card_temp_range: '18–24°C (64–75°F)', card_temp_why_title: 'Por que é Importante para a Baunilha', card_temp_why: 'As orquídeas de baunilha são filhas dos trópicos. Precisam de calor consistente para desencadear o crescimento e a floração. Temperaturas abaixo de 18°C atrasam o desenvolvimento; acima de 32°C, a planta entra em estresse. O nosso ponto ideal de 24,5°C acelera tanto o crescimento vegetativo quanto o processo delicado de maturação da flor.', card_temp_growth_title: 'Sinal de Crescimento que Estão a Observar', card_temp_growth: 'Quando a temperatura é estável na faixa de 24–28°C, os motores metabólicos da baunilha funcionam com eficiência máxima. A planta aloca energia para desenvolver a inflorescência (espiga de flor)—o precursor das nossas preciosas vagens de baunilha.', card_temp_growth_dynamic: 'Quando a temperatura se mantém estável na faixa de {lowTemp}–{highTemp}°C, os motores metabólicos da baunilha funcionam com eficiência máxima. A planta aloca energia para desenvolver a inflorescência (espiga floral)—o precursor das nossas preciosas vagens de baunilha.', card_temp_control_title: 'O que Controlamos', card_temp_control_heating: 'Aquecimento noturno (evita estresse do resfriamento noturno dos Açores)', card_temp_control_ventilation: 'Ventilação diurna (evita superaquecimento no verão)', card_temp_control_seasonal: 'Ajustes sazonais (respeita ciclos de floração)',
    card_hum_title: 'Humidade', card_hum_range: '65–75% (Humidade Relativa)', card_hum_why_title: 'Por que é Importante para a Baunilha', card_hum_why: 'A humidade é a linha de vida invisível do cultivo de baunilha. Em 72% HR, o ar contém humidade suficiente para satisfazer as raízes aéreas da planta (sim, a baunilha tem raízes que absorvem água e nutrientes do ar húmido!), enquanto permanece seco o suficiente para prevenir doenças fúngicas que afligem as orquídeas tropicais.', card_hum_balance_title: 'O Equilíbrio', card_hum_balance: 'Abaixo de 60% HR, a planta desidrata—uma sentença de morte numa estufa. Acima de 90% HR, os fungos assumem o controle. A janela de 65–85% é onde as orquídeas de baunilha alcançam o equilíbrio perfeito entre hidratação e resistência a doenças.', card_hum_balance_dynamic: 'Abaixo de {belowThresh}% HR, a planta desidrata—uma sentença de morte numa estufa. Acima de {aboveThresh}% HR, os fungos dominam. A janela de {hMin}–{hMax}% é onde as orquídeas de baunilha alcançam o equilíbrio perfeito entre hidratação e resistência a doenças.', card_hum_growth_title: 'Sinal de Crescimento que Estão a Observar', card_hum_growth: 'Quando a humidade é estável na faixa ideal, as raízes aéreas da baunilha permanecem túrgidas e funcionais. Os estômatos da planta (poros respiratórios) abrem confiantemente, permitindo que a fotossíntese prossiga com capacidade total. É quando o crescimento acontece mais rapidamente.', card_hum_control_title: 'O que Controlamos', card_hum_control_misting: 'Sistemas de nebulização inteligentes (complementam a humidade durante períodos secos)', card_hum_control_ventilation: 'Agendamento de ventilação (libertam humidade excessiva para prevenir proliferação de fungos)', card_hum_control_dew: 'Monitorização do ponto de orvalho (garante que a condensação se forme estrategicamente)', card_hum_control_circulation: 'Circulação de ar (evita bolsas estagnadas onde fungos prosperam)',
    card_vpd_title: 'VPD (Déficit de Pressão de Vapor)', card_vpd_range: '0,4–0,6 kPa (Quilopascais)', card_vpd_what_title: 'O Que é VPD? (A Ciência Por Trás do Número)', card_vpd_what: 'VPD é a métrica da "zona de conforto". Mede a diferença entre a quantidade de humidade que o ar pode conter (na temperatura atual) e a quantidade que realmente contém (humidade atual). Pense nisso como a "sede" do ar.', card_vpd_matters_title: 'Por que é Importante para a Baunilha', card_vpd_matters: 'VPD controla diretamente quão agressivamente uma planta transpira (liberta água através das folhas e raízes aéreas).', card_vpd_too_low: 'VPD muito baixo (< 0,6 kPa): O ar é tão húmido que a planta não consegue libertar água. As raízes sufocam. Os fungos prosperam.', card_vpd_too_low_dynamic: 'VPD demasiado baixo (< {threshold} kPa): O ar é tão húmido que a planta não consegue libertar água. As raízes sufocam. Os fungos prosperam.', card_vpd_too_high: 'VPD muito alto (> 2,0 kPa): O ar é tão seco que a planta transpira desesperadamente para se arrefecer. A planta perde água mais rápido do que as raízes conseguem absorver—induzindo estresse de seca.', card_vpd_too_high_dynamic: 'VPD demasiado alto (> {threshold} kPa): O ar é tão seco que a planta transpira desesperadamente para se arrefecer. A planta perde água mais rápido do que as raízes conseguem absorver—induzindo estresse de seca.', card_vpd_sweet: 'VPD no ponto ideal (0,4–0,6 kPa): A planta transpira na taxa perfeita. Os nutrientes movem-se através da planta com eficiência. O crescimento é maximizado. A planta não está nem a afogar-se nem a ofegar.', card_vpd_sweet_dynamic: 'VPD no ponto ideal ({vpdSweetMin}–{vpdSweetMax} kPa): A planta transpira na taxa perfeita. Os nutrientes movem-se através da planta com eficiência. O crescimento é maximizado. A planta não está nem a afogar-se nem a ofegar.', card_vpd_growth_title: 'Sinal de Crescimento que Estão a Observar', card_vpd_growth: 'Quando o VPD é 1,2 kPa, a planta está em "modo de absorção ativa de nutrientes." A taxa de transpiração é ideal para mover água e nutrientes dissolvidos das raízes para folhas e flores. É quando a magia acontece—quando a baunilha acumula os açúcares e compostos que eventualmente se tornarão o sabor de baunilha que valorizamos.', card_vpd_growth_dynamic: 'Quando o VPD está em {midVpd} kPa, a planta está em "modo de absorção ativa de nutrientes". A taxa de transpiração é ideal para mover água e nutrientes dissolvidos das raízes para folhas e flores. É quando a magia acontece—quando a baunilha acumula os açúcares e compostos que eventualmente se tornarão o sabor de baunilha que valorizamos.', card_vpd_investor_title: 'Por que os Investidores Devem se Importar', card_vpd_investor: 'VPD é o proxy para eficiência de colheita. Em 1,2 kPa, a nossa entrada de energia (ventiladores, nebulizadores, aquecedores) alcança rendimento máximo da planta. Este é o ponto de dados que prova que o nosso controle climático não é apenas preciso—é económico.', card_vpd_control_title: 'O que Controlamos', card_vpd_control_coordination: 'Coordenação temperatura-humidade (mantendo VPD ideal mesmo quando as condições externas variam)', card_vpd_control_monitoring: 'Monitorização de transpiração ativa (os nossos sensores disparam intervenções antes que o estresse ocorra)', card_vpd_control_seasonal: 'Metas VPD sazonais (ajustadas para diferentes fases de crescimento)',
    current_label: 'Atual:', data_explorer_title: 'Explorador de Dados Detalhados', data_explorer_intro: 'Filtrem por intervalo de datas para examinar períodos específicos. Pesquisadores podem usar estes dados para validar correlações de crescimento, identificar eventos de estresse ou estudar os nossos algoritmos de controle climático em ação.', data_tip: 'Dica: Uma depressão de ponto de orvalho negativa (diferença entre temp. do ar e ponto de orvalho) indica que o ar está a aproximar-se da saturação—útil para prever eventos de condensação.',
    transparency_title: 'Uma Nota sobre Transparência & Ciência Aberta', transparency_intro: 'Estes dados representam a nossa pesquisa atual sobre condições ótimas para o cultivo de baunilha. Estamos a documentar o que funciona. Não escolhemos seletivamente resultados. A nossa abordagem é baseada em observação e medição—compreendendo os parâmetros ambientais precisos que permitem à baunilha prosperar nas nossas estufas em São Miguel.', transparency_why: 'Porque acreditamos que a transparência acelera a inovação. Os pesquisadores podem validar os nossos métodos. Os investidores podem construir confiança através de evidências, não de marketing. Os entusiastas podem realmente compreender o que é necessário para cultivar baunilha nos Açores.', transparency_why_bold: 'Por quê?', transparency_conclusion: 'Não estamos apenas a cultivar baunilha. Estamos a provar que a agricultura de precisão—alimentada por medição cuidadosa, controle ambiental e aprendizagem contínua—é a base da agricultura de especialidade. E estamos a construir a infraestrutura para compartilhar o nosso conhecimento conforme escalamos.', transparency_contact_link: 'Entre em contacto',
    // Old stats
    stats_title: 'Estatísticas da Estufa', from_label: 'De', to_label: 'Até', apply: 'Aplicar', reset: 'Limpar',
    col_datetime: 'DataHora', col_temp: 'Temperatura (°C)', col_hum: 'Humidade (%)', col_vpd: 'VPD (kPa)', col_dew: 'Ponto de Orvalho (°C)'
  }
};

// Expose translations for the status/i18n helpers and allow overlay via external JSON.
// Embedded translations remain the fallback source of truth.
window.__TRANSLATIONS = window.__TRANSLATIONS || TRANSLATIONS;

function mergeTranslations(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  for (const [lang, dict] of Object.entries(extra)) {
    if (!dict || typeof dict !== 'object') continue;
    base[lang] = base[lang] || {};
    Object.assign(base[lang], dict);
  }
  return base;
}

/* ----------------------------- helpers ----------------------------- */
const q = selector => document.querySelector(selector);
const qAll = selector => Array.from(document.querySelectorAll(selector));

function setTextNodeSafe(el, text){
  if(!el) return;
  const tag = el.tagName && el.tagName.toLowerCase();
  if(tag === 'input' || tag === 'textarea' || tag === 'select'){
    el.value = text;
    return;
  }
  if(el.childElementCount === 0){
    el.textContent = text;
    return;
  }
  for(const node of Array.from(el.childNodes)){
    if(node.nodeType === Node.TEXT_NODE){
      node.nodeValue = text;
      return;
    }
  }
  el.insertBefore(document.createTextNode(text), el.firstChild);
}

/* ----------------------------- translations ----------------------------- */
function translatePage(lang){
  const source = window.__TRANSLATIONS || TRANSLATIONS;
  const map = source[lang] || source.en || {};
  // no debug logs in production
  qAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = map[key];
    if(value !== undefined && value !== null) setTextNodeSafe(el, value);
  });
  // Force a second-pass set using innerText for elements that may have
  // complex child nodes or styling that prevented the first pass.
  qAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = map[key];
    if(value !== undefined && value !== null){
      try{ el.innerText = value; }catch(e){}
    }
  });
  // no debug logs in production
  qAll('.lang-switch [data-lang]').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  try{
    if(document && document.documentElement) document.documentElement.lang = lang;
  }catch(e){}
  window.__site_lang = lang;
  localStorage.setItem('site_lang', lang);
}

// Allow other parts of the code to re-apply i18n using an already-selected map.
window.__applyI18n = function applyI18n(map) {
  if (!map) return;
  qAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = map[key];
    if (value !== undefined && value !== null) setTextNodeSafe(el, value);
  });
  qAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = map[key];
    if (value !== undefined && value !== null) {
      try { el.innerText = value; } catch (e) {}
    }
  });
};

async function loadExternalTranslationsAndApply() {
  try {
    const res = await fetch('assets/translations.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const extra = await res.json();
    window.__TRANSLATIONS = window.__TRANSLATIONS || {};
    mergeTranslations(window.__TRANSLATIONS, extra);

    const current = localStorage.getItem('site_lang') || window.__site_lang || 'en';
    translatePage(current);
  } catch (e) {
    // silent: keep embedded translations as fallback
  }
}

/* ----------------------------- UI behaviors ----------------------------- */
function setupParallax(){
  const hero = q('#hero');
  if(!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hero.style.backgroundPosition = `center ${50 - y * 0.03}%`;
  });
}

function setupDelegatedHandlers(){
  document.body.addEventListener('click', (e) => {
    const langBtn = e.target.closest && e.target.closest('.lang-switch [data-lang]');
    if(langBtn){
      if (langBtn.tagName && String(langBtn.tagName).toLowerCase() === 'a') {
        e.preventDefault();
      }
      const lang = langBtn.getAttribute('data-lang');
      translatePage(lang);
      // ensure terms display is updated even if DOM is modified
      setTimeout(() => translatePage(lang), 80);
      setTimeout(() => translatePage(lang), 240);
      if(window.__updateStatusesOnLangChange) window.__updateStatusesOnLangChange();
      return;
    }
    const mt = e.target.closest && e.target.closest('.menu-toggle');
    if(mt) qAll('.nav').forEach(navEl => navEl.classList.toggle('open'));
  });
}

/* ----------------------------- stats ----------------------------- */
function parseDate(dateStr){
  const trimmed = dateStr.trim();
  
  // Try new format first: "YYYY-MM-DD HH:MM:SS"
  if(trimmed.includes('-') && trimmed.includes(':') && !trimmed.includes('a.m') && !trimmed.includes('p.m')) {
    try {
      const [datePart, timePart] = trimmed.split(' ');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
      return parsed;
    } catch(e) {
      console.error('parseDate error for', dateStr, e);
      return null;
    }
  }
  
  // Fall back to old format: "MM-DD-YYYY HH:MM:SS p.m./a.m."
  const parts = trimmed.split(' ');
  if(parts.length < 3) return null;
  
  const [month, day, year] = parts[0].split('-');
  const [hours, minutes, seconds] = parts[1].split(':');
  let ampm = parts[2];
  
  // Remove period from am/pm (e.g., 'p.m.' -> 'pm')
  ampm = ampm.replace(/\./g, '');
  
  let h = parseInt(hours);
  const m = parseInt(minutes);
  const s = parseInt(seconds);
  
  if(ampm.toLowerCase().startsWith('p') && h !== 12) h += 12;
  if(ampm.toLowerCase().startsWith('a') && h === 12) h = 0;
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, m, s);
}

function parseCSV(csvText){
  csvText = csvText.replace(/\0/g, '');
  const lines = csvText.trim().split('\n');
  if(lines.length < 2) return [];
  
  const data = [];
  for(let i = 1; i < lines.length; i++){
    if(!lines[i].trim()) continue;
    // Try comma first (new format), fall back to tab (old format)
    let values = lines[i].split(',');
    if(values.length < 5) {
      values = lines[i].split('\t');
    }
    if(values.length < 5) continue;
    
    // Handle both old 5-column and new 6-column format
    let row = values.map(v => v.trim());
    if(row.length === 5) {
      // Old format: add 'greenhouse' as location
      row = [row[0], 'greenhouse', row[1], row[2], row[4], row[3]];
    }
    
    data.push({
      _values: row,
      _date: parseDate(row[0])
    });
  }
  return data;
}

function renderRows(data){
  const tbody = q('#stats-table tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    // Format: timestamp, location, temp, humidity, vpd, dew_point
    tr.innerHTML = `<td>${row._values[0]}</td><td>${row._values[1]}</td><td>${row._values[2]}</td><td>${row._values[3]}</td><td>${row._values[4]}</td><td>${row._values[5]}</td>`;
    tbody.appendChild(tr);
  });
}

function showMessage(msg){
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:15px 20px;border-radius:5px;z-index:9999;font-size:14px;';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

// Load current values from latest_results.json
// Wait for translations to be loaded before rendering status text
async function waitForTranslations() {
  return new Promise(resolve => {
    if (window.__TRANSLATIONS) {
      resolve();
    } else {
      const maxWait = 3000; // Max 3 seconds
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.__TRANSLATIONS) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          console.warn('Translations took too long to load, proceeding anyway');
          resolve();
        }
      }, 50);
    }
  });
}

async function loadCurrentValues(){
  // Ensure translations are loaded before rendering status text
  await waitForTranslations();
  
  try {
    const res = await fetch('data/latest_results.json');
    if (!res.ok) return;
    
    const data = await res.json();
    
    // Update greenhouse conditions
    if (data.greenhouse) {
      const gh = data.greenhouse;
      // Store current values for language change updates
      currentGreenhouseValues = { temp: gh.temp, humidity: gh.humidity, vpd: gh.vpd };
      
      const setIfExists = (id, value, formatter) => {
        const el = q(id);
        if(el) el.textContent = value !== null ? formatter(value) : '--';
      };
      
      setIfExists('#live-temp', gh.temp, v => v.toFixed(1));
      setIfExists('#live-hum', gh.humidity, v => v.toFixed(0));
      setIfExists('#live-vpd', gh.vpd, v => v.toFixed(2));
      
      updateComparisonTableWithStatus(gh.temp, gh.humidity, gh.vpd);
      updatePlantStatus(gh.temp, gh.humidity, gh.vpd);
      updateGaugeStatus(gh.temp, gh.humidity, gh.vpd);
      updateMetricCardRanges(gh.temp, gh.humidity, gh.vpd);
      updateGaugeRanges(getCurrentPolicy().policy);
    }
    
    // Update outdoor conditions
    if (data.outdoor) {
      const out = data.outdoor;
      // Store current values for language change updates
      currentOutdoorValues = { temp: out.temp, humidity: out.humidity, vpd: out.vpd };
      
      const setIfExists = (id, value, formatter) => {
        const el = q(id);
        if(el) el.textContent = value !== null ? formatter(value) : '--';
      };
      
      setIfExists('#outdoor-temp', out.temp, v => v.toFixed(1));
      setIfExists('#outdoor-hum', out.humidity, v => v.toFixed(0));
      setIfExists('#outdoor-vpd', out.vpd, v => v.toFixed(2));
      
      updateOutdoorGaugeStatus(out.temp, out.humidity, out.vpd);
      updateOutdoorPlantStatus(out.temp, out.humidity, out.vpd);
      updateComparisonTableOutdoor(out.temp, out.humidity, out.vpd);
    }

    // Update MiFlora values (sanitized devices: first/second)
    if (data.miflora) {
      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const norm = (d) => {
        const obj = d || {};
        return {
          moisture_pct: toNum(obj.moisture_pct),
          conductivity_us_cm: toNum(obj.conductivity_us_cm),
          illuminance_lux: toNum(obj.illuminance_lux)
        };
      };

      currentMiFloraValues = {
        first: norm(data.miflora.first),
        second: norm(data.miflora.second)
      };

      updateMiFloraLiveValues(currentMiFloraValues);
      updateMiFloraGaugeStatus(currentMiFloraValues);
    }

    // Always refresh policy-based range labels
    updateGaugeRanges(getCurrentPolicy().policy);
    updateChartLabels();
  } catch(err) {
    // Silently fail if data unavailable
  }
}

// Load chart data from latest_24_greenhouse_results.csv and latest_24_outdoor_results.csv
async function loadChartsData(){
  try {
    // Load both greenhouse and outdoor data
    const ghRes = await fetch('data/latest_24_greenhouse_results.csv');
    const outRes = await fetch('data/latest_24_outdoor_results.csv');
    
    if (!ghRes.ok || !outRes.ok) return;
    
    const ghText = await ghRes.text();
    const outText = await outRes.text();
    
    const ghData = parseCSV(ghText);
    const outData = parseCSV(outText);
    
    const chartData = generateChartData(ghData, outData);

    // MiFlora (optional)
    try {
      const mfRes = await fetch('data/latest_24_miflora_packets.csv');
      if (mfRes.ok) {
        const mfText = await mfRes.text();
        const mfData = parseCSV(mfText);
        chartData.miflora = generateMiFloraChartData(mfData);
      }
    } catch(_) {
      // ignore missing miflora CSV
    }

    updateCharts(chartData);
  } catch(err) {
    // Silently fail if data unavailable
  }
}

// Load table data from stats.csv
async function loadTableData(){
  try {
    const res = await fetch('data/stats.csv');
    if (!res.ok) return;
    
    const text = await res.text();
    const data = parseCSV(text);
    window.__stats = data;
  } catch(err) {
    // Silently fail if data unavailable
  }
}

// Each function is called independently in its specific place:
// - loadCurrentValues() in cards/displays for greenhouse conditions
// - loadChartsData() in chart sections
// - loadTableData() in table/filtering sections

function updateComparisonTableWithStatus(temp, humidity, vpd){
  const { name, policy } = getCurrentPolicy();
  const vpdTol = getVpdTolerance(policy);
  const isDay = isDaylight();
  const targetVpd = isDay ? policy.dv : policy.nv;
  
  // Determine status based on policy ranges
  const tempInRange = temp >= policy.t_min && temp <= policy.t_max;
  const humInRange = humidity >= policy.h_min && humidity <= policy.h_max;
  const vpdInRange = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  const tempStatus = tempInRange ? 'good' : (Math.abs(temp - policy.t_min) < 2 ? 'warning' : 'critical');
  const tempMark = tempInRange ? '✓' : (temp < policy.t_min ? '↓' : '↑');
  
  const humStatus = humInRange ? 'good' : (Math.abs(humidity - policy.h_min) < 5 ? 'warning' : 'critical');
  const humMark = humInRange ? '✓' : (humidity < policy.h_min ? '↓' : '↑');
  
  const vpdStatus = vpdInRange ? 'good' : (Math.abs(vpd - targetVpd) < vpdTol * 1.5 ? 'warning' : 'critical');
  const vpdMark = vpdInRange ? '✓' : (vpd < targetVpd ? '↓' : '↑');
  
  // Update comparison table cells
  const tempCell = q('#comp-temp-inside');
  const humCell = q('#comp-hum-inside');
  const vpdCell = q('#comp-vpd-inside');
  
  if(tempCell) {
    tempCell.className = 'comparison-cell inside ' + tempStatus;
    tempCell.innerHTML = temp.toFixed(1) + '°C <span class="badge">' + tempMark + '</span>';
  }
  if(humCell) {
    humCell.className = 'comparison-cell inside ' + humStatus;
    humCell.innerHTML = humidity.toFixed(0) + '% <span class="badge">' + humMark + '</span>';
  }
  if(vpdCell) {
    vpdCell.className = 'comparison-cell inside ' + vpdStatus;
    vpdCell.innerHTML = vpd.toFixed(2) + ' kPa <span class="badge">' + vpdMark + '</span>';
  }
}

function calculateStatus(temp, humidity, vpd){
  const { name, policy } = getCurrentPolicy();
  const vpdTol = getVpdTolerance(policy);
  const isDay = isDaylight();
  const targetVpd = isDay ? policy.dv : policy.nv;
  
  // Check if values are within policy ranges
  const optimalTemp = temp >= policy.t_min && temp <= policy.t_max;
  const optimalHum = humidity >= policy.h_min && humidity <= policy.h_max;
  const optimalVpd = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  // Growth phase status (based on temperature and policy)
  let growthStatus = optimalTemp ? 'good' : (Math.abs(temp - policy.t_min) < 2 || Math.abs(temp - policy.t_max) < 2 ? 'warning' : 'critical');
  
  // CAM-aware transpiration/CO2/photosynthesis status based on day/night
  let transpirationStatus = 'good';
  let secondaryStatus = 'good';
  
  if(isDay) {
    // DAY MODE: Stomata closed, using stored malic acids
    // Primary: Photosynthesis status based on VPD conditions
    if(!optimalVpd) {
      const distance = Math.abs(vpd - targetVpd);
      const isWarning = distance < vpdTol * 1.5;
      if(vpd < targetVpd - vpdTol) {
        // VPD too low (excess humidity) during day = moisture risk
        // Consider both humidity AND VPD when assessing severity
        const humCritical = humidity > (policy.h_max + 5);
        transpirationStatus = (isWarning && !humCritical) ? 'warning' : 'critical';
        secondaryStatus = transpirationStatus; // "Excess Moisture Risk"
      } else {
        // VPD too high during day = doesn't affect photosynthesis (stomata closed)
        transpirationStatus = isWarning ? 'warning' : 'critical';
        secondaryStatus = 'good'; // No secondary concern
      }
    }
  } else {
    // NIGHT MODE: Stomata open for CO2 uptake and transpiration
    // Primary: CO2 uptake status based on VPD
    if(!optimalVpd) {
      const distance = Math.abs(vpd - targetVpd);
      const isWarning = distance < vpdTol * 1.5;
      if(vpd < targetVpd - vpdTol) {
        // VPD too low (high humidity) at night = transpiration limited (restricts water loss and stomatal opening)
        // Consider both humidity AND VPD when assessing severity
        const humCritical = humidity > (policy.h_max + 5);
        transpirationStatus = (isWarning && !humCritical) ? 'warning' : 'critical';
        secondaryStatus = transpirationStatus; // "Transpiration Limited"
      } else {
        // VPD too high (dry air) at night = CO2 uptake limited (prevents stomata from opening)
        transpirationStatus = isWarning ? 'warning' : 'critical';
        secondaryStatus = 'good'; // No secondary concern
      }
    }
  }
  
  // Fungus risk (high humidity + warm temp = ideal for fungi)
  let fungusRisk = 'good';
  if(humidity > 85 && temp > policy.t_max - 3) {
    fungusRisk = 'critical';
  } else if(humidity > policy.h_max) {
    fungusRisk = 'warning';
  }
  
  return { growthStatus, transpirationStatus, fungusRisk, secondaryStatus, isDay, policyName: name };
}

function getStatusIcon(status){
  return status === 'good' ? '🟢' : (status === 'warning' ? '🟡' : '🔴');
}

function getStatusClass(status){
  return status === 'good' ? 'status-good' : (status === 'warning' ? 'status-watch' : 'status-critical');
}

function updatePlantStatus(temp, humidity, vpd){
  const s = calculateStatus(temp, humidity, vpd);
  const items = qAll('.status-display .status-item');
  
  if(items[0]) {
    items[0].className = 'status-item ' + getStatusClass(s.growthStatus);
    const icon = items[0].querySelector('.status-icon');
    if(icon) icon.textContent = getStatusIcon(s.growthStatus);
    const textEl = items[0].querySelector('.status-text');
    if(textEl) {
      const statusKey = s.growthStatus === 'good' ? 'status_growth_optimal' 
                      : s.growthStatus === 'warning' ? 'status_growth_caution' 
                      : 'status_growth_critical';
      textEl.textContent = getTranslation(statusKey);
      textEl.setAttribute('data-i18n', statusKey);
    }
  }
  if(items[1]) {
    items[1].className = 'status-item ' + getStatusClass(s.transpirationStatus);
    const icon = items[1].querySelector('.status-icon');
    if(icon) icon.textContent = getStatusIcon(s.transpirationStatus);
    
    // Update label dynamically based on day/night
    const labelEl = items[1].querySelector('.status-label');
    if(labelEl) {
      const labelKey = s.isDay ? 'status_label_photosynthesis' : 'status_label_co2_uptake';
      labelEl.textContent = getStatusText(labelKey);
      labelEl.setAttribute('data-i18n', labelKey);
    }
    
    const textEl = items[1].querySelector('.status-text');
    if(textEl) {
      // CAM-aware status: Use CO2 uptake at night, Photosynthesis during day
      let statusKey;
      if(s.isDay) {
        // Day mode: stomata closed, using stored acids
        statusKey = s.transpirationStatus === 'good' ? 'vpd_day_photo_optimal'
                  : s.transpirationStatus === 'warning' ? 'vpd_day_photo_limited'
                  : 'vpd_day_photo_limited';
      } else {
        // Night mode: stomata open for CO2 uptake
        statusKey = s.transpirationStatus === 'good' ? 'vpd_night_co2_optimal'
                  : s.transpirationStatus === 'warning' ? 'vpd_night_co2_limited'
                  : 'vpd_night_co2_limited';
      }
      textEl.textContent = getStatusText(statusKey);
      textEl.setAttribute('data-i18n', statusKey);
    }
  }
  if(items[2]) {
    // Item 2: Secondary concern - Transpiration Limited at night, Excess Moisture Risk during day
    items[2].className = 'status-item ' + getStatusClass(s.secondaryStatus);
    const icon = items[2].querySelector('.status-icon');
    if(icon) icon.textContent = getStatusIcon(s.secondaryStatus);
    
    // Update label dynamically based on day/night
    const labelEl = items[2].querySelector('.status-label');
    if(labelEl) {
      const labelKey = s.isDay ? 'status_label_moisture' : 'status_label_transpiration';
      labelEl.textContent = getStatusText(labelKey);
      labelEl.setAttribute('data-i18n', labelKey);
    }
    
    const textEl = items[2].querySelector('.status-text');
    if(textEl) {
      let statusKey;
      if(s.isDay) {
        // Day mode: excess moisture risk when VPD too low
        statusKey = s.secondaryStatus === 'good' ? 'status_fungus_low'
                  : s.secondaryStatus === 'warning' ? 'vpd_day_excess_moisture'
                  : 'vpd_day_excess_moisture';
      } else {
        // Night mode: transpiration limited when VPD too low
        statusKey = s.secondaryStatus === 'good' ? 'status_fungus_low'
                  : s.secondaryStatus === 'warning' ? 'vpd_night_trans_limited'
                  : 'vpd_night_trans_limited';
      }
      textEl.textContent = getStatusText(statusKey);
      textEl.setAttribute('data-i18n', statusKey);
    }
  }
  
  // Update dynamic explanation based on worst status and actual values
  const worstStatus = [s.growthStatus, s.transpirationStatus, s.secondaryStatus].includes('critical') ? 'critical' 
                    : [s.growthStatus, s.transpirationStatus, s.secondaryStatus].includes('warning') ? 'warning' 
                    : 'good';
  
  let explanationKey = 'explanation_all_optimal';
  if(worstStatus === 'critical') {
    if(s.growthStatus === 'critical') explanationKey = 'explanation_temp_critical';
    else if(s.transpirationStatus === 'critical') explanationKey = 'explanation_trans_critical';
    else if(s.secondaryStatus === 'critical') explanationKey = s.isDay ? 'explanation_moisture_critical' : 'explanation_trans_critical';
  } else if(worstStatus === 'warning') {
    if(s.growthStatus === 'warning') explanationKey = 'explanation_temp_warning';
    else if(s.transpirationStatus === 'warning') {
      // Check if humidity is significantly off (not just slightly)
      const { policy } = getCurrentPolicy();
      const humDeviationPercent = Math.abs(humidity - (humidity > policy.h_max ? policy.h_max : policy.h_min));
      const humSignificantlyOff = humDeviationPercent > 5; // More than 5% off
      explanationKey = humSignificantlyOff ? 'explanation_trans_warning_high_hum' : 'explanation_trans_warning';
    }
    else if(s.secondaryStatus === 'warning') explanationKey = s.isDay ? 'explanation_moisture_warning' : 'explanation_trans_warning';
  }

  
  const explanationEl = q('#dynamic-explanation');
  if(explanationEl) {
    explanationEl.textContent = getTranslation(explanationKey);
    explanationEl.setAttribute('data-i18n', explanationKey);
  }
}

function updateGaugeStatus(temp, humidity, vpd){
  // Get current policy based on season
  const { name, policy } = getCurrentPolicy();
  
  // Determine status based on policy ranges
  const tempInRange = temp >= policy.t_min && temp <= policy.t_max;
  const humInRange = humidity >= policy.h_min && humidity <= policy.h_max;
  
  // VPD check: use appropriate VPD target (day or night) and tolerance
  const isDay = isDaylight();
  const targetVpd = isDay ? policy.dv : policy.nv;  // Use current VPD (day or night)
  const vpdTol = getVpdTolerance(policy);
  const vpdInRange = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  const tempStatus = tempInRange ? 'optimal' : (Math.abs(temp - policy.t_min) < 2 || Math.abs(temp - policy.t_max) < 2 ? 'caution' : 'critical');
  const humStatus = humInRange ? 'optimal' : (Math.abs(humidity - policy.h_min) < 5 || Math.abs(humidity - policy.h_max) < 5 ? 'caution' : 'critical');
  const vpdStatus = vpdInRange ? 'ideal' : (Math.abs(vpd - targetVpd) < vpdTol * 1.5 ? 'caution' : 'critical');
  
  const tempEl = q('#gauge-temp-status');
  const humEl = q('#gauge-hum-status');
  const vpdEl = q('#gauge-vpd-status');
  
  const tempClass = tempInRange ? 'good' : (tempStatus === 'caution' ? 'warning' : 'critical');
  const humClass = humInRange ? 'good' : (humStatus === 'caution' ? 'warning' : 'critical');
  const vpdClass = vpdInRange ? 'good' : (vpdStatus === 'caution' ? 'warning' : 'critical');
  
  if(tempEl) {
    tempEl.textContent = getStatusText(tempStatus);
    tempEl.className = 'gauge-status ' + tempClass;
  }
  if(humEl) {
    humEl.textContent = getStatusText(humStatus);
    humEl.className = 'gauge-status ' + humClass;
  }
  if(vpdEl) {
    vpdEl.textContent = getStatusText(vpdStatus);
    vpdEl.className = 'gauge-status ' + vpdClass;
  }
  
  // Update policy-based ranges displayed in the gauge cards
  updateGaugeRanges(policy);
}

function updateMiFloraLiveValues(miflora) {
  const setText = (id, value, formatter) => {
    const el = q(id);
    if(!el) return;
    if(value === null || value === undefined || Number.isNaN(value)) {
      el.textContent = '--';
      return;
    }
    el.textContent = formatter(value);
  };

  const first = (miflora && miflora.first) ? miflora.first : {};
  const second = (miflora && miflora.second) ? miflora.second : {};

  setText('#live-moisture-first', first.moisture_pct, (v) => v.toFixed(0));
  setText('#live-moisture-second', second.moisture_pct, (v) => v.toFixed(0));
  setText('#live-cond-first', first.conductivity_us_cm, (v) => v.toFixed(0));
  setText('#live-cond-second', second.conductivity_us_cm, (v) => v.toFixed(0));
  setText('#live-lux-first', first.illuminance_lux, (v) => Math.round(v).toString());
  setText('#live-lux-second', second.illuminance_lux, (v) => Math.round(v).toString());

  // Science cards current values
  setText('#card-moisture-first', first.moisture_pct, (v) => v.toFixed(0));
  setText('#card-moisture-second', second.moisture_pct, (v) => v.toFixed(0));
  setText('#card-cond-first', first.conductivity_us_cm, (v) => v.toFixed(0));
  setText('#card-cond-second', second.conductivity_us_cm, (v) => v.toFixed(0));
  setText('#card-lux-first', first.illuminance_lux, (v) => Math.round(v).toString());
  setText('#card-lux-second', second.illuminance_lux, (v) => Math.round(v).toString());
}

function updateMiFloraGaugeStatus(miflora) {
  const { policy } = getCurrentPolicy();

  const isValidNumber = (v) => v !== null && v !== undefined && !Number.isNaN(v);

  const classifyPairDirectional = (a, b, { min, max, lowKey, highKey }) => {
    const values = [a, b].filter(isValidNumber);
    if(values.length === 0) return { statusKey: null, className: null };

    const sides = values.map((v) => (v < min ? 'low' : (v > max ? 'high' : 'ok')));
    if(sides.includes('low') && sides.includes('high')) {
      return { statusKey: 'mixed', className: 'critical' };
    }
    if(sides.every((s) => s === 'ok')) {
      return { statusKey: 'within_policy', className: 'good' };
    }

    const direction = sides.includes('low') ? 'low' : 'high';
    const outOfRange = values.filter((v) => (direction === 'low' ? v < min : v > max));
    const worstDist = outOfRange.length === 0 ? 0 : Math.max(
      ...outOfRange.map((v) => (direction === 'low' ? (min - v) : (v - max)))
    );
    const span = Math.max(1e-9, (max - min));
    const severity = worstDist <= span * 0.25 ? 'warning' : 'critical';

    return {
      statusKey: direction === 'low' ? lowKey : highKey,
      className: severity
    };
  };

  const first = (miflora && miflora.first) ? miflora.first : {};
  const second = (miflora && miflora.second) ? miflora.second : {};

  const moisture = classifyPairDirectional(
    first.moisture_pct,
    second.moisture_pct,
    { min: policy.soil_moisture_min, max: policy.soil_moisture_max, lowKey: 'too_dry', highKey: 'too_wet' }
  );
  const conductivity = classifyPairDirectional(
    first.conductivity_us_cm,
    second.conductivity_us_cm,
    { min: policy.soil_conductivity_min, max: policy.soil_conductivity_max, lowKey: 'cond_low', highKey: 'cond_high' }
  );

  const isDay = isDaylight();
  const nightLuxMax = Math.max(50, Math.round(policy.illuminance_min * 0.10));
  const lux = classifyPairDirectional(
    first.illuminance_lux,
    second.illuminance_lux,
    {
      min: isDay ? policy.illuminance_min : 0,
      max: isDay ? policy.illuminance_max : nightLuxMax,
      lowKey: 'too_dark',
      highKey: 'too_bright'
    }
  );

  const apply = (id, result) => {
    const el = q(id);
    if(!el) return;
    if(!result || !result.statusKey || !result.className) {
      el.textContent = '--';
      el.className = 'gauge-status';
      return;
    }

    el.textContent = getStatusText(result.statusKey);
    el.className = 'gauge-status ' + result.className;
  };

  apply('#gauge-moisture-status', moisture);
  apply('#gauge-cond-status', conductivity);
  apply('#gauge-lux-status', lux);
}

function updateGaugeRanges(policy){
  const tempRange = q('#temp-target-range');
  const humRange = q('#hum-target-range');
  const vpdRange = q('#vpd-target-range');
  const moistureRange = q('#moisture-target-range');
  const condRange = q('#cond-target-range');
  const luxRange = q('#lux-target-range');

  if(tempRange) tempRange.textContent = policy.t_min + '–' + policy.t_max + '°C';
  if(humRange) humRange.textContent = policy.h_min + '–' + policy.h_max + '%';
  if(vpdRange) {
    const isDay = isDaylight();
    const currentVPD = isDay ? policy.dv : policy.nv;
    const vpdTol = getVpdTolerance(policy);
    const vpdMin = (currentVPD - vpdTol).toFixed(2);
    const vpdMax = (currentVPD + vpdTol).toFixed(2);
    vpdRange.textContent = vpdMin + '–' + vpdMax + ' kPa';
  }

  if(moistureRange) moistureRange.textContent = `${policy.soil_moisture_min}–${policy.soil_moisture_max}%`;
  if(condRange) condRange.textContent = `${policy.soil_conductivity_min}–${policy.soil_conductivity_max} µS/cm`;
  if(luxRange) {
    const isDay = isDaylight();
    const nightLuxMax = Math.max(50, Math.round(policy.illuminance_min * 0.10));
    luxRange.textContent = isDay
      ? `${policy.illuminance_min}–${policy.illuminance_max} lux`
      : `0–${nightLuxMax} lux`;
  }

  updateMiFloraChartTargets(policy);
}

function updateMetricCards(temp, humidity, vpd){
  // Update the metric cards with current values
  const cardTemp = q('#card-temp');
  const cardHum = q('#card-hum');
  const cardVpd = q('#card-vpd');
  
  if(cardTemp) cardTemp.textContent = temp.toFixed(1);
  if(cardHum) cardHum.textContent = humidity.toFixed(0);
  if(cardVpd) cardVpd.textContent = vpd.toFixed(2);
}

function generateChartData(ghDataRows, outDataRows){
  // Generate separate chart datasets for greenhouse and outdoor
  // Both use last 24 hours of their respective data
  
  const processData = (dataRows, location) => {
    if(!dataRows || dataRows.length === 0) return [];
    
    const latestRow = dataRows[dataRows.length - 1];
    if(!latestRow || !latestRow._date) return [];
    
    const latestTime = latestRow._date.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cutoffTime = latestTime - oneDayMs;
    
    // Filter rows from the last 24 hours for this location
    const last24h = dataRows.filter(row => {
      if(!row._date) return false;
      if(row._values[1] !== location) return false;
      return row._date.getTime() >= cutoffTime;
    });
    
    return last24h.map(row => ({
      temp: parseFloat(row._values[2]),
      humidity: parseFloat(row._values[3]),
      vpd: parseFloat(row._values[4]),
      timestamp: row._values[0]
    }));
  };
  
  const ghData = processData(ghDataRows, 'greenhouse');
  const outData = processData(outDataRows, 'outdoor');
  
  return {
    greenhouse: ghData,
    outdoor: outData
  };
}

function generateMiFloraChartData(mfDataRows) {
  const empty = { first: [], second: [] };
  if(!mfDataRows || mfDataRows.length === 0) return empty;

  const withDate = mfDataRows.filter(r => r && r._date);
  if(withDate.length === 0) return empty;

  const latestRow = withDate[withDate.length - 1];
  const latestTime = latestRow._date.getTime();
  const cutoffTime = latestTime - 24 * 60 * 60 * 1000;

  const out = { first: [], second: [] };
  for(const row of withDate) {
    if(row._date.getTime() < cutoffTime) continue;
    const device = row._values[1];
    if(device !== 'first' && device !== 'second') continue;

    // Expected columns (sanitized export):
    // timestamp, device, temperature_c, illuminance_lux, moisture_pct, conductivity_us_cm
    const lux = Number(row._values[3]);
    const moisture = Number(row._values[4]);
    const cond = Number(row._values[5]);

    out[device].push({
      timestamp: row._values[0],
      lux: Number.isFinite(lux) ? lux : null,
      moisture: Number.isFinite(moisture) ? moisture : null,
      cond: Number.isFinite(cond) ? cond : null
    });
  }

  return out;
}

function updateChartTimeLabels(chartData) {
  if(!chartData || chartData.length < 1) return;
  
  const charts = qAll('svg.metric-chart');
  if(charts.length < 1) return;
  
  // Parse date string in format "YYYY-MM-DD HH:MM:SS"
  const parseChartDate = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return null;
    return new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]);
  };
  
  // Get exact first and last timestamps
  const firstDate = parseChartDate(chartData[0].timestamp);
  const lastDate = parseChartDate(chartData[chartData.length - 1].timestamp);
  
  if(!firstDate || !lastDate) return;
  
  const timeSpanMs = lastDate.getTime() - firstDate.getTime();
  const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
  
  // Generate time labels - EVENLY SPACED across available x-range
  const timeLabels = [];
  // Equal spacing: 7 labels across 50-870 (820px range) = 136.67px gap between each
  const xPositions = [50, 186.67, 323.33, 460, 596.67, 733.33, 870]; // Evenly distributed
  
  for(let i = 0; i < xPositions.length; i++) {
    let labelDate;
    
    if(i === 0) {
      // First label is always the first timestamp
      labelDate = firstDate;
    } else if(i === xPositions.length - 1) {
      // Last label is ALWAYS the last timestamp (at x=870)
      labelDate = lastDate;
    } else {
      // Middle labels are interpolated
      const fraction = i / (xPositions.length - 1);
      const timeMs = firstDate.getTime() + (lastDate.getTime() - firstDate.getTime()) * fraction;
      labelDate = new Date(timeMs);
    }
    
    const hours = String(labelDate.getHours()).padStart(2, '0');
    const minutes = String(labelDate.getMinutes()).padStart(2, '0');
    timeLabels.push({
      time: `${hours}:${minutes}`,
      x: xPositions[i]
    });
  }
  
  // Update time labels in all charts
  charts.forEach(chart => {
    const timeTexts = chart.querySelectorAll('text[y="220"]');
    timeTexts.forEach((text, i) => {
      if(i < timeLabels.length) {
        text.textContent = timeLabels[i].time;
        text.setAttribute('x', timeLabels[i].x.toString());
      }
    });
  });
}

function updateCharts(chartData){
  if(!chartData || chartData.length < 1) return;

  // ===== CHART RENDERING ENGINE =====
  class ChartRenderer {
    constructor(polylineElement, dataKey = 'temp', minVal = 14, maxVal = 32) {
      this.polyline = polylineElement;
      this.dataKey = dataKey;
      this.minVal = minVal;
      this.maxVal = maxVal;
      
      // Fixed chart dimensions
      this.xMin = 50;
      this.xMax = 870;
      this.yTop = 20;
      this.yBottom = 200;
      this.xRange = this.xMax - this.xMin;
      this.yRange = this.yBottom - this.yTop;
    }

    parseDate(timeStr) {
      if (!timeStr) return null;
      const parts = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (!parts) return null;
      return new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]);
    }

    render(data) {
      if (!data || data.length < 1) return false;

      try {
        const firstDate = this.parseDate(data[0].timestamp);
        const lastDate = this.parseDate(data[data.length - 1].timestamp);
        
        if (!firstDate || !lastDate) return false;

        const timeSpanMs = lastDate.getTime() - firstDate.getTime();
        if (timeSpanMs <= 0) return false;

        // Find actual data range
        let dataMin = Infinity, dataMax = -Infinity;
        data.forEach(d => {
          const val = d[this.dataKey];
          if (val !== undefined && !isNaN(val)) {
            dataMin = Math.min(dataMin, val);
            dataMax = Math.max(dataMax, val);
          }
        });

        const minVal = this.minVal !== null ? this.minVal : dataMin;
        const maxVal = this.maxVal !== null ? this.maxVal : dataMax;
        const valRange = maxVal - minVal;

        if (valRange <= 0) return false;

        // Generate polyline points
        let points = [];
        data.forEach(point => {
          const pointDate = this.parseDate(point.timestamp);
          if (!pointDate) return;

          const msFromStart = pointDate.getTime() - firstDate.getTime();
          const timeProgress = msFromStart / timeSpanMs;
          const x = this.xMin + (timeProgress * this.xRange);

          const val = point[this.dataKey];
          const normalized = (val - minVal) / valRange;
          const y = this.yBottom - (normalized * this.yRange);

          // Ensure points stay within bounds
          const xClamped = Math.max(this.xMin, Math.min(this.xMax, x));
          const yClamped = Math.max(this.yTop, Math.min(this.yBottom, y));

          points.push(`${xClamped.toFixed(1)},${yClamped.toFixed(1)}`);
        });

        this.polyline.setAttribute('points', points.join(' '));
        return true;
      } catch (e) {
        console.error('Chart render error:', e);
        return false;
      }
    }
  }

  // Render all three charts with both greenhouse and outdoor lines
  const tempPolyGH = document.getElementById('temp-line-greenhouse');
  const tempPolyOut = document.getElementById('temp-line-outdoor');
  const humPolyGH = document.getElementById('hum-line-greenhouse');
  const humPolyOut = document.getElementById('hum-line-outdoor');
  const vpdPolyGH = document.getElementById('vpd-line-greenhouse');
  const vpdPolyOut = document.getElementById('vpd-line-outdoor');

  // Temperature chart
  if (tempPolyGH && chartData.greenhouse) {
    new ChartRenderer(tempPolyGH, 'temp', 14, 32).render(chartData.greenhouse);
  }
  if (tempPolyOut && chartData.outdoor) {
    new ChartRenderer(tempPolyOut, 'temp', 14, 32).render(chartData.outdoor);
  }

  // Humidity chart
  if (humPolyGH && chartData.greenhouse) {
    new ChartRenderer(humPolyGH, 'humidity', 50, 95).render(chartData.greenhouse);
  }
  if (humPolyOut && chartData.outdoor) {
    new ChartRenderer(humPolyOut, 'humidity', 50, 95).render(chartData.outdoor);
  }

  // VPD chart
  if (vpdPolyGH && chartData.greenhouse) {
    new ChartRenderer(vpdPolyGH, 'vpd', 0, 2.5).render(chartData.greenhouse);
  }
  if (vpdPolyOut && chartData.outdoor) {
    new ChartRenderer(vpdPolyOut, 'vpd', 0, 2.5).render(chartData.outdoor);
  }

  // MiFlora charts (sanitized devices: first/second)
  const mf = chartData.miflora;
  if(mf) {
    const filterMetric = (arr, key) => (arr || []).filter(p => p && Number.isFinite(p[key]));

    const luxFirst = document.getElementById('lux-line-first');
    const luxSecond = document.getElementById('lux-line-second');
    const moistureFirst = document.getElementById('moisture-line-first');
    const moistureSecond = document.getElementById('moisture-line-second');
    const condFirst = document.getElementById('cond-line-first');
    const condSecond = document.getElementById('cond-line-second');

    const mfFirst = mf.first || [];
    const mfSecond = mf.second || [];

    if(luxFirst) new ChartRenderer(luxFirst, 'lux', 0, 30000).render(filterMetric(mfFirst, 'lux'));
    if(luxSecond) new ChartRenderer(luxSecond, 'lux', 0, 30000).render(filterMetric(mfSecond, 'lux'));
    if(moistureFirst) new ChartRenderer(moistureFirst, 'moisture', 0, 60).render(filterMetric(mfFirst, 'moisture'));
    if(moistureSecond) new ChartRenderer(moistureSecond, 'moisture', 0, 60).render(filterMetric(mfSecond, 'moisture'));
    if(condFirst) new ChartRenderer(condFirst, 'cond', 0, 2000).render(filterMetric(mfFirst, 'cond'));
    if(condSecond) new ChartRenderer(condSecond, 'cond', 0, 2000).render(filterMetric(mfSecond, 'cond'));
  }

  // Update time labels dynamically based on actual data timestamps (use greenhouse data for timing)
  if (chartData.greenhouse && chartData.greenhouse.length > 0) {
    updateChartTimeLabels(chartData.greenhouse);
  }
}

function updateOutdoorGaugeStatus(temp, humidity, vpd){
  // Get current policy for comparison
  const { name, policy } = getCurrentPolicy();
  const isDay = isDaylight();
  const vpdTol = getVpdTolerance(policy);
  const targetVpd = isDay ? policy.dv : policy.nv;  // Use current VPD (day or night)
  
  // Update outdoor gauge status labels - compare against policy ranges
  const tempInPolicy = temp >= policy.t_min && temp <= policy.t_max;
  const humInPolicy = humidity >= policy.h_min && humidity <= policy.h_max;
  const vpdInPolicy = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  const tempStatus = tempInPolicy ? 'within_policy' : (temp < policy.t_min ? 'below_min' : 'above_max');
  const humStatus = humInPolicy ? 'within_policy' : (humidity < policy.h_min ? 'too_dry' : 'too_humid');
  const vpdStatus = vpdInPolicy ? 'within_policy' : (vpd < targetVpd - vpdTol ? 'too_low' : 'too_high');
  
  const tempEl = q('#gauge-outdoor-temp-status');
  const humEl = q('#gauge-outdoor-hum-status');
  const vpdEl = q('#gauge-outdoor-vpd-status');
  
  // Determine status colors
  const tempClass = tempInPolicy ? 'good' : (Math.abs(temp - policy.t_min) < 3 || Math.abs(temp - policy.t_max) < 3 ? 'warning' : 'critical');
  const humClass = humInPolicy ? 'good' : (Math.abs(humidity - policy.h_min) < 5 || Math.abs(humidity - policy.h_max) < 5 ? 'warning' : 'critical');
  const vpdClass = vpdInPolicy ? 'good' : (Math.abs(vpd - targetVpd) < vpdTol * 1.5 ? 'warning' : 'critical');
  
  if(tempEl) {
    tempEl.textContent = getStatusText(tempStatus);
    tempEl.className = 'gauge-status ' + tempClass;
  }
  if(humEl) {
    humEl.textContent = getStatusText(humStatus);
    humEl.className = 'gauge-status ' + humClass;
  }
  if(vpdEl) {
    vpdEl.textContent = getStatusText(vpdStatus);
    vpdEl.className = 'gauge-status ' + vpdClass;
  }
}

function updateOutdoorAssessmentStatus(temp, humidity, vpd){
  // Update outdoor assessment with status items comparing to current policy
  const display = q('#outdoor-assess-display');
  if(!display) return;
  
  const { name, policy } = getCurrentPolicy();
  const isDay = isDaylight();
  const vpdTol = getVpdTolerance(policy);
  const targetVpd = isDay ? policy.dv : policy.nv;  // Use appropriate VPD target (day or night)
  
  let html = '';
  
  // Assess temperature
  const tempInRange = temp >= policy.t_min && temp <= policy.t_max;
  if(tempInRange) {
    html += '<div class="status-item status-good"><span class="status-icon">🟢</span><span class="status-text">' + getStatusText('temp_optimal') + ' (' + temp.toFixed(1) + '°C)</span></div>';
  } else {
    const distance = Math.min(Math.abs(temp - policy.t_min), Math.abs(temp - policy.t_max));
    const isWarning = distance < 2;
    if(isWarning) {
      html += '<div class="status-item status-warning"><span class="status-icon">🟡</span><span class="status-text">' + getStatusText('temp_caution') + ' (' + temp.toFixed(1) + '°C)</span></div>';
    } else {
      html += '<div class="status-item status-critical"><span class="status-icon">🔴</span><span class="status-text">' + getStatusText('temp_critical') + ' (' + temp.toFixed(1) + '°C)</span></div>';
    }
  }
  
  // Assess humidity
  const humInRange = humidity >= policy.h_min && humidity <= policy.h_max;
  if(humInRange) {
    html += '<div class="status-item status-good"><span class="status-icon">🟢</span><span class="status-text">' + getStatusText('hum_optimal') + ' (' + humidity.toFixed(0) + '%)</span></div>';
  } else {
    const distance = Math.min(Math.abs(humidity - policy.h_min), Math.abs(humidity - policy.h_max));
    const isWarning = distance < 5;
    if(isWarning) {
      html += '<div class="status-item status-warning"><span class="status-icon">🟡</span><span class="status-text">' + getStatusText('hum_caution') + ' (' + humidity.toFixed(0) + '%)</span></div>';
    } else {
      html += '<div class="status-item status-critical"><span class="status-icon">🔴</span><span class="status-text">' + getStatusText('hum_critical') + ' (' + humidity.toFixed(0) + '%)</span></div>';
    }
  }
  
  // Assess VPD with CAM-specific logic
  const vpdInRange = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  let vpdStatusKey = '';
  let vpdClass = '';
  
  if(vpdInRange) {
    vpdClass = 'status-good';
    // Different status based on day/night for CAM plant
    vpdStatusKey = isDay ? 'vpd_day_photo_optimal' : 'vpd_night_co2_optimal';
  } else {
    const distance = Math.abs(vpd - targetVpd);
    const isWarning = distance < vpdTol * 1.5;
    
    if(isDay) {
      // Daytime: stomata closed, using stored acids
      if(vpdClass === '') {
        if(vpd < targetVpd - vpdTol) {
          // Too humid during day = excess moisture risk
          vpdStatusKey = 'vpd_day_excess_moisture';
          vpdClass = isWarning ? 'status-warning' : 'status-critical';
        } else {
          // VPD too high during day = actually good (minimal risk)
          vpdStatusKey = 'vpd_day_photo_optimal';
          vpdClass = 'status-good';
        }
      }
    } else {
      // Nighttime: stomata open for CO2 uptake
      if(vpdClass === '') {
        if(vpd < targetVpd - vpdTol) {
          // Too humid at night = transpiration limited (not ideal for stomatal opening)
          vpdStatusKey = 'vpd_night_trans_limited';
          vpdClass = isWarning ? 'status-warning' : 'status-critical';
        } else {
          // VPD too high at night = CO2 uptake limited (dry air prevents stomata opening)
          vpdStatusKey = 'vpd_night_co2_limited';
          vpdClass = isWarning ? 'status-warning' : 'status-critical';
        }
      }
    }
  }
  
  if(vpdStatusKey) {
    html += '<div class="status-item ' + vpdClass + '"><span class="status-icon">' + (vpdClass === 'status-good' ? '🟢' : (vpdClass === 'status-warning' ? '🟡' : '🔴')) + '</span><span class="status-text">' + getStatusText(vpdStatusKey) + ' (' + vpd.toFixed(2) + ' kPa)</span></div>';
  }
  
  display.innerHTML = html;
}

function updateOutdoorPlantStatus(temp, humidity, vpd){
  // Legacy function - now calls the assessment status update
  updateOutdoorAssessmentStatus(temp, humidity, vpd);
}

function updateComparisonTableOutdoor(temp, humidity, vpd){
  // Get current policy for comparison
  const { name, policy } = getCurrentPolicy();
  const isDay = isDaylight();
  const vpdTol = getVpdTolerance(policy);
  const targetVpd = isDay ? policy.dv : policy.nv;  // Use appropriate VPD target (day or night)
  
  // Update the comparison table with actual outdoor values - compare against policy
  const compTempOutside = q('#comp-temp-outside');
  const compHumOutside = q('#comp-hum-outside');
  const compVpdOutside = q('#comp-vpd-outside');
  
  const tempInPolicy = temp >= policy.t_min && temp <= policy.t_max;
  const humInPolicy = humidity >= policy.h_min && humidity <= policy.h_max;
  const vpdInPolicy = vpd >= (targetVpd - vpdTol) && vpd <= (targetVpd + vpdTol);
  
  if(compTempOutside) {
    const tempStatus = tempInPolicy ? 'good' : (Math.abs(temp - policy.t_min) < 3 || Math.abs(temp - policy.t_max) < 3 ? 'warning' : 'critical');
    const badge = temp < policy.t_min ? '↓' : (temp > policy.t_max ? '↑' : '✓');
    compTempOutside.className = 'comparison-cell outside ' + tempStatus;
    compTempOutside.innerHTML = temp.toFixed(1) + '°C <span class="badge">' + badge + '</span>';
  }
  
  if(compHumOutside) {
    const humStatus = humInPolicy ? 'good' : (Math.abs(humidity - policy.h_min) < 5 || Math.abs(humidity - policy.h_max) < 5 ? 'warning' : 'critical');
    const badge = humidity < policy.h_min ? '↓' : (humidity > policy.h_max ? '↑' : '✓');
    compHumOutside.className = 'comparison-cell outside ' + humStatus;
    compHumOutside.innerHTML = humidity.toFixed(0) + '% <span class="badge">' + badge + '</span>';
  }
  
  if(compVpdOutside) {
    const vpdStatus = vpdInPolicy ? 'good' : (Math.abs(vpd - targetVpd) < vpdTol * 1.5 ? 'warning' : 'critical');
    const badge = vpd < (targetVpd - vpdTol) ? '↓' : (vpd > (targetVpd + vpdTol) ? '↑' : '✓');
    compVpdOutside.className = 'comparison-cell outside ' + vpdStatus;
    compVpdOutside.innerHTML = vpd.toFixed(2) + ' kPa <span class="badge">' + badge + '</span>';
  }
}

function applyFilter(){
  if(!window.__stats || window.__stats.length === 0) return;
  
  const fromInput = q('#from');
  const toInput = q('#to');
  const locationSelect = q('#location-filter');
  const selectedLocation = locationSelect?.value || 'greenhouse';
  
  // REQUIRE date period selection
  if(!fromInput?.value || !toInput?.value) {
    showMessage('❌ Select date period');
    return;
  }
  
  let filtered = window.__stats;
  
  if(fromInput?.value && toInput?.value) {
    const from = new Date(fromInput.value + 'T00:00:00');
    const to = new Date(toInput.value + 'T23:59:59');
    
    // Check if range is more than 2 days
    const diffDays = (to - from) / (1000 * 60 * 60 * 24);
    if(diffDays > 2) {
      showMessage('❌ Maximum 2 days per request. Please select up to 2 days.');
      return;
    }
    
    // Filter data for date range
    filtered = filtered.filter(r => {
      if(!r._date) return false;
      return r._date >= from && r._date <= to;
    });
  }
  
  // Filter by location
  if(selectedLocation !== 'both') {
    filtered = filtered.filter(r => r._values[1] === selectedLocation);
  }
  
  if(filtered.length === 0) {
    showMessage('⚠️ No data available for selected filters');
    return;
  }
  
  renderRows(filtered);
  
  // Update status and charts based on filtered data
  if(filtered.length > 0) {
    const latest = filtered[filtered.length - 1];
    const temp = parseFloat(latest._values[2]);
    const humidity = parseFloat(latest._values[3]);
    const vpd = parseFloat(latest._values[4]);
    updatePlantStatus(temp, humidity, vpd);
    updateGaugeStatus(temp, humidity, vpd);
    updateMetricCards(temp, humidity, vpd);
    updateComparisonTableWithStatus(temp, humidity, vpd);
    
    const chartData = generateChartData(filtered);
    updateChartTimeLabels(chartData);
    updateCharts(chartData);
  }
}

// Update date dynamically in status_updated elements
function updateDynamicDates() {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesPortuguese = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const currentMonth = monthNames[now.getMonth()];
  const currentMonthPT = monthNamesPortuguese[now.getMonth()];
  const currentYear = now.getFullYear();
  
  // Update all status_updated elements
  qAll('.status-updated small[data-i18n="status_updated"]').forEach(el => {
    const lang = window.__site_lang || 'en';
    if (lang === 'pt') {
      el.textContent = `Com Base em Pesquisa: ${currentMonthPT} de ${currentYear}`;
    } else {
      el.textContent = `Based on Research: ${currentMonth} ${currentYear}`;
    }
  });
}

/* ----------------------------- initialization ----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  setupParallax();
  setupDelegatedHandlers();

  // Overlay embedded translations with assets/translations.json (if present).
  // This keeps one "editable" source for recent SEO/content changes.
  loadExternalTranslationsAndApply();

  // Also attach direct listeners to language toggles for reliability
  qAll('.lang-switch [data-lang]').forEach(b => {
    b.addEventListener('click', (ev) => {
      if (b.tagName && String(b.tagName).toLowerCase() === 'a') ev.preventDefault();
      const lang = b.getAttribute('data-lang');
      translatePage(lang);
      // small retries to cover edge cases
      setTimeout(()=> translatePage(lang), 80);
      setTimeout(()=> translatePage(lang), 240);
      updateDynamicDates();
      if(window.__updateStatusesOnLangChange) window.__updateStatusesOnLangChange();
    });
  });

  // Crawlable entrypoint for Portuguese/English without new paths:
  // /page.html?lang=pt
  const urlLang = (() => {
    try{
      const u = new URL(window.location.href);
      const l = (u.searchParams.get('lang') || '').toLowerCase();
      return (l === 'pt' || l === 'en') ? l : null;
    }catch(e){
      return null;
    }
  })();

  const saved = urlLang || localStorage.getItem('site_lang') || 'en';
  if (urlLang) {
    localStorage.setItem('site_lang', urlLang);
    // Keep canonicals clean (avoid duplicate parameter URLs in the address bar).
    try{
      const u = new URL(window.location.href);
      u.searchParams.delete('lang');
      const qs = u.searchParams.toString();
      const clean = u.pathname + (qs ? `?${qs}` : '') + (u.hash || '');
      window.history.replaceState({}, '', clean);
    }catch(e){}
  }

  translatePage(saved);
  updateDynamicDates();

  // apply saved hero height if present (clamp to sensible range)
  const savedHero = localStorage.getItem('hero_height');
  if(savedHero){
    let applied = String(savedHero).trim();
    try{
      if(applied.endsWith('vh')){
        const n = parseFloat(applied);
        const clamped = Math.max(18, Math.min(60, isNaN(n) ? 36 : n));
        applied = clamped + 'vh';
      } else if(applied.endsWith('px')){
        const n = parseFloat(applied);
        const clamped = Math.max(120, Math.min(1200, isNaN(n) ? 360 : n));
        applied = clamped + 'px';
      } else if(!isNaN(parseFloat(applied))){
        // treat bare number as px
        const n = parseFloat(applied);
        const clamped = Math.max(120, Math.min(1200, n));
        applied = clamped + 'px';
      }
    }catch(e){ applied = savedHero; }
    document.documentElement.style.setProperty('--hero-height', applied);
  }

  // retry a few times in case DOM changes occur after load
  let attempts = 0;
  const maxAttempts = 6;
  const retryTimer = setInterval(() => {
    attempts++;
    // always use the freshest language preference so we don't overwrite
    // a user click with the originally saved value
    const current = localStorage.getItem('site_lang') || saved;
    translatePage(current);
    if(attempts >= maxAttempts) clearInterval(retryTimer);
  }, 200);

  // mutation observer to catch dynamic inserts
  const observer = new MutationObserver(mutations => {
    let found = false;
    for(const m of mutations){
      if(m.addedNodes && m.addedNodes.length){
        m.addedNodes.forEach(node => {
          if(node.nodeType === 1 && (node.querySelector && node.querySelector('[data-i18n]') || node.hasAttribute && node.hasAttribute('data-i18n'))) found = true;
        });
      }
    }
    if(found) translatePage(localStorage.getItem('site_lang') || 'en');
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // stats controls
  const applyBtn = q('#apply');
  const resetBtn = q('#reset');
  const locationSelect = q('#location-filter');
  if(applyBtn) applyBtn.addEventListener('click', applyFilter);
  if(locationSelect) locationSelect.addEventListener('change', applyFilter);
  if(resetBtn) resetBtn.addEventListener('click', () => {
    const fromInput = q('#from'); if(fromInput) fromInput.value = '';
    const toInput = q('#to'); if(toInput) toInput.value = '';
    if(locationSelect) locationSelect.value = 'greenhouse';
    if(window.__stats) {
      const greenhouse = window.__stats.filter(r => r._values[1] === 'greenhouse');
      renderRows(greenhouse.slice(-24));
    }
  });
  
  // Update metric cards AFTER initial translation setup completes
  // This ensures the dynamic day/night VPD values aren't overwritten by static translations
  setTimeout(() => {
    updateMetricCardRanges();
    updateChartLabels();
  }, 1300); // Wait for retryTimer to finish (max 1200ms) + buffer
});

// banner removed

// Expose helper to tweak hero height at runtime (value should include units, e.g. '48vh' or '420px')
function setHeroHeight(value){
  if(!value) return;
  document.documentElement.style.setProperty('--hero-height', value);
  localStorage.setItem('hero_height', value);
}

window.setHeroHeight = setHeroHeight;

// Lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
  const galleryImages = document.querySelectorAll('.gallery-image');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.querySelector('.lightbox-image');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  
  let currentIndex = 0;
  const images = Array.from(galleryImages);
  
  function openLightbox(index) {
    currentIndex = index;
    lightboxImage.src = images[currentIndex].src;
    lightboxImage.alt = images[currentIndex].alt;
    lightbox.classList.remove('hidden');
  }
  
  function closeLightbox() {
    lightbox.classList.add('hidden');
  }
  
  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImage.src = images[currentIndex].src;
    lightboxImage.alt = images[currentIndex].alt;
  }
  
  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImage.src = images[currentIndex].src;
    lightboxImage.alt = images[currentIndex].alt;
  }
  
  // Click on gallery images to open lightbox
  galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(index));
  });
  
  // Close lightbox - only if lightbox elements exist
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  
  // Navigation
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', showPrev);
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', showNext);
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'Escape') closeLightbox();
  });
});

// debug utilities removed

