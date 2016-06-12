module.exports = function(grunt) {

  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    "babel": {
      options: {
        sourceMap: true,
        plugins: ["transform-react-jsx"],
        presets: ['babel-preset-es2015']
      },
      dist: {
        files: {
          "assets/build/ifengine.js": "assets/src/ifengine.jsx",
          "assets/build/cloak-of-darkness.js": "assets/src/cloak-of-darkness.jsx"
        }
      }
    },
    "uglify": {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'assets/build/ifengine.min.js': 'assets/build/ifengine.js',
          "assets/build/cloak-of-darkness.min.js": "assets/build/cloak-of-darkness.js"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['babel', 'uglify']);
};
