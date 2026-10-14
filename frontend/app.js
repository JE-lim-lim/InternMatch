const API_BASE = '';
let jobsCache = [];
let selected = {};
let matchSelectedJob = null;
const FILTERS = {
    'Internship Field': [
        'Accounting',
        'Business',
        'Data Science',
        'Design',
        'Engineering',
        'Marketing',
        'Psychology',
        'Software / IT',
        'Human Resources & Recruitment',
        'Supply Chain & Logistics',
        'Customer Service & Customer Experience',
        'Cybersecurity',
        'Legal & Compliance',
        'Hospitality & Tourism',
        'Education & Training',
        'Procurement & Vendor Management'
    ],
    'Location': [
        'Kuala Lumpur',
        'Selangor',
        'Penang',
        'Johor',
        'Remote'
    ],
    'Work Mode': [
        'On-site',
        'Hybrid',
        'Remote'
    ],
    'Internship Duration': [
        '2-3 Months',
        '4-6 Months',
        '6+ Months'
    ],
    'Allowance': [
        'Any',
        'RM500+',
        'RM800+',
        'RM1000+',
        'RM1500+'
    ]
};
const CAREERS = [
    {
        icon: '$',
        title: 'Accountant / Auditor',
        field: 'Accounting',
        desc: 'Prepare, review and interpret financial records while supporting reporting, audit and compliance work.',
        skills: [
            'Accounting',
            'Excel',
            'Audit',
            'Financial Reporting'
        ],
        path: 'Intern → Junior Accountant / Audit Associate → Accountant / Auditor → Senior / Manager',
        roles: 'Accounting Intern · Audit Intern · Tax Intern'
    },
    {
        icon: '▤',
        title: 'Business Analyst',
        field: 'Business',
        desc: 'Study business needs, processes and data to recommend practical improvements and support decisions.',
        skills: [
            'Excel',
            'Business Analysis',
            'Communication',
            'PowerPoint'
        ],
        path: 'Intern → Junior BA → Business Analyst → Senior BA',
        roles: 'Business Analyst Intern · Operations Intern · Consulting Intern'
    },
    {
        icon: '▥',
        title: 'Data Analyst',
        field: 'Data Science',
        desc: 'Turn raw data into useful insights that support business decisions and performance tracking.',
        skills: [
            'SQL',
            'Excel',
            'Python',
            'Power BI'
        ],
        path: 'Intern → Junior Data Analyst → Data Analyst → Senior Analyst',
        roles: 'Data Analyst Intern · BI Intern · Data Science Intern'
    },
    {
        icon: '◇',
        title: 'UI/UX Designer',
        field: 'Design',
        desc: 'Research user needs and design clear, usable digital experiences for websites and applications.',
        skills: [
            'Figma',
            'Prototyping',
            'UX Research',
            'UI Design'
        ],
        path: 'Intern → Junior Designer → UI/UX Designer → Senior Designer',
        roles: 'UI/UX Intern · Product Design Intern · Digital Design Intern'
    },
    {
        icon: '⚙',
        title: 'Engineer',
        field: 'Engineering',
        desc: 'Apply technical and analytical knowledge to design, test, improve and support engineering systems or projects.',
        skills: [
            'Engineering',
            'Data Analysis',
            'Excel',
            'Technical Documentation'
        ],
        path: 'Intern → Graduate Engineer → Engineer → Senior Engineer',
        roles: 'Engineering Intern · Process Intern · Test Engineering Intern'
    },
    {
        icon: '↗',
        title: 'Digital Marketer',
        field: 'Marketing',
        desc: 'Plan digital campaigns, content and channel strategies to reach audiences and grow engagement.',
        skills: [
            'Marketing',
            'Social Media',
            'Content Creation',
            'Communication'
        ],
        path: 'Intern → Marketing Executive → Digital Marketer → Marketing Lead',
        roles: 'Marketing Intern · Content Intern · Brand Intern'
    },
    {
        icon: '◎',
        title: 'Psychology / People Specialist',
        field: 'Psychology',
        desc: 'Use behavioural understanding, research and communication to support wellbeing, people or human-centred programmes.',
        skills: [
            'Psychology',
            'Research',
            'Communication',
            'Human Resources'
        ],
        path: 'Intern → People / Research Assistant → Specialist → Senior Specialist',
        roles: 'Psychology Intern · People & Culture Intern · Research Assistant Intern'
    },
    {
        icon: '&lt;/&gt;',
        title: 'Software Engineer',
        field: 'Software / IT',
        desc: 'Design, build, test and maintain software applications and digital systems.',
        skills: [
            'Programming',
            'Git',
            'SQL',
            'Problem Solving'
        ],
        path: 'Intern → Junior Software Engineer → Software Engineer → Senior Engineer',
        roles: 'Software Engineer Intern · Developer Intern · Technology Intern'
    }
,
    {icon: "♧", title: "Human Resources Specialist", field: "Human Resources & Recruitment", desc: "Help teams recruit, onboard and support employees, organise personnel records, and improve the employee experience.", skills: ["Recruitment", "Communication", "Excel", "HR Operations"], path: "HR Intern → HR Executive → HR Specialist → HR Business Partner / HR Manager", roles: "HR Intern · Talent Acquisition Intern · Recruitment Intern"},
    {icon: "⇄", title: "Supply Chain Analyst", field: "Supply Chain & Logistics", desc: "Coordinate procurement, inventory and delivery processes to help goods move efficiently across the supply chain.", skills: ["Excel", "Inventory Management", "Logistics", "Data Analysis"], path: "Supply Chain Intern → Logistics Coordinator → Supply Chain Analyst → Supply Chain Manager", roles: "Supply Chain Intern · Logistics Intern · Warehouse Operations Intern"},
    {icon: "♡", title: "Customer Experience Specialist", field: "Customer Service & Customer Experience", desc: "Understand customer needs, resolve enquiries, and use feedback to improve services and customer journeys.", skills: ["Customer Service", "Communication", "CRM", "Problem Solving"], path: "Customer Service Intern → Customer Support Executive → CX Specialist → CX Manager", roles: "Customer Experience Intern · Customer Support Intern · Client Services Intern"},
    {icon: "⬡", title: "Cybersecurity Analyst", field: "Cybersecurity", desc: "Help protect software, systems and data by identifying risks, monitoring alerts and improving security practices.", skills: ["Networking", "Cybersecurity", "Python", "Risk Assessment"], path: "Security Intern → Junior SOC Analyst → Cybersecurity Analyst → Security Engineer", roles: "Cybersecurity Intern · Security Operations Intern · IT Risk Intern"},
    {icon: "⚖", title: "Compliance Analyst", field: "Legal & Compliance", desc: "Research regulations, maintain compliance documentation and assist teams with risk and legal processes.", skills: ["Research", "Compliance", "Documentation", "Attention to Detail"], path: "Legal / Compliance Intern → Compliance Executive → Compliance Analyst → Compliance Manager", roles: "Legal Intern · Compliance Intern · Risk Intern"},
    {icon: "✈", title: "Hospitality & Tourism Coordinator", field: "Hospitality & Tourism", desc: "Support hotel, travel and guest services operations to create positive visitor experiences.", skills: ["Customer Service", "Event Planning", "Communication", "Hospitality"], path: "Hospitality Intern → Operations Executive → Guest Experience Supervisor → Manager", roles: "Hotel Operations Intern · Tourism Marketing Intern · Travel Operations Intern"},
    {icon: "✎", title: "Learning & Development Specialist", field: "Education & Training", desc: "Support lesson materials, learner activities, training coordination and assessment of learning outcomes.", skills: ["Training", "Communication", "Presentation", "Content Development"], path: "Education / Training Intern → Training Coordinator → L&D Executive → L&D Manager", roles: "Teaching Intern · Learning & Development Intern · Training Coordinator Intern"},
    {icon: "▣", title: "Procurement Specialist", field: "Procurement & Vendor Management", desc: "Support sourcing, vendor communication, quotation comparisons, purchase records and supplier performance tracking.", skills: ["Procurement", "Excel", "Negotiation", "Vendor Management"], path: "Procurement Intern → Purchasing Executive → Procurement Specialist → Procurement Manager", roles: "Procurement Intern · Purchasing Intern · Supplier Management Intern"}
];
function getJSON(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
    }
    catch {
        return fallback;
    }
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

function safeExternalURL(value) {
    const candidate = String(value ?? '').trim();
    return /^https?:\/\//i.test(candidate) ? candidate : '';
}


function user() {
    return getJSON('im_user', null);
}

function account() {
    return getJSON('im_account', null);
}

function initials(name = 'User') {
    return name.trim().split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

function logoImg(j, cls = 'company-logo-img') {
    const company = String(j.company || 'Company');
    const words = company.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    const mark = words.slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CO';
    const local = /^assets\/company_logos\/[a-z0-9-]+\.svg$/i.test(String(j.logo || '')) ? String(j.logo) : '';
    // Restore the real company image before the older text-only placeholder SVG.
    // Curated vector sources are hosted by Wikimedia Commons; other listings use
    // their original V2 image URL. The fallback is shown only if the image fails.
    const remote = safeExternalURL(j.logo_url);
    const src = remote || local;
    const initials = `<span class="company-logo-initials" aria-hidden="true">${escapeHTML(mark)}</span>`;
    if (!src) return `<div class="company-logo company-logo-placeholder" aria-label="${escapeHTML(company)} identifier">${initials}</div>`;
    return `<div class="company-logo" aria-label="${escapeHTML(company)} logo"><img class="${escapeHTML(cls)}" src="${escapeHTML(src)}" alt="${escapeHTML(company)} logo" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.hidden=true;this.parentElement.classList.add('company-logo-failed')">${initials}</div>`;
}

function navDisplayButton() {
    return `<button class="display-settings-trigger" id="displaySettingsTrigger" type="button" aria-label="Display settings" aria-haspopup="dialog" aria-expanded="false" title="Display settings"><span aria-hidden="true">Aa</span><span class="display-settings-label">Display</span></button>`;
}

function navLogoutButton() {
    return '<button type="button" class="btn btn-primary" id="employerSharedLogout">Log out</button>';
}

function setSharedNavLinks(nav, isEmployer) {
    if (!nav) return;
    const links = [
        ['jobs', 'jobs.html', 'Job Search'],
        ['match', 'match.html', 'AI Job Match'],
        ['career', 'career.html', 'Career Info'],
        ['tools', 'career-tools.html', 'Career Toolkit'],
        ['employer-dashboard', 'employer-dashboard.html', 'Employer Dashboard']
    ];
    // Reconcile existing anchors by destination as well as data-nav.
    // Older dashboard pages omitted data-nav, which caused five originals
    // plus four extra duplicate links to appear after JS initialization.
    const canonical = new Map();
    for (const [key, url, label] of links) {
        const candidates = [...nav.querySelectorAll('a')].filter(a => {
            const path = (a.getAttribute('href') || '').split(/[?#]/)[0].replace(/^\.\//, '');
            return a.dataset.nav === key || path === url;
        });
        let anchor = candidates[0];
        if (!anchor) {
            anchor = document.createElement('a');
            nav.appendChild(anchor);
        }
        anchor.dataset.nav = key;
        anchor.href = url;
        anchor.textContent = label;
        anchor.classList.toggle('employer-dashboard-nav', key === 'employer-dashboard');
        for (const duplicate of candidates.slice(1)) duplicate.remove();
        const active = key === document.body.dataset.page;
        anchor.classList.toggle('active', active);
        if (active) anchor.setAttribute('aria-current', 'page');
        else anchor.removeAttribute('aria-current');
        canonical.set(key, anchor);
    }
    // Ensure exact order and discard any leftover duplicate/legacy links.
    nav.replaceChildren(...links.map(([key]) => canonical.get(key)));
}

function rememberedEmployerNav() {
    // Session-scoped hint only; the backend remains authoritative for access control.
    try { return sessionStorage.getItem('im_employer_nav_hint') === '1'; }
    catch (_) { return false; }
}
function rememberEmployerNav(isEmployer) {
    try { sessionStorage.setItem('im_employer_nav_hint', isEmployer ? '1' : '0'); }
    catch (_) { /* Browsing without session storage still works. */ }
}

function paintNav(employer, dashboard, authPage) {
    const header = document.querySelector('.site-header');
    const nav = header?.querySelector('.main-nav');
    const actions = document.getElementById('authNav');
    document.body.classList.toggle('employer-browsing', employer);
    document.documentElement.classList.toggle('im-employer-nav', employer);
    header?.classList.toggle('employer-site-nav', employer);
    setSharedNavLinks(nav, employer);
    if (!actions) return;
    const displayButton = navDisplayButton();
    if (dashboard || authPage) actions.innerHTML = displayButton;
    else if (employer) actions.innerHTML = displayButton + navLogoutButton();
    else {
        const u = user();
        actions.innerHTML = displayButton + (u
            ? `<a class="user-btn" href="profile.html" aria-label="My Profile" title="My Profile"></a>`
            : `<a class="btn btn-outline" href="auth-choice.html?mode=login">Login</a><a class="btn btn-primary" href="auth-choice.html?mode=signup">Sign Up</a>`);
    }
    initDisplaySettings();
    document.getElementById('employerSharedLogout')?.addEventListener('click', async () => {
        try { await fetch('/api/employer/logout', {method:'POST', credentials:'same-origin'}); } catch (_) {}
        rememberEmployerNav(false);
        location.href = 'index.html';
    });
}

async function initNav() {
    const page = document.body.dataset.page;
    const dashboard = page === 'employer-dashboard';
    const authPage = ['auth-choice', 'employer-auth'].includes(page);
    // Render synchronously, so the header does not disappear while waiting for an API.
    const cachedRole = dashboard || (!authPage && rememberedEmployerNav());
    paintNav(cachedRole, dashboard, authPage);
    document.documentElement.classList.remove('im-nav-pending');
    if (dashboard || authPage || !document.querySelector('.site-header .main-nav')) return;
    try {
        const response = await fetch('/api/employer/session-status', {credentials:'same-origin', cache:'no-store'});
        if (!response.ok) return; // A transient failure must not cause navbar flicker.
        const status = await response.json();
        const verifiedEmployer = !!status.authenticated;
        rememberEmployerNav(verifiedEmployer);
        if (verifiedEmployer !== cachedRole) paintNav(verifiedEmployer, false, false);
    } catch (_) { /* Keep stable layout during temporary network errors. */ }
}

const DEFAULT_DISPLAY_PREFERENCES = {
    fontSize: 'default',
    theme: 'light',
    density: 'comfortable'
};

function readDisplayPreferences() {
    const stored = getJSON('im_display_preferences', {});
    const allowed = {
        fontSize: ['small', 'default', 'large'],
        theme: ['light', 'dark'],
        density: ['comfortable', 'compact']
    };
    const result = { ...DEFAULT_DISPLAY_PREFERENCES };
    Object.keys(allowed).forEach(key => {
        if (allowed[key].includes(stored?.[key])) result[key] = stored[key];
    });
    return result;
}

function applyDisplayPreferences(preferences) {
    const root = document.documentElement;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.theme = preferences.theme;
    root.dataset.density = preferences.density;
}

function initDisplaySettings() {
    const trigger = document.getElementById('displaySettingsTrigger');
    if (!trigger) return;

    let panel = document.getElementById('displaySettingsPanel');
    if (!panel) {
        document.body.insertAdjacentHTML('beforeend', `
            <section class="display-settings-panel" id="displaySettingsPanel" role="dialog" aria-modal="false" aria-labelledby="displaySettingsTitle" hidden>
                <div class="display-settings-header">
                    <div><h2 id="displaySettingsTitle">Display settings</h2><p>Make InternMatch more comfortable to use.</p></div>
                    <button class="display-settings-close" type="button" aria-label="Close display settings">×</button>
                </div>
                <div class="display-setting-row"><label for="prefFontSize">Font size</label><select id="prefFontSize" data-pref="fontSize"><option value="small">Small</option><option value="default">Default</option><option value="large">Large</option></select><small>Changes text size across the website.</small></div>
                <div class="display-setting-row"><label for="prefTheme">Theme</label><select id="prefTheme" data-pref="theme"><option value="light">Light</option><option value="dark">Dark</option></select><small>Switch between light and dark appearance.</small></div>
                <div class="display-setting-row"><label for="prefDensity">Layout density</label><select id="prefDensity" data-pref="density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select><small>Choose more breathing room or a tighter layout.</small></div>
                <div class="display-settings-footer"><span id="displaySettingsStatus" role="status">Preferences are saved on this device.</span><button class="display-settings-reset" type="button">Reset</button></div>
            </section>
        `);
        panel = document.getElementById('displaySettingsPanel');
    }

    const preferences = readDisplayPreferences();
    applyDisplayPreferences(preferences);
    panel.querySelectorAll('[data-pref]').forEach(control => {
        control.value = preferences[control.dataset.pref];
    });

    trigger.onclick = () => {
        const opening = panel.hidden;
        panel.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
        if (opening) panel.querySelector('select')?.focus();
    };

    if (panel.dataset.bound === 'true') return;
    panel.dataset.bound = 'true';

    const save = (nextPreferences, statusText = 'Saved on this device.') => {
        localStorage.setItem('im_display_preferences', JSON.stringify(nextPreferences));
        applyDisplayPreferences(nextPreferences);
        const status = document.getElementById('displaySettingsStatus');
        if (status) status.textContent = statusText;
    };

    panel.addEventListener('change', event => {
        const control = event.target.closest('[data-pref]');
        if (!control) return;
        const next = readDisplayPreferences();
        next[control.dataset.pref] = control.value;
        save(next);
    });

    panel.querySelector('.display-settings-close').addEventListener('click', () => {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
    });

    panel.querySelector('.display-settings-reset').addEventListener('click', () => {
        const defaults = { ...DEFAULT_DISPLAY_PREFERENCES };
        panel.querySelectorAll('[data-pref]').forEach(control => {
            control.value = defaults[control.dataset.pref];
        });
        save(defaults, 'Display preferences reset.');
    });

    document.addEventListener('click', event => {
        const currentTrigger = document.getElementById('displaySettingsTrigger');
        if (panel.hidden || panel.contains(event.target) || currentTrigger?.contains(event.target)) return;
        panel.hidden = true;
        currentTrigger?.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || panel.hidden) return;
        panel.hidden = true;
        document.getElementById('displaySettingsTrigger')?.setAttribute('aria-expanded', 'false');
    });
}

function authMsg(text) {
    const el = document.getElementById('authMessage');
    if (!el)
        return;
    el.textContent = text;
    el.classList.remove('hidden');
}

function bindAuth() {
    const sf = document.getElementById('signupForm');
    if (sf)
        sf.onsubmit = e => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const p = document.getElementById('signupPassword').value;
            const c = document.getElementById('signupConfirm').value;
            if (p !== c)
                return authMsg('Passwords do not match.');
            const acc = {
                name,
                email,
                password: p,
                profileComplete: false,
                age: '',
                school: '',
                course: '',
                studyYear: '',
                location: '',
                skills: ''
            };
            localStorage.setItem('im_account', JSON.stringify(acc));
            localStorage.removeItem('im_user');
            location.href = 'login.html?created=1';
        };
    const lf = document.getElementById('loginForm');
    if (lf) {
        if (new URLSearchParams(location.search).get('created') === '1')
            authMsg('Account created successfully. Please log in to continue.');
        lf.onsubmit = e => {
            e.preventDefault();
            const a = account();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            if (!a || a.email !== email || a.password !== password)
                return authMsg('Email or password is incorrect.');
            const session = {
                name: a.name,
                email: a.email,
                profileComplete: !!a.profileComplete,
                age: a.age || '',
                school: a.school || '',
                course: a.course || '',
                studyYear: a.studyYear || '',
                location: a.location || '',
                skills: a.skills || ''
            };
            localStorage.setItem('im_user', JSON.stringify(session));
            location.href = a.profileComplete ? 'jobs.html' : 'profile.html?setup=1';
        };
    }
}

async function loadJobs() {
    const el = document.getElementById('jobsList');
    if (!el)
        return;
    try {
        jobsCache = await (await fetch(`${API_BASE}/api/jobs`)).json();
        buildFilters();
        applyQueryField();
        renderJobs();
    }
    catch {
        el.innerHTML = '<div class="empty">Could not load internships. Start the Python server first.</div>';
    }
}

const FIELD_SHORT_NAMES = {
    'Human Resources & Recruitment': 'HR & Recruitment',
    'Supply Chain & Logistics': 'Supply Chain & Logistics',
    'Customer Service & Customer Experience': 'Customer Experience',
    'Cybersecurity': 'Cybersecurity',
    'Legal & Compliance': 'Legal & Compliance',
    'Hospitality & Tourism': 'Hospitality & Tourism',
    'Education & Training': 'Education & Training',
    'Procurement & Vendor Management': 'Procurement & Vendors'
};
function makeFilterChip(group, value) {
    const label = group === 'Internship Field' ? (FIELD_SHORT_NAMES[value] || value) : value;
    return `     <button       class="filter-chip"       data-group="${group}"       data-value="${value}"       title="${value}"       onclick="toggleFilter(this)">       ${label}     </button>   `;
}

function updateMoreFieldsSummary() {
    const summary = document.querySelector('.more-fields summary');
    if (!summary)
        return;
    summary.innerHTML = `     <span class="more-fields-title">More fields</span>     <span class="more-fields-right">       <span class="more-fields-arrow" aria-hidden="true"></span>     </span>   `;
}

function buildFilters() {
    const root = document.getElementById('filters');
    if (!root)
        return;
    root.innerHTML = Object.entries(FILTERS).map(([group, values]) => {
        if (group !== 'Internship Field') {
            return `         <div class="filter-group">           <strong>${group}</strong>           <div class="filter-chips">             ${values.map(value => makeFilterChip(group, value)).join('')}           </div>         </div>       `;
        }
        const mainFields = values.slice(0, 8);
        const moreFields = values.slice(8);
        return `       <div class="filter-group field-filter-group">         <strong>${group}</strong>          <div class="filter-chips">           ${mainFields.map(value => makeFilterChip(group, value)).join('')}         </div>          <details class="more-fields">           <summary>             <span>More fields</span>             <span class="more-fields-count">               ${moreFields.length}               <span class="more-fields-arrow"></span>             </span>           </summary>            <div class="filter-chips field-extra-chips">             ${moreFields.map(value => makeFilterChip(group, value)).join('')}           </div>         </details>       </div>     `;
    }).join('');
    updateMoreFieldsSummary();
}

function applyQueryField() {
    const f = new URLSearchParams(location.search).get('field');
    if (!f || !FILTERS['Internship Field'].includes(f))
        return;
    selected['Internship Field'] = new Set([
        f
    ]);
    document.querySelector(`[data-group="Internship Field"][data-value="${CSS.escape(f)}"]`)?.classList.add('selected');
}

function toggleFilter(button) {
    const group = button.dataset.group, value = button.dataset.value;
    selected[group] ??= new Set();
    if (group === 'Allowance' && value === 'Any') {
        selected[group] = new Set([
            'Any'
        ]);
        document.querySelectorAll(`[data-group="${group}"]`).forEach(x => x.classList.remove('selected'));
        button.classList.add('selected');
    }
    else {
        selected[group].delete('Any');
        button.parentElement.querySelector('[data-value="Any"]')?.classList.remove('selected');
        selected[group].has(value) ? selected[group].delete(value) : selected[group].add(value);
        button.classList.toggle('selected');
    }
    updateMoreFieldsSummary();
    renderJobs();
}

function allowanceMin(s) {
    const nums = (s.match(/[\d,]+/g) || []).map(x => +x.replaceAll(',', ''));
    return nums[0] || 0;
}

function passJob(j) {
    const q = (document.getElementById('jobSearch')?.value || '').trim().toLowerCase();
    if (q && !`${j.title} ${j.company} ${j.field} ${j.location}`.toLowerCase().includes(q))
        return false;
    for (const [group, set] of Object.entries(selected)) {
        if (!set?.size || set.has('Any'))
            continue;
        if (group === 'Internship Field') {
            const normalizeField = value => ({
                'HR & Recruitment': 'Human Resources & Recruitment',
                'Customer Experience': 'Customer Service & Customer Experience',
                'Procurement & Vendors': 'Procurement & Vendor Management'
            }[value] || value).trim().toLowerCase();
            const jobField = normalizeField(j.field || '');
            const matchesField = [
                ...set
            ].some(field => normalizeField(field) === jobField);
            if (!matchesField)
                return false;
        }
        if (group === 'Location' && ![
            ...set
        ].some(v => j.location.includes(v) || (v === 'Remote' && j.work_mode === 'Remote')))
            return false;
        if (group === 'Work Mode' && !set.has(j.work_mode))
            return false;
        if (group === 'Internship Duration') {
            const m = parseInt(j.duration) || 0;
            if (![
                ...set
            ].some(v => (v === '2-3 Months' && m <= 3) || (v === '4-6 Months' && m >= 4 && m <= 6) || (v === '6+ Months' && m >= 6)))
                return false;
        }
        if (group === 'Allowance') {
            const min = allowanceMin(j.allowance);
            if (![
                ...set
            ].some(v => min >= +v.replace(/\D/g, '')))
                return false;
        }
    }
    return true;
}

function jobCard(j, showMatch = false) {
    const id = Number(j.id) || 0;
    const required = Array.isArray(j.required) ? j.required : [];
    const match = Number(j.match_score);
    return `<article class="job-card"><div class="job-top">${logoImg(j)}<div class="job-title-wrap"><h3>${escapeHTML(j.title)}</h3><div class="company">${escapeHTML(j.company)}</div></div>${showMatch && Number.isFinite(match) ? `<span class="match-badge">${match}% Match</span>` : ''}</div><div class="meta"><span class="pill">${escapeHTML(j.location)}</span><span class="pill">${escapeHTML(j.work_mode)}</span><span class="pill">${escapeHTML(j.allowance)}</span><span class="pill">${escapeHTML(j.duration)}</span></div><p>${escapeHTML(j.description)}</p><div class="skills">${required.slice(0, 4).map(skill => `<span class="skill">${escapeHTML(skill)}</span>`).join('')}</div><div class="job-actions"><a class="btn btn-primary" href="job.html?id=${id}">View Details</a><button class="btn btn-outline" onclick="saveJob(${id})">Save Internship</button></div></article>`;
}

function renderJobs() {
    const el = document.getElementById('jobsList');
    if (!el)
        return;
    const arr = jobsCache.filter(passJob);
    const summary = document.getElementById('resultSummary');
    if (summary)
        summary.textContent = `${arr.length} internship${arr.length === 1 ? '' : 's'} found`;
    el.innerHTML = arr.length ? arr.map(j => jobCard(j)).join('') : '<div class="empty">No internships match the selected filters.</div>';
}

function clearFilters() {
    selected = {};
    document.querySelectorAll('.filter-chip').forEach(x => x.classList.remove('selected'));
    const q = document.getElementById('jobSearch');
    if (q)
        q.value = '';
    updateMoreFieldsSummary();
    renderJobs();
}

function savedIds() {
    return getJSON('im_saved', []);
}

function saveJob(id) {
    if (!user()) {
        if (confirm('Please log in to save internships. Go to Login now?'))
            location.href = 'login.html';
        return;
    }
    const ids = savedIds();
    if (!ids.includes(id))
        ids.push(id);
    localStorage.setItem('im_saved', JSON.stringify(ids));
    const b = (typeof event !== 'undefined' && event) ? event.currentTarget : null;
    if (b) {
        const old = b.textContent;
        b.textContent = 'Saved ✓';
        setTimeout(() => b.textContent = old, 1200);
    }
}

async function loadJobDetail() {
    const root = document.getElementById('jobDetail');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('id');
    try {
        const response = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(id || '')}`);
        if (!response.ok) throw new Error('Internship not found.');
        const j = await response.json();
        const esc = escapeHTML;
        const website = safeExternalURL(j.website);
        const contact = safeExternalURL(j.contact_url) || website;
        const required = Array.isArray(j.required) ? j.required : [];
        const preferred = Array.isArray(j.preferred) ? j.preferred : [];
        const responsibilities = Array.isArray(j.responsibilities) ? j.responsibilities : [];
        root.innerHTML = `
          <div class="detail-grid">
            <article class="card detail-card">
              <div class="job-top detail-job-top">${logoImg(j, 'company-logo-img detail-logo-img')}<div><div class="muted">${esc(j.company)}</div><h1>${esc(j.title)}</h1></div></div>
              <div class="meta"><span class="pill">${esc(j.field)}</span><span class="pill">${esc(j.location)}</span><span class="pill">${esc(j.work_mode)}</span><span class="pill">${esc(j.allowance)}</span><span class="pill">${esc(j.duration)}</span></div>
              <h3>Internship Description</h3><p class="muted">${esc(j.description)}</p>
              <h3>What You May Work On</h3><ul>${responsibilities.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
              <h3>Required Skills</h3><div class="skills">${required.map(skill => `<span class="skill">${esc(skill)}</span>`).join('')}</div>
              <h3>Preferred Skills</h3><div class="skills">${preferred.map(skill => `<span class="skill">${esc(skill)}</span>`).join('')}</div>
              <h3>About the Company</h3><p class="muted">${esc(j.company_description || 'Company information has not been provided.')}</p>
              <div class="company-contact"><h3>Company Contact</h3>${website ? `<div class="contact-row"><span class="contact-label">Official website</span><a href="${esc(website)}" target="_blank" rel="noopener noreferrer">${esc(website)}</a></div><p class="muted contact-help">For internship or recruitment enquiries, use the Contact Us / Careers section on the company’s official website.</p><a class="btn btn-soft contact-btn" href="${esc(contact)}" target="_blank" rel="noopener noreferrer">Open Official Company Website ↗</a>` : '<p class="muted contact-help">No company website or application link has been provided for this listing.</p>'}</div>
            </article>
            <aside class="card detail-side"><div class="detail-side-logo">${logoImg(j, 'company-logo-img detail-side-logo-img')}</div><h3>Interested in this internship?</h3><p class="muted">Use AI Job Match to compare this role with your skills, or save it to your profile.</p><a class="btn btn-primary" style="width:100%" href="match.html?job=${Number(j.id) || 0}">Check AI Match</a><button class="btn btn-outline" style="width:100%;margin-top:10px" onclick="saveJob(${Number(j.id) || 0})">Save Internship</button>${website ? `<a class="btn btn-soft" style="width:100%;margin-top:10px" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Company Website ↗</a>` : ''}</aside>
          </div>`;
    } catch {
        root.innerHTML = '<div class="empty">Internship not found.</div>';
    }
}
function buildDefaultMatchProfile(profileUser) {
    const parts = [];
    if (profileUser?.course) parts.push(`Course / Major: ${profileUser.course}`);
    if (profileUser?.school) parts.push(`University / College: ${profileUser.school}`);
    if (profileUser?.studyYear) parts.push(`Year of Study: ${profileUser.studyYear}`);
    if (profileUser?.location) parts.push(`Location: ${profileUser.location}`);
    if (profileUser?.skills) parts.push(`Skills, tools and experience: ${profileUser.skills}`);

    parts.push(
        'Internship goal: I am looking for an opportunity to apply what I have learned, develop practical skills, and contribute to a team. ' +
        'Use the uploaded resume and the profile details above as evidence. Do not assume skills or experience that are not stated.'
    );
    if (!parts.some(line => /Skills, tools and experience:/.test(line))) {
        parts.splice(0, 0,
            'Student background: Please use my uploaded resume as the main source for my education, coursework, projects, skills, and experience.'
        );
    }
    return parts.join('\n');
}

function formatSelectedJobDescription(job) {
    const sections = [
        `Job Title: ${job.title || 'Internship'}`,
        `Company: ${job.company || 'Not specified'}`,
        job.field ? `Internship Field: ${job.field}` : '',
        job.location ? `Location: ${job.location}` : '',
        job.work_mode ? `Work Mode: ${job.work_mode}` : '',
        job.duration ? `Duration: ${job.duration}` : '',
        job.allowance ? `Allowance: ${job.allowance}` : '',
        job.description ? `Job Description:\n${job.description}` : '',
        Array.isArray(job.responsibilities) && job.responsibilities.length
            ? `Responsibilities:\n${job.responsibilities.map(item => `- ${item}`).join('\n')}` : '',
        Array.isArray(job.required) && job.required.length
            ? `Required Skills:\n${job.required.join(', ')}` : '',
        Array.isArray(job.preferred) && job.preferred.length
            ? `Preferred Skills:\n${job.preferred.join(', ')}` : '',
        job.company_description ? `About the Company:\n${job.company_description}` : ''
    ];
    return sections.filter(Boolean).join('\n\n');
}

function renderSelectedJobNotice(job, message = '') {
    const root = document.getElementById('selectedJobNotice');
    if (!root) return;
    if (job) {
        root.innerHTML = `
          <div class="match-job-context-icon" aria-hidden="true">✓</div>
          <div class="match-job-context-copy">
            <strong>Matching against: ${escapeHTML(job.title || 'Selected internship')}</strong>
            <span>${escapeHTML(job.company || '')}${job.location ? ` · ${escapeHTML(job.location)}` : ''}</span>
            <small>The complete job description, responsibilities and listed skills have been filled in for you.</small>
          </div>
          <a class="btn btn-outline match-change-job" href="jobs.html">Change job</a>`;
        root.classList.remove('hidden');
        root.classList.add('has-selected-job');
        return;
    }
    root.classList.remove('has-selected-job');
    if (message) {
        root.innerHTML = `<div class="match-job-context-copy"><strong>Choose a target internship</strong><span>${escapeHTML(message)}</span></div><a class="btn btn-outline match-change-job" href="jobs.html">Browse jobs</a>`;
        root.classList.remove('hidden');
    } else {
        root.classList.add('hidden');
        root.innerHTML = '';
    }
}

async function prefillMatchFromProfile() {
    const profileBox = document.getElementById('profile');
    if (!profileBox) return;

    // Fill the applicant background from their saved profile. For visitors, use an
    // honest starter description so a resume alone is enough to run the analysis.
    if (!profileBox.value.trim()) {
        profileBox.value = buildDefaultMatchProfile(user());
    }

    const params = new URLSearchParams(location.search);
    const jobId = params.get('job') || params.get('job_id');
    const jdBox = document.getElementById('jd');
    if (!jobId) {
        renderSelectedJobNotice(null, 'The target job description will be filled in automatically when you open AI Job Match from a job listing. You can also paste a description below.');
        return;
    }
    if (!/^\d+$/.test(jobId)) {
        renderSelectedJobNotice(null, 'The selected job link is invalid. Please choose an internship from Job Search.');
        return;
    }

    const button = document.querySelector('.match-btn');
    const oldButtonText = button?.textContent;
    if (button) {
        button.disabled = true;
        button.textContent = 'Loading selected internship…';
    }
    try {
        const response = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}`, { credentials: 'same-origin' });
        let job;
        try { job = await response.json(); } catch { job = {}; }
        if (!response.ok) throw new Error(job.error || 'The selected internship could not be loaded.');
        matchSelectedJob = job;
        if (jdBox && (!jdBox.value.trim() || jdBox.dataset.autoFilled === 'true')) {
            jdBox.value = formatSelectedJobDescription(job);
            jdBox.dataset.autoFilled = 'true';
        }
        renderSelectedJobNotice(job);
    } catch (error) {
        matchSelectedJob = null;
        renderSelectedJobNotice(null, `${error.message || 'Could not load the selected internship.'} You can browse jobs and open Check AI Match again.`);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = oldButtonText || 'Check AI Match →';
        }
    }
}

async function analyze() {
    const profileBox = document.getElementById('profile');
    const jdBox = document.getElementById('jd');
    const resumeBox = document.getElementById('resume');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const button = document.querySelector('.match-btn');
    if (!profileBox || !jdBox || !resumeBox || !loading || !result) return;

    const profileText = profileBox.value.trim();
    const jobDescription = jdBox.value.trim();
    const resumeFile = resumeBox.files?.[0];
    if (!profileText && !resumeFile) {
        (document.getElementById('jobMatchResult') || result).innerHTML = '<div class="empty">Please upload a resume or enter your profile details first.</div>';
        return;
    }
    if (new URLSearchParams(location.search).has('job') && !jobDescription) {
        (document.getElementById('jobMatchResult') || result).innerHTML = '<div class="empty">The selected job description is still loading. Please wait a moment and try again.</div>';
        return;
    }

    const formData = new FormData();
    formData.append('profile', profileText);
    formData.append('job_description', jobDescription);
    if (resumeFile) formData.append('resume', resumeFile);
    if (matchSelectedJob && jdBox.dataset.autoFilled === 'true' && jobDescription === formatSelectedJobDescription(matchSelectedJob).trim()) formData.append('job_id', String(matchSelectedJob.id));

    loading.textContent = 'Checking your resume against the internship…';
    loading.classList.remove('hidden');
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Checking match…';
    }
    (document.getElementById('jobMatchResult') || result).innerHTML = '<div class="empty">Analysing your resume and the selected internship…</div>';

    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        let data;
        try { data = await response.json(); }
        catch { throw new Error('The server returned an unreadable response. Please restart the InternMatch server and try again.'); }
        if (!response.ok) throw new Error(data.error || 'AI match analysis failed.');

        const skills = Array.isArray(data.extracted_skills) ? data.extracted_skills : [];
        const roles = Array.isArray(data.predicted_roles) ? data.predicted_roles : [];
        const jobAnalysis = data.job_analysis;
        window.imLatestMatchAnalysis = jobAnalysis;
        const advisor = document.getElementById('imAdvisor');
        if (advisor) advisor.classList.toggle('hidden', !jobAnalysis);
        const roleMarkup = roles.length
            ? roles.map(role => `<div class="role"><b>${escapeHTML(titleCase(role.role || 'Career direction'))}</b><span>${Number(role.confidence) || 0}%</span></div>`).join('')
            : '<p class="muted">No career directions could be detected from the provided text.</p>';
        const skillsMarkup = skills.length
            ? skills.map(skill => `<span class="tag good">${escapeHTML(skill)} ✓</span>`).join('')
            : '<span class="tag unknown">No listed skills detected from the current text</span>';

        const jobResult = document.getElementById('jobMatchResult');
        if (jobAnalysis && jobResult) {
            const score = Math.max(0, Math.min(100, Number(jobAnalysis.match_score) || 0));
            const matched = Array.isArray(jobAnalysis.required_matches) ? jobAnalysis.required_matches : [];
            const missing = Array.isArray(jobAnalysis.required_unknown) ? jobAnalysis.required_unknown : [];
            const comps = jobAnalysis.score_components || {};
            const weights = comps.effective_weights || {};
            const metric = (label, value, available = true) => `<div class="im-metric"><div class="im-metric-label"><span>${escapeHTML(label)}</span><strong>${available ? Math.round(Number(value)||0)+'%' : 'N/A'}</strong></div>${available ? `<div class="im-meter"><span style="width:${Math.max(0,Math.min(100,Number(value)||0))}%"></span></div>` : ''}</div>`;
            const nextSkills = missing.slice(0, 3);
            const nextSteps = nextSkills.length
                ? `Consider practising ${nextSkills.map(escapeHTML).join(', ')} and documenting them in a project or your resume.`
                : 'Review the role responsibilities and explore your learning roadmap in Career Toolkit.';
            jobResult.innerHTML = `
              <div class="match-result-target"><strong>${escapeHTML(jobAnalysis.job_title || matchSelectedJob?.title || 'Selected internship')}</strong><span>${escapeHTML(matchSelectedJob?.company || '')}</span></div>
              <div class="match-score-label">Job Match Score</div>
              <div class="result-score">${score}<small>/100</small></div>
              <div class="im-explain"><h4>Why this match?</h4>
              <p>${escapeHTML(jobAnalysis.recommendation_reason || 'Compared the provided profile with the listed job requirements.')}</p>
              ${metric('Required skill coverage',jobAnalysis.required_coverage, Number(jobAnalysis.required_count)>0)}
              ${metric('Preferred skill coverage',jobAnalysis.preferred_coverage, Number(jobAnalysis.preferred_count)>0)}
              ${metric('Resume–job text similarity',jobAnalysis.semantic_similarity)}
              <details><summary>How is the score calculated?</summary><p>Weighted evidence score: required skills, preferred skills and TF-IDF text similarity (default 70/15/15). Missing categories are excluded and the remaining weights are normalized. No base points. This is not hiring probability.</p><p>Effective weights: ${Number(weights.required)||0}% required, ${Number(weights.preferred)||0}% preferred, ${Number(weights.text_similarity)||0}% text similarity. Earned points: ${(Number(comps.required_points)||0).toFixed(2)} + ${(Number(comps.preferred_points)||0).toFixed(2)} + ${(Number(comps.text_similarity_points)||0).toFixed(2)}.</p></details></div>
              <p class="match-disclaimer">Estimated compatibility using the provided text, not a prediction of hiring success. A skill not detected is not proof that you lack it.</p>
              <div class="match-skill-line"><b>Skills found:</b> ${matched.map(skill=>`<span class="tag good">${escapeHTML(skill)} ✓</span>`).join('') || '<span class="tag unknown">None detected</span>'}</div>
              <div class="match-skill-line"><b>Skills to review:</b> ${missing.map(skill=>`<span class="tag unknown">${escapeHTML(skill)} ?</span>`).join('') || '<span class="tag good">No required skills flagged</span>'}</div>
              <div class="match-next-steps"><h4>Recommended Actions</h4><p>${nextSteps}</p><a href="career-tools.html">Explore Career Toolkit →</a></div>`;
        } else if (jobResult) {
            jobResult.innerHTML = '<div class="empty">Open a job from Job Search for a job-specific matching score, or enter a job description on the left.</div>';
        }
        const resumeMessage = data.resume_text_found
            ? '<div class="match-resume-status success">Resume text was read and included in the analysis.</div>'
            : (resumeFile ? '<div class="match-resume-status warning">No readable resume text extracted. Use a text-based PDF or TXT.</div>' : '<div class="match-resume-status">No resume uploaded; career prediction uses profile text only.</div>');
        result.innerHTML = `
          <div class="career-top-score">${Number(roles[0]?.confidence)||0}%</div>
          <p class="muted">Top predicted career direction: <b>${escapeHTML(titleCase(roles[0]?.role || 'Not enough evidence'))}</b></p>
          ${resumeMessage}
          <h4>Skills detected in your profile and resume</h4><div>${skillsMarkup}</div>
          <h4>Top career directions</h4>${roleMarkup}
          <p class="match-disclaimer">Career classification probabilities across the model's roles; not job match or hiring probabilities.</p>`;
        renderSuggested(data.suggested_jobs || []);
    } catch (error) {
        (document.getElementById('jobMatchResult') || result).innerHTML = `<div class="empty">${escapeHTML(error.message || 'Analysis failed.')}<br><br>Make sure the Python server is running, then try again.</div>`;
    } finally {
        loading.classList.add('hidden');
        if (button) {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Check AI Match →';
            delete button.dataset.originalText;
        }
    }
}

async function askMatchAdvisor(question) {
    const output = document.getElementById('imAdvisorReply');
    const input = document.getElementById('imAdvisorQuestion');
    const analysis = window.imLatestMatchAnalysis;
    if (!output || !analysis) return;
    const prompt = String(question || input?.value || '').trim();
    if (!prompt) return;
    output.textContent = 'Preparing advice from your matching result…';
    try {
        const response = await fetch(`${API_BASE}/api/advisor`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question:prompt,analysis})});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Advice unavailable.');
        output.textContent = data.reply;
    } catch(error) { output.textContent = error.message || 'Advice unavailable. Check the server.'; }
}

function titleCase(s) {
    return String(s || '').replace(/\b\w/g, m => m.toUpperCase());
}

function renderSuggested(items) {
    const root = document.getElementById('suggestedJobs');
    const hint = document.getElementById('suggestedHint');
    const more = document.getElementById('viewMoreSuggested');
    if (!root) return;
    if (!Array.isArray(items) || !items.length) {
        root.innerHTML = '';
        return;
    }
    if (hint) hint.textContent = 'Based on your skills and AI match result, these internships may be worth exploring.';
    if (more) more.classList.remove('hidden');
    root.innerHTML = items.map((job, i) => `<div class="im-suggestion"><div class="im-suggestion-label">#${i+1} Personalized recommendation</div>${jobCard(job, true)}<div class="im-suggestion-reason"><strong>Why recommended:</strong> ${escapeHTML(job.match_details?.recommendation_reason || 'Profile-to-job overlap')}</div></div>`).join('');
}

function renderCareers() {
    const root = document.getElementById('careerGrid');
    if (!root)
        return;
    root.innerHTML = CAREERS.map(c => `<article class="career-card"><div class="career-icon">${c.icon}</div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.desc)}</p><div class="skills">${c.skills.map(s => `<span class="skill">${s}</span>`).join('')}</div><div class="career-path"><b>Career path</b><br>${c.path}</div><p><b>Related internships:</b><br>${c.roles}</p><a class="btn btn-soft" href="jobs.html?field=${encodeURIComponent(c.field)}">Find Related Internships</a></article>`).join('');
}

function loadProfile() {
    const root = document.getElementById('profileName');
    if (!root)
        return;
    const u = user();
    if (!u) {
        location.href = 'login.html';
        return;
    }
    const isSetup = new URLSearchParams(location.search).get('setup') === '1' || !u.profileComplete;
    if (isSetup) {
        document.getElementById('profilePageTitle').textContent = 'Complete Your Profile';
        document.getElementById('profilePageSubtitle').textContent = 'Tell us a little about yourself so InternMatch can personalise your internship experience.';
    }
    document.getElementById('profileName').textContent = u.name || 'Student';
    document.getElementById('profileEmail').textContent = u.email;
    document.getElementById('avatar').textContent = initials(u.name);
    document.getElementById('editName').value = u.name || '';
    document.getElementById('editEmail').value = u.email || '';
    document.getElementById('editAge').value = u.age || '';
    document.getElementById('editSchool').value = u.school || '';
    document.getElementById('editCourse').value = u.course || '';
    document.getElementById('editStudyYear').value = u.studyYear || '';
    document.getElementById('editLocation').value = u.location || '';
    document.getElementById('editSkills').value = u.skills || '';
    const ids = savedIds();
    fetch(`${API_BASE}/api/jobs`).then(r => r.json()).then(js => {
        const saved = js.filter(j => ids.includes(j.id));
        document.getElementById('savedJobs').innerHTML = saved.length ? saved.map(j => `<div class="saved-row"><div class="saved-job-main">${logoImg(j, 'company-logo-img saved-logo-img')}<span><b>${escapeHTML(j.title)}</b><br><small class="muted">${escapeHTML(j.company)}</small></span></div><a class="btn btn-soft" href="job.html?id=${j.id}">View</a></div>`).join('') : '<div class="empty">No saved internships yet.</div>';
    }).catch(() => {
        document.getElementById('savedJobs').innerHTML = '<div class="empty">Start the Python server to load saved internships.</div>';
    });
}

function saveProfile() {
    const u = user();
    if (!u)
        return;
    const name = document.getElementById('editName').value.trim();
    const age = document.getElementById('editAge').value.trim();
    const school = document.getElementById('editSchool').value.trim();
    const course = document.getElementById('editCourse').value.trim();
    const skills = document.getElementById('editSkills').value.trim();
    const msg = document.getElementById('profileMessage');
    if (!name || !age || !school || !course || !skills) {
        msg.textContent = 'Please complete Full Name, Age, University / College, Course / Major and Skills.';
        msg.classList.remove('hidden');
        return;
    }
    const updated = {
        ...u,
        name,
        age,
        school,
        course,
        studyYear: document.getElementById('editStudyYear').value,
        location: document.getElementById('editLocation').value.trim(),
        skills,
        profileComplete: true
    };
    localStorage.setItem('im_user', JSON.stringify(updated));
    const a = account() || {};
    localStorage.setItem('im_account', JSON.stringify({
        ...a,
        ...updated,
        password: a.password
    }));
    msg.textContent = 'Profile saved successfully.';
    msg.classList.remove('hidden');
    setTimeout(() => {
        location.href = 'jobs.html';
    }, 650);
}

function logout() {
    localStorage.removeItem('im_user');
    location.href = 'index.html';
}

function initVisualMotion() {
    const selectors = '.ct-hero, .ct-input-card, .ct-how-card, .ct-panel, .section-head, .feature-card, .faq-card, .contact-item, .career-card, .job-card, .card, .profile-card, .match-card';
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll(selectors).forEach(el => el.classList.add('im-reveal', 'is-visible'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    const observe = root => {
        if (!(root instanceof Element)) return;
        if (root.matches(selectors) && !root.classList.contains('im-reveal')) {
            root.classList.add('im-reveal');
            observer.observe(root);
        }
        root.querySelectorAll?.(selectors).forEach(el => {
            if (el.classList.contains('im-reveal')) return;
            el.classList.add('im-reveal');
            observer.observe(el);
        });
    };
    observe(document.body);
    const mutationObserver = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) observe(node);
    })));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initVisualMotion();
    bindAuth();
    loadJobs();
    loadJobDetail();
    renderCareers();
    loadProfile();
    prefillMatchFromProfile();
}); /* =========================================================    CAREER TOOLKIT - merged into the single shared app.js    ========================================================= */
const CT_API = '';
let ctJobs = [];
let ctLastPlan = null;
let ctInterviewQuestions = [];
let ctActiveTab = 'analysis';
const CT_STATUS = [
    'Planned',
    'Applied',
    'Assessment',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn'
];
function ctEsc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function ctReadJson(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
    }
    catch {
        return fallback;
    }
}

function ctUser() {
    return ctReadJson('im_user', null);
}

function ctProfileText() {
    const box = document.getElementById('ctProfile');
    return box ? box.value.trim() : '';
}

function ctSelectedJobId() {
    const value = document.getElementById('ctJobSelect')?.value || '';
    return value && value !== 'custom' ? value : '';
}

function ctFormData() {
    const form = new FormData();
    form.append('profile', ctProfileText());
    const selected = document.getElementById('ctJobSelect')?.value || '';
    if (selected && selected !== 'custom')
        form.append('job_id', selected);
    if (selected === 'custom')
        form.append('job_description', document.getElementById('ctJobDescription')?.value || '');
    const file = document.getElementById('ctResume')?.files?.[0];
    if (file)
        form.append('resume', file);
    return form;
}

// Searchable internship picker. The native select stays as the single source of truth
// for analysis/tracker requests, so existing API and saved application logic remain unchanged.
function makeJobPicker(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.enhanced === 'true') return;
    select.dataset.enhanced = 'true';
    const host = document.createElement('div');
    host.className = 'im-job-picker';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'im-job-picker-input';
    input.autocomplete = 'off';
    input.placeholder = 'Type a title or company to find an internship...';
    input.setAttribute('role','combobox');
    input.setAttribute('aria-autocomplete','list');
    input.setAttribute('aria-expanded','false');
    input.setAttribute('aria-label', selectId === 'ctTrackerJob' ? 'Search an internship to track' : 'Search an internship to analyse');
    const list = document.createElement('div');
    list.className = 'im-job-picker-menu';
    list.setAttribute('role','listbox');
    list.hidden = true;
    const options = [...select.options].filter(o => o.value).map(o => ({value:o.value,text:o.textContent}));
    const original = select.parentElement;
    original.insertBefore(host,select);
    host.append(input,list,select);
    select.classList.add('im-picker-native');
    const setFromSelect = () => {
        input.value = options.find(o => o.value === select.value)?.text || '';
    };
    const close = () => {list.hidden = true;input.setAttribute('aria-expanded','false');};
    const choose = option => {
        select.value = option.value;
        setFromSelect();
        select.dispatchEvent(new Event('change',{bubbles:true}));
        close();
    };
    const show = () => {
        const query = input.value.trim().toLowerCase();
        const filtered = options.filter(o => o.text.toLowerCase().includes(query)).slice(0,40);
        list.replaceChildren();
        if (!filtered.length) {
            const empty = document.createElement('div');empty.className='im-picker-empty';empty.textContent='No internships found.';list.append(empty);
        }
        filtered.forEach(o => {
            const button = document.createElement('button');
            button.type='button';button.className='im-picker-option';button.setAttribute('role','option');
            button.textContent=o.text;button.addEventListener('mousedown',event=>event.preventDefault());
            button.addEventListener('click',()=>choose(o));list.append(button);
        });
        list.hidden = false;input.setAttribute('aria-expanded','true');
    };
    input.addEventListener('focus',()=>{input.select();show();});
    input.addEventListener('click',()=>show());
    input.addEventListener('input',show);
    input.addEventListener('keydown',event=>{
        if(event.key==='Escape'){close();input.blur();}
        else if(event.key==='Enter' && !list.hidden){event.preventDefault();const first=options.filter(o=>o.text.toLowerCase().includes(input.value.trim().toLowerCase()))[0];if(first)choose(first);}
    });
    document.addEventListener('pointerdown',event=>{if(!host.contains(event.target))close();});
    select.addEventListener('change',setFromSelect);
    if (select.value && select.value !== 'custom') setFromSelect();
    else input.value = '';
}

function ctCurrentJobPayload() {
    const selected = document.getElementById('ctJobSelect')?.value || '';
    const data = {
        profile: ctProfileText()
    };
    if (selected && selected !== 'custom')
        data.job_id = Number(selected);
    if (selected === 'custom')
        data.job_description = document.getElementById('ctJobDescription')?.value || '';
    return data;
}

function ctShowError(message) {
    const el = document.getElementById('ctError');
    if (!el)
        return;
    el.textContent = message;
    el.classList.remove('hidden');
}

function ctHideError() {
    const el = document.getElementById('ctError');
    if (el) {
        el.textContent = '';
        el.classList.add('hidden');
    }
}

function switchToolkitTab(tab) {
    ctActiveTab = tab;
    document.querySelectorAll('.ct-tab').forEach(button => {
        const active = button.dataset.tab === tab;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.ct-panel').forEach(panel => {
        const active = panel.id === `ctPanel-${tab}`;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
    });
    if (tab === 'tracker')
        renderApplicationTracker();
}

async function loadCareerToolkit() {
    const profileBox = document.getElementById('ctProfile');
    const user = ctUser();
    if (profileBox && user && !profileBox.value) {
        profileBox.value = [
            user.skills ? `Skills: ${user.skills}` : '',
            user.course ? `Course: ${user.course}` : '',
            user.school ? `University: ${user.school}` : '',
            user.studyYear ? `Year of study: ${user.studyYear}` : ''
        ].filter(Boolean).join('\n');
    }
    try {
        const response = await fetch(`${CT_API}/api/jobs`);
        if (!response.ok)
            throw new Error('Could not load internships. Start the Python server first.');
        ctJobs = await response.json();
        const optionHtml = '<option value="custom">Custom job description</option>' + ctJobs.map(job => `<option value="${Number(job.id)}">${ctEsc(job.title)} — ${ctEsc(job.company)}</option>`).join('');
        const jobSelect = document.getElementById('ctJobSelect');
        const trackerSelect = document.getElementById('ctTrackerJob');
        if (jobSelect)
            jobSelect.innerHTML = optionHtml;
        if (trackerSelect)
            trackerSelect.innerHTML = '<option value="">Choose an internship...</option>' + ctJobs.map(job => `<option value="${Number(job.id)}">${ctEsc(job.title)} — ${ctEsc(job.company)}</option>`).join('');
        const urlJob = new URLSearchParams(location.search).get('job');
        if (urlJob && ctJobs.some(job => String(job.id) === urlJob))
            jobSelect.value = urlJob;
        else if (ctJobs.length)
            jobSelect.value = String(ctJobs[0].id);
        makeJobPicker('ctJobSelect');
        makeJobPicker('ctTrackerJob');
        updateCustomDescriptionState();
        renderApplicationTracker();
    }
    catch (error) {
        ctShowError(error.message || 'Could not load internship data.');
        const jobSelect = document.getElementById('ctJobSelect');
        if (jobSelect)
            jobSelect.innerHTML = '<option value="">Unable to load internships</option>';
    }
}

function updateCustomDescriptionState() {
    const selected = document.getElementById('ctJobSelect')?.value || '';
    const box = document.getElementById('ctJobDescription');
    const wrap = document.getElementById('ctCustomJobWrap');
    if (wrap) {
        wrap.hidden = selected !== 'custom';
        wrap.classList.toggle('ct-custom-required', selected === 'custom');
    }
    if (box)
        box.placeholder = selected === 'custom' ? 'Paste the target job description here. Skills mentioned in this text will be compared with your profile...' : 'Optional: add extra role requirements for context. To analyse a pasted description, choose Custom job description above.';
}

async function runCareerAnalysis() {
    ctHideError();
    const profile = ctProfileText();
    const selected = document.getElementById('ctJobSelect')?.value || '';
    if (!profile && !document.getElementById('ctResume')?.files?.length) {
        ctShowError('Please enter your profile/skills or choose a resume file first.');
        return;
    }
    if (!selected) {
        ctShowError('Please select a target internship.');
        return;
    }
    if (selected === 'custom' && !document.getElementById('ctJobDescription')?.value.trim()) {
        ctShowError('Please paste the job description when using Custom job description.');
        return;
    }
    const loading = document.getElementById('ctLoading');
    const button = document.getElementById('ctAnalyseBtn');
    loading?.classList.remove('hidden');
    if (button) {
        button.disabled = true;
        button.textContent = 'Analysing...';
    }
    try {
        const response = await fetch(`${CT_API}/api/career/plan`, {
            method: 'POST',
            body: ctFormData()
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || 'Career analysis failed.');
        ctLastPlan = data;
        localStorage.setItem('im_career_last_plan', JSON.stringify({
            readiness_score: data.readiness_score,
            job: data.job,
            created_at: new Date().toISOString(),
            required_not_found: data.required_not_found,
            required_found: data.required_found
        }));
        renderCareerPlan(data);
        switchToolkitTab('analysis');
    }
    catch (error) {
        ctShowError(error.message || 'Career analysis failed. Check that the Python server is running.');
    }
    finally {
        loading?.classList.add('hidden');
        if (button) {
            button.disabled = false;
            button.innerHTML = 'Analyse my readiness <span aria-hidden="true">→</span>';
        }
    }
}

function ctChips(items, type) {
    if (!items || !items.length)
        return '<span class="ct-skill-chip neutral">None detected</span>';
    return items.map(skill => `<span class="ct-skill-chip ${type}">${ctEsc(skill)} ${type === 'good' ? '✓' : '?'}</span>`).join('');
}

function ctMetric(label, value) {
    const n = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div class="ct-metric"><span class="ct-metric-label">${ctEsc(label)}</span><div class="ct-meter" aria-label="${ctEsc(label)} ${n}%"><span style="width:${n}%"></span></div><strong>${n}%</strong></div>`;
}

function renderCareerPlan(data) {
    const target = document.getElementById('ctAnalysisResult');
    if (target) {
        const b = data.match_breakdown || {};
        const statuses = (data.skill_breakdown || []).map(item => `<tr><td>${ctEsc(item.skill)}</td><td>${ctEsc(item.type)}</td><td><span class="ct-status-pill ${item.status === 'Found in profile' ? 'good' : 'unknown'}">${ctEsc(item.status)}</span></td></tr>`).join('');
        target.className = '';
        target.innerHTML = `       <div class="ct-score-grid">         <article class="ct-score-card"><div class="ct-score-kicker">INTERNSHIP READINESS</div><div class="ct-score-number">${Number(data.readiness_score) || 0}<small>/100</small></div><div class="ct-meter"><span style="width:${Math.max(0, Math.min(100, Number(data.readiness_score) || 0))}%"></span></div><p>Heuristic guide based on text evidence. This is not your chance of getting hired.</p></article>         <div class="ct-metric-stack">           ${ctMetric('Required skill coverage', b.required_coverage)}           ${ctMetric('Preferred skill coverage', b.preferred_coverage)}           ${ctMetric('Profile detail', b.profile_detail)}           <div class="ct-note-box"><b>Target role:</b> ${ctEsc(data.job?.title || 'Target internship')} ${data.job?.company ? `at ${ctEsc(data.job.company)}` : ''}. ${data.is_custom_job ? 'Custom job description.' : 'Listed internship.'} Skills not detected are marked as “Not yet evidenced”, not as proof that you do not have them.</div>         </div>       </div>       <div class="ct-result-section"><h3>Skills already evidenced</h3><p>Skills detected in the profile and/or resume text you provided.</p><div class="ct-skill-chips">${ctChips(data.profile_skills, 'good')}</div></div>       <div class="ct-result-section"><h3>Explainable match breakdown</h3><div class="ct-metric-stack">         ${ctMetric(`Required skills (${b.required_found_count || 0}/${b.required_total || 0})`, b.required_coverage)}         ${ctMetric(`Preferred skills (${b.preferred_found_count || 0}/${b.preferred_total || 0})`, b.preferred_coverage)}       </div></div>       <div class="ct-result-section"><h3>Required skills to review</h3><div class="ct-skill-chips">${ctChips(data.required_not_found, 'unknown')}</div></div>       <div class="ct-result-section"><h3>Preferred skills to review</h3><div class="ct-skill-chips">${ctChips(data.preferred_not_found, 'unknown')}</div></div>       <div class="ct-result-section"><h3>Skill-by-skill evidence</h3><div style="overflow-x:auto"><table class="ct-explain-table"><thead><tr><th>Skill</th><th>Requirement</th><th>Detected status</th></tr></thead><tbody>${statuses || '<tr><td colspan="3">No skill requirements were detected in this target role.</td></tr>'}</tbody></table></div></div>       <div class="ct-note-box">${ctEsc(data.score_note || '')} The result can change when you add relevant, accurate evidence to your profile.</div>`;
    }
    renderRoadmap(data);
    renderResumeTips(data);
}

function renderRoadmap(data) {
    const root = document.getElementById('ctRoadmapResult');
    if (!root)
        return;
    root.className = '';
    root.innerHTML = `<div class="ct-roadmap-intro"><b>Target:</b> ${ctEsc(data.job?.title || 'Internship')} · This roadmap prioritises skills that are not yet evidenced. Adjust the tasks to your schedule and current level.</div><div class="ct-roadmap">${(data.roadmap || []).map((week, index) => `<article class="ct-week-card"><span class="ct-week-num">${ctEsc(week.week || `WEEK ${index + 1}`)}</span><h3>${ctEsc(week.title)}</h3>${week.skills?.length ? `<div class="ct-skill-chips">${week.skills.map(skill => `<span class="ct-skill-chip unknown">${ctEsc(skill)}</span>`).join('')}</div>` : ''}<ul>${(week.tasks || []).map(task => `<li>${ctEsc(task)}</li>`).join('')}</ul><div class="ct-deliverable"><b>Deliverable</b><br>${ctEsc(week.deliverable || '')}</div></article>`).join('')}</div>`;
}

function renderResumeTips(data) {
    const root = document.getElementById('ctResumeResult');
    if (!root)
        return;
    root.className = '';
    root.innerHTML = `<div class="ct-roadmap-intro"><b>Resume target:</b> ${ctEsc(data.job?.title || 'Target internship')}. These are tailored editing suggestions, not an auto-generated replacement resume.</div><div class="ct-tip-grid">${(data.resume_tips || []).map(tip => `<article class="ct-tip-card"><h3>${ctEsc(tip.title)}</h3><p>${ctEsc(tip.detail)}</p></article>`).join('')}</div><div class="ct-example-box"><h3>Evidence-based bullet template</h3><p><b>[Action verb]</b> + [specific task or project] + using [tool/skill] + resulting in [verified outcome].<br><br>Example structure only: “Analysed [dataset/process] using [tool] to identify [finding]; presented [verified result] to [audience/team].” Replace every bracketed section with truthful details from your own experience. Do not claim metrics or tools you did not use.</p></div>`;
}

async function generateInterview() {
    ctHideError();
    const payload = ctCurrentJobPayload();
    if (!payload.profile && !document.getElementById('ctResume')?.files?.length) {
        ctShowError('Please enter your profile first so the practice can be personalised.');
        switchToolkitTab('interview');
        return;
    }
    if (!payload.job_id && !(payload.job_description || '').trim()) {
        ctShowError('Choose a target internship or paste a job description first.');
        return;
    }
    try {
        const response = await fetch(`${CT_API}/api/career/interview/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || 'Could not generate questions.');
        ctInterviewQuestions = data.questions || [];
        renderInterviewQuestions(ctInterviewQuestions, data.evaluation_note || '');
    }
    catch (error) {
        ctShowError(error.message || 'Could not generate questions.');
    }
}

function renderInterviewQuestions(questions, note) {
    const root = document.getElementById('ctInterviewResult');
    if (!root)
        return;
    root.innerHTML = questions.map((q, index) => `<article class="ct-question-card" data-question-id="${ctEsc(q.id)}"><div class="ct-question-top"><span class="ct-question-type">${ctEsc(q.type)}</span><span class="ct-question-type">QUESTION ${index + 1}</span></div><h3>${ctEsc(q.question)}</h3><div class="ct-question-focus"><b>Focus:</b> ${ctEsc(q.focus)}</div><label for="ctAnswer-${ctEsc(q.id)}" class="ct-question-focus">Your answer</label><textarea class="ct-answer-box" id="ctAnswer-${ctEsc(q.id)}" placeholder="Write your answer here. Use real examples from coursework, projects, clubs or work..."></textarea><button class="btn btn-soft" type="button" onclick="reviewInterviewAnswer('${ctEsc(q.id)}')">Review my answer</button><div class="ct-feedback" id="ctFeedback-${ctEsc(q.id)}"></div></article>`).join('') + `<div class="ct-note-box">${ctEsc(note)} Feedback is a transparent practice checklist, not a generative interview coach.</div>`;
}

async function reviewInterviewAnswer(questionId) {
    const question = ctInterviewQuestions.find(q => q.id === questionId);
    const answer = document.getElementById(`ctAnswer-${questionId}`)?.value.trim() || '';
    const feedbackEl = document.getElementById(`ctFeedback-${questionId}`);
    if (!answer) {
        feedbackEl.className = 'ct-feedback visible';
        feedbackEl.innerHTML = '<p>Please write an answer first.</p>';
        return;
    }
    try {
        const response = await fetch(`${CT_API}/api/career/interview/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answer,
                keywords: question?.keywords || []
            })
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || 'Feedback failed.');
        feedbackEl.className = 'ct-feedback visible';
        feedbackEl.innerHTML = `<div class="ct-feedback-head"><span class="ct-feedback-score">${Number(data.practice_score)}/100</span><b>Practice structure score</b></div><p>${Number(data.word_count)} words · Relevant terms found: ${ctEsc((data.relevant_terms_found || []).join(', ') || 'None detected')}</p><ul>${(data.feedback || []).map(item => `<li>${ctEsc(item)}</li>`).join('')}</ul><p>${ctEsc(data.score_note || '')}</p>`;
    }
    catch (error) {
        feedbackEl.className = 'ct-feedback visible';
        feedbackEl.textContent = error.message || 'Feedback failed.';
    }
}

function getApplications() {
    const value = ctReadJson('im_applications', []);
    return Array.isArray(value) ? value : [];
}

function saveApplications(items) {
    localStorage.setItem('im_applications', JSON.stringify(items));
}

function addApplication() {
    const select = document.getElementById('ctTrackerJob');
    const id = Number(select?.value || 0);
    const job = ctJobs.find(item => Number(item.id) === id);
    if (!job) {
        ctShowError('Choose an internship to add to your tracker.');
        return;
    }
    const current = getApplications();
    if (current.some(item => Number(item.jobId) === id)) {
        ctShowError('This internship is already in your tracker.');
        return;
    }
    current.unshift({
        jobId: id,
        title: job.title,
        company: job.company,
        status: 'Planned',
        appliedDate: '',
        deadline: '',
        notes: '',
        createdAt: new Date().toISOString()
    });
    saveApplications(current);
    ctHideError();
    renderApplicationTracker();
}

function updateApplication(jobId) {
    const items = getApplications();
    const item = items.find(app => Number(app.jobId) === Number(jobId));
    if (!item)
        return;
    const card = document.querySelector(`[data-application="${Number(jobId)}"]`);
    if (!card)
        return;
    item.status = card.querySelector('[data-field="status"]')?.value || 'Planned';
    item.appliedDate = card.querySelector('[data-field="appliedDate"]')?.value || '';
    item.deadline = card.querySelector('[data-field="deadline"]')?.value || '';
    item.notes = card.querySelector('[data-field="notes"]')?.value || '';
    saveApplications(items);
    const button = card.querySelector('.ct-app-save');
    if (button) {
        button.textContent = 'Saved ✓';
        setTimeout(() => {
            if (button.isConnected)
                button.textContent = 'Save changes';
        }, 1000);
    }
    renderTrackerStats(items);
}

function deleteApplication(jobId) {
    if (!confirm('Remove this internship from your tracker?'))
        return;
    saveApplications(getApplications().filter(item => Number(item.jobId) !== Number(jobId)));
    renderApplicationTracker();
}

function renderTrackerStats(items) {
    const root = document.getElementById('ctTrackerStats');
    if (!root)
        return;
    const stats = [
        [
            'Total tracked',
            items.length
        ],
        [
            'Applied',
            items.filter(x => x.status === 'Applied').length
        ],
        [
            'Interviews',
            items.filter(x => x.status === 'Interview').length
        ],
        [
            'Offers',
            items.filter(x => x.status === 'Offer').length
        ]
    ];
    root.innerHTML = stats.map(([label, value]) => `<div class="ct-tracker-stat"><span>${ctEsc(label)}</span><strong>${value}</strong></div>`).join('');
}

function renderApplicationTracker() {
    const root = document.getElementById('ctTrackerList');
    if (!root)
        return;
    const items = getApplications();
    renderTrackerStats(items);
    if (!items.length) {
        root.innerHTML = '<div class="ct-empty-state"><div class="ct-empty-icon">▣</div><h3>No applications tracked yet</h3><p>Add an internship above to record its status, dates and next steps.</p></div>';
        return;
    }
    root.innerHTML = items.map(item => {
        const job = ctJobs.find(j => Number(j.id) === Number(item.jobId));
        const title = job?.title || item.title || 'Internship';
        const company = job?.company || item.company || '';
        return `<article class="ct-app-card" data-application="${Number(item.jobId)}"><div class="ct-app-head"><div><h3>${ctEsc(title)}</h3><p>${ctEsc(company)}</p></div><button type="button" class="ct-app-delete" onclick="deleteApplication(${Number(item.jobId)})">Remove</button></div><div class="ct-app-fields"><div><label for="ct-status-${Number(item.jobId)}">Application status</label><select id="ct-status-${Number(item.jobId)}" data-field="status">${CT_STATUS.map(status => `<option${status === (item.status || 'Planned') ? ' selected' : ''}>${ctEsc(status)}</option>`).join('')}</select></div><div><label for="ct-applied-${Number(item.jobId)}">Date applied</label><input id="ct-applied-${Number(item.jobId)}" type="date" data-field="appliedDate" value="${ctEsc(item.appliedDate || '')}"></div><div><label for="ct-deadline-${Number(item.jobId)}">Deadline / next date</label><input id="ct-deadline-${Number(item.jobId)}" type="date" data-field="deadline" value="${ctEsc(item.deadline || '')}"></div><div class="notes-field"><label for="ct-notes-${Number(item.jobId)}">Notes / next action</label><textarea id="ct-notes-${Number(item.jobId)}" rows="2" data-field="notes" placeholder="e.g. Follow up with recruiter, prepare SQL exercise...">${ctEsc(item.notes || '')}</textarea></div></div><button type="button" class="btn btn-soft ct-app-save" onclick="updateApplication(${Number(item.jobId)})">Save changes</button></article>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('ctJobSelect');
    if (select)
        select.addEventListener('change', updateCustomDescriptionState);
    loadCareerToolkit();
});