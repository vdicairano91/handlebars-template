var gulp = require('gulp');
var grunt = require('grunt');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var scss = require('gulp-sass');
var path = require('path');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var gutil = require('gutil');
var rename = require("gulp-rename");
var inject = require('gulp-inject');
var es = require('event-stream');
// var optipng = require('gulp-optipng');
var gulpFilter = require('gulp-filter');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var wiredep = require('wiredep').stream;
var fileinclude = require('gulp-file-include');
var mainBowerFiles = require('main-bower-files');

// Grunt module better so we use it in our Gulp lol;
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    assemble: {
        options: {
            layout: "./src/templates/layouts/default.hbs",
            partials: "./src/templates/partials/**/*.hbs",
            helpers: "./src/templates/helpers/helpers.js",
            data: "./src/templates/data/*.json",
            flatten: false
        },
        pages: {
            files: [
                {expand: true, cwd: './src/templates/pages/', src: '**/*.hbs', dest: './build/', ext: '.html'}
            ]
        }
    }
});
grunt.loadNpmTasks('grunt-assemble');

// Compile Our scss
gulp.task('scss', function() {
    return gulp.src(['./src/**/*.scss'])
        .pipe(scss())
        .pipe(rename({dirname: ""}))
        .pipe(gulp.dest('./build/styles/'))
        .pipe(reload({stream: true}));
});

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./build/scripts'))
});

// Copy pre-compiled resources (JS and CSS)
gulp.task('copy-js', function() {
    gulp.src(['./src/js/**/*.js', '!./bower_components/**/*.js'])
        .pipe(rename({dirname: ""}))
        .pipe(gulp.dest('./build/scripts'));
    gulp.src(mainBowerFiles())
        .pipe(rename({dirname: ""}))
        .pipe(gulp.dest('./build/scripts'));
    gulp.src(['./src/**/*.css'])
        .pipe(rename({dirname: ""}))
        .pipe(gulp.dest('./build/styles'));
});

gulp.task("html", function() {
    return gulp.src('./build/**/*.html')
    .pipe(fileinclude({
        prefix: '@@',
        basepath: 'src/partials/'
    }))
    .pipe(wiredep({}))
    .pipe(inject(gulp.src('./**/vendor/*.js', {read: false, cwd: './build'}), {name: 'vendor'},{relative: true} ,{ignorePath: 'build/'}))    
    .pipe(inject(gulp.src(['./**/*.js','!./**/vendor/*.js', './**/*.css'], {read: false, cwd: './build'}), {relative: true} ,{ignorePath: 'build/'}))
    .pipe(gulp.dest('./build'));
});

// Copy images, optimising PNGs
gulp.task("image", function() {
    var pngFilter = gulpFilter('**/*.png');
    gulp
        .src('./src/img/**')
        .pipe(gulp.dest('./build/img/'));
});

// Fonts
gulp.task("fonts", function() {
    gulp
        .src('./src/fonts/*')
        .pipe(gulp.dest('./build/fonts/'));
});

gulp.task('build', function(){
    grunt.tasks(
        ['assemble'],    //you can add more grunt tasks in this array
        {gruntfile: false}, //don't look for a Gruntfile - there is none. :-)
        function () {runSequence(["scss", "image", "fonts", "copy-js", "bower"], "html");}
    );    
});

gulp.task('dev', ['build', 'serve-dev']);

gulp.task("dist", function(callback) {
    runSequence("build", "make-release", "html-release", callback);
});

gulp.task("make-release", function() {
    // Bower scripts
    gulp.src(mainBowerFiles())
        .pipe(gulpFilter('**/*.js'))
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/scripts/vendor/'))
    // Bower styles
    gulp.src(mainBowerFiles())
        .pipe(gulpFilter('**/*.css'))
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest('./dist/styles/vendor/'))
    // App scripts
    gulp.src("./build/scripts/*.js")
        .pipe(concat('compiled.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/scripts/'));
    // App styles
    gulp.src("./build/styles/*.css")
        .pipe(concat('compiled.css'))
        .pipe(gulp.dest('./dist/styles/'));
    // App images
    gulp.src('./build/img/*')
        .pipe(gulp.dest('./dist/img/'));
    // App fonts
    gulp.src('./build/fonts/*')
        .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('html-release', function() {
    return gulp.src('./src/*.html')
        .pipe(inject(
            gulp.src(['./**/*.js', './**/*.css'], {read: false, cwd: './dist'}), {
                ignorePath: 'dist/'
            }))
        .pipe(gulp.dest('./dist'));
});

// Watch all source files for changes
gulp.task('serve-dev', function() {
    gulp.watch(['src/**/*.scss'], ['scss']);
    gulp.watch(['src/**/*.hbs'], ['build']);
    gulp.watch(['src/img/*'], ['image']);
    gulp.watch(['src/fonts/*'], ['fonts']);
    gulp.watch(['src/**/*.css', 'src/**/*.js'], ['copy-js']);

    // Reload browser-sync on change
    browserSync.init({
        browser: "google chrome",
        server: {baseDir: ["./build", "./"]}
    });

    gulp.watch(['./build/*.html', './build/scripts/*.js', './build/img/*']).on('change', function(e) {
        // console.log(e.type + ": " + e.path);
        reload();
    });
});
