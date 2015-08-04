//Gruntfile
module.exports = function(grunt) {

//Initializing the configuration object
    grunt.initConfig({
        // Task configuration
        less: {
            development: {
                options: {
                    compress: true,
                },
                files: {
                    "./static/stylesheets/styles.css": "./assets/stylesheets/styles.less",
                }
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            js: {
                src: [
                  './bower_components/jquery/dist/jquery.js',
                  //'./bower_components/materialize/dist/js/materialize.min.js',
                  './bower_components/toastr/toastr.min.js',
                  './assets/javascript/frontend.js'
                ],
                dest: './static/javascript/frontend.js',
            },
        },
        watch: {
            js: {
                files: [
                  './bower_components/jquery/dist/jquery.js',
                  //'./bower_components/materialize/dist/js/materialize.min.js',
                  './bower_components/toastr/toastr.min.js',
                  './assets/javascript/frontend.js'
                ],
                tasks: ['concat:js']
            },
            less: {
                files: ['./assets/stylesheets/*.less'],
                tasks: ['less']
            },
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Define tasks
    grunt.registerTask('default', ['watch']);

};
