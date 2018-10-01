const { parallel, src, task } = require('gulp');
const eslint = require('gulp-eslint');

task(
  'lint',
  () => src([
    '**/*.js',
    '!node_modules/**',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
  ,
);

task(
  'default',
  parallel(
    'lint',
  ),
);
