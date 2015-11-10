var gulp = require("gulp"),
    plugins = require("gulp-load-plugins")(),
    streamqueue = require("streamqueue"),
    browserify = require("browserify"),
    babelify = require("babelify"),
    source = require("vinyl-source-stream"),
    buffer = require("vinyl-buffer");

var assetPath = "./src/assets";
var genPath = "./src/assets/gen";

/**
 * javascript tasks
 */
var jsSrc = function (isRelease) {
    var libs = gulp.src([
        assetPath + "/libs/jquery/jquery-2.1.4.min.js",
        assetPath + "/libs/angular/angular.min.js",
        assetPath + "/libs/firebase/firebase.js",
        assetPath + "/libs/firebase/angularfire.min.js",
        assetPath + "/libs/angular/angular-aria.min.js",
        assetPath + "/libs/angular/angular-animate.min.js",
        assetPath + "/libs/angular/angular-messages.min.js",
        assetPath + "/libs/angular-material/angular-material.min.js"
    ]);

    var custom = browserify([require.resolve("babel-polyfill"), assetPath + "/js/config.js"])
        .transform(babelify)
        .bundle()
        .pipe(source("custom.js"))
        .pipe(buffer());

    return streamqueue({ objectMode: true })
        .queue(libs)
        .queue(isRelease ? custom.pipe(plugins.uglify()) : custom)
        .done();
};

gulp.task("js-dev", function () {
    return jsSrc()
        .pipe(plugins.concat("app.js"))
        .pipe(gulp.dest(genPath + "/js/"));
});

gulp.task("js-release", function () {
    return jsSrc(true)
        .pipe(plugins.concat("app.min.js"))
        .pipe(gulp.dest(genPath + "/js/"));
});

/**
 * css tasks
 */
gulp.task("css", function () {
    var libs = gulp.src([
        assetPath + "/libs/font-awesome/css/font-awesome.min.css",
        assetPath + "/libs/angular-material/angular-material.min.css"
    ]);
    var custom = gulp.src([
        assetPath + "/less/main.less"
    ])
        .pipe(plugins.less())
        .pipe(plugins.autoprefixer())
        .pipe(plugins.minifyCss());

    return streamqueue({ objectMode: true }).queue(libs).queue(custom).done()
        .pipe(plugins.concat("app.min.css"))
        .pipe(gulp.dest(genPath + "/css/"));
});

/**
 * font tasks
 */
gulp.task("fonts", function () {
    return gulp.src([assetPath + "/libs/font-awesome/fonts/*"])
        .pipe(gulp.dest(genPath + "/fonts/"));
});

/**
 * generate jsdoc
 */
 gulp.task("api-doc", function () {
	 // plugins.run("yuidoc -t node_modules/yuidoc-bootstrap-theme -H node_modules/yuidoc-bootstrap-theme/helpers/helpers.js").exec()
	 return gulp.src(["src/api/**/*.js"]).pipe(plugins.yuidoc.parser()).pipe(plugins.yuidoc.generator()).pipe(gulp.dest("src/api-doc"));
 });

/**
 * compile all tasks
 */
gulp.task("compile", ["css", "fonts", "js-dev", "js-release"]);

/**
 * watch tasks
 */
gulp.task("watch", ["compile"], function () {
    var reload = function (e) {
        setTimeout(function () {
            plugins.livereload.changed(e);
        }, 1000);
    };

    plugins.livereload.listen();
    gulp.watch(assetPath + "/less/**/*.less", ["css"]).on("change", reload);
    gulp.watch([assetPath + "/js/**/*.js", assetPath + "/libs/gcci-model/*.js"], ["js-dev"]).on("change", reload);
    gulp.watch(["src/**/*.html"]).on("change", reload);
});