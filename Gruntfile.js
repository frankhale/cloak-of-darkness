module.exports = function(grunt) {

  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    "react": {
      build: {
        files: {
          'assets/build/app.js': 'assets/src/app.jsx',
        }
      }
    },
    "babel": {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          "assets/build/app.js": "assets/build/app.js",
        }
      }
    },
    "uglify": {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'assets/build/app.min.js': 'assets/build/app.js',
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-react');
  grunt.registerTask("default", ["babel"]);

  // Default task(s).
  grunt.registerTask('default', ['react', 'babel', 'uglify']);

};
