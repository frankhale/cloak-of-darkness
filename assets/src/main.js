var CloakOfDarkness = (function() {
  var $content = $("#content");
  var $commandText = $("#commandText");
  var $title = $("#title");
  var $room = $("#room");
  var $score = $("#score");

  var gameTitle = "Cloak of Darkness";

  var createPlayer = function() {
    return {
      score: 0,
      room: {},
      won: undefined,
      inventory: [
        {
          name: "A eerily dark velvet cloak",
          type: {
              name: "garment",
              worn: true,
              description: "This garment is made of a light absorbing material causing it to absorb available light shedding darkness on objects around you."
          }
        }
      ]
    }
  };

  var player = createPlayer();

  // {
  //   id: 0,
  //   points: 0,
  //   name: "Room Name",
  //   entryText: "Initial room text when entering",
  //   objects: [],
  //   actions: []
  // },

  var rooms = [
    {
      id: 0,
      name: "Opera House Foyer",
      entryText: "You are in the Foyer of the Opera House. This room has doors to the south and west, also an unusable exit to the north. The room is quiet and you don't see anyone around.",
      objects: [],
      actions: [],
      adjacentRooms: [
        {
          direction: "west",
          id: 1
        },
        {
          direction: "south",
          id: 2
        }
      ]
    },
    {
      id: 1,
      name: "Cloak Room",
      entryText: "You are in the cloak room and you can see a hook on the wall.",
      objects: [],
      actions: [
        {
          name: "hang", // hang up cloak
          func: function(args) {
            if(args[0] === "cloak") {
              player.inventory = _.remove(player.inventory, function(i) {
                return i.name !== "cloak";
              });
              say("You take off your cloak and hang it up on the hook.");
            }
          }
        }
      ],
      adjacentRooms: [
        {
          direction: "east",
          id: 0
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
          func: function() {
            // if the player is not wearing the cloak
            var hasCloak = _.find(player.inventory, function(i) {
              return i.name === "cloak";
            });

            if(hasCloak === undefined) {
              say("The room is lit vibrantly and you notice a message is scratched in sawdust on the floor.", true);
            } else {
              say("You are in the bar and it is extremely dark, you cannot see anything right now.", true);
            }
          }
        },
        {
          name: "movement",
          func: function(args) {
            var hasCloak = _.find(player.inventory, function(i) {
              return i.name === "cloak";
            });

            if(hasCloak !== undefined) {
              args++;
              if(args > 1) {
                player.won = false;
                say("Your movement has disturbed things within the room and the room is no longer as it was when you first entered.", true);
              }
            }
          }
        },
        {
          name: "won",
          func: function(args) {
            if(player.won !== undefined) {
              if(player.won) {
                say("Congratulations you've won!")
              } else {
                say("I'm sorry but you have lost.")
              }
            }
          }
        }
      ],
      actions: [],
      adjacentRooms: [
        {
          direction: "north",
          id: 0
        }
      ]
    },
  ];

  var keys = {
    Enter: 13,
    Up: 38,
    Down: 40
  };

  function say(text, newLine) {
    if(text.length > 0) {
      var spacer = "";
      if(newLine) {
        spacer = "<p/>";
      }
      $content.append(text + spacer);
      $('html,body').animate({ scrollTop: $content[0].scrollHeight }, 1000);
    }
  }

  function printCommand(command) {
    $content.append("<h3>&gt;" + command + "</h3>");
  }

  function clear() {
    $content.html("");
  }

  function roomTitle(title) {
    $room.text(" | " + title);
  }

  function setScore(score) {
    $score.text(score);
  }

  function startGame() {
    var firstRoom = _.findWhere(rooms, { "id": 0 });

    player = createPlayer();
    player.room = firstRoom;

    roomTitle(player.room.name);
    say(player.room.entryText, true);
  };

  function go(direction) {
    var adjacentRoom = _.find(player.room.adjacentRooms, { "direction": direction });

    printCommand(direction);

    if(adjacentRoom !== undefined) {
      var room = _.find(rooms, { "id": adjacentRoom.id });

      if(room !== undefined) {
        say("entered: " + room.name, true);

        player.room = room;
        roomTitle(player.room.name);

        if(player.room.triggers !== undefined &&
           player.room.triggers.length > 0) {
          var entryTrigger = _.find(player.room.triggers, function(t) {
            return t.name === "entry";
          });

          if(entryTrigger !== undefined) {
            entryTrigger.func();
          }
        }

        if(player.room.entryText !== "") {
          say(player.room.entryText, true);
        }
      }
    } else {
      say("You cannot go in that direction.");
    }
  }

  var commands = [
    {
      name: "/clear",
      func: function(args) {
        $content.html("");
      }
    },
    {
      name: "/restart",
      func: function(args) {
        $content.html("");
        startGame();
      }
    },
    {
      name: "help",
      func: function(args) {
        printCommand("help");

        var help = [
          "<b>/clear</b> - clears the screen",
          "<b>/restart</b> - restarts the game",
          "<b>help</b> - prints this message",
          "<b>inventory</b> - prints your inventory",
          "<b>look</b> - prints the description of the current room",
          "<b>examine</b> - prints a detailed description of an object",
          "<b>north|south|east|west</b> - moves the player to a room relative to the direction specified",
        ];

        say("<blockquote>" + help.join("<br/>") + "</blockquote>");
      }
    },
    {
      name: "exits",
      func: function(args) {
        printCommand("exits");
      }
    },
    {
      name: "inventory",
      func: function(args) {
        printCommand("inventory");

        if(player.inventory.length > 0) {
          _.forEach(player.inventory, function(i) {
            var modifier = "";

            if(i.type.name === "garment") {
              if(i.type.worn) {
                modifier = "is";
              } else {
                modifier = "is not";
              }

              say(i.name + " (which " + modifier + " being worn)", true);
            } else {
              say(i.name);
            }
          });
        } else {
          say("Your inventory contains no items.<br/>")
        }
      }
    },
    {
      // This is potentially wrong for rooms that have an entry trigger and opt
      // not to fill out the basic entryText.
      name: "look",
      func: function(args) {
        if(player.room !== {}) {
          say(player.room.entryText, true);
        }
      }
    },
    {
      name: "examine",
      func: function(args) {
      }
    },
    {
      name: "north|south|east|west",
      func: function(args) {
        if(args.length > 0) {
          go(args[0]);
        }
      }
    }
    // {
    //   name: "/sayHello",
    //   func: function(args) {
    //     $content.append("<strong>Hello, World!</strong><br/>");
    //   }
    // },
    // {
    //   name: "test",
    //   func: function(args) {
    //     $content.append("You are standing in the middle of an open field, to your left, right and rear are trees and to your front is a pinpoint of light on the horizon...<br/><br/>");
    //   }
    // }
  ];

  return {
    init: function() {
      var commandsEntered = [];
      var commandIndex = -1;

      $title.text(gameTitle);
      document.title = gameTitle;

      startGame();

      $commandText.keyup(function(e) {
        //console.log(e.which);

        // 38 = Up arrow
        // 40 = Down arrow

        if(e.which === keys.Up) {
          commandIndex = (commandIndex === -1) ? commandsEntered.length - 1 : --commandIndex;

          if(commandIndex < 0) commandIndex = 0;

          $commandText.val(commandsEntered[commandIndex]);

        } else if (e.which === keys.Down) {
          commandIndex = (commandIndex === -1) ? 0 : ++commandIndex;

          if(commandIndex > commandsEntered.length) {
            commandIndex = commandsEntered.length;
            return;
          }

          $commandText.val(commandsEntered[commandIndex]);

        } else if(e.which === keys.Enter) {
          var textEntered = $(this).val();

          if(!(textEntered.length > 0)) return;

          commandsEntered.push(textEntered);
          commandIndex = -1;

          var textSplit = textEntered.split(" ");
          var args = textSplit.slice(1);

          //console.log(args);

          var findCommand = function(commands, text) {
            return _.find(commands, function(c) {
              //console.log(c);

              if(c.name === textSplit[0]) {
                return c;
              } else if(c.name.indexOf("|") !== -1) {
                var subCmds = c.name.split("|");

                return _.find(subCmds, function(sc) {
                  if(sc === textSplit[0]) {
                    args.push(textSplit[0]);
                    return sc;
                  }
                });
              }
            });
          };

          var cmd = findCommand(commands, textSplit[0]);

          if(cmd === undefined) {
            cmd = findCommand(player.room.actions, textSplit[0]);
          }

          if(cmd !== undefined) {
            $commandText.val("");
            cmd.func(args);
          } else {
            $content.append($(this).val() + "<br/>");
            $commandText.val("");
          }
        }
      });
    }
  }
})();

$(document).ready(function() {
  CloakOfDarkness.init();
});
