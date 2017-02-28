const elixir = require('laravel-elixir');
const gulp        = require('gulp');
const browserSync = require('browser-sync').create();

elixir(mix => {
    mix.webpack('./app/scripts/main.js', './dist/scripts/bundle.js');

    browserSync.init({
        server: "./dist"
    });
});
