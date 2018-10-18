const {
  src,
  dest,
  parallel,
  series,
  task,
} = require('gulp');

const eslint    = require('gulp-eslint');
const changeLog = require('gulp-conventional-changelog');
const bump      = require('gulp-bump');
const log       = require('gulplog');
const minimist  = require('minimist');


/*
 * Begin Task Definitions
 * */
task(
  'bump-version',
  () => {
    const opts = minimist(process.argv.slice(2), { string: 'type' });

    return src(['./package.json'])
          .pipe(bump({ type: opts.type }).on('error', log.error))
          .pipe(dest('./'));
  }
  ,
);

task(
  'changelog',
  () => src('CHANGELOG.md', { buffer: false })
        .pipe(changeLog({ preset: 'angular' }))
        .pipe(dest('./'))
  ,
);


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
  'release',
  series(
    'bump-version',
    'changelog',
  )
  ,
);

task(
  'default',
  parallel(
    'lint',
  )
  ,
);
