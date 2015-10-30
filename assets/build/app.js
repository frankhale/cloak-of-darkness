"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Cloak of Darkness as described here: http://www.firthworks.com/roger/cloak/
//
// Frank Hale <frankhale@gmail.com>
// 30 October 2015

var CloakOfDarkness = (function () {
  var gameInfo = {
    title: "Cloak of Darkness",
    description: "Welcome, Cloak of Darkness is a reprise of the de facto 'Hello, World' of interactive  fiction by the same name. If you want to find out what a 'Cloak of Darkness' is you can find out more <a href='http://www.firthworks.com/roger/cloak' target='_blank'>here</a>.",
    author: "Frank Hale <frankhale@gmail.com>",
    releaseDate: "30 October 2015"
  };

  var keys = {
    Enter: 13,
    Up: 38,
    Down: 40
  };

  var directionSynonyms = {
    north: ["north", "n"],
    northEast: ["northeast", "ne"],
    northWest: ["northwest", "nw"],
    south: ["south", "s"],
    southEast: ["southeast", "se"],
    southWest: ["southwest", "sw"],
    east: ["east", "e"],
    west: ["west", "w"]
  };

  var rooms = [{
    id: 0,
    name: "Opera House Foyer",
    entryText: "You are in the Foyer of the Opera House. This room has doors to the south and west, also an unusable exit to the north. The room is quiet and you don't see anyone around.",
    objects: [],
    triggers: [],
    actions: [],
    adjacentRooms: [{
      direction: directionSynonyms.west,
      roomId: 1
    }, {
      direction: directionSynonyms.south,
      roomId: 2
    }]
  }, {
    id: 1,
    name: "Cloak Room",
    entryText: "You are in the cloak room and you can see a hook on the wall.",
    objects: [],
    triggers: [],
    actions: [{
      name: "hang", // hang up cloak
      synonyms: ["hang", "place", "put"],
      func: function func(player, system, cmd, args) {
        if (args[0] === "cloak") {
          player.inventory = _.remove(player.inventory, function (i) {
            return i.name !== "cloak";
          });
          system.say("You take off your cloak and hang it up on the hook.");
        }
      }
    }],
    adjacentRooms: [{
      direction: directionSynonyms.east,
      roomId: 0
    }]
  }, {
    id: 2,
    name: "Bar",
    entryText: "",
    objects: [],
    triggers: [{
      name: "entry",
      func: function func(player, system) {
        // if the player is not wearing the cloak
        var hasCloak = _.find(player.inventory, function (i) {
          return i.name === "cloak";
        });

        if (hasCloak === undefined && player.won === undefined) {
          system.say("The room is lit vibrantly and you notice a message is scratched in sawdust on the floor.");
          player.won = true;
        } else if (player.won === false) {
          system.say("You can see the room now and there is nothing special about it. You do notice that there is a mess on the floor but you cannot discern why it's there.");
        } else {
          system.say("You are in the bar and it is extremely dark, you cannot see anything right now. You can't even see if there is a light switch.");
        }
      }
    }, {
      name: "movement",
      func: (function (player, system) {
        var hasCloak = _.find(player.inventory, function (i) {
          return i.name === "cloak";
        });

        if (hasCloak !== undefined) {
          player.won = false;
          system.say("Your movement has disturbed things within the room and the room is no longer as it was when you first entered.");
        }
      }).bind(this)
    }],
    actions: [{
      name: "message",
      synonyms: ["read"],
      func: function func(player, system, cmd, args) {
        var hasCloak = _.find(player.inventory, function (i) {
          return i.name === "cloak";
        });

        if (args[0] === "message") {
          if (hasCloak === undefined && player.won !== undefined && player.won) {
            system.say("The message on the floor reads, YOU WON!");
          } else if (player.won !== undefined && !player.won) {
            system.say("Because you disturbed the room while moving around in the dark you made the message written on the floor impossible to read. I'm sorry but you have lost.");
          } else {
            system.say("You cannot see anything in the room because it's too dark.");
          }
        }
      }
    }],
    adjacentRooms: [{
      direction: directionSynonyms.north,
      roomId: 0
    }]
  }];

  var objects = [{
    name: "cloak",
    description: "A eerily dark velvet cloak",
    synonyms: ["cloak", "dark cloak", "velvet cloak"],
    examine: function examine(player, system, args) {
      system.say(this.description);
    },
    type: {
      name: "garment",
      worn: true,
      description: "This garment is made of a light absorbing material causing it to cancels available light shedding darkness on objects around you."
    }
  }];

  var initialPlayerInventory = [_.find(objects, { "name": "cloak" })];

  function flattenDirectionSynonyms() {
    var result = [];

    for (var p in directionSynonyms) {
      if (directionSynonyms.hasOwnProperty(p)) {
        result = result.concat(directionSynonyms[p]);
      }
    }

    return result;
  }

  var CommandInput = (function (_React$Component) {
    _inherits(CommandInput, _React$Component);

    function CommandInput() {
      _classCallCheck(this, CommandInput);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CommandInput).call(this));

      _this.onCommandInputKeyUp = _this.onCommandInputKeyUp.bind(_this);

      _this.state = {
        commandIndex: -1,
        commandsEntered: []
      };
      return _this;
    }

    _createClass(CommandInput, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        // Make sure the command input box width is a consistant width based on the
        // width of the window.
        var $commandText = $("#commandText");

        this.setState({ commandText: $commandText });

        $commandText.width(window.innerWidth - 50);

        $(window).resize(function (e) {
          $commandText.width(window.innerWidth - 50);
        });
      }
    }, {
      key: "onCommandInputKeyUp",
      value: function onCommandInputKeyUp(e) {
        var _this2 = this;

        if (e.which === keys.Up) {
          var commandIndex = this.state.commandIndex === -1 ? this.state.commandsEntered.length - 1 : --this.state.commandIndex;

          if (commandIndex < 0) {
            commandIndex = 0;
          }

          this.setState({ commandIndex: commandIndex }, function () {
            this.state.commandText.val(this.state.commandsEntered[commandIndex]);
          });
        } else if (e.which === keys.Down) {

          var commandIndex = this.state.commandIndex === -1 ? 0 : ++this.state.commandIndex;

          if (commandIndex > this.state.commandsEntered.length) {
            commandIndex = this.state.commandsEntered.length;
          }

          this.setState({ commandIndex: commandIndex }, function () {
            this.state.commandText.val(this.state.commandsEntered[commandIndex]);
          });
        } else if (e.which === keys.Enter) {
          var _ret = (function () {

            var textEntered = _this2.state.commandText.val();
            if (!(textEntered.length > 0)) return {
                v: undefined
              };

            _this2.state.commandText.val("");

            _this2.setState({
              commandsEntered: _.uniq(_this2.state.commandsEntered.concat([textEntered])),
              commandIndex: -1
            }, function () {
              if (this.props.onKeyEnter !== undefined) {
                this.props.onKeyEnter(textEntered);
              }
            });
          })();

          if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
        }
      }
    }, {
      key: "render",
      value: function render() {
        var commandContainerStyle = {
          paddingLeft: "10px"
        };

        var textInputStyle = {
          border: "none",
          outline: "none",
          paddingLeft: "2px"
        };

        return React.createElement(
          "div",
          { id: "commandContainer", style: commandContainerStyle },
          ">",
          React.createElement("input", { id: "commandText", style: textInputStyle, type: "text", onKeyUp: this.onCommandInputKeyUp })
        );
      }
    }]);

    return CommandInput;
  })(React.Component);

  var InfoBar = (function (_React$Component2) {
    _inherits(InfoBar, _React$Component2);

    function InfoBar() {
      _classCallCheck(this, InfoBar);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(InfoBar).apply(this, arguments));
    }

    _createClass(InfoBar, [{
      key: "render",
      value: function render() {
        var infoStyle = {
          backgroundColor: "#000",
          position: "fixed",
          top: "0",
          width: "100%",
          paddingLeft: "10px"
        };

        var titleStyle = {
          backgroundColor: "#000",
          color: "#fff",
          marginBottom: "25px"
        };

        var roomStyle = {
          backgroundColor: "#000",
          color: "#fff"
        };

        var scoreStyle = {
          backgroundColor: "#000",
          color: "#fff",
          right: "20px",
          position: "absolute"
        };

        var separator = "";
        if (this.props.title !== undefined && this.props.title.length > 0 && this.props.room !== undefined && this.props.room.length > 0) {
          separator = " | ";
        }

        return React.createElement(
          "div",
          { id: "info", style: infoStyle },
          React.createElement(
            "span",
            { id: "title", style: titleStyle },
            this.props.title,
            " ",
            separator
          ),
          React.createElement(
            "span",
            { id: "room", style: roomStyle },
            this.props.room
          ),
          React.createElement(
            "span",
            { id: "score", style: scoreStyle },
            this.props.score
          )
        );
      }
    }]);

    return InfoBar;
  })(React.Component);

  var GameUI = (function (_React$Component3) {
    _inherits(GameUI, _React$Component3);

    function GameUI() {
      _classCallCheck(this, GameUI);

      var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(GameUI).call(this));

      _this4.onCommandEntered = _this4.onCommandEntered.bind(_this4);

      var playerCommands = [{
        synonyms: ["exits", "ex"],
        func: (function (player, system, cmd, args) {
          var exits = [];
          _.forEach(_.pluck(player.room.adjacentRooms, "direction"), function (d) {
            exits.push(_.first(d));
          });

          if (exits.length > 0) {
            this.say("the following exits are available: " + exits.join(', '));
          }
        }).bind(_this4)
      }, {
        synonyms: ["inventory", "i"],
        func: (function (player, system, cmd, args) {
          if (player.inventory.length > 0) {
            _.forEach(player.inventory, (function (i) {
              var modifier = "";

              if (i.type.name === "garment") {
                if (i.type.worn) {
                  modifier = "is";
                } else {
                  modifier = "is not";
                }

                this.say(i.name + " (which " + modifier + " being worn)");
              } else {
                this.say(i.name);
              }
            }).bind(this));
          } else {
            this.say("Your inventory contains no items.<br/>");
          }
        }).bind(_this4)
      }, {
        synonyms: ["look", "l"],
        func: (function (player, system, cmd, args) {
          if (player.room !== {} && player.room.entryText.length > 0) {
            this.say(player.room.entryText);
          }
        }).bind(_this4)
      }, {
        synonyms: ["examine", "x"],
        func: (function (player, system, cmd, args) {
          if (args.length > 0) {
            var obj = _.find(player.inventory, function (i) {
              return i.name === args[0];
            });

            if (obj !== undefined) {
              obj.examine(player, system, args);
            } else {
              this.say("I cannot examine that object.");
            }
          }
        }).bind(_this4)
      }, {
        synonyms: flattenDirectionSynonyms(),
        func: (function (player, system, cmd, args) {
          this.go(cmd);
        }).bind(_this4)
      }];

      var systemCommands = [{
        synonyms: ["/clear"],
        func: (function (cmd, args) {
          this.clear();
        }).bind(_this4)
      }, {
        synonyms: ["/restart"],
        func: (function (cmd, args) {
          this.clear();
          this.startGame();
        }).bind(_this4)
      }, {
        synonyms: ["help", "h"],
        func: (function (cmd, args) {
          var help = ["<b>/clear</b> - clears the screen", "<b>/restart</b> - restarts the game", "<b>h, help</b> - prints this message", "<b>i, inventory</b> - prints your inventory", "<b>l, look</b> - prints the description of the current room", "<b>x, examine</b> - prints a detailed description of an object", "<b>ex, exits</b> - prints the list of exits for this room", "<b>n, north, ne, northeast, nw, northwest, s, south, se, southeast, sw, southwest, e, east, w, west</b> - moves the player to a room relative to the direction specified"];

          this.say("<blockquote>" + help.join("<br/>") + "</blockquote>");
        }).bind(_this4)
      }];

      _this4.state = {
        rooms: rooms,
        objects: [],
        playerCommands: playerCommands,
        systemCommands: systemCommands,
        // minimal player object to satisfy the InfoBar title, room and score
        // properties
        player: {
          room: {
            name: ""
          },
          score: "" // this will be changed later
        }
      };
      return _this4;
    }

    _createClass(GameUI, [{
      key: "initializePlayer",
      value: function initializePlayer() {
        return {
          score: "", // this will be changed later
          room: {},
          inventory: initialPlayerInventory
        };
      }
    }, {
      key: "scrollContentArea",
      value: function scrollContentArea() {
        $("html, body").animate({ scrollTop: $(document).height() }, 1000);
      }
    }, {
      key: "clear",
      value: function clear() {
        this.state.content.html("");
      }
    }, {
      key: "printCommand",
      value: function printCommand(command) {
        this.state.content.append("<h3>&gt;" + command + "</h3>");
      }
    }, {
      key: "say",
      value: function say(text) {
        var newLine = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        if (text.length > 0) {
          var spacer = "";
          if (newLine) {
            spacer = "<p/>";
          }
          this.state.content.append(text + spacer);
          this.scrollContentArea();
        }
      }
    }, {
      key: "startGame",
      value: function startGame() {
        var firstRoom = _.findWhere(rooms, { "id": 0 });

        if (firstRoom !== undefined) {
          var player = this.initializePlayer();
          player.room = firstRoom;

          this.setState({ player: player }, (function () {
            this.say(gameInfo.description);
            this.say("Author: " + gameInfo.author + "<br/>Release Date: " + gameInfo.releaseDate);
            this.say("---");

            this.say(player.room.entryText);
          }).bind(this));
        }
      }
    }, {
      key: "getCommand",
      value: function getCommand(command, found) {
        var result = {};

        var findIn = function findIn(commands, commandType, found) {
          if (result !== {}) {
            _.forEach(commands, function (cmd) {
              if (_.indexOf(cmd.synonyms, command) > -1) {
                found({
                  commandType: commandType,
                  command: cmd
                });

                return false;
              }
            });
          }
        };

        var found = function found(res) {
          result = res;
        };

        findIn(this.state.playerCommands, "player", found);
        findIn(this.state.player.room.actions, "player", found);
        findIn(this.state.systemCommands, "system", found);

        return result;
      }
    }, {
      key: "findAndExecuteTrigger",
      value: function findAndExecuteTrigger(name) {
        if (this.state.player.room.triggers !== undefined && this.state.player.room.triggers.length > 0) {
          var trigger = _.find(this.state.player.room.triggers, function (t) {
            return t.name === name;
          });

          if (trigger !== undefined) {
            trigger.func(this.state.player, this);
          }
        }
      }
    }, {
      key: "go",
      value: function go(direction) {
        var adjacentRoom = _.filter(this.state.player.room.adjacentRooms, function (r) {
          return _.indexOf(r.direction, direction) > -1;
        });

        if (adjacentRoom.length > 0) {
          var room = _.find(this.state.rooms, { "id": adjacentRoom[0].roomId });

          if (room !== undefined) {
            this.say("entered: " + room.name);

            this.state.player.room = room;

            this.forceUpdate();

            if (this.state.player.room.entryText !== "") {
              this.say(this.state.player.room.entryText);
            }

            this.findAndExecuteTrigger("entry");
          }
        } else {
          this.say("You cannot go in that direction.");
          this.findAndExecuteTrigger("movement");
        }
      }
    }, {
      key: "onCommandEntered",
      value: function onCommandEntered(command) {
        this.printCommand(command);

        var split = command.split(" ");
        var cmd = split[0];
        var args = split.slice(1);

        var cmdObj = this.getCommand(cmd);

        if (cmdObj.commandType !== undefined) {
          if (cmdObj.commandType === "player") {
            cmdObj.command.func(this.state.player, this.state.systemAPI, cmd, args);
          } else if (cmdObj.commandType === "system") {
            cmdObj.command.func(cmd, args);
          }
        }

        this.scrollContentArea();
      }
    }, {
      key: "componentDidMount",
      value: function componentDidMount() {
        this.setState({
          content: $("#content"),
          player: this.initializePlayer(),
          systemAPI: {
            // Just one function here so far, if anything else is needed to be
            // called from the rooms or objects then it'll be put in here.
            say: (function (text, newLine) {
              this.say(text, newLine);
            }).bind(this)
          }
        }, function () {
          this.startGame();
        });
      }
    }, {
      key: "render",
      value: function render() {
        var contentStyle = {
          marginTop: "50px",
          padding: "10px"
        };

        return React.createElement(
          "div",
          null,
          React.createElement(InfoBar, { title: gameInfo.title,
            room: this.state.player.room.name,
            score: this.state.player.score }),
          React.createElement("div", { id: "content", style: contentStyle }),
          React.createElement(CommandInput, { onKeyEnter: this.onCommandEntered })
        );
      }
    }]);

    return GameUI;
  })(React.Component);

  return {
    init: function init() {
      ReactDOM.render(React.createElement(GameUI, null), document.getElementById("ui"));
    }
  };
})();

$(document).ready(function () {
  CloakOfDarkness.init();
});
//# sourceMappingURL=app.js.map
