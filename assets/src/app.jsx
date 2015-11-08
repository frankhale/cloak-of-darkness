var CloakOfDarkness = (function() {
  const gameInfo = {
    title: "Cloak of Darkness",
    description: "Welcome, Cloak of Darkness is an implementation of the de facto 'Hello, World' of interactive  fiction by the same name. If you want to find out what a 'Cloak of Darkness' is you can find out more <a href='http://www.firthworks.com/roger/cloak' target='_blank'>here</a>.",
    author: "Frank Hale <frankhale@gmail.com>",
    releaseDate: "8 November 2015"
  };

  const keys = {
    Enter: 13,
    Up: 38,
    Down: 40
  };

  const directionSynonyms = {
    north: ["north", "n"],
    northEast: ["northeast", "ne"],
    northWest: ["northwest", "nw"],
    south: ["south", "s"],
    southEast: ["southeast", "se"],
    southWest: ["southwest", "sw"],
    east: ["east", "e"],
    west: ["west", "w"]
  };

  function flattenDirectionSynonyms() {
    let result = [];

    for(let p in directionSynonyms) {
      if(directionSynonyms.hasOwnProperty(p)) {
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

  class DataLoader {
    load(dataUrl, error, complete) {
      $.ajax({
        url: dataUrl,
        error: function(status) {
          error(status);
        },
        success: function(data) {
          complete(data)
        }
      });
    }
    read(data) {
      const idAndDataRegex = /^(\d+)\s+/;

      let readNumberedLines = (data) => {
        // Example:
        //
        // 1 You are in the Foyer of the Opera House. This room has doors to the
        // 1 south and west, also an unusable exit to the north. The room is quiet
        // 1 and you don't see anyone around.

        let result = [];

        _.forEach(data, (l) => {
          if(idAndDataRegex.test(l)) {
            const s = l.split(idAndDataRegex)
                     .filter(function(el) {return el.length != 0});

            result.push({
              id: Number(s[0]),
              text: s[1]
            });
          }
        });

        return result;
      }

      let joinNumberedLines = (data) => {
        let result = [];
        const ids = _.uniq(_.pluck(data, "id"));

        _.forEach(ids, (id) => {
          const d = _.where(data, { "id" : id});
          const textJoined = _.pluck(d, "text").join(" ");

          result.push({
            id: id,
            text: textJoined
          });
        });

        return result;
      }

      let getGroupedLines = (data) => {
        let groups = [];
        const temp = readNumberedLines(data);
        const ids = _.uniq(_.pluck(temp, "id"));

        _.forEach(ids, (id) => {
          const d = _.where(temp, { "id" : id});

          groups.push({
             id: id,
             group: _.pluck(d, "text")
          });
        });

        return groups;
      }

      let getStructuredObject = (data, conditional) => {
        let result = [];
        const groups = getGroupedLines(data);

        _.forEach(groups, (g) => {
          let item = {
            name: g.group.shift().trim()
          };

          g.group.map((ig) => {
            if(ig.indexOf(":") != -1) {
              const gName = ig.split(":")[0];

              let conditionalItem;

              if(conditional !== undefined) {
                conditionalItem = conditional(gName, ig.replace(`${gName}:`, "").trim());
              }

              if(conditionalItem === undefined && ig.startsWith(gName)) {
                item[gName] = ig.replace(`${gName}:`, "").trim().split(",").map((i) => { return i.trim(); });
              } else {
                item[gName] = conditionalItem;
              }
            }
          });

          result.push(item);
        });

        return result;
      }

      let readText = (data) => {
        return joinNumberedLines(readNumberedLines(data));
      };

      let readSynonyms = (data) => {
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

        const temp = joinNumberedLines(readNumberedLines(data));
        let synonyms = [];

        _.forEach(temp, (s) => {
          synonyms.push({
            id: s.id,
            words: s.text.split(",").map((x) => { return x.trim(); })
          });
        });

        return synonyms;
      }

      let readRooms = (data) => {
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

        return getStructuredObject(data, (gName, data) => {
          if(gName === "synonyms" || gName === "text") {
            return data.split(",").map((n) => { return Number(n); });
          }
        });
      }

      let readActions = (data) => {
        // Example:
        //
        // actions
        // 1 hang
        // 1 synonyms: 2
        // 1 text: 4
        // 2 read
        // 2 synonyms: 3
        // 2 text: 6, 7, 8

        return getStructuredObject(data, (gName, data) => {
          if(gName === "synonyms" || gName === "text") {
            return data.split(",").map((n) => { return Number(n); });
          }
        });
      }

      let readTriggers = (data) => {
        // Example:
        //
        // triggers
        // 1 movement
        // 1 rooms: 3

        return getStructuredObject(data, (gName, data) => {
          if(gName === "rooms") {
            return data.split(" ").map((n) => { return Number(n); });
          }
        });
      }

      let readObjects = (data) => {
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

        return getStructuredObject(data, (gName, data) => {
          if(gName === "synonyms" || gName === "text") {
            return data.split(",").map((n) => { return Number(n); });
          } else if (gName === "wearable") {
            let result = false;

            if(data.toLowerCase().trim().substr("true") > -1) {
              result = true;
            } else if(data.toLowerCase().trim().substr("false") > -1) {
              result = false;
            }
            return result;
          }
        });
      }

      let readExits = (data) => {
        return readNumberedLines(data).map((e) => {
          return {
            id: e.id,
            rooms: e.text.split(",").map((n) => { return Number(n); })
          }
        });
      }

      let readPlayer = (data) => {
        return getStructuredObject(data, (gName, data) => {
          if(gName === "items") {
            return data.split(",").map((n) => { return Number(n); });
          } else if (gName === "description" || gName === "age") {
            return Number(data);
          }
        });
      }

      const lines = data.split("\n").filter((el) => {return el.length != 0});
      const name = lines.shift().trim();

      let result = {
        name: name
      };

      if(name === "text") {
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
      } else if (name === "exits") {
        result.data = readExits(lines);
      } else if (name === "player") {
        result.data = readPlayer(lines);
      } else {
        result.data = [];
      }

      return result;
    }
  }

  class InfoBar extends React.Component {
    render() {
      const infoStyle = {
        backgroundColor: "#000",
        position: "fixed",
        top: "0",
        width: "100%",
        paddingLeft: "10px"
      };

      const titleStyle = {
        backgroundColor: "#000",
        color: "#fff",
        marginBottom: "25px"
      };

      const roomStyle = {
        backgroundColor: "#000",
        color: "#fff",
      };

      const scoreStyle = {
        backgroundColor: "#000",
        color: "#fff",
        right: "20px",
        position: "absolute"
      };

      let separator = "";
      if((this.props.title !== undefined && this.props.title.length > 0) &&
         (this.props.room !== undefined && this.props.room.length > 0)) {
           separator = " | ";
         }

      return (
        <div id="info" style={infoStyle}>
          <span id="title" style={titleStyle}>{this.props.title} {separator}</span>
          <span id="room" style={roomStyle}>{this.props.room}</span>
          <span id="score" style={scoreStyle}>{this.props.score}</span>
        </div>
      );
    }
  }

  class CommandInput extends React.Component {
    constructor() {
      super();
      this.onCommandInputKeyUp = this.onCommandInputKeyUp.bind(this);
      this.state = {
        commandIndex: -1,
        commandsEntered: []
      };
    }
    componentDidMount() {
      // Make sure the command input box width is a consistant width based on the
      // width of the window.
      const $commandText = $("#commandText");

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

      $(window).resize((e) => {
        resizeCommandInput();
      });
    }
    onCommandInputKeyUp(e) {
      if(e.which === keys.Up) {
        let commandIndex = (this.state.commandIndex === -1) ?
                            this.state.commandsEntered.length - 1 :
                            --this.state.commandIndex;

        if(commandIndex < 0) {
          commandIndex = 0;
        }

        this.setState({ commandIndex: commandIndex}, function() {
          this.state.commandText.val(this.state.commandsEntered[commandIndex]);
        });

      } else if (e.which === keys.Down) {
        let commandIndex = (this.state.commandIndex === -1) ? 0 : ++this.state.commandIndex;

        if(commandIndex > this.state.commandsEntered.length) {
          commandIndex = this.state.commandsEntered.length;
        }

        this.setState({ commandIndex: commandIndex }, function() {
          this.state.commandText.val(this.state.commandsEntered[commandIndex]);
        });

      } else if(e.which === keys.Enter) {
        const textEntered = this.state.commandText.val();
        if(!(textEntered.length > 0)) return;

        this.state.commandText.val("");

        this.setState({
          commandsEntered: _.uniq(this.state.commandsEntered.concat([textEntered])),
          commandIndex: -1
        }, function() {
          if(this.props.onKeyEnter !== undefined) {
            this.props.onKeyEnter(textEntered);
          }
        });
      }
    }
    render() {
      const commandContainerStyle = {
        paddingLeft: "10px"
      };

      const textInputStyle = {
        border: "none",
        outline: "none",
        paddingLeft: "2px"
      };

      return (
        <div id="commandContainer" style={commandContainerStyle}>
          &gt;<input id="commandText" style={textInputStyle} type="text" onKeyUp={this.onCommandInputKeyUp} autoFocus />
        </div>
      );
    }
  }

  class GameUI extends React.Component {
    constructor() {
      super();
      this.onCommandEntered = this.onCommandEntered.bind(this);

      const playerCommands = [
        {
          synonyms: ["exits", "ex"],
          func: function(player, system, cmd, args) {
            // var exits = [];
            // _.forEach(_.pluck(player.room.adjacentRooms, "direction"), function(d) {
            //   exits.push(_.first(d));
            // });
            //
            // if(exits.length > 0) {
            //   this.say(`the following exits are available: ${exits.join(', ')}`);
            // }
            this.say(`${cmd} has not yet been implemented.`);
          }.bind(this)
        },
        {
          synonyms: ["inventory", "i"],
          func: function(player, system, cmd, args) {
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
            this.say(`${cmd} has not yet been implemented.`);
          }.bind(this)
        },
        {
          synonyms: ["look", "l"],
          func: function(player, system, cmd, args) {
            // if(player.room !== {} &&
            //    player.room.entryText.length > 0) {
            //   this.say(player.room.entryText);
            // }
            this.say(`${cmd} has not yet been implemented.`);
          }.bind(this)
        },
        {
          synonyms: ["examine", "x"],
          func: function(player, system, cmd, args) {
            if(args.length > 0) {
              // var obj = _.find(player.inventory, function(i) {
              //   return i.name === args[0];
              // })
              //
              // if(obj !== undefined) {
              //   obj.examine(player, system, args);
              // } else {
              //   this.say("I cannot examine that object.");
              // }

              if(args[0].toLowerCase() === "self" ||
                 args[0].toLowerCase() === "me") {
                var self = _.find(this.state.data.player, { "name" :"self" });

                if(self !== undefined) {
                  var desc = _.find(this.state.data.text, { "id" : self.description });
                  console.log(self, desc);
                  this.say(desc.text);
                }
              } else {
                this.say("I don't know what that is.");
              }
            } else {
              this.say("usage: x|examine [something]");
            }
          }.bind(this)
        },
        {
          synonyms: flattenDirectionSynonyms(),
          func: function(player, system, cmd, args) {
            //this.go(cmd);
            this.say("movement directions are not yet implemented.");
          }.bind(this)
        }
      ];

      const systemCommands = [
        {
          synonyms: ["/save"],
          func: function(cmd, args) {
            //this.say("not yet implemented.");

            const json = JSON.stringify(this.state.player, null, 2);
            this.say(`<h3>Player Data</h3><pre>${syntaxHighlight(json)}</pre>`);
            this.say(`<h3>Encoded</h3>${btoa(JSON.stringify(this.state.player, null, 2))}`);
          }.bind(this)
        },
        {
          synonyms: ["/restore"],
          func: function(cmd, args) {
            //this.say("not yet implemented.");
            //console.log(atob("ewogICJzY29yZSI6IDAsCiAgInJvb20iOiB7fSwKICAiaW52ZW50b3J5IjogW10KfQ=="));

            if(args.length > 0) {
              try {
                let restoredJSON = JSON.parse(atob(args[0]));
                this.say(`<h3>Restored Player Data</h3><pre>${syntaxHighlight(restoredJSON)}</pre>`);
                this.say("Restoring player save data.");

                // need to check the properties on the player object because we
                // don't want to restore some arbitary JSON object and then overwrite
                // the player object.

                let canRestore = [];
                const props = ["score", "rooms", "inventory"];

                props.map((p) => { canRestore.push(true); });
                canRestore = _.find(canRestore, false);

                if(canRestore === undefined) {
                  canRestore = true;
                }

                if(canRestore) {
                  this.setState({
                    player: restoredJSON
                  }, function() {
                    this.say("Finished restoring player save data.");
                  }.bind(this));
                } else {
                  this.say("I cannot restore this save data.");
                }
              } catch(e) {
                console.log(e);
                this.say("Sorry I cannot restore your game.");
              }
            } else {
              this.say("usage: /restore [encoded string]");
            }

          }.bind(this)
        },
        {
          synonyms: ["/undo"],
          func: function(cmd, args) {
            this.say("not yet implemented.");
          }.bind(this)
        },
        {
          synonyms: ["/debug"],
          func: function(cmd, args) {
            const json = JSON.stringify(this.state.data, null, 2);
            this.say(`<h3>Game Data</h3><pre>${syntaxHighlight(json)}</pre>`);
          }.bind(this)
        },
        {
          synonyms: ["/clear"],
          func: function(cmd, args) {
            this.clear();
          }.bind(this)
        },
        {
          synonyms: ["/restart"],
          func: function(cmd, args) {
            this.clear();
            this.startGame();
          }.bind(this)
        },
        {
          synonyms: ["help","h"],
          func: function(cmd, args) {
            var help = [
              "<b>/save</b> - prints an encoded string you can use to restore your game.",
              "<b>/restore [encoded string] - restores a previous game.</b>",
              "<b>/clear</b> - clears the screen",
              "<b>/restart</b> - restarts the game",
              "<b>h, help</b> - prints this message",
              "<b>i, inventory</b> - prints your inventory",
              "<b>l, look</b> - prints the description of the current room",
              "<b>x, examine</b> - prints a detailed description of an object",
              "<b>ex, exits</b> - prints the list of exits for this room",
              "<b>n, north, ne, northeast, nw, northwest, s, south, se, southeast, sw, southwest, e, east, w, west</b> - moves the player to a room relative to the direction specified",
            ];

            this.say(`<blockquote>${help.join('<br/>')}</blockquote>`);
          }.bind(this)
        }
      ];

      this.state = {
        playerCommands: playerCommands,
        systemCommands: systemCommands,
        // minimal player object to satisfy the InfoBar title, room and score
        // properties
        roomName: "",
        score: 0
      }
    }
    initializePlayer() {
      return {
        score: 0,
        room: {},
        inventory: [] // <- will contain the cloak
      }
    }
    scrollContentArea() {
      $("html, body").animate({ scrollTop: $(document).height() }, 1000);
    }
    clear() {
      this.state.content.html("");
    }
    printCommand(command) {
      this.state.content.append("<h3>&gt;" + command + "</h3>");
    }
    say(text, newLine = true) {
      if(text.length > 0) {
        var spacer = "";
        if(newLine) {
          spacer = "<p/>";
        }
        this.state.content.append(text + spacer);
        this.scrollContentArea();
      }
    }
    startGame() {
      // var firstRoom = _.findWhere(rooms, { "id": 0 });
      //
      // if(firstRoom !== undefined) {
      //   var player = this.initializePlayer();
      //   player.room = firstRoom;
      //
      //   this.setState({ player: player }, function() {
      //     this.say(gameInfo.description);
      //     this.say(`Author: ${gameInfo.author}<br/>Release Date: ${gameInfo.releaseDate}`);
      //     this.say("---");
      //
      //     this.say(player.room.entryText);
      //   }.bind(this));
      // }
    }
    getCommand(command) {
      let result = {};
      let foundCommand = false;
      let found = (res) => { result = res; };
      let findIn = (commands, commandType, found) => {
        if(result !== {}) {
          _.forEach(commands, (cmd) => {
            if(_.indexOf(cmd.synonyms, command) > -1) {
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
      // findIn(this.state.player.room.actions, "player", found)

      if(!foundCommand) {
        this.say(`I don't understand: ${command}`);
      }

      return result;
    }
    findAndExecuteTrigger(name) {
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
    go(direction) {
      // var adjacentRoom = _.filter(this.state.player.room.adjacentRooms, function(r) {
      //   return _.indexOf(r.direction, direction) > -1;
      // });
      //
      // if(adjacentRoom.length > 0) {
      //   var room = _.find(this.state.rooms, { "id": adjacentRoom[0].roomId });
      //
      //   if(room !== undefined) {
      //     this.say("entered: " + room.name);
      //
      //     this.state.player.room = room;
      //
      //     this.forceUpdate();
      //
      //     if(this.state.player.room.entryText !== "") {
      //       this.say(this.state.player.room.entryText);
      //     }
      //
      //     this.findAndExecuteTrigger("entry");
      //   }
      // } else {
      //    this.say("You cannot go in that direction.");
      //    this.findAndExecuteTrigger("movement");
      // }
    }
    onCommandEntered(command) {
      this.printCommand(command);

      let split = command.split(" ");
      let cmd = split[0];
      let args = split.slice(1);

      const cmdObj = this.getCommand(cmd);

      if(cmdObj.commandType !== undefined) {
        if(cmdObj.commandType === "player") {
          cmdObj.command.func(this.state.player, this.state.systemAPI, cmd, args);
        } else if (cmdObj.commandType === "system") {
          cmdObj.command.func(cmd, args);
        }
      }

      this.scrollContentArea();
    }
    componentDidMount() {
      this.setState({
        content: $("#content"),
        data: this.props.data,
        player: this.initializePlayer(),
        systemAPI: {
          // Just one function here so far, if anything else is needed to be
          // called from the rooms or objects then it'll be put in here.
          say: function(text, newLine) {
           this.say(text, newLine);
          }.bind(this)
        }
      }, function() {
        this.startGame();
      });
    }
    render() {
      const contentStyle = {
        marginTop: "50px",
        marginLeft: "10px"
      };

      return (
        <div>
          <InfoBar title={gameInfo.title}
                   room={this.state.roomName}
                   score={this.state.score} />
          <div id="content" style={contentStyle}></div>
          <CommandInput onKeyEnter={this.onCommandEntered} />
        </div>
      );
    }
  }

  return {
    init: function() {
      let dl = new DataLoader();

      dl.load("/assets/data/cloak-of-darkness-data.txt",
        (status) => { console.log(status); },
        (data) => {
          const dataParts = data.split("\n\r");
          //console.log(`Total chunks = ${dataParts.length}`);

          let gdata = {};

          _.forEach(dataParts, (dp) => {
            const result = dl.read(dp);
            gdata[result.name] = result.data;
          });

          // console.log("---game data loaded---");
          // console.log(gdata);
          // console.log("----------------------");

          ReactDOM.render(<GameUI data={gdata} />, document.getElementById("ui"));
        });
    }
  }
})();

$(document).ready(function() {
  CloakOfDarkness.init();
});
