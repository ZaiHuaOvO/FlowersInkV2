let markdownRuntimeLoadPromise: Promise<void> | null = null;

function setGlobal(name: 'Prism' | 'ClipboardJS', value: unknown): void {
  (globalThis as Record<string, unknown>)[name] = value;
}

export function ensureMarkdownRuntimeLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (markdownRuntimeLoadPromise) {
    return markdownRuntimeLoadPromise;
  }

  markdownRuntimeLoadPromise = (async () => {
    const prismModule = await import('prismjs');
    const prism = (prismModule as { default?: unknown }).default ?? prismModule;
    setGlobal('Prism', prism);

    await Promise.all([
      import('prismjs/components/prism-typescript.min.js'),
      import('prismjs/components/prism-json.min.js'),
      import('prismjs/components/prism-bash.min.js'),
      import('prismjs/components/prism-yaml.min.js'),
      import('prismjs/components/prism-sql.min.js'),
      import('prismjs/components/prism-python.min.js'),
      import('prismjs/components/prism-java.min.js'),
      import('prismjs/components/prism-csharp.min.js'),
      import('prismjs/components/prism-markdown.min.js'),
    ]);

    const clipboardModule = await import('clipboard');
    const clipboard =
      (clipboardModule as { default?: unknown }).default ?? clipboardModule;
    setGlobal('ClipboardJS', clipboard);
  })();

  return markdownRuntimeLoadPromise;
}
