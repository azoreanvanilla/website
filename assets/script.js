// ========== SECURITY & UTILITY FUNCTIONS ==========
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
    hero_title: 'Baunilha dos Açores — São Miguel',
    hero_lead: 'Experimentally cultivating uncommon vanilla in greenhouse conditions on São Miguel island.',
    cta_support: 'Support the Project', cta_visit: 'Plan a Visit',
    project_title: 'Project', project_desc: 'This project explores whether vanilla can thrive in greenhouse conditions on São Miguel Island. We combine small-scale R&D, sustainable off-grid methods, and agrotourism to build a unique product and visitor experience.',
    gallery_title: 'Gallery',
    footer_copy: '© Baunilha dos Açores — São Miguel',
    // About
    about_title: 'From Code to Orchids: Our Story', about_lead: 'We\'re building the future of vanilla cultivation in the Azores—one data point, one experiment, one vine at a time.',
    about_vanilla_core: 'After researching what would work here, I looked for something tropical, rare, edible, compact, high-demand. Vanilla emerged as the answer—a totally uncommon plant for the Azores, yet perfectly suited to controlled greenhouse conditions. While the island\'s winter nights drop to 10°C—too cold for outdoor tropical cultivation—that\'s precisely why greenhouses make sense. We control the environment. Temperature, humidity, light—these become variables we can manage and optimize. What started as a hobby experiment has become something real. Today, we\'re growing over 200 meters of vanilla vines. It\'s taught me that agriculture, like cybersecurity, demands precision—in temperature, humidity, light, pollination timing. The same mindset applies: observe carefully, measure everything, iterate based on what you learn. We\'re not trying to be experts in everything. We\'re just being rigorous about what we do.',
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
    live_conditions_title: 'Target Greenhouse Conditions', metric_temperature: 'Temperature', metric_humidity: 'Humidity', metric_vpd: 'VPD', status_optimal: 'Optimal', status_ideal: 'Ideal', temp_range: '20–30°C', hum_range: '65–85%', vpd_range: '0.8–1.5 kPa',
    plant_status_title: 'Plant Status Indicators', status_growth_phase: 'Optimal Growth Phase', status_transpiration: 'Active Transpiration', status_monitoring: 'Monitoring for Fungi Risk', status_explanation: 'The greenhouse is in an optimal growth window. Current conditions support active nutrient absorption and plant development. VPD is ideal for stomatal function.', status_updated: 'Based on Research: December 2025',
    comparison_title: 'Inside vs. Outside: The Azorean Advantage', comparison_intro: 'The comparison below illustrates why our greenhouse design is a breakthrough for vanilla cultivation in the Azores. Outside, the island\'s temperate climate is beautiful but insufficient for vanilla. Inside, we engineer the tropics.', comp_temperature: 'Temperature', comp_humidity: 'Humidity', comp_vpd: 'VPD', comparison_conclusion: 'Why This Matters: Our greenhouse creates a microclimate that vanilla orchids crave—precision weather engineering. This data validates our competitive edge: we use the Azores\' renewable energy abundance to power climate control that transforms a temperate island into a vanilla paradise.',
    trend_title: '24-Hour Trend: The Daily Rhythm', trend_intro: 'This chart shows the natural oscillations we orchestrate. Notice how temperature dips overnight (we heat to prevent shock) and peaks midday (we ventilate to maintain the ideal range). Humidity follows the inverse: higher when it\'s cooler, managed carefully during warm hours. VPD is our true north—we adjust temperature and humidity in concert to keep VPD in the sweet spot.', chart_note: '[Interactive chart coming soon — showing Temperature (blue), Humidity (green), VPD (orange) over 24 hours]', trend_rhythm: 'This rhythm mirrors the natural day-night cycle that vanilla expects, even though we\'re controlling every variable. That\'s the essence of our technology.',
    metrics_title: 'What the Numbers Mean: Vanilla Orchid Science', card_temp_title: 'Temperature', card_temp_range: '20–30°C (68–86°F)', card_temp_why_title: 'Why It Matters for Vanilla', card_temp_why: 'Vanilla orchids are children of the tropics. They need consistent warmth to trigger growth and flowering. Temperatures below 18°C stall development; above 32°C, the plant enters stress. Our 24.5°C sweet spot accelerates both vegetative growth and the delicate process of flower maturation.', card_temp_growth_title: 'Growth Signal You\'re Watching', card_temp_growth: 'When temperature is stable in the 24–28°C range, vanilla\'s metabolic engines run at peak efficiency. The plant allocates energy to developing the inflorescence (flower spike)—the precursor to our precious vanilla beans.', card_temp_control_title: 'What We Control', card_temp_control_heating: 'Overnight heating (prevents stress from island cool-downs)', card_temp_control_ventilation: 'Daytime ventilation (prevents overheating in summer)', card_temp_control_seasonal: 'Seasonal adjustments (respects flowering cycles)',
    card_hum_title: 'Humidity', card_hum_range: '65–85% (Relative Humidity)', card_hum_why_title: 'Why It Matters for Vanilla', card_hum_why: 'Humidity is the invisible lifeline of vanilla cultivation. At 72% RH, the air holds enough moisture to satisfy the plant\'s aerial roots (yes, vanilla has roots that absorb water and nutrients from humid air!), while remaining dry enough to prevent fungal diseases that plague tropical orchids.', card_hum_balance_title: 'The Balance', card_hum_balance: 'Below 60% RH, the plant desiccates—a death sentence in a greenhouse. Above 90% RH, fungi take over. The 65–85% window is where vanilla orchids achieve the perfect balance of hydration and disease resistance.', card_hum_growth_title: 'Growth Signal You\'re Watching', card_hum_growth: 'When humidity is stable in the ideal range, vanilla\'s aerial roots remain plump and functional. The plant\'s stomata (breathing pores) open confidently, allowing photosynthesis to proceed at full capacity. This is when growth happens fastest.', card_hum_control_title: 'What We Control', card_hum_control_misting: 'Smart misting systems (supplement humidity during dry periods)', card_hum_control_ventilation: 'Ventilation scheduling (release excess moisture to prevent fungal blooms)', card_hum_control_dew: 'Dew point monitoring (ensures condensation forms strategically, not randomly)', card_hum_control_circulation: 'Air circulation (prevents stagnant pockets where fungi thrive)',
    card_vpd_title: 'VPD (Vapor Pressure Deficit)', card_vpd_range: '0.8–1.5 kPa (Kilopascals)', card_vpd_what_title: 'What Is VPD? (The Science Behind the Number)', card_vpd_what: 'VPD is the "comfort zone" metric. It measures the difference between the amount of moisture the air can hold (at current temperature) and the amount it actually holds (current humidity). Think of it as the "thirst" of the air.', card_vpd_matters_title: 'Why It Matters for Vanilla', card_vpd_matters: 'VPD directly controls how aggressively a plant transpires (releases water through leaves and aerial roots).', card_vpd_too_low: 'VPD too low (< 0.6 kPa): The air is so humid that the plant can\'t release water. Roots suffocate. Fungi thrive.', card_vpd_too_high: 'VPD too high (> 2.0 kPa): The air is so dry that the plant desperately transpires to cool itself. The plant loses water faster than roots can absorb it—inducing drought stress.', card_vpd_sweet: 'VPD in the sweet spot (0.8–1.5 kPa): The plant transpires at the perfect rate. Nutrients move through the plant efficiently. Growth is maximized. The plant is neither drowning nor gasping.', card_vpd_growth_title: 'Growth Signal You\'re Watching', card_vpd_growth: 'When VPD is 1.2 kPa, the plant is in "active nutrient uptake mode." The transpiration rate is optimal for moving water and dissolved nutrients from the roots to leaves and flowers. This is when the magic happens—when vanilla accumulates the sugars and compounds that will eventually become the vanilla flavor we prize.', card_vpd_investor_title: 'Why Investors Should Care', card_vpd_investor: 'VPD is the proxy for crop efficiency. At 1.2 kPa, our energy input (fans, misters, heaters) achieves maximum plant output. This is the data point that proves our climate control is not just precise—it\'s economical.', card_vpd_control_title: 'What We Control', card_vpd_control_coordination: 'Temperature-humidity coordination (maintaining ideal VPD even as outdoor conditions swing)', card_vpd_control_monitoring: 'Active transpiration monitoring (our sensors trigger interventions before stress occurs)', card_vpd_control_seasonal: 'Seasonal VPD targets (adjusted for different growth phases)',
    current_label: 'Current:', data_explorer_title: 'Detailed Data Explorer', data_explorer_intro: 'Filter by date range to examine specific periods. Researchers can use this data to validate growth correlations, identify stress events, or study our climate control algorithms in action.', data_tip: 'Tip: A negative Dew Point depression (difference between air temp and dew point) indicates the air is approaching saturation—useful for predicting condensation events.',
    transparency_title: 'A Note on Transparency & Open Science', transparency_intro: 'This data represents our current research on optimal conditions for vanilla cultivation. We\'re documenting what works. We don\'t cherry-pick results. Our approach is grounded in observation and measurement—understanding the precise environmental parameters that allow vanilla to thrive in our greenhouses on São Miguel.', transparency_why: 'Because we believe that transparency accelerates innovation. Researchers can validate our methods. Investors can build confidence through evidence, not marketing. Enthusiasts can truly understand what it takes to grow vanilla in the Azores.', transparency_why_bold: 'Why?', transparency_conclusion: 'We\'re not just growing vanilla. We\'re proving that precision agriculture—powered by careful measurement, environmental control, and continuous learning—is the foundation of specialty farming. And we\'re building the infrastructure to share our knowledge as we scale.', transparency_contact_link: 'Contact us',
    // Old stats
    stats_title: 'Greenhouse Statistics', from_label: 'From', to_label: 'To', apply: 'Apply', reset: 'Reset',
    col_datetime: 'Datetime', col_temp: 'Temperature (°C)', col_hum: 'Humidity (%)', col_vpd: 'VPD (kPa)', col_dew: 'Dew Point (°C)'
  },
  pt: {
    nav_home: 'Início', nav_about: 'Quem Somos', nav_visits: 'Visitas', nav_invest: 'Investimentos', nav_stats: 'Estatísticas', nav_contact: 'Contacto',
    logo: 'Baunilha dos Açores',
    hero_title: 'Baunilha dos Açores — São Miguel',
    hero_lead: 'Cultivo experimental de baunilha em estufa na Ilha de São Miguel.',
    cta_support: 'Apoie o Projeto', cta_visit: 'Agende uma Visita',
    project_title: 'Projeto', project_desc: 'Este projeto explora se a baunilha pode prosperar em condições controladas de estufa na Ilha de São Miguel. Combinamos I&D em pequena escala, métodos sustentáveis off-grid e agroturismo para criar um produto único e uma experiência para visitantes.',
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
    live_conditions_title: 'Condições-Alvo da Estufa', metric_temperature: 'Temperatura', metric_humidity: 'Humidade', metric_vpd: 'VPD', status_optimal: 'Ótimo', status_ideal: 'Ideal', temp_range: '20–30°C', hum_range: '65–85%', vpd_range: '0,8–1,5 kPa',
    plant_status_title: 'Indicadores de Estado da Planta', status_growth_phase: 'Fase de Crescimento Ótima', status_transpiration: 'Transpiração Ativa', status_monitoring: 'Monitorização de Risco de Fungos', status_explanation: 'A estufa está numa janela de crescimento ótima. As condições atuais apoiam a absorção ativa de nutrientes e o desenvolvimento da planta. O VPD é ideal para a função estomatal.', status_updated: 'Com Base em Pesquisa: Dezembro de 2025',
    comparison_title: 'Interior vs. Exterior: A Vantagem Açoriana', comparison_intro: 'A comparação abaixo ilustra por que a nossa conceção de estufa é uma inovação para o cultivo de baunilha nos Açores. No exterior, o clima temperado da ilha é bonito mas insuficiente para a baunilha. No interior, engenhamos os trópicos.', comp_temperature: 'Temperatura', comp_humidity: 'Humidade', comp_vpd: 'VPD', comparison_conclusion: 'Por que isto é Importante: A nossa estufa cria um microclima que as orquídeas de baunilha desejam—engenharia meteorológica de precisão. Estes dados validam a nossa vantagem competitiva: utilizamos a abundância de energia renovável dos Açores para alimentar o controle climático que transforma uma ilha temperada num paraíso de baunilha.',
    trend_title: 'Tendência de 24 Horas: O Ritmo Diário', trend_intro: 'Este gráfico mostra as oscilações naturais que orquestamos. Reparem como a temperatura desce durante a noite (aquecemos para evitar choque) e atinge o pico ao meio-dia (ventilamos para manter o intervalo ideal). A humidade segue o inverso: mais alta quando está mais frio, controlada cuidadosamente durante as horas quentes. O VPD é a nossa bússola verdadeira—ajustamos a temperatura e a humidade em conjunto para manter o VPD no ponto ideal.', chart_note: '[Gráfico interativo em breve — mostrando Temperatura (azul), Humidade (verde), VPD (laranja) em 24 horas]', trend_rhythm: 'Este ritmo espelha o ciclo dia-noite natural que a baunilha espera, mesmo que estejamos a controlar cada variável. Esta é a essência da nossa tecnologia.',
    metrics_title: 'O Que os Números Significam: Ciência das Orquídeas de Baunilha', card_temp_title: 'Temperatura', card_temp_range: '20–30°C (68–86°F)', card_temp_why_title: 'Por que é Importante para a Baunilha', card_temp_why: 'As orquídeas de baunilha são filhas dos trópicos. Precisam de calor consistente para desencadear o crescimento e a floração. Temperaturas abaixo de 18°C atrasam o desenvolvimento; acima de 32°C, a planta entra em estresse. O nosso ponto ideal de 24,5°C acelera tanto o crescimento vegetativo quanto o processo delicado de maturação da flor.', card_temp_growth_title: 'Sinal de Crescimento que Estão a Observar', card_temp_growth: 'Quando a temperatura é estável na faixa de 24–28°C, os motores metabólicos da baunilha funcionam com eficiência máxima. A planta aloca energia para desenvolver a inflorescência (espiga de flor)—o precursor das nossas preciosas vagens de baunilha.', card_temp_control_title: 'O que Controlamos', card_temp_control_heating: 'Aquecimento noturno (evita estresse do resfriamento noturno dos Açores)', card_temp_control_ventilation: 'Ventilação diurna (evita superaquecimento no verão)', card_temp_control_seasonal: 'Ajustes sazonais (respeita ciclos de floração)',
    card_hum_title: 'Humidade', card_hum_range: '65–85% (Humidade Relativa)', card_hum_why_title: 'Por que é Importante para a Baunilha', card_hum_why: 'A humidade é a linha de vida invisível do cultivo de baunilha. Em 72% HR, o ar contém humidade suficiente para satisfazer as raízes aéreas da planta (sim, a baunilha tem raízes que absorvem água e nutrientes do ar húmido!), enquanto permanece seco o suficiente para prevenir doenças fúngicas que afligem as orquídeas tropicais.', card_hum_balance_title: 'O Equilíbrio', card_hum_balance: 'Abaixo de 60% HR, a planta desidrata—uma sentença de morte numa estufa. Acima de 90% HR, os fungos assumem o controle. A janela de 65–85% é onde as orquídeas de baunilha alcançam o equilíbrio perfeito entre hidratação e resistência a doenças.', card_hum_growth_title: 'Sinal de Crescimento que Estão a Observar', card_hum_growth: 'Quando a humidade é estável na faixa ideal, as raízes aéreas da baunilha permanecem túrgidas e funcionais. Os estômatos da planta (poros respiratórios) abrem confiantemente, permitindo que a fotossíntese prossiga com capacidade total. É quando o crescimento acontece mais rapidamente.', card_hum_control_title: 'O que Controlamos', card_hum_control_misting: 'Sistemas de nebulização inteligentes (complementam a humidade durante períodos secos)', card_hum_control_ventilation: 'Agendamento de ventilação (libertam humidade excessiva para prevenir proliferação de fungos)', card_hum_control_dew: 'Monitorização do ponto de orvalho (garante que a condensação se forme estrategicamente)', card_hum_control_circulation: 'Circulação de ar (evita bolsas estagnadas onde fungos prosperam)',
    card_vpd_title: 'VPD (Déficit de Pressão de Vapor)', card_vpd_range: '0,8–1,5 kPa (Quilopascais)', card_vpd_what_title: 'O Que é VPD? (A Ciência Por Trás do Número)', card_vpd_what: 'VPD é a métrica da "zona de conforto". Mede a diferença entre a quantidade de humidade que o ar pode conter (na temperatura atual) e a quantidade que realmente contém (humidade atual). Pense nisso como a "sede" do ar.', card_vpd_matters_title: 'Por que é Importante para a Baunilha', card_vpd_matters: 'VPD controla diretamente quão agressivamente uma planta transpira (liberta água através das folhas e raízes aéreas).', card_vpd_too_low: 'VPD muito baixo (< 0,6 kPa): O ar é tão húmido que a planta não consegue libertar água. As raízes sufocam. Os fungos prosperam.', card_vpd_too_high: 'VPD muito alto (> 2,0 kPa): O ar é tão seco que a planta transpira desesperadamente para se arrefecer. A planta perde água mais rápido do que as raízes conseguem absorver—induzindo estresse de seca.', card_vpd_sweet: 'VPD no ponto ideal (0,8–1,5 kPa): A planta transpira na taxa perfeita. Os nutrientes movem-se através da planta com eficiência. O crescimento é maximizado. A planta não está nem a afogar-se nem a ofegar.', card_vpd_growth_title: 'Sinal de Crescimento que Estão a Observar', card_vpd_growth: 'Quando o VPD é 1,2 kPa, a planta está em "modo de absorção ativa de nutrientes." A taxa de transpiração é ideal para mover água e nutrientes dissolvidos das raízes para folhas e flores. É quando a magia acontece—quando a baunilha acumula os açúcares e compostos que eventualmente se tornarão o sabor de baunilha que valorizamos.', card_vpd_investor_title: 'Por que os Investidores Devem se Importar', card_vpd_investor: 'VPD é o proxy para eficiência de colheita. Em 1,2 kPa, a nossa entrada de energia (ventiladores, nebulizadores, aquecedores) alcança rendimento máximo da planta. Este é o ponto de dados que prova que o nosso controle climático não é apenas preciso—é económico.', card_vpd_control_title: 'O que Controlamos', card_vpd_control_coordination: 'Coordenação temperatura-humidade (mantendo VPD ideal mesmo quando as condições externas variam)', card_vpd_control_monitoring: 'Monitorização de transpiração ativa (os nossos sensores disparam intervenções antes que o estresse ocorra)', card_vpd_control_seasonal: 'Metas VPD sazonais (ajustadas para diferentes fases de crescimento)',
    current_label: 'Atual:', data_explorer_title: 'Explorador de Dados Detalhados', data_explorer_intro: 'Filtrem por intervalo de datas para examinar períodos específicos. Pesquisadores podem usar estes dados para validar correlações de crescimento, identificar eventos de estresse ou estudar os nossos algoritmos de controle climático em ação.', data_tip: 'Dica: Uma depressão de ponto de orvalho negativa (diferença entre temp. do ar e ponto de orvalho) indica que o ar está a aproximar-se da saturação—útil para prever eventos de condensação.',
    transparency_title: 'Uma Nota sobre Transparência & Ciência Aberta', transparency_intro: 'Estes dados representam a nossa pesquisa atual sobre condições ótimas para o cultivo de baunilha. Estamos a documentar o que funciona. Não escolhemos seletivamente resultados. A nossa abordagem é baseada em observação e medição—compreendendo os parâmetros ambientais precisos que permitem à baunilha prosperar nas nossas estufas em São Miguel.', transparency_why: 'Porque acreditamos que a transparência acelera a inovação. Os pesquisadores podem validar os nossos métodos. Os investidores podem construir confiança através de evidências, não de marketing. Os entusiastas podem realmente compreender o que é necessário para cultivar baunilha nos Açores.', transparency_why_bold: 'Por quê?', transparency_conclusion: 'Não estamos apenas a cultivar baunilha. Estamos a provar que a agricultura de precisão—alimentada por medição cuidadosa, controle ambiental e aprendizagem contínua—é a base da agricultura de especialidade. E estamos a construir a infraestrutura para compartilhar o nosso conhecimento conforme escalamos.', transparency_contact_link: 'Entre em contacto',
    // Old stats
    stats_title: 'Estatísticas da Estufa', from_label: 'De', to_label: 'Até', apply: 'Aplicar', reset: 'Limpar',
    col_datetime: 'DataHora', col_temp: 'Temperatura (°C)', col_hum: 'Humidade (%)', col_vpd: 'VPD (kPa)', col_dew: 'Ponto de Orvalho (°C)'
  }
};

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
  const map = TRANSLATIONS[lang] || TRANSLATIONS.en;
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
  qAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  localStorage.setItem('site_lang', lang);
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
    const langBtn = e.target.closest && e.target.closest('.lang-switch button');
    if(langBtn){
      const lang = langBtn.getAttribute('data-lang');
      translatePage(lang);
      // ensure terms display is updated even if DOM is modified
      setTimeout(() => translatePage(lang), 80);
      setTimeout(() => translatePage(lang), 240);
      return;
    }
    const mt = e.target.closest && e.target.closest('.menu-toggle');
    if(mt) qAll('.nav').forEach(navEl => navEl.classList.toggle('open'));
  });
}

/* ----------------------------- stats ----------------------------- */
function parseDate(dateStr){
  const parts = dateStr.trim().split(' ');
  if(parts.length < 3) return null;
  
  const [month, day, year] = parts[0].split('-');
  const [hours, minutes, seconds] = parts[1].split(':');
  const ampm = parts[2];
  
  let h = parseInt(hours);
  const m = parseInt(minutes);
  const s = parseInt(seconds);
  
  if(ampm.toLowerCase() === 'p.m.' && h !== 12) h += 12;
  if(ampm.toLowerCase() === 'a.m.' && h === 12) h = 0;
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, m, s);
}

function parseCSV(csvText){
  csvText = csvText.replace(/\0/g, '');
  const lines = csvText.trim().split('\n');
  if(lines.length < 2) return [];
  
  const data = [];
  for(let i = 1; i < lines.length; i++){
    if(!lines[i].trim()) continue;
    const values = lines[i].split('\t');
    if(values.length < 5) continue;
    
    data.push({
      _values: values,
      _date: parseDate(values[0])
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
    tr.innerHTML = `<td>${row._values[0]}</td><td>${row._values[1]}</td><td>${row._values[2]}</td><td>${row._values[4]}</td><td>${row._values[3]}</td>`;
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

async function loadStats(){
  try{
    const res = await fetch('data/stats.csv');
    const csvText = await res.text();
    const data = parseCSV(csvText);
    window.__stats = data;
    
    // Show last 48 hours (24 rows at 5-min intervals)
    const last24h = data.slice(-24);
    renderRows(last24h);
    
    // Update dashboard with latest data
    if(data.length > 0) {
      const latest = data[data.length - 1];
      const temp = parseFloat(latest._values[1]);
      const humidity = parseFloat(latest._values[2]);
      const vpd = parseFloat(latest._values[4]);
      
      // Update live conditions
      const tempEl = q('#live-temp');
      const humEl = q('#live-hum');
      const vpdEl = q('#live-vpd');
      
      if(tempEl) tempEl.textContent = temp.toFixed(1);
      if(humEl) humEl.textContent = humidity.toFixed(0);
      if(vpdEl) vpdEl.textContent = vpd.toFixed(2);
      
      // Update comparison table and plant status with latest data
      updateComparisonTableWithStatus(temp, humidity, vpd);
      updatePlantStatus(temp, humidity, vpd);
      updateGaugeStatus(temp, humidity, vpd);
      updateMetricCards(temp, humidity, vpd);
      
      // Update charts with last 24 rows
      const chartData = generateChartData(data);
      updateCharts(chartData);
    }
  }catch(e){ 
    console.error('Error loading stats:', e); 
  }
}

function updateComparisonTableWithStatus(temp, humidity, vpd){
  // Determine status and arrow/checkmark based on optimal ranges
  // Temperature: optimal 24-28°C
  const tempStatus = temp >= 24 && temp <= 28 ? 'good' : (temp < 20 || temp > 32 ? 'critical' : 'warning');
  const tempMark = temp >= 24 && temp <= 28 ? '✓' : (temp < 24 ? '↓' : '↑');
  
  // Humidity: optimal 65-85%
  const humStatus = humidity >= 65 && humidity <= 85 ? 'good' : (humidity < 60 || humidity >= 90 ? 'critical' : 'warning');
  const humMark = humidity >= 65 && humidity <= 85 ? '✓' : (humidity < 65 ? '↓' : '↑');
  
  // VPD: optimal 0.8-1.5 kPa
  const vpdStatus = vpd >= 0.8 && vpd <= 1.5 ? 'good' : (vpd < 0.5 || vpd >= 2.0 ? 'critical' : 'warning');
  const vpdMark = vpd >= 0.8 && vpd <= 1.5 ? '✓' : (vpd < 0.8 ? '↓' : '↑');
  
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
  const optimalTemp = temp >= 24 && temp <= 28;
  const optimalHum = humidity >= 65 && humidity <= 85;
  const optimalVpd = vpd >= 0.8 && vpd <= 1.5;
  
  let growthStatus = optimalTemp ? 'good' : (temp < 20 || temp > 32 ? 'critical' : 'warning');
  
  // Transpiration requires both humidity AND VPD to be optimal
  let transpirationStatus = 'good';
  if(!optimalHum || !optimalVpd) {
    if((humidity < 60 || humidity > 90) || (vpd < 0.5 || vpd > 2.0)) {
      transpirationStatus = 'critical';
    } else {
      transpirationStatus = 'warning';
    }
  }
  
  let fungusRisk = humidity > 85 && temp > 25 ? 'critical' : (humidity > 80 ? 'warning' : 'good');
  
  return { growthStatus, transpirationStatus, fungusRisk };
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
  }
  if(items[1]) {
    items[1].className = 'status-item ' + getStatusClass(s.transpirationStatus);
    const icon = items[1].querySelector('.status-icon');
    if(icon) icon.textContent = getStatusIcon(s.transpirationStatus);
  }
  if(items[2]) {
    items[2].className = 'status-item ' + getStatusClass(s.fungusRisk);
    const icon = items[2].querySelector('.status-icon');
    if(icon) icon.textContent = getStatusIcon(s.fungusRisk);
  }
}

function updateGaugeStatus(temp, humidity, vpd){
  // Update gauge status labels based on actual values
  const tempStatus = temp >= 24 && temp <= 28 ? 'Optimal' : (temp < 20 || temp > 32 ? 'Critical' : 'Caution');
  const humStatus = humidity >= 65 && humidity <= 85 ? 'Optimal' : (humidity < 60 || humidity >= 90 ? 'Critical' : 'Caution');
  const vpdStatus = vpd >= 0.8 && vpd <= 1.5 ? 'Ideal' : (vpd < 0.5 || vpd >= 2.0 ? 'Critical' : 'Caution');
  
  const tempEl = q('#gauge-temp-status');
  const humEl = q('#gauge-hum-status');
  const vpdEl = q('#gauge-vpd-status');
  
  // Determine status colors
  const tempClass = temp >= 24 && temp <= 28 ? 'good' : (temp < 20 || temp > 32 ? 'critical' : 'warning');
  const humClass = humidity >= 65 && humidity <= 85 ? 'good' : (humidity < 60 || humidity >= 90 ? 'critical' : 'warning');
  const vpdClass = vpd >= 0.8 && vpd <= 1.5 ? 'good' : (vpd < 0.5 || vpd >= 2.0 ? 'critical' : 'warning');
  
  if(tempEl) {
    tempEl.textContent = tempStatus;
    tempEl.className = 'gauge-status ' + tempClass;
  }
  if(humEl) {
    humEl.textContent = humStatus;
    humEl.className = 'gauge-status ' + humClass;
  }
  if(vpdEl) {
    vpdEl.textContent = vpdStatus;
    vpdEl.className = 'gauge-status ' + vpdClass;
  }
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

function generateChartData(dataRows){
  const last24 = dataRows.slice(-24);
  return last24.map(row => ({
    temp: parseFloat(row._values[1]),
    humidity: parseFloat(row._values[2]),
    vpd: parseFloat(row._values[4])
  }));
}

function updateCharts(chartData){
  if(!chartData || chartData.length < 2) return;
  
  const charts = qAll('svg.metric-chart');
  if(charts.length < 3) return;
  
  // Temperature chart
  const tempPoly = charts[0].querySelector('polyline');
  if(tempPoly) {
    let points = '';
    const minT = 14, maxT = 32;
    chartData.forEach((d, i) => {
      const x = 40 + (i / (chartData.length - 1)) * 820;
      const y = 230 - ((d.temp - minT) / (maxT - minT)) * 200;
      points += x + ',' + y + ' ';
    });
    tempPoly.setAttribute('points', points);
  }
  
  // Humidity chart
  const humPoly = charts[1].querySelector('polyline');
  if(humPoly) {
    let points = '';
    const minH = 50, maxH = 95;
    chartData.forEach((d, i) => {
      const x = 40 + (i / (chartData.length - 1)) * 820;
      const y = 230 - ((d.humidity - minH) / (maxH - minH)) * 200;
      points += x + ',' + y + ' ';
    });
    humPoly.setAttribute('points', points);
  }
  
  // VPD chart
  const vpdPoly = charts[2].querySelector('polyline');
  if(vpdPoly) {
    let points = '';
    const minV = 0, maxV = 2.5;
    chartData.forEach((d, i) => {
      const x = 40 + (i / (chartData.length - 1)) * 820;
      const y = 200 - ((d.vpd - minV) / (maxV - minV)) * 180;
      points += x + ',' + y + ' ';
    });
    vpdPoly.setAttribute('points', points);
  }
}

function applyFilter(){
  if(!window.__stats || window.__stats.length === 0) return;
  
  const fromInput = q('#from');
  const toInput = q('#to');
  
  if(!fromInput?.value || !toInput?.value) {
    showMessage('Please select both from and to dates');
    return;
  }
  
  const from = new Date(fromInput.value + 'T00:00:00');
  const to = new Date(toInput.value + 'T23:59:59');
  
  // Check if range is more than 2 days
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  if(diffDays > 2) {
    showMessage('❌ Maximum 2 days per request. Please select up to 2 days.');
    return;
  }
  
  // Filter data for date range
  const filtered = window.__stats.filter(r => {
    if(!r._date) return false;
    return r._date >= from && r._date <= to;
  });
  
  if(filtered.length === 0) {
    showMessage('⚠️ No data available for selected dates');
    return;
  }
  
  renderRows(filtered);
  
  // Update status and charts based on filtered data
  if(filtered.length > 0) {
    const latest = filtered[filtered.length - 1];
    const temp = parseFloat(latest._values[1]);
    const humidity = parseFloat(latest._values[2]);
    const vpd = parseFloat(latest._values[4]);
    updatePlantStatus(temp, humidity, vpd);
    updateGaugeStatus(temp, humidity, vpd);
    updateMetricCards(temp, humidity, vpd);
    updateComparisonTableWithStatus(temp, humidity, vpd);
    
    const chartData = generateChartData(filtered);
    updateCharts(chartData);
  }
}

/* ----------------------------- initialization ----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  setupParallax();
  setupDelegatedHandlers();

  // Also attach direct listeners to language buttons for reliability
  qAll('.lang-switch button').forEach(b => {
    b.addEventListener('click', (ev) => {
      const lang = b.getAttribute('data-lang');
      translatePage(lang);
      // small retries to cover edge cases
      setTimeout(()=> translatePage(lang), 80);
      setTimeout(()=> translatePage(lang), 240);
    });
  });

  const saved = localStorage.getItem('site_lang') || 'en';
  translatePage(saved);

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
  if(applyBtn) applyBtn.addEventListener('click', applyFilter);
  if(resetBtn) resetBtn.addEventListener('click', () => {
    const fromInput = q('#from'); if(fromInput) fromInput.value = '';
    const toInput = q('#to'); if(toInput) toInput.value = '';
    if(window.__stats) renderRows(window.__stats.slice(-24));
  });

  loadStats();
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
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'Escape') closeLightbox();
  });
});

// debug utilities removed

