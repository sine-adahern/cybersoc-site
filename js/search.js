// Site search bar: filters window.SITE_SEARCH_INDEX and renders a dropdown of matches.
(function () {
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, term) {
    const escaped = escapeHtml(text);
    if (!term) return escaped;
    const re = new RegExp('(' + escapeRegExp(term) + ')', 'ig');
    return escaped.replace(re, '<mark>$1</mark>');
  }

  function snippet(text, term, radius) {
    radius = radius || 60;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) {
      return text.length > radius * 2 ? text.slice(0, radius * 2) + '…' : text;
    }
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + term.length + radius);
    let out = text.slice(start, end);
    if (start > 0) out = '…' + out;
    if (end < text.length) out += '…';
    return out;
  }

  function init() {
    const root = document.getElementById('siteSearch');
    if (!root) return;
    const toggle = document.getElementById('searchToggle');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const index = window.SITE_SEARCH_INDEX || [];

    let activeIndex = -1;

    function setOpen(open) {
      root.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        setTimeout(() => input.focus(), 10);
      } else {
        input.value = '';
        results.hidden = true;
        results.innerHTML = '';
        activeIndex = -1;
      }
    }

    function updateActive(items) {
      items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
      if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function render(matches, term) {
      activeIndex = -1;
      if (!term) {
        results.hidden = true;
        results.innerHTML = '';
        return;
      }
      if (matches.length === 0) {
        results.innerHTML = '<p class="search-empty">No results for “' + escapeHtml(term) + '”.</p>';
        results.hidden = false;
        return;
      }
      results.innerHTML = matches
        .map(
          (m) =>
            '<a class="search-result" href="' + m.url + '" role="option">' +
              '<span class="search-result-title">' + highlight(m.title, term) +
                '<span class="search-result-page">' + escapeHtml(m.page) + '</span>' +
              '</span>' +
              '<span class="search-result-snippet">' + highlight(snippet(m.text, term), term) + '</span>' +
            '</a>'
        )
        .join('');
      results.hidden = false;
    }

    function search(term) {
      const q = term.trim().toLowerCase();
      if (!q) {
        render([], '');
        return;
      }
      const matches = index
        .filter((entry) => entry.title.toLowerCase().includes(q) || entry.text.toLowerCase().includes(q))
        .slice(0, 20);
      render(matches, term.trim());
    }

    toggle.addEventListener('click', () => setOpen(!root.classList.contains('open')));

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('open')) setOpen(false);
    });

    input.addEventListener('input', () => search(input.value));

    input.addEventListener('keydown', (e) => {
      const items = Array.from(results.querySelectorAll('.search-result'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length) {
          activeIndex = (activeIndex + 1) % items.length;
          updateActive(items);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length) {
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActive(items);
        }
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && items[activeIndex]) {
          window.location.href = items[activeIndex].getAttribute('href');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
