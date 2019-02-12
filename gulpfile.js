const {
  src,
  parallel,
  task,
} = require('gulp');

const eslint = require('gulp-eslint');
const mocha  = require('gulp-mocha');

/*
 * Begin Task Definitions
 * */
// Linting
task(
  'lint',
  () => src([
              '**/*.js',
              '!node_modules/**',
            ])  // eslint-disable-line indent
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failAfterError())
  ,
);

// Run tests with Mocha
task(
  'test',
  () => src([
              '**/*.spec.js',
              '!node_modules/**',
            ])  // eslint-disable-line indent
            .pipe(mocha({ reporter: 'spec' }))
  ,
);

task(
  'default',
  parallel(
    'lint',
    'test',
  )
  ,
);
