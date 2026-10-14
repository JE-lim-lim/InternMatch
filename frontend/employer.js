/* InternMatch employer account flow and dashboard interactions. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function displayPrefs() {
    try {
      const pref = JSON.parse(localStorage.getItem('im_display_preferences') || '{}');
      document.documentElement.dataset.fontSize = ['small', 'default', 'large'].includes(pref.fontSize) ? pref.fontSize : 'default';
      document.documentElement.dataset.theme = ['light', 'dark'].includes(pref.theme) ? pref.theme : 'light';
      document.documentElement.dataset.density = ['comfortable', 'compact'].includes(pref.density) ? pref.density : 'comfortable';
    } catch (_) {
      document.documentElement.dataset.theme = 'light';
    }
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    let data = {};
    try { data = await response.json(); } catch (_) { /* non-JSON response */ }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function initAuthChoice() {
    const root = $('.auth-choice-page');
    if (!root) return;
    const params = new URLSearchParams(location.search);
    let mode = params.get('mode') === 'login' ? 'login' : 'signup';
    const title = $('#authChoiceTitle');
    const subtitle = $('#authChoiceSubtitle');
    const prompt = $('#authChoiceSwitchPrompt');
    const switchLink = $('#authChoiceSwitchLink');
    const update = () => {
      const login = mode === 'login';
      title.textContent = login ? 'How would you like to log in?' : 'How would you like to join?';
      subtitle.textContent = login
        ? 'Choose your account type to continue. You can browse internships without signing in.'
        : 'Choose the account that fits what you want to do. You can still browse internships without signing in.';
      prompt.textContent = login ? 'New to InternMatch?' : 'Already have an account?';
      switchLink.textContent = login ? 'Create an account' : 'Log in instead';
      switchLink.href = `auth-choice.html?mode=${login ? 'signup' : 'login'}`;
      $$('[data-choice-role]').forEach(link => {
        const role = link.dataset.choiceRole;
        const action = login ? 'Log in' : 'Sign up';
        link.textContent = `${action} as ${role === 'student' ? 'a Job Seeker' : 'an Employer'} →`;
        link.href = role === 'student'
          ? `${login ? 'login.html' : 'signup.html'}?role=student`
          : `employer-auth.html?mode=${mode}`;
      });
    };
    switchLink.addEventListener('click', event => {
      event.preventDefault();
      mode = mode === 'login' ? 'signup' : 'login';
      history.replaceState(null, '', `auth-choice.html?mode=${mode}`);
      update();
    });
    update();
  }

  function initEmployerAuth() {
    const form = $('#employerAuthForm');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    let mode = params.get('mode') === 'login' ? 'login' : 'signup';
    const signupFields = $('#employerSignupFields');
    const confirmWrap = $('#employerConfirmWrap');
    const password = $('#employerPassword');
    const confirm = $('#employerConfirm');
    const message = $('#employerAuthMessage');
    const title = $('#employerAuthTitle');
    const subtitle = $('#employerAuthSubtitle');
    const submit = $('#employerAuthSubmit');
    const switchPrompt = $('#employerAuthSwitchPrompt');
    const switchLink = $('#employerAuthSwitchLink');
    const back = $('#backToRoleChoice');

    const showMessage = (text, isError = false) => {
      message.textContent = text;
      message.hidden = false;
      message.classList.toggle('error', isError);
    };
    const update = () => {
      const login = mode === 'login';
      title.textContent = login ? 'Welcome back' : 'Create an employer account';
      subtitle.textContent = login ? 'Log in to manage your company’s internship listings.' : 'Set up your company profile to publish internships.';
      submit.textContent = login ? 'Log In to Employer Workspace' : 'Create Employer Account';
      signupFields.hidden = login;
      confirmWrap.hidden = login;
      $('#employerCompany').required = !login;
      $('#employerContact').required = !login;
      $('#employerWebsite').required = false;
      password.autocomplete = login ? 'current-password' : 'new-password';
      confirm.required = !login;
      switchPrompt.textContent = login ? 'New to InternMatch?' : 'Already registered?';
      switchLink.textContent = login ? 'Create an employer account' : 'Log in';
      switchLink.href = `employer-auth.html?mode=${login ? 'signup' : 'login'}`;
      back.href = `auth-choice.html?mode=${mode}`;
      document.title = `${login ? 'Employer Login' : 'Employer Sign Up'} | InternMatch`;
      message.hidden = true;
      history.replaceState(null, '', `employer-auth.html?mode=${mode}`);
    };

    switchLink.addEventListener('click', event => {
      event.preventDefault();
      mode = mode === 'login' ? 'signup' : 'login';
      form.reset();
      update();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      message.hidden = true;
      const email = $('#employerEmail').value.trim().toLowerCase();
      const pass = password.value;
      if (mode === 'signup') {
        if (pass.length < 8) return showMessage('Please use a password with at least 8 characters.', true);
        if (pass !== confirm.value) return showMessage('The passwords do not match.', true);
      }
      const payload = { email, password: pass };
      let endpoint = '/api/employer/login';
      if (mode === 'signup') {
        endpoint = '/api/employer/register';
        payload.company_name = $('#employerCompany').value.trim();
        payload.contact_name = $('#employerContact').value.trim();
        payload.website = $('#employerWebsite').value.trim();
        if (!payload.company_name || !payload.contact_name) return showMessage('Please enter your company name and contact person.', true);
      }
      submit.disabled = true;
      submit.textContent = mode === 'login' ? 'Logging in…' : 'Creating account…';
      try {
        await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
        // The server must be able to read the session cookie before redirecting.
        // Otherwise the dashboard immediately sends the user back to login.
        const auth = await api('/api/employer/session-status');
        if (!auth.authenticated) {
          const tip = auth.cookies_require_https && !auth.request_is_https
            ? ' HTTPS-only cookies are enabled, but this site is running on HTTP. Remove INTERNMATCH_HTTPS=1 when testing locally.'
            : ' Your browser did not retain the session cookie. Try http://127.0.0.1:5000 consistently, allow site cookies, and restart the Flask server.';
          throw new Error('Account credentials accepted, but the login session was not saved.' + tip);
        }
        try { sessionStorage.setItem('im_employer_nav_hint', '1'); } catch (_) {}
        location.assign('employer-dashboard.html');
      } catch (error) {
        showMessage(error.message || 'Could not complete the request. Please try again.', true);
      } finally {
        submit.disabled = false;
        submit.textContent = mode === 'login' ? 'Log In to Employer Workspace' : 'Create Employer Account';
      }
    });
    update();
    if (params.get('expired') === '1') {
      showMessage('Your employer session is missing or expired. Please log in again. If this happens immediately after signup, ensure cookies are allowed and use the same local host.', true);
    }
  }

  function initEmployerDashboard() {
    const form = $('#employerJobForm');
    if (!form) return;
    let employer = null;
    let listings = [];
    let editingId = null;
    const message = $('#employerDashboardMessage');
    const listRoot = $('#employerJobList');

    const showMessage = (text, isError = false) => {
      message.textContent = text;
      message.hidden = false;
      message.classList.toggle('error', isError);
      message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const clearMessage = () => { message.hidden = true; message.textContent = ''; message.classList.remove('error'); };
    const resetForm = () => {
      form.reset();
      editingId = null;
      $('#employerJobFormTitle').textContent = 'Post a new internship';
      $('#saveListingButton').textContent = 'Publish Internship';
      $('#cancelListingEdit').hidden = true;
    };
    const setInput = (id, value) => { const field = $(`#${id}`); if (field) field.value = value ?? ''; };
    const commaList = value => Array.isArray(value) ? value.join(', ') : '';

    const render = () => {
      const headerName = $('#employerHeaderName');
      if (headerName) headerName.textContent = employer?.company_name || 'Employer';
      $('#employerWelcome').textContent = `Welcome, ${employer?.company_name || 'Employer'}`;
      $('#employerCompanyStat').textContent = employer?.company_name || '—';
      $('#employerTotalJobs').textContent = String(listings.length);
      $('#employerActiveJobs').textContent = String(listings.filter(job => job.status !== 'inactive').length);
      if (!listings.length) {
        listRoot.innerHTML = '<div class="employer-empty"><strong>No internships published yet.</strong><br>Use the form to publish your first opportunity.</div>';
        return;
      }
      listRoot.innerHTML = listings.map(job => `
        <article class="employer-listing">
          <h3>${escapeHtml(job.title)}</h3>
          <p>${escapeHtml(job.location)} · ${escapeHtml(job.work_mode)} · ${escapeHtml(job.duration)}</p>
          <div class="employer-listing-meta"><span>${escapeHtml(job.field)}</span><span>${escapeHtml(job.allowance)}</span><span>${(job.required || []).length} required skills</span></div>
          <div class="employer-listing-actions">
            <a class="btn btn-soft" href="job.html?id=${Number(job.id)}" target="_blank" rel="noopener noreferrer">Preview</a>
            <button class="btn btn-outline" type="button" data-edit-job="${Number(job.id)}">Edit</button>
            <button class="btn btn-outline" type="button" data-delete-job="${Number(job.id)}">Delete</button>
          </div>
        </article>`).join('');
    };

    const refresh = async () => {
      const data = await api('/api/employer/jobs');
      listings = Array.isArray(data) ? data : [];
      render();
    };

    const fillForEdit = job => {
      editingId = Number(job.id);
      setInput('listingTitle', job.title);
      setInput('listingField', job.field);
      setInput('listingLocation', job.location);
      setInput('listingWorkMode', job.work_mode);
      setInput('listingDuration', job.duration);
      setInput('listingAllowance', job.allowance);
      setInput('listingRequired', commaList(job.required));
      setInput('listingPreferred', commaList(job.preferred));
      setInput('listingDescription', job.description);
      setInput('listingResponsibilities', (job.responsibilities || []).join('\n'));
      setInput('listingAboutCompany', job.company_description);
      setInput('listingWebsite', job.website);
      $('#employerJobFormTitle').textContent = 'Edit internship';
      $('#saveListingButton').textContent = 'Save Changes';
      $('#cancelListingEdit').hidden = false;
      $('#employerJobFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#listingTitle').focus({ preventScroll: true });
    };

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearMessage();
      // Native browser validation for starred fields only.
      if (!form.reportValidity()) {
        return showMessage('Please complete the fields marked * before publishing.', true);
      }
      const required = $('#listingRequired').value.split(',').map(value => value.trim()).filter(Boolean);
      if (!required.length) return showMessage('Please add at least one required skill, separated by commas.', true);
      const payload = {
        title: $('#listingTitle').value.trim(),
        field: $('#listingField').value,
        location: $('#listingLocation').value.trim(),
        work_mode: $('#listingWorkMode').value,
        duration: $('#listingDuration').value,
        allowance: $('#listingAllowance').value.trim(),
        required,
        preferred: $('#listingPreferred').value.split(',').map(value => value.trim()).filter(Boolean),
        description: $('#listingDescription').value.trim(),
        responsibilities: $('#listingResponsibilities').value.split('\n').map(value => value.trim()).filter(Boolean),
        company_description: $('#listingAboutCompany').value.trim(),
        website: $('#listingWebsite').value.trim()
      };
      const submit = $('#saveListingButton');
      const wasEditing = editingId !== null;
      const editingJobId = editingId;
      submit.disabled = true;
      submit.textContent = wasEditing ? 'Saving…' : 'Publishing…';
      try {
        await api(wasEditing ? `/api/employer/jobs/${editingJobId}` : '/api/employer/jobs', {
          method: wasEditing ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        });
        resetForm();
        // Update statistics and employer-owned listings from the server.
        try {
          await refresh();
          showMessage(wasEditing ? 'Internship updated successfully.' : 'Internship published. It is now available in Job Search.');
        } catch (refreshError) {
          showMessage('Internship saved. Refresh the page to reload the listing statistics and cards.');
        }
      } catch (error) {
        showMessage(error.message || 'Could not save the internship.', true);
      } finally {
        submit.disabled = false;
        submit.textContent = editingId !== null ? 'Save Changes' : 'Publish Internship';
      }
    });

    $('#cancelListingEdit').addEventListener('click', () => { resetForm(); clearMessage(); });
    $('#newInternshipButton').addEventListener('click', () => {
      resetForm(); clearMessage();
      $('#employerJobFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#listingTitle').focus({ preventScroll: true });
    });
    listRoot.addEventListener('click', async event => {
      const editButton = event.target.closest('[data-edit-job]');
      const deleteButton = event.target.closest('[data-delete-job]');
      if (editButton) {
        const job = listings.find(item => Number(item.id) === Number(editButton.dataset.editJob));
        if (job) fillForEdit(job);
        return;
      }
      if (deleteButton) {
        const id = Number(deleteButton.dataset.deleteJob);
        const job = listings.find(item => Number(item.id) === id);
        if (!job || !confirm(`Delete “${job.title}”? This also removes it from Job Search.`)) return;
        deleteButton.disabled = true;
        try {
          await api(`/api/employer/jobs/${id}`, { method: 'DELETE' });
          listings = listings.filter(item => Number(item.id) !== id);
          render();
          if (editingId === id) resetForm();
          showMessage('Internship removed from your listings and Job Search.');
        } catch (error) {
          showMessage(error.message || 'Could not delete this internship.', true);
        }
      }
    });

    $('#employerLogout').addEventListener('click', async () => {
      try { await api('/api/employer/logout', { method: 'POST' }); } catch (_) { /* still return to public browsing */ }
      try { sessionStorage.setItem('im_employer_nav_hint', '0'); } catch (_) {}
      location.href = 'index.html';
    });

    (async () => {
      try {
        const data = await api('/api/employer/me');
        employer = data.employer;
        try { sessionStorage.setItem('im_employer_nav_hint', '1'); } catch (_) {}
        await refresh();
      } catch (error) {
        // Only redirect for an unauthenticated session. Other errors belong
        // on the dashboard instead of looking like a failed login.
        try {
          const status = await api('/api/employer/session-status');
          if (!status.authenticated) {
            location.replace('employer-auth.html?mode=login&expired=1');
            return;
          }
        } catch (_) { /* leave current view and show the original error */ }
        showMessage(error.message || 'Could not load employer listings.', true);
      }
    })();
  }

  document.addEventListener('DOMContentLoaded', () => {
    displayPrefs();
    initAuthChoice();
    initEmployerAuth();
    initEmployerDashboard();
  });
})();
