"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// IFEngine.js - A small Interactive Fiction engine.
// Copyright (C) 2015  Frank Hale <frankhale@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var IFEngine = (function () {
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
    west: ["west", "w"],
    up: ["up"],
    down: ["down"]
  };

  function flattenDirectionSynonyms() {
    var result = [];

    for (var p in directionSynonyms) {
      if (directionSynonyms.hasOwnProperty(p)) {
        result = result.concat(directionSynonyms[p]);
      }
    }

    return result;
  }

  // borrowed from: http://stackoverflow.com/a/7220510/170217
  function syntaxHighlight(json) {
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  var DataLoader = (function () {
    function DataLoader() {
      _classCallCheck(this, DataLoader);
    }

    _createClass(DataLoader, [{
      key: "load",
      value: function load(dataUrl, _error, complete) {
        $.ajax({
          url: dataUrl,
          error: function error(status) {
            _error(status);
          },
          success: function success(data) {
            complete(data);
          }
        });
      }
    }, {
      key: "read",
      value: function read(data) {
        var idAndDataRegex = /^(\d+)\s+/;

        var readNumberedLines = function readNumberedLines(data) {
          // Example:
          //
          // 1 You are in the Foyer of the Opera House. This room has doors to the
          // 1 south and west, also an unusable exit to the north. The room is quiet
          // 1 and you don't see anyone around.

          var result = [];

          _.forEach(data, function (l) {
            if (idAndDataRegex.test(l)) {
              var s = l.split(idAndDataRegex).filter(function (el) {
                return el.length != 0;
              });

              result.push({
                id: Number(s[0]),
                text: s[1]
              });
            }
          });

          return result;
        };

        var joinNumberedLines = function joinNumberedLines(data) {
          var result = [];
          var ids = _.uniq(_.pluck(data, "id"));

          _.forEach(ids, function (id) {
            var d = _.where(data, { "id": id });
            var textJoined = _.pluck(d, "text").join(" ");

            result.push({
              id: id,
              text: textJoined
            });
          });

          return result;
        };

        var getGroupedLines = function getGroupedLines(data) {
          var groups = [];
          var temp = readNumberedLines(data);
          var ids = _.uniq(_.pluck(temp, "id"));

          _.forEach(ids, function (id) {
            var d = _.where(temp, { "id": id });

            groups.push({
              id: id,
              group: _.pluck(d, "text")
            });
          });

          return groups;
        };

        var getStructuredObject = function getStructuredObject(data, conditional) {
          var result = [];
          var groups = getGroupedLines(data);

          _.forEach(groups, function (g) {

            //console.log(g);

            var item = {
              id: g.id,
              name: g.group.shift().trim()
            };

            g.group.map(function (ig) {
              if (ig.indexOf(":") != -1) {
                var gName = ig.split(":")[0];

                var conditionalItem = undefined;

                if (conditional !== undefined) {
                  conditionalItem = conditional(gName, ig.replace(gName + ":", "").trim());
                }

                if (conditionalItem === undefined && ig.startsWith(gName)) {
                  item[gName] = ig.replace(gName + ":", "").trim().split(",").map(function (i) {
                    return i.trim();
                  });
                } else {
                  item[gName] = conditionalItem;
                }
              }
            });

            result.push(item);
          });

          return result;
        };

        var readText = function readText(data) {
          return joinNumberedLines(readNumberedLines(data));
        };

        var readSynonyms = function readSynonyms(data) {
          // Example:
          //
          // synonyms
          // 1 cloak, dark cloak, velvet cloak, jacket, overcoat
          // 2 hang, place, put, throw, toss
          // 3 read, look, ponder, interpret, consider
          // 4 message, words, inscription, sign
          // 5 foyer, front room, entrance
          // 6 cloak room, closet
          // 7 bar

          var temp = joinNumberedLines(readNumberedLines(data));
          var synonyms = [];

          _.forEach(temp, function (s) {
            synonyms.push({
              id: s.id,
              words: s.text.split(",").map(function (x) {
                return x.trim();
              })
            });
          });

          return synonyms;
        };

        var readRooms = function readRooms(data) {
          // Example:
          //
          // rooms
          // 1 Opera House Foyer
          // 1 synonyms: 5
          // 1 text: 1
          // 2 Cloak Room
          // 2 synonyms: 6
          // 2 text: 2
          // 3 The Bar
          // 3 synonyms: 7
          // 3 text: 3, 9, 11, 12

          return getStructuredObject(data, function (gName, data) {
            if (gName === "synonyms" || gName === "text") {
              return data.split(",").map(function (n) {
                return Number(n);
              });
            }
          });
        };

        var readActions = function readActions(data) {
          // Example:
          //
          // actions
          // 1 hang
          // 1 synonyms: 2
          // 1 text: 4
          // 2 read
          // 2 synonyms: 3
          // 2 text: 6, 7, 8

          return getStructuredObject(data, function (gName, data) {
            if (gName === "synonyms" || gName === "text" || gName === "rooms") {
              return data.split(",").map(function (n) {
                return Number(n);
              });
            }
          });
        };

        var readTriggers = function readTriggers(data) {
          // Example:
          //
          // triggers
          // 1 movement
          // 1 rooms: 3

          return getStructuredObject(data, function (gName, data) {
            if (gName === "rooms") {
              return data.split(" ").map(function (n) {
                return Number(n);
              });
            }
          });
        };

        var readObjects = function readObjects(data) {
          // Example:
          //
          // objects
          // 1 cloak
          // 1 synonyms: 1
          // 1 wearable: true
          // 1 text: 13, 14
          // 2 message
          // 2 synonyms: 4
          // 2 wearable: false
          // 2  text: 15

          return getStructuredObject(data, function (gName, data) {
            if (gName === "synonyms" || gName === "text") {
              return data.split(",").map(function (n) {
                return Number(n);
              });
            } else if (gName === "wearable") {
              var _result = false;

              if (data.toLowerCase().trim() === "true") {
                _result = true;
              } else if (data.toLowerCase().trim() === "false") {
                _result = false;
              }

              console.log(_result);

              return _result;
            }
          });
        };

        var readScenery = function readScenery(data) {
          return getStructuredObject(data);
        };

        var readExits = function readExits(data) {
          return readNumberedLines(data).map(function (e) {
            return {
              id: e.id,
              rooms: e.text.split(",").map(function (n) {
                return Number(n);
              })
            };
          });
        };

        var readPlayer = function readPlayer(data) {
          return getStructuredObject(data, function (gName, data) {
            if (gName === "items") {
              return data.split(",").map(function (n) {
                return Number(n);
              });
            } else if (gName === "description" || gName === "age" || gName === "startRoom") {
              return Number(data);
            }
          });
        };

        var lines = data.split("\n").filter(function (el) {
          return el.length != 0;
        });
        var name = lines.shift().trim();

        var result = {
          name: name
        };

        if (name === "text") {
          result.data = readText(lines);
        } else if (name === "synonyms") {
          result.data = readSynonyms(lines);
        } else if (name === "rooms") {
          result.data = readRooms(lines);
        } else if (name === "actions") {
          result.data = readActions(lines);
        } else if (name === "triggers") {
          result.data = readTriggers(lines);
        } else if (name === "objects") {
          result.data = readObjects(lines);
        } else if (name === "scenery") {
          result.data = readScenery(lines);
        } else if (name === "exits") {
          result.data = readExits(lines);
        } else if (name === "player") {
          result.data = readPlayer(lines);
        } else {
          result.data = [];
        }

        return result;
      }
    }]);

    return DataLoader;
  })();

  var InfoBar = (function (_React$Component) {
    _inherits(InfoBar, _React$Component);

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

  var CommandInput = (function (_React$Component2) {
    _inherits(CommandInput, _React$Component2);

    function CommandInput() {
      _classCallCheck(this, CommandInput);

      var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(CommandInput).call(this));

      _this2.onCommandInputKeyUp = _this2.onCommandInputKeyUp.bind(_this2);
      _this2.state = {
        commandIndex: -1,
        commandsEntered: []
      };
      return _this2;
    }

    _createClass(CommandInput, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        // Make sure the command input box width is a consistant width based on the
        // width of the window.
        var $commandText = $("#commandText");

        // this may need to be changed later if I have more rich UI's but basically
        // this will make sure the command input is always focused, hopefully.
        // $(commandText).on("blur", () => {
        //   $commandText.focus();
        // });

        this.setState({ commandText: $commandText });

        function resizeCommandInput() {
          $commandText.width(window.innerWidth - 50);
        }

        resizeCommandInput();

        $(window).resize(function (e) {
          resizeCommandInput();
        });
      }
    }, {
      key: "onCommandInputKeyUp",
      value: function onCommandInputKeyUp(e) {
        var _this3 = this;

        if (e.which === keys.Up) {
          (function () {
            var commandIndex = _this3.state.commandIndex === -1 ? _this3.state.commandsEntered.length - 1 : --_this3.state.commandIndex;

            if (commandIndex < 0) {
              commandIndex = 0;
            }

            _this3.setState({ commandIndex: commandIndex }, function () {
              this.state.commandText.val(this.state.commandsEntered[commandIndex]);
            });
          })();
        } else if (e.which === keys.Down) {
          (function () {
            var commandIndex = _this3.state.commandIndex === -1 ? 0 : ++_this3.state.commandIndex;

            if (commandIndex > _this3.state.commandsEntered.length) {
              commandIndex = _this3.state.commandsEntered.length;
            }

            _this3.setState({ commandIndex: commandIndex }, function () {
              this.state.commandText.val(this.state.commandsEntered[commandIndex]);
            });
          })();
        } else if (e.which === keys.Enter) {
          var _ret3 = (function () {
            var textEntered = _this3.state.commandText.val();
            if (!(textEntered.length > 0)) return {
                v: undefined
              };

            _this3.state.commandText.val("");

            _this3.setState({
              commandsEntered: _.uniq(_this3.state.commandsEntered.concat([textEntered])),
              commandIndex: -1
            }, function () {
              if (this.props.onKeyEnter !== undefined) {
                this.props.onKeyEnter(textEntered);
              }
            });
          })();

          if ((typeof _ret3 === "undefined" ? "undefined" : _typeof(_ret3)) === "object") return _ret3.v;
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
          React.createElement("input", { id: "commandText", style: textInputStyle, type: "text", onKeyUp: this.onCommandInputKeyUp, autoFocus: true })
        );
      }
    }]);

    return CommandInput;
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
          var indices = [];

          //console.log(player.room.exits);

          for (var i = 0; i < player.room.exits.length; i++) {
            if (player.room.exits[i] !== 0) {
              indices.push(i);
            }
          }

          //console.log(indices);

          indices.map(function (i) {
            var counter = 0;
            for (var d in directionSynonyms) {
              if (counter === i) {
                exits.push(d);
                return;
              }
              counter++;
            }
          });

          if (exits.length > 0) {
            this.say("the following exits are available: " + exits.join(', '));
          }
        }).bind(_this4)
      }, {
        synonyms: ["inventory", "i"],
        func: (function (player, system, cmd, args) {
          // if(player.inventory.length > 0) {
          //   _.forEach(player.inventory, function(i) {
          //     var modifier = "";
          //
          //     if(i.type.name === "garment") {
          //       if(i.type.worn) {
          //         modifier = "is";
          //       } else {
          //         modifier = "is not";
          //       }
          //
          //       this.say(i.name + " (which " + modifier + " being worn)");
          //     } else {
          //       this.say(i.name);
          //     }
          //   }.bind(this));
          // } else {
          //   this.say("Your inventory contains no items.<br/>");
          // }
          this.say(cmd + " has not yet been implemented.");
        }).bind(_this4)
      }, {
        synonyms: ["look", "l"],
        func: (function (player, system, cmd, args) {
          if (player.room !== undefined) {
            this.say(player.room.text[0].text);
          }
        }).bind(_this4)
      }, {
        synonyms: ["examine", "x"],
        func: (function (player, system, cmd, args) {
          if (args.length > 0) {
            if (args[0].toLowerCase() === "self" || args[0].toLowerCase() === "me") {
              var self = _.find(this.state.data.player, { "name": "self" });

              if (self !== undefined) {
                var desc = _.find(this.state.data.text, { "id": self.description });
                //console.log(self, desc);
                this.say(desc.text);
              }
            } else {
              //TODO: We need to provide a way to get an object description
              //      here...

              this.say("I don't know what that is.");
            }
          } else {
            this.say("usage: x|examine [something]");
          }
        }).bind(_this4)
      }, {
        synonyms: flattenDirectionSynonyms(),
        func: (function (player, system, cmd, args) {
          this.go(cmd);
        }).bind(_this4)
      }];

      var systemCommands = [{
        synonyms: ["/banner"],
        func: (function (cmd, args) {
          this.printBanner();
        }).bind(_this4)
      }, {
        synonyms: ["/save"],
        func: (function (cmd, args) {
          //this.say("not yet implemented.");

          var json = JSON.stringify(this.state.player, null, 2);
          this.say("<h3>Player Data</h3><pre>" + syntaxHighlight(json) + "</pre>");
          this.say("<h3>Encoded</h3>" + btoa(JSON.stringify(this.state.player, null, 2)));
        }).bind(_this4)
      }, {
        synonyms: ["/restore"],
        func: (function (cmd, args) {
          var _this5 = this;

          //this.say("not yet implemented.");
          //console.log(atob("ewogICJzY29yZSI6IDAsCiAgInJvb20iOiB7fSwKICAiaW52ZW50b3J5IjogW10KfQ=="));

          if (args.length > 0) {
            try {
              (function () {
                var restoredJSON = JSON.parse(atob(args[0]));
                _this5.say("<h3>Restored Player Data</h3><pre>" + syntaxHighlight(restoredJSON) + "</pre>");
                _this5.say("Restoring player save data.");

                // need to check the properties on the player object because we
                // don't want to restore some arbitary JSON object and then overwrite
                // the player object.

                var canRestore = [];
                var props = ["score", "rooms", "inventory"];

                props.map(function (p) {
                  canRestore.push(true);
                });
                canRestore = _.find(canRestore, false);

                if (canRestore === undefined) {
                  canRestore = true;
                }

                if (canRestore) {
                  _this5.setState({
                    player: restoredJSON
                  }, (function () {
                    this.say("Finished restoring player save data.");
                  }).bind(_this5));
                } else {
                  _this5.say("I cannot restore this save data.");
                }
              })();
            } catch (e) {
              //console.log(e);
              this.say("Sorry I cannot restore your game.");
            }
          } else {
            this.say("usage: /restore [encoded string]");
          }
        }).bind(_this4)
      }, {
        synonyms: ["/undo"],
        func: (function (cmd, args) {
          this.say("not yet implemented.");
        }).bind(_this4)
      }, {
        synonyms: ["/debug"],
        func: (function (cmd, args) {
          var json = "";

          if (args.length > 0 && this.state.data.hasOwnProperty(args[0])) {
            json = JSON.stringify(this.state.data[args[0]], null, 2);
            this.say("<h3>Game Data - " + args[0] + "</h3>");
          } else {
            json = JSON.stringify(this.state.data, null, 2);
            this.say("<h3>Game Data - All</h3>");
          }

          this.say("<pre>" + syntaxHighlight(json) + "</pre>");
        }).bind(_this4)
      }, {
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
          var help = ["<b>/banner</b> - prints the game title, description and author.", "<b>/debug [key]</b> - prints the game data object for debugging purposes.", "<b>/save</b> - prints an encoded string you can use to restore your game.", "<b>/restore &lt;encoded string&gt;</b> - restores a previous game.", "<b>/clear</b> - clears the screen", "<b>/restart</b> - restarts the game", "<b>h, help</b> - prints this message", "<b>i, inventory</b> - prints your inventory", "<b>l, look</b> - prints the description of the current room", "<b>x, examine &lt;object&gt;</b> - prints a detailed description of an object", "<b>ex, exits</b> - prints the list of exits for this room", "<b>n, north, ne, northeast, nw, northwest, s, south, se, southeast, sw, southwest, e, east, w, west</b> - moves the player to a room relative to the direction specified"];

          this.say("<h3>Help:</h3><blockquote>" + help.join('<br/>') + "</blockquote>");
        }).bind(_this4)
      }];

      _this4.state = {
        playerCommands: playerCommands,
        systemCommands: systemCommands,
        // minimal player object to satisfy the InfoBar title, room and score
        // properties
        roomName: "",
        score: 0,
        moves: 0
      };
      return _this4;
    }

    _createClass(GameUI, [{
      key: "initializePlayer",
      value: function initializePlayer() {
        return {
          score: 0,
          moves: 0,
          room: {},
          previousRooms: {},
          inventory: []
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
      key: "printBanner",
      value: function printBanner() {
        this.say(this.state.gameInfo.title + "<br/>");
        this.say(this.state.gameInfo.description);
        this.say("Author: " + this.state.gameInfo.author + "<br/>Release Date: " + this.state.gameInfo.releaseDate);
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
      key: "getSynonyms",
      value: function getSynonyms(id) {
        var synonyms = _.find(this.state.data.synonyms, { "id": id });
        if (synonyms !== undefined) {
          return synonyms.words;
        } else {
          return [];
        }
      }
    }, {
      key: "getExits",
      value: function getExits(id) {
        var exits = _.find(this.state.data.exits, { "id": id });
        if (exits !== undefined) {
          return exits.rooms;
        } else {
          return [];
        }
      }
    }, {
      key: "getActions",
      value: function getActions(id) {
        var _this6 = this;

        var actions = _.filter(this.state.data.actions, function (a) {
          if (a.rooms.indexOf(id) > -1) {
            return a;
          }
        });

        if (actions !== undefined) {
          _.forEach(actions, function (a) {
            var actionImpl = _.find(_this6.state.gameInfo.actions, { "name": a.name });
            if (actionImpl !== undefined) {
              a.func = actionImpl.func;
            }
          });

          return actions;
        } else {
          return [];
        }
      }
    }, {
      key: "getTriggers",
      value: function getTriggers(id) {
        var triggers = _.find(this.state.data.triggers, { "id": id });
        if (triggers !== undefined) {
          return triggers;
        } else {
          return [];
        }
      }
    }, {
      key: "getObjects",
      value: function getObjects(id) {
        var objects = _.find(this.state.data.objects, { "id": id });
        if (actions !== undefined) {
          return objects;
        } else {
          return [];
        }
      }
    }, {
      key: "getText",
      value: function getText(id) {
        var text = _.find(this.state.data.text, { "id": id });
        if (text !== undefined) {
          return text;
        } else {
          return [];
        }
      }
    }, {
      key: "getRoom",
      value: function getRoom(id) {
        var _this7 = this;

        var room = _.find(this.state.data.rooms, { "id": id });

        if (room !== undefined) {
          var result = {
            id: id,
            name: room.name,
            synonyms: _.uniq(_.flatten(room.synonyms.map(function (s) {
              return _this7.getSynonyms(s);
            }))),
            text: room.text.map(function (t) {
              return _this7.getText(t);
            }),
            exits: this.getExits(id),
            actions: this.getActions(id),
            triggers: this.getTriggers(id)
          };

          _.forEach(result.actions, function (a) {
            a.synonyms = _.uniq(_.flatten(a.synonyms.map(function (s) {
              return _this7.getSynonyms(s);
            })));
          });

          //console.log(result);

          return result;
        }
      }
    }, {
      key: "startGame",
      value: function startGame() {
        var misc = _.find(this.state.data.player, { "name": "misc" });
        var startingRoom = this.getRoom(misc.startRoom);

        //console.log(misc);
        //console.log(startingRoom);

        if (startingRoom !== undefined) {
          var player = this.initializePlayer();
          player.room = startingRoom;

          //player.inventory = _.uniq(_.flatten(room.synonyms.map((s) => { return this.getSynonyms(s); }))),

          this.setState({
            player: player,
            roomName: player.room.name
          }, (function () {
            this.printBanner();
            this.say("---");
            this.say(startingRoom.text[0].text);
          }).bind(this));
        }
      }
    }, {
      key: "getCommand",
      value: function getCommand(command) {
        var result = {};
        var foundCommand = false;
        var found = function found(res) {
          result = res;
        };
        var findIn = function findIn(commands, commandType, found) {
          if (result !== {}) {
            _.forEach(commands, function (cmd) {
              if (_.indexOf(cmd.synonyms, command) > -1) {
                foundCommand = true;

                found({
                  commandType: commandType,
                  command: cmd
                });

                return false;
              }
            });
          }
        };

        findIn(this.state.systemCommands, "system", found);
        findIn(this.state.playerCommands, "player", found);
        findIn(this.state.player.room.actions, "player", found);

        // console.log("---");
        // console.log(this.state.player.room);
        // console.log(this.state.player.room.actions);
        // console.log("---");

        if (!foundCommand) {
          this.say("I don't understand: " + command);
        }

        return result;
      }
    }, {
      key: "findAndExecuteTrigger",
      value: function findAndExecuteTrigger(name) {
        // if(this.state.player.room.triggers !== undefined &&
        //    this.state.player.room.triggers.length > 0) {
        //   var trigger = _.find(this.state.player.room.triggers, function(t) {
        //     return t.name === name;
        //   });
        //
        //   if(trigger !== undefined) {
        //     trigger.func(this.state.player, this);
        //   }
        // }
      }
    }, {
      key: "go",
      value: function go(direction) {
        var _this8 = this;

        // The room exits are an array and the following indices correspond to the
        // following directions.

        // 0: north: ["north", "n"]
        // 1: northEast: ["northeast", "ne"]
        // 2: northWest: ["northwest", "nw"]
        // 3: south: ["south", "s"]
        // 4: southEast: ["southeast", "se"]
        // 5: southWest: ["southwest", "sw"]
        // 6: east: ["east", "e"]
        // 7: west: ["west", "w"]
        // 8: up: ["up"]
        // 9: down: ["down"]

        var dirName = _.findKey(directionSynonyms, function (ds) {
          return ds.indexOf(direction) > -1;
        });

        if (dirName !== undefined) {
          (function () {
            //console.log(`Direction: ${dirName}`);
            var index = 0;

            for (var p in directionSynonyms) {
              if (p === dirName) {
                break;
              }
              index++;
            }

            //console.log(`index = ${index} | directionSynonyms = ${directionSynonyms[dirName]}`);

            var newRoom = _this8.getRoom(_this8.state.player.room.exits[index]);

            if (newRoom !== undefined) {
              //console.log(newRoom);
              _this8.state.player.room = newRoom;

              _this8.setState({
                roomName: _this8.state.player.room.name
              }, function () {
                _this8.say("Entered: " + newRoom.name);
                _this8.say(_this8.state.player.room.text[0].text);
                //this.findAndExecuteTrigger("entry");
              });
            } else {
                _this8.say("I cannot go in that direction.");
                //this.findAndExecuteTrigger("movement");
              }
          })();
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
          gameInfo: this.props.gameInfo,
          data: this.props.data,
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
          marginLeft: "10px"
        };

        return React.createElement(
          "div",
          null,
          React.createElement(InfoBar, { title: this.props.gameInfo.title,
            room: this.state.roomName,
            score: this.state.score }),
          React.createElement("div", { id: "content", style: contentStyle }),
          React.createElement(CommandInput, { onKeyEnter: this.onCommandEntered })
        );
      }
    }]);

    return GameUI;
  })(React.Component);

  return {
    init: function init(gameInfo) {
      var dl = new DataLoader();

      dl.load(gameInfo.dataFile, function (status) {
        console.log(status);
      }, function (data) {
        var dataParts = data.split("\n\r");
        //console.log(`Total chunks = ${dataParts.length}`);

        var gdata = {};

        _.forEach(dataParts, function (dp) {
          var result = dl.read(dp);
          gdata[result.name] = result.data;
        });

        // console.log("---game data loaded---");
        // console.log(gdata);
        // console.log("----------------------");

        ReactDOM.render(React.createElement(GameUI, { gameInfo: gameInfo, data: gdata }), document.getElementById("ui"));
      });
    }
  };
})();
//# sourceMappingURL=ifengine.js.map
