const {
  src,
  parallel,
  task,
} = require('gulp');

const eslint = require('gulp-eslint');

/*
 * Begin Task Definitions
 * */
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

task(
  'default',
  parallel(
    'lint',
  )
  ,
);
