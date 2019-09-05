'use strict';

/*
 * Author: Ji Youn
 * Description: gulpfile (es6 문법으로 작성됨.)
 */

// 1) babel-core babel-preset-es2015를 설치하고 
// 2) .babelrc에서 es2015 설정을 하고
// 3) 이 gulpfile.babel.js을 만들어서
// 'gulp'를 실행하면 gulpfile.babel.js이 읽혀지고, es6문법을 읽음.

import gulp from 'gulp';
import gutil from 'gulp-util';
import del from 'del';
import rename from "gulp-rename";
import pump from 'pump';
import merge from 'merge-stream';
import jsObfuscator from 'gulp-javascript-obfuscator';

// transpile될 소스의 결과물은 build/app안으로 들어간다.
// public 은 build로 들어간다.
const DIR = {
  SRC: 'src',
  DEST: 'build',
  DIST: 'dist'
};

// 배포를 위해서 dist안에 모든 것들을 모으기 위해서 gulp를 사용...

const SRC = {
  TRANSPILED: 'build/app/**/*.js',
  CONFIG: 'config/**/*.json',
  EJS: DIR.SRC + '/views/**/*.ejs',
  PUBLIC: 'public/**/*.*', // 중요: 제일 앞에 슬래시(/)가 없음.
  SSL: '*.pem'
};

const ETC = {
  CONFIG: '/config',
  EJS: '/app/views',
  PUBLIC: '/public'
};

gutil.log('Gulp is running...');

// TODO: rundev를 할때는..
// npm run dev 라고 하면
// gulp clean && gulp build && tsc -w 하도록. 그래서 build는 한번만 이루어 지고, ts만 바뀔때마다 빌드하도록

// "build:project": "typings install && tsc -p tsconfig.build.json && gulp"

const prepareTasks = ['clean_only_prepare', 'conf_files', 'ejs_files', 'public_dirs', 'ssl_files'];
gulp.task('prepare', prepareTasks, () => {
//gulp.task('build', ['obfuscate', 'conf_files', 'ejs_files', 'public_dirs'], () => {
//gulp.task('default', ['clean', 'public_dirs'], () => {
  gutil.log(`Preparing ${prepareTasks}`);
})

gulp.task('conf_files', () => {
  return gulp.src(SRC.CONFIG)
         .pipe(gulp.dest(`${DIR.DEST}${ETC.CONFIG}`));
})

gulp.task('ejs_files', () => {
  return gulp.src(SRC.EJS)
         .pipe(gulp.dest(`${DIR.DEST}${ETC.EJS}`));
});

gulp.task('public_dirs', () => {
  return gulp.src(SRC.PUBLIC)
         .pipe(gulp.dest(`${DIR.DEST}${ETC.PUBLIC}`));
});

gulp.task('ssl_files', () => {
  return gulp.src(SRC.SSL)
         .pipe(gulp.dest(`${DIR.DEST}`));
});

// gulp.task('etc_files', () => {
//   const pm2Json = gulp.src('pm2_*.json').pipe(gulp.dest(DIR.DEST));
//   const pkgJson = gulp.src('package.json').pipe(gulp.dest(DIR.DEST));
//   const scripts = gulp.src('scripts/**/*.sh').pipe(gulp.dest(DIR.DEST));
//   return merge(pm2Json, pkgJson, scripts);
// })

gulp.task('clean', () => {
  return del.sync([DIR.DEST]);
});

gulp.task('clean_only_prepare', () => {
  const _DEST = Object.keys(ETC).map((key) => `${DIR.DEST}${ETC[key]}`);
  return del.sync(_DEST);
});

gulp.task('clean_dist', () => {
  return del.sync([DIR.DIST]);
})

gulp.task('dist', ['clean_dist', 'dist_etc_files'], () => {
  const targetOpt = process.argv[3];
  const target = process.argv[4];

  if (targetOpt && targetOpt === '--target' && target) {
    const src = gulp.src(SRC.TRANSPILED).pipe(gulp.dest(`${DIR.DIST}/app`));
    const ejs = gulp.src(SRC.EJS).pipe(gulp.dest(`${DIR.DIST}${ETC.EJS}`));
    const pub = gulp.src(SRC.PUBLIC).pipe(gulp.dest(`${DIR.DIST}${ETC.PUBLIC}`));
    //const config = gulp.src(`config/${target}.json`).pipe(rename(`${target}.json`)).pipe(gulp.dest(`${DIR.DIST}/config`));
    const config = gulp.src(`config/${target}.json`).pipe(gulp.dest(`${DIR.DIST}/config`));
    return merge(src, ejs, pub, config);
  }
  else {
    gutil.log('********************************');
    gutil.log('Invalid arguments!');
    gutil.log('usage: gulp dist --target <host>');
  }
})

gulp.task('dist_etc_files', () => {
  const targetOpt = process.argv[3];
  const target = process.argv[4];

  if (targetOpt && targetOpt === '--target' && target) {
    // target: prod'
    const pm2Json = gulp.src(`pm2_${target}.json`).pipe(rename('pm2.json')).pipe(gulp.dest(DIR.DIST));
    const pkgJson = gulp.src('package.json').pipe(rename('package.json')).pipe(gulp.dest(DIR.DIST));
    const pkgLockJson = gulp.src('package-lock.json').pipe(rename('package-lock.json')).pipe(gulp.dest(DIR.DIST));
    const scripts = gulp.src('scripts/**/*.sh').pipe(gulp.dest(DIR.DIST));
    const ssl = gulp.src(SRC.SSL).pipe(gulp.dest(`${DIR.DIST}`));
    return merge(pm2Json, pkgJson, pkgLockJson, scripts, ssl);
  }
  else {
    gutil.log('********************************');
    gutil.log('Invalid arguments!');
    gutil.log('usage: gulp dist --target <host>');
  }
})

gulp.task('obfuscate', (cb) => {
  pump([
    gulp.src('dist/app/**/*.js'),
    jsObfuscator({
      compact: true,
      selfDefending: true,
      //identifierNamesGenerator: 'mangled',
      identifierNamesGenerator: 'hexadecimal',
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: false,
      disableConsoleOutput: false,
      log: false,
      renameGlobals: false,
      rotateStringArray: false,
      stringArray: false,
      stringArrayEncoding: false,
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
      target: 'node',
    }),
    gulp.dest('dist/app')
    ],
    cb
  );
})