import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const ts = () => typescript({
  declaration: true,
  declarationDir: 'dist/types',
  rootDir: 'src',
});

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/pianova.mjs',
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/pianova.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/pianova.min.js',
        format: 'umd',
        name: 'Pianova',
        sourcemap: true,
        exports: 'named',
        plugins: [terser()],
      },
    ],
    plugins: [ts()],
  },
  // pianova/theory: no DOM, no audio
  {
    input: 'src/theory/index.ts',
    output: [
      {
        file: 'dist/theory.mjs',
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/theory.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [ts()],
  },
];
