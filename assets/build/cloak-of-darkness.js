"use strict";

var CloakOfDarkness = (function () {
  var gameInfo = {
    title: "Cloak of Darkness",
    description: "Welcome, Cloak of Darkness is an implementation of the de facto 'Hello, World' of interactive  fiction by the same name. If you want to find out what a 'Cloak of Darkness' is you can find out more <a href='http://www.firthworks.com/roger/cloak' target='_blank'>here</a>.",
    author: "Frank Hale <frankhale@gmail.com>",
    releaseDate: "11 November 2015",
    dataFile: "/assets/data/cloak-of-darkness-data.txt"
  };

  // any game specific code will go here and somehow, don't know be called from
  // the IF engine

  return {
    init: function init() {
      IFEngine.init(gameInfo);
    }
  };
})();

$(document).ready(function () {
  CloakOfDarkness.init();
});
//# sourceMappingURL=cloak-of-darkness.js.map
