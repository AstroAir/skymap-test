#!/usr/bin/env node

const { generateAboutDependencies } = require('./about-dependency-generator.cjs');

const { dependencies, outputPath } = generateAboutDependencies();

console.log(`Generated ${dependencies.length} about dependencies at ${outputPath}`);
