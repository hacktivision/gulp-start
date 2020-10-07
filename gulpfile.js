const projectName = require('path').basename(__dirname);
const sourseDir = 'app';
const projectDir = 'dist';

const PATHS = {
    build: {
		html: projectDir + `/`,
		css: projectDir + `/css/`,
		js: projectDir +  `/js/`,
		img: projectDir + `/img/`,
		fonts: projectDir + `/fonts/`,
		libs: projectDir + `/libs/`,
	},
	sourse: {
		html: sourseDir + `/html/[^_]*.html`,
		scss: sourseDir + `/scss/main.scss`,
		js: sourseDir + `/js/main.js`,
		img: sourseDir + `/img/**/*.{jpg,png,svg,gif,ico,webp}`,
		fonts: sourseDir + `/fonts/*.ttf`,
		libs: sourseDir + `/libs/**/*`,
	},
	watch: {
		html: sourseDir + `/**/*.html`,
		scss: sourseDir + `/scss/**/*.scss`,
		js: sourseDir + `/js/**/*.js`,
		img: sourseDir + `/img/**/*.{jpg,png,svg,gif,ico,webp}`,
	},
	clean: projectDir + `/`
}


const {src, dest} = require('gulp'),
	gulp = require('gulp'),
	scss = require('gulp-sass'),
	browsersync = require('browser-sync').create(),
	fileinclude = require('gulp-file-include'),
	autoprefixer = require('gulp-autoprefixer'),
	groupmedia = require('gulp-group-css-media-queries'),
	cleancss = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default,
	babel = require('gulp-babel'),
	imagemin = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	webphtml = require('gulp-webp-html'),
	svgsprite = require('gulp-svg-sprite'),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	fonter = require('gulp-fonter'),
	zip = require('gulp-zip'),
	// sourcemaps = require('gulp-sourcemaps'),
	// mocha = require('gulp-mocha'),
	// concat = require('gulp-concat'),
	// filter = require('gulp-filter'),
	// gulpif = require('gulp-if'),
	del = require('del'),
	resizeImg = require('resize-img');

const fs = require('fs');

const browserSync = () => {
    browsersync.init({
        server: {
			baseDir: projectDir + `/`,
		},
		port: 3000,
		notify: false
    })
}

// Html
const html = () =>{
    return src(PATHS.sourse.html)
		.pipe(fileinclude())
		// .pipe(webphtml())
        .pipe(dest(PATHS.build.html))
        .pipe(browsersync.stream());
}

// Css
const css = () => {
    return src(PATHS.sourse.scss)
        .pipe(scss({
			outputStyle: 'expanded'
		}))
		.pipe(groupmedia())
		.pipe(autoprefixer(["last 15 version", "> 1%", "ie 9", "ie 8", "ie 7"], { cascade: true }))
		.pipe(dest(PATHS.build.css))
		.pipe(browsersync.stream())
		.pipe(cleancss())
		.pipe(rename({extname: '.min.css'}))
		.pipe(dest(PATHS.build.css))
		.pipe(browsersync.stream())
}

// Js
const js = () => {
    return src(PATHS.sourse.js)
        .pipe(fileinclude())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(dest(PATHS.build.js))
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(dest(PATHS.build.js))
		.pipe(browsersync.stream())
}

// Images
const images = () => {
	return src(PATHS.sourse.img)
		.pipe(webp({
			quality: 70
		}))
		.pipe(dest(PATHS.build.img))
		.pipe(src(PATHS.sourse.img))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
			interlaced: true,
			optimizationLevel: 3
		}))
		.pipe(dest(PATHS.build.img))
		.pipe(browsersync.stream())
}

// Libs
const libs = () => {
	return src(PATHS.sourse.libs)
		.pipe(dest(PATHS.build.libs));
}

// Fonts
const fonts = () => {
	src(PATHS.sourse.fonts)
		.pipe(ttf2woff())
		.pipe(dest(PATHS.build.fonts));
	return src(PATHS.sourse.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(PATHS.build.fonts));
}

// Cleaner
const clean = () => {
	return del(PATHS.clean)
}

// Font style
const fontsStyle = () => {
	let file_content = fs.readFileSync(sourseDir + "/scss/base/_fonts.scss");
	if (file_content == "") {
		fs.writeFile(sourseDir + "/scss/base/_fonts.scss",file_content , ()=>{});
		return fs.readdir(PATHS.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split(".");
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile( sourseDir + "/scss/base/_fonts.scss", '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', ()=>{} );
					}
					c_fontname = fontname;
				}
			}
		});
	}
}


// Otf to ttf
gulp.task('otf2ttf', () => {
	return src([`.//fonts/*.otf`])
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest(`.//fonts/`));
});

// Svg icon
gulp.task('svgSprite', () => {
	return gulp.src([`./iconsprite/*.svg`])
		.pipe(svgsprite({
			mode: {
				stack: {
					sprite: '../icons/icons.svg',
					example: true
				}
			}
		}))
		.pipe(dest('./app/img/'))
});


// TODO: FIX
// Favicons sizes 
const favicons = {
	'apple-touch-icon': [57, 60, 72, 76, 114, 120, 144, 152, 180],
	'android-icon': [192],
	'favicon': [32, 96, 16]
};
gulp.task('favicon-resize', async () => {
	for (let i in favicons) {
		for (let j of favicons[i]) {
			await resizeImg( fs.readFile('./app/img/common/favicon.png'), { width: j, height: j })
				.then( async (buf) => {
					await fs.writeFile(`./app/img/common/${i}-${j}x${j}.png`, buf, (err) => {
						if(err) throw err
						console.log(`File "${i}-${j}x${j}.png" created`)
					})
			})
		}
	}
	return true;
});

// To archive
gulp.task('zip', async () => {
	await gulp.src('./app/*')
		.pipe(zip(projectName + '.zip'))
		.pipe(dest('./'))
})

/**
 * Files wathcing
 */ 
const watching = () => {
    gulp.watch([PATHS.watch.html], html);
    gulp.watch([PATHS.watch.scss], css);
    gulp.watch([PATHS.watch.js], js);
    gulp.watch([PATHS.watch.img], images);
}

/**
 * All
 */ 
const build = gulp.series(clean, gulp.parallel(css, js, html, images, libs));
const watch = gulp.parallel(build, browserSync, watching);

exports.libs = libs;
// exports.fontsStyle = fontsStyle;
// exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;