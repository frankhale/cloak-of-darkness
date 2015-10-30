// Cloak of Darkness as described here: http://www.firthworks.com/roger/cloak/
//
// Frank Hale <frankhale@gmail.com>
// 30 October 2015

var CloakOfDarkness = (function() {
  const gameInfo = {
    title: "Cloak of Darkness",
    description: "Welcome, Cloak of Darkness is a reprise of the de facto 'Hello, World' of interactive  fiction by the same name. If you want to find out what a 'Cloak of Darkness' is you can find out more <a href='http://www.firthworks.com/roger/cloak' target='_blank'>here</a>.",
    author: "Frank Hale <frankhale@gmail.com>",
    releaseDate: "30 October 2015"
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

  const rooms = [
    {
      id: 0,
      name: "Opera House Foyer",
      entryText: "You are in the Foyer of the Opera House. This room has doors to the south and west, also an unusable exit to the north. The room is quiet and you don't see anyone around.",
      objects: [],
      triggers: [],
      actions: [],
      adjacentRooms: [
        {
          direction: directionSynonyms.west,
          roomId: 1
        },
        {
          direction: directionSynonyms.south,
          roomId: 2
        }
      ]
    },
    {
      id: 1,
      name: "Cloak Room",
      entryText: "You are in the cloak room and you can see a hook on the wall.",
      objects: [],
      triggers: [],
      actions: [
        {
          name: "hang", // hang up cloak
          synonyms: ["hang", "place", "put"],
          func: function(player, system, cmd, args) {
            if(args[0] === "cloak") {
               player.inventory = _.remove(player.inventory, function(i) {
                 return i.name !== "cloak";
               });
               system.say("You take off your cloak and hang it up on the hook.");
            }
          }
        }
      ],
      adjacentRooms: [
        {
          direction: directionSynonyms.east,
          roomId: 0
        }
      ]
    },
    {
      id: 2,
      name: "Bar",
      entryText: "",
      objects: [],
      triggers: [
        {
          name: "entry",
          func: function(player, system) {
            // if the player is not wearing the cloak
            var hasCloak = _.find(player.inventory, function(i) {
              return i.name === "cloak";
            });

            if(hasCloak === undefined && player.won === undefined) {
              system.say("The room is lit vibrantly and you notice a message is scratched in sawdust on the floor.");
              player.won = true;
            } else if (player.won === false) {
              system.say("You can see the room now and there is nothing special about it. You do notice that there is a mess on the floor but you cannot discern why it's there.");
            } else {
              system.say("You are in the bar and it is extremely dark, you cannot see anything right now. You can't even see if there is a light switch.");
            }
          }
        },
        {
          name: "movement",
          func: function(player, system) {
            var hasCloak = _.find(player.inventory, function(i) {
              return i.name === "cloak";
            });

            if(hasCloak !== undefined) {
              player.won = false;
              system.say("Your movement has disturbed things within the room and the room is no longer as it was when you first entered.");
            }
          }.bind(this)
        }
      ],
      actions: [
        {
          name: "message",
          synonyms: ["read"],
          func: function(player, system, cmd, args) {
            var hasCloak = _.find(player.inventory, function(i) {
              return i.name === "cloak";
            });

            if(args[0] === "message") {
              if(hasCloak === undefined &&
                 player.won !== undefined &&
                 player.won) {
                system.say("The message on the floor reads, YOU WON!");
              } else if (player.won !== undefined && !player.won) {
                system.say("Because you disturbed the room while moving around in the dark you made the message written on the floor impossible to read. I'm sorry but you have lost.");
              } else {
                system.say("You cannot see anything in the room because it's too dark.");
              }
            }
          }
        }
      ],
      adjacentRooms: [
        {
          direction: directionSynonyms.north,
          roomId: 0
        }
      ]
    },
  ];

  const objects = [
    {
      name: "cloak",
      description: "A eerily dark velvet cloak",
      synonyms: ["cloak", "dark cloak", "velvet cloak"],
      examine: function(player, system, args) {
        system.say(this.description);
      },
      type: {
        name: "garment",
        worn: true,
        description: "This garment is made of a light absorbing material causing it to cancels available light shedding darkness on objects around you."
      }
    }
  ]

  const initialPlayerInventory = [_.find(objects, { "name" : "cloak" })];

  function flattenDirectionSynonyms() {
    var result = [];

    for(var p in directionSynonyms) {
      if(directionSynonyms.hasOwnProperty(p)) {
        result = result.concat(directionSynonyms[p]);
      }
    }

    return result;
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
      var $commandText = $("#commandText");

      this.setState({ commandText: $commandText });

      $commandText.width(window.innerWidth - 50);

      $(window).resize(function(e) {
        $commandText.width(window.innerWidth - 50);
      });
    }
    onCommandInputKeyUp(e) {
      if(e.which === keys.Up) {
        var commandIndex = (this.state.commandIndex === -1) ?
                            this.state.commandsEntered.length - 1 :
                            --this.state.commandIndex;

        if(commandIndex < 0) {
          commandIndex = 0;
        }

        this.setState({ commandIndex: commandIndex}, function() {
          this.state.commandText.val(this.state.commandsEntered[commandIndex]);
        });

      } else if (e.which === keys.Down) {

        var commandIndex = (this.state.commandIndex === -1) ? 0 : ++this.state.commandIndex;

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
          &gt;<input id="commandText" style={textInputStyle} type="text" onKeyUp={this.onCommandInputKeyUp} />
        </div>
      );
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

      var separator = "";
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

  class GameUI extends React.Component {
    constructor() {
      super();
      this.onCommandEntered = this.onCommandEntered.bind(this);

      var playerCommands = [
        {
          synonyms: ["exits", "ex"],
          func: function(player, system, cmd, args) {
            var exits = [];
            _.forEach(_.pluck(player.room.adjacentRooms, "direction"), function(d) {
              exits.push(_.first(d));
            });

            if(exits.length > 0) {
              this.say(`the following exits are available: ${exits.join(', ')}`);
            }

          }.bind(this)
        },
        {
          synonyms: ["inventory", "i"],
          func: function(player, system, cmd, args) {
            if(player.inventory.length > 0) {
              _.forEach(player.inventory, function(i) {
                var modifier = "";

                if(i.type.name === "garment") {
                  if(i.type.worn) {
                    modifier = "is";
                  } else {
                    modifier = "is not";
                  }

                  this.say(i.name + " (which " + modifier + " being worn)");
                } else {
                  this.say(i.name);
                }
              }.bind(this));
            } else {
              this.say("Your inventory contains no items.<br/>");
            }
          }.bind(this)
        },
        {
          synonyms: ["look", "l"],
          func: function(player, system, cmd, args) {
            if(player.room !== {} &&
               player.room.entryText.length > 0) {
              this.say(player.room.entryText);
            }
          }.bind(this)
        },
        {
          synonyms: ["examine", "x"],
          func: function(player, system, cmd, args) {
            if(args.length > 0) {
              var obj = _.find(player.inventory, function(i) {
                return i.name === args[0];
              })

              if(obj !== undefined) {
                obj.examine(player, system, args);
              } else {
                this.say("I cannot examine that object.");
              }
            }
          }.bind(this)
        },
        {
          synonyms: flattenDirectionSynonyms(),
          func: function(player, system, cmd, args) {
            this.go(cmd);
          }.bind(this)
        }
      ];

      var systemCommands = [
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
              "<b>/clear</b> - clears the screen",
              "<b>/restart</b> - restarts the game",
              "<b>h, help</b> - prints this message",
              "<b>i, inventory</b> - prints your inventory",
              "<b>l, look</b> - prints the description of the current room",
              "<b>x, examine</b> - prints a detailed description of an object",
              "<b>ex, exits</b> - prints the list of exits for this room",
              "<b>n, north, ne, northeast, nw, northwest, s, south, se, southeast, sw, southwest, e, east, w, west</b> - moves the player to a room relative to the direction specified",
            ];

            this.say("<blockquote>" + help.join("<br/>") + "</blockquote>");
          }.bind(this)
        }
      ];

      this.state = {
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
      }
    }
    initializePlayer() {
      return {
        score: "", // this will be changed later
        room: {},
        inventory: initialPlayerInventory
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
      var firstRoom = _.findWhere(rooms, { "id": 0 });

      if(firstRoom !== undefined) {
        var player = this.initializePlayer();
        player.room = firstRoom;

        this.setState({ player: player }, function() {
          this.say(gameInfo.description);
          this.say(`Author: ${gameInfo.author}<br/>Release Date: ${gameInfo.releaseDate}`);
          this.say("---");

          this.say(player.room.entryText);
        }.bind(this));
      }
    }
    getCommand(command, found) {
      var result = {};

      var findIn = function(commands, commandType, found) {
        if(result !== {}) {
          _.forEach(commands, function(cmd) {
            if(_.indexOf(cmd.synonyms, command) > -1) {
              found({
                commandType: commandType,
                command: cmd
              });

              return false;
            }
          });
        }
      };

      var found = function(res) {
        result = res;
      };

      findIn(this.state.playerCommands, "player", found);
      findIn(this.state.player.room.actions, "player", found)
      findIn(this.state.systemCommands, "system", found);

      return result;
    }
    findAndExecuteTrigger(name) {
      if(this.state.player.room.triggers !== undefined &&
         this.state.player.room.triggers.length > 0) {
        var trigger = _.find(this.state.player.room.triggers, function(t) {
          return t.name === name;
        });

        if(trigger !== undefined) {
          trigger.func(this.state.player, this);
        }
      }
    }
    go(direction) {
      var adjacentRoom = _.filter(this.state.player.room.adjacentRooms, function(r) {
        return _.indexOf(r.direction, direction) > -1;
      });

      if(adjacentRoom.length > 0) {
        var room = _.find(this.state.rooms, { "id": adjacentRoom[0].roomId });

        if(room !== undefined) {
          this.say("entered: " + room.name);

          this.state.player.room = room;

          this.forceUpdate();

          if(this.state.player.room.entryText !== "") {
            this.say(this.state.player.room.entryText);
          }

          this.findAndExecuteTrigger("entry");
        }
      } else {
         this.say("You cannot go in that direction.");
         this.findAndExecuteTrigger("movement");
      }
    }
    onCommandEntered(command) {
      this.printCommand(command);

      var split = command.split(" ");
      var cmd = split[0];
      var args = split.slice(1);

      var cmdObj = this.getCommand(cmd);

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
        padding: "10px"
      };

      return (
        <div>
          <InfoBar title={gameInfo.title}
                   room={this.state.player.room.name}
                   score={this.state.player.score} />
          <div id="content" style={contentStyle}></div>
          <CommandInput onKeyEnter={this.onCommandEntered} />
        </div>
      );
    }
  }

  return {
    init: function() {
      ReactDOM.render(<GameUI />, document.getElementById("ui"));
    }
  }
})();

$(document).ready(function() {
  CloakOfDarkness.init();
});
