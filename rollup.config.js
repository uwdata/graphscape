import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import bundleSize from 'rollup-plugin-bundle-size';
import {terser} from 'rollup-plugin-terser';

const extensions = ['.js'];
const outputs = [
  {
    input: 'src/index.js',
    output: [
      {
        file: `graphscape.js`,
        format: 'umd',
        sourcemap: true,
        name: 'graphscape',
        globals: {
          vega: "vega",
          "vega-lite": "vl",
          d3: "d3"
        }
      },
      {
        file: `graphscape.min.js`,
        format: 'umd',
        sourcemap: true,
        name: 'graphscape',
        plugins: [terser()],
        globals: {
          vega: "vega",
          "vega-lite": "vl",
          d3: "d3"
        }
      }
    ],
    plugins: [
      resolve({browser: true, extensions}),
      commonjs(),
      json(),
      babel({
        extensions,
        babelHelpers: 'bundled',
        presets: [
          [
            '@babel/env',
            { targets: 'defaults and not IE 11'}
          ]
        ]
      }),
      bundleSize()
    ],
    external: ['d3',  "vega-lite", "vega"]
  }
];

export default outputs;