let markdownRuntimeLoadPromise: Promise<void> | null = null;

const SCRIPT_BASE = 'assets/vendor';
const LOADED_SCRIPTS = new Set<string>();

function globalExists(name: 'Prism' | 'ClipboardJS'): boolean {
  return typeof (globalThis as Record<string, unknown>)[name] !== 'undefined';
}

function loadScript(src: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (LOADED_SCRIPTS.has(src)) {
    return Promise.resolve();
  }

  const selector = `script[data-markdown-runtime="${src}"]`;
  const existing = document.querySelector(selector) as HTMLScriptElement | null;

  if (existing) {
    if (existing.dataset['loaded'] === 'true') {
      LOADED_SCRIPTS.add(src);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      existing.addEventListener(
        'load',
        () => {
          existing.dataset['loaded'] = 'true';
          LOADED_SCRIPTS.add(src);
          resolve();
        },
        { once: true }
      );
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset['markdownRuntime'] = src;
    script.addEventListener(
      'load',
      () => {
        script.dataset['loaded'] = 'true';
        LOADED_SCRIPTS.add(src);
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load script: ${src}`)),
      { once: true }
    );
    document.head.appendChild(script);
  });
}

export function ensureMarkdownRuntimeLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (markdownRuntimeLoadPromise) {
    return markdownRuntimeLoadPromise;
  }

  markdownRuntimeLoadPromise = (async () => {
    if (!globalExists('Prism')) {
      await loadScript(`${SCRIPT_BASE}/prism/prism.js`);

      await Promise.all([
        loadScript(`${SCRIPT_BASE}/prism/prism-typescript.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-json.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-bash.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-yaml.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-sql.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-python.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-java.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-csharp.min.js`),
        loadScript(`${SCRIPT_BASE}/prism/prism-markdown.min.js`),
      ]);
    }

    if (!globalExists('ClipboardJS')) {
      await loadScript(`${SCRIPT_BASE}/clipboard/clipboard.min.js`);
    }

    if (!globalExists('Prism')) {
      throw new Error('Prism runtime failed to initialize.');
    }
    if (!globalExists('ClipboardJS')) {
      throw new Error('Clipboard runtime failed to initialize.');
    }
  })();

  return markdownRuntimeLoadPromise;
}
