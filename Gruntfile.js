module.exports = function(grunt) {

require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),
  babel: {
    options: {
      sourceMap: true,
      plugins: ["transform-react-jsx"],
      presets: ['babel-preset-es2015'],
      compact: "auto"
    },    
    dist: {
      files: {
        "build/cloak.js": "src/cloak.js"
      }
    }
  },
  uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {          
          "build/cloak.min.js": "build/cloak.js",
        }
      }
    }
});

grunt.loadNpmTasks("grunt-contrib-uglify");

grunt.registerTask("default", ["babel", "uglify"]);

};