var gulp = require('gulp');
var plugin = require('gulp-load-plugins')();
var config = {
    "bower" : "bower_components",
    "src" : "public/src",
    "dest" : "public/dist",
    "debug" : !(process.env.APPLICATION_ENVIRONMENT === 'production')
};

gulp.task('bower', function (cb) {
    require('child_process').exec('bower-installer', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})

gulp.task('lint', function() {
    return gulp.src([
        config.src + '/spl2json/**/*.js',
        './routes/**/*.js'
    ])
    .pipe(plugin.jshint())
    .pipe(plugin.jshint.reporter('default'));
});

gulp.task('sass', function() {
    return gulp.src([
        '!' + config.src + '/spl2json/common/styles/fonts.scss',
        config.src + '/spl2json/common/styles/*.scss',
        config.src + '/spl2json/common/styles/main.scss',
        config.src + '/spl2json/**/*.scss',
        '!' + config.src + '/spl2json/common/styles/variables.scss',
        '!' + config.src + '/spl2json/common/styles/mixins.scss'
    ])
    .pipe(plugin.sass())
    .pipe(plugin.autoprefixer({
        'browsers' : ['last 2 versions'],
        'cascade' : false
    }))
    .pipe(plugin.minifyCss())
    .pipe(plugin.concat('main.css'))
    .pipe(gulp.dest(config.dest + '/css'))
    .pipe(plugin.if(config.debug, plugin.livereload()));
});

gulp.task('markup', function() {
    return gulp.src(config.src + '/**/*.html')
    .pipe(plugin.flatten())
    .pipe(gulp.dest(config.dest + '/html'))
    .pipe(plugin.if(config.debug, plugin.livereload()));
});

gulp.task('json', function() {
    return gulp.src(config.src + '/**/*.json')
    .pipe(plugin.flatten())
    .pipe(gulp.dest(config.dest + '/stat'));
});

gulp.task('scripts', function() {
  return gulp.src([
        config.src + '/lib/angular/angular.js',
        config.src + '/lib/**/*.js',
        config.src + '/spl2json/*.js',
        config.src + '/spl2json/**/*.js'
    ])
    .pipe(plugin.if(config.debug, plugin.sourcemaps.init()))
    .pipe(plugin.concat('main.js'))
    .pipe(plugin.uglify())
    .pipe(plugin.if(config.debug, plugin.sourcemaps.write()))
    .pipe(gulp.dest(config.dest + '/js'))
    .pipe(plugin.if(config.debug, plugin.livereload()));
});

gulp.task('watch', ['express'], function () {
    plugin.livereload.listen();
    gulp.watch(config.src + '/**/*.js', ['lint', 'scripts']);
    gulp.watch(config.src + '/**/*.scss', ['sass']);
    gulp.watch(config.src + '/**/*.html', ['markup']);
});

gulp.task('express', ['lint', 'sass', 'scripts', 'markup', 'json'], function () {
    var express = require('express');
    var app = express();
    app.use(express.static(__dirname + '/public/dist'), require('./routes/routes')(express));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/dist/html/index.html');
    });
    app.listen(8080);
});

gulp.task('default', function () {
    return (config.debug) ? ['watch'] : ['express'];
}());
