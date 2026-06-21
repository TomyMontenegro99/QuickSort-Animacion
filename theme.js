(function () {
  const STORAGE_KEY = 'quicksort-theme';
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  if (!themeToggle || !themeIcon || !themeLabel) return;

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // El tema funciona durante la sesión aunque el almacenamiento esté bloqueado.
    }
  }

  function applyTheme(theme) {
    const darkModeEnabled = theme === 'dark';
    document.documentElement.dataset.theme = darkModeEnabled ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(darkModeEnabled));
    themeIcon.textContent = darkModeEnabled ? '☀' : '☾';
    themeLabel.textContent = darkModeEnabled ? 'Modo claro' : 'Modo oscuro';
  }

  const systemPrefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(getSavedTheme() || (systemPrefersDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', function () {
    const nextTheme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });
})();
