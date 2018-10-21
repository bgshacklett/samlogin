const {
  src,
  dest,
  parallel,
  series,
  task,
} = require('gulp');

const eslint                = require('gulp-eslint');
const conventionalChangelog = require('gulp-conventional-changelog');
const bump                  = require('gulp-bump');
const git                   = require('gulp-git');
const log                   = require('gulplog');
const minimist              = require('minimist');


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
    () => src('CHANGELOG.md')
          .pipe(conventionalChangelog({ preset: 'angular' }))
          .pipe(dest('./'))
  ,
);

task(
  'git-add-release-files',
  () => src([
              './CHANGELOG.md',
              './package.json',
           ])  // eslint-disable-line indent
           .pipe(git.add())
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
  'prep-release',
  series(
    'bump-version',
    'changelog',
    'git-add-release-files',
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
