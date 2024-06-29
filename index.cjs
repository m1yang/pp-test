throw new Error(
  'This package cannot be imported in a CommonJS module using require(). Please use "import" instead.'
  + '\n\nIf you are using "import" in your source code, then it\'s possible it was bundled into require() automatically by your bundler. '
  + 'In that case, do not bundle CommonJS output since it will never work with this package, or use dynamic import() which is available in all CommonJS modules.',
)
