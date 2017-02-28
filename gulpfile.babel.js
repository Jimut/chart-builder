import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import webpack from 'webpack-stream';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('copy', () =>
    gulp.src([
        'app/*'
    ], {
        dot: true
    })
    .pipe(gulp.dest('dist/'))
);

gulp.task('copy-data', () =>
    gulp.src('app/data/*')
    .pipe(gulp.dest('dist/data'))
);

gulp.task('images', () =>
    gulp.src('app/images/**/*')
    .pipe(gulp.dest('dist/images'))
);

gulp.task('styles', () => {
    const AUTOPREFIXER_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];

    return gulp.src([
        'app/styles/**/*.scss'
    ])
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('app/styles'))
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', () =>
    gulp.src([
        './app/scripts/main.js'
    ])
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe(webpack())
    .pipe($.sourcemaps.write('.'))
    .pipe($.rename('bundle.js'))
    .pipe(gulp.dest('app/scripts'))
    .pipe(gulp.dest('dist/scripts'))
);

gulp.task('clean', () =>
    del(['dist/*', '!dist/.git'], {dot: true})
);

gulp.task('serve', ['scripts', 'styles'], () => {
    browserSync({
        notify: false,
        logPrefix: 'WSK',
        server: ['app'],
        port: 3000
    });

    gulp.watch(['app/**/*.html'], reload);
    gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['app/scripts/**/*.js'], ['scripts', reload]);
    gulp.watch(['app/images/**/*'], reload);
});

gulp.task('serve:dist', ['default'], () =>
    browserSync({
        notify: false,
        logPrefix: 'WSK',
        server: 'dist',
        port: 3001
    })
);

gulp.task('default', ['clean'], cb =>
    runSequence(
        'styles',
        ['scripts', 'images', 'copy', 'copy-data'],
        cb
    )
);
