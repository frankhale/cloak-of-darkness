// A Cloak of Darkness implementation with a few artistic liberties taken.
// 
// Frank Hale <frankhale@gmail.com>
// 18 September 2016
//
// Run: live-server --ignore="C:\Users\frank\Desktop\Cloak-of-Darkness\src"
// Note: ^ will need to change the ignore dir to be relative to where you cloned the code.
//
//
// Cloak of Darkness specification: http://www.firthworks.com/roger/cloak/
//
// Specification:
//
// The Foyer of the Opera House is where the game begins. This empty room has doors to the south and west, also an unusable exit to the north. There is nobody else around.
// The Bar lies south of the Foyer, and is initially unlit. Trying to do anything other than return northwards results in a warning message about disturbing things in the dark.
// On the wall of the Cloakroom, to the west of the Foyer, is fixed a small brass hook.
// Taking an inventory of possessions reveals that the player is wearing a black velvet cloak which, upon examination, is found to be light-absorbent. The player can drop the cloak on the floor of the Cloakroom or, better, put it on the hook.
// Returning to the Bar without the cloak reveals that the room is now lit. A message is scratched in the sawdust on the floor.
// The message reads either "You have won" or "You have lost", depending on how much it was disturbed by the player while the room was dark.
// The act of reading the message ends the game.

const CloakOfDarkness = (function() {
    var _this = {};
    
    // IDs help you point to specific pieces of the game story
    _this.ids = {
        foyer: 0,
        cloakroom: 10,
        brassHook: 11,
        bar: 20,
        barWithCloak: 21,        
        barWithoutCloak: 22,
        barWithoutCloakDisturbed: 23,
        message: 50,
        placeCloak: 60,
        dropCloak: 61,
        win: 70,
        disturbingMovement: 80,      
        lost: 100,        
        me: 111,
        cloakInfo: 112,        
        dontUnderstand: 120,
        illegalDirection: 130,
        initializePlayer: 140,
        inventoryEmpty: 150,
        hintCloakroom: 160,
        hintUnknown: 170
    };        
    
    _this.directions = [ "n", "north", "s", "south", "e", "east", "w", "west" ];
    
    // All game text goes here
    _this.story = [
        { id: _this.ids.foyer, name: "Foyer", text: "You are in the Foyer of the Opera House. This empty room has doors to the south and west, also an unusable exit to the north. There is nobody else around." },
        { id: _this.ids.cloakroom, name: "Cloakroom", text: "You are in the Cloakroom. On the wall is fixed a small brass hook." },
        { id: _this.ids.bar, name: "Bar", text: "You are in the Bar." },
        { id: _this.ids.brassHook, text: "There is nothing unusal about this brass hook. You suppose it's for hanging a coat or even better a cloak." },
        { id: _this.ids.barWithCloak, text: "The room is unlit and you cannot see anything." },        
        { id: _this.ids.barWithoutCloak, text: "The room is now lit. You can see a message on the floor." },
        { id: _this.ids.barWithoutCloakDisturbed, text: "The room is now lit. There is sawdust all over the floor, your movements previously must have distrubed it. There is a message written in the sawdust." },
        { id: _this.ids.message, text: "You see a message written in sawdust on the floor." },
        { id: _this.ids.placeCloak, text: "You place the cloak on the brass hook." },
        { id: _this.ids.dropCloak, text: "You drop the cloak on the ground." },
        { id: _this.ids.win, text: "You Won!" },
        { id: _this.ids.disturbingMovement, text: "The room is dark and your movement is slow and steady, as you carefully walk you feel as though you are stepping on something on the floor and disturbing it." },
        { id: _this.ids.lost, text: "You Lost!" },    
        { id: _this.ids.me, text: "You are an average male in your early 40's, nearly 6 feet tall and you are feeling great." },
        { id: _this.ids.cloakInfo, text: "By the way, you are wearing some crazy cloak that looks like it came straight out of the 1850's.." },
        { id: _this.ids.dontUnderstand, text: "I don't understand what you want." },
        { id: _this.ids.illegalDirection, text: "You cannot go in that direction." },
        { id: _this.ids.inventoryEmpty, text: "Your inventory is empty." },
        { id: _this.ids.hintCloakroom, text: "Maybe you can hang something on the brass hook?" },
        { id: _this.ids.hintUnknown, text: "There are no hints for this room." }
    ];
    
    _this.exits = [
        { id: _this.ids.foyer, west: _this.ids.cloakroom, south: _this.ids.bar },
        { id: _this.ids.cloakroom, east: _this.ids.foyer },
        { id: _this.ids.bar, north: _this.ids.foyer }
    ];

    _this.actions = [
        {            
            commands: [
                {
                    synonyms: ["hint"],
                    perform: function(player) {
                        if(player.room.name === "Cloakroom") {
                            return _.find(_this.story, { id: _this.ids.hintCloakroom }).text
                        } else {
                            return _.find(_this.story, { id: _this.ids.hintUnknown }).text
                        }
                    }
                },
                {
                    synonyms: ["x me", "examine me"], 
                    perform: function(player) {
                        let me = _.find(_this.story, { id: _this.ids.me }).text,
                            meCloak = _.find(_this.story, { id: _this.ids.cloakInfo }).text,
                            meFinal = "";

                        if(_.indexOf(player.items, "cloak of darkness") > -1) {
                            meFinal = `${me} ${meCloak}`; 
                        } else {
                            meFinal = me;
                        }

                        return meFinal;
                    }
                },
                {
                    synonyms: ["l", "look"],
                    perform: function(player) {
                        let text = player.room.text;

                        if(player.room.name === "Bar" && 
                          _.indexOf(player.flags, "bar-movement") > -1 &&
                          _.indexOf(player.items, "cloak of darkness") > -1) {
                            text += ` ${_.find(_this.story, { id: _this.ids.barWithCloak }).text}`;
                        } 

                        return text;
                    }
                },
                {
                    synonyms: ["i", "inv", "inventory"],
                    perform: function(player) {
                        if(player.items.length > 0) {
                            return ( 
                                <div>
                                    Your have the following items in your inventory:
                                    <br/>
                                    <br/>
                                    {
                                        player.items.map((item, i) => {
                                            return <div key={i}>{item}</div>;
                                        })
                                    }
                                </div>
                            );
                        } else {
                            return _.find(_this.story, { id: _this.ids.inventoryEmpty }).text;
                        }                       
                    }
                }
            ]
        },
        {
            id: _this.ids.initializePlayer,
            perform: function(player) {
                player.room = _.find(_this.story, { id: _this.ids.foyer });
                player.items.push("cloak of darkness");
                return player;
            }
        },
        {
            id: _this.ids.dontUnderstand,
            perform: function() {
                return _.find(_this.story, { id: _this.ids.dontUnderstand }).text;
            }
        },
        { 
            id: _this.ids.cloakroom, 
            commands: [
                {
                    synonyms: ["hang cloak"], 
                    perform: function(player) {
                        if(_.indexOf(player.items, "cloak of darkness") > -1) {
                            player.moves += 1;
                            player.score += 1;
                            player.items = _.remove(player.items, "cloak of darkness");
                            return _.find(_this.story, { id: _this.ids.placeCloak }).text;
                        }
                    }
                },
                {
                    synonyms: ["drop cloak"], 
                    perform: function(player) {           
                        if(_.indexOf(player.items, "cloak of darkness") > -1) {  
                            player.moves += 1;
                            player.items = _.remove(player.items, "cloak of darkness");                               
                            return _.find(_this.story, { id: _this.ids.dropCloak }).text;
                        }
                    }
                },
                {
                    synonyms: ["x hook", "x brass hook", "examine hook", "examine brass hook"],
                    perform: function(player) {
                        player.score += 1;                        
                        return _.find(_this.story, { id: _this.ids.brassHook }).text;
                    }
                }
            ] 
        },
        {
            id: _this.ids.bar,
            commands: [
                {
                    synonyms: ["read message"],
                    perform: function(player) {
                        const barMovement = _.indexOf(player.flags, "bar-movement") > -1,
                              hasCloak = _.indexOf(player.items, "cloak of darkness") > -1;

                        if(hasCloak) return;

                        player.moves += 1;

                        if(barMovement) {
                            return _.find(_this.story, { id: _this.ids.lost }).text;
                        } else {
                            player.score += 2;              
                            return _.find(_this.story, { id: _this.ids.win }).text;    
                        }
                    }
                }
            ]
        }
    ];

    _this.triggers = [
        {
            id: _this.ids.bar, 
            events: [
                {
                    name: "enter",
                    perform: function(player) {
                        const cloak = _.indexOf(player.items, "cloak of darkness");
                        
                        if(_.indexOf(player.flags, "bar-movement") > -1) {
                            return _.find(_this.story, { id: _this.ids.barWithoutCloakDisturbed }).text;
                        } else {                        
                            if(cloak !== -1) {              
                                return _.find(_this.story, { id: _this.ids.barWithCloak }).text;
                            } else {
                                return _.find(_this.story, { id: _this.ids.barWithoutCloak }).text;
                            }
                        }
                    }
                },
                {
                    name: "movement", 
                    perform: function(player) {
                        // Need to be able to tell if a player moves in the Bar and then leaves, drops cloak and comes back
                        let movementFlag = _.find(player.flags, "bar-movement");
                        if(movementFlag === undefined) {
                            player.flags.push("bar-movement");
                        }
                        return _.find(_this.story, { id: _this.ids.disturbingMovement }).text;
                    }
                }
            ]
        }
    ];

    return _this;
})();

class CommandInput extends React.Component {
    constructor() {
        super();
        this.onCommandInputKeyUp = this.onCommandInputKeyUp.bind(this);
        
        this.state = {
            commandIndex: -1,
            commandsEntered: [],
            keys: {
                Enter: 13,
                Up: 38,
                Down: 40
            }
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
        if(e.which === this.state.keys.Up) {
            let commandIndex = (this.state.commandIndex === -1) ?
                                this.state.commandsEntered.length - 1 :
                                --this.state.commandIndex;

            if(commandIndex < 0) {
                commandIndex = 0;
            }

            this.setState({ commandIndex: commandIndex}, function() {
                this.state.commandText.val(this.state.commandsEntered[commandIndex]);
            });
        } else if (e.which === this.state.keys.Down) {
            let commandIndex = (this.state.commandIndex === -1) ? 0 : ++this.state.commandIndex;

            if(commandIndex > this.state.commandsEntered.length) {
                commandIndex = this.state.commandsEntered.length;
            }

            this.setState({ commandIndex: commandIndex }, function() {
                this.state.commandText.val(this.state.commandsEntered[commandIndex]);
            });
        } else if(e.which === this.state.keys.Enter) {
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
            paddingLeft: "5px"
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

class InfoBar extends React.Component {
    render() {
        const infoStyle = {
            backgroundColor: "#000",
            color: "#fff",
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%"
        },
        columnLeft = { 
            float: "left", 
            width: "33%" 
        },
        columnRight = {
            float: "right", 
            width: "33%",
            textAlign: "right" 
        },
        columnCenter = { 
            display: "inline-block",
            width: "33%",
            textAlign: "center" 
        };

        return (
            <div id="info" style={infoStyle}>
                <div style={columnCenter}>{this.props.title}</div>
                <div style={columnLeft}>
                    <div>{(this.props.area !== undefined) ? this.props.area : ""}</div>
                    <div>{this.props.room}</div>
                </div>
                <div style={columnRight}>
                    <div>Score: {this.props.score}</div>
                    <div>Moves: {this.props.moves}</div>
                </div>
            </div>
        );
    }
}

class IFGameEngine extends React.Component {
    constructor() {
        super();

        this.onCommandEntered = this.onCommandEntered.bind(this);
        this.getNewRoom = this.getNewRoom.bind(this);  
        this.getAndExecuteTrigger = this.getAndExecuteTrigger.bind(this);      

        this.state = {
            game: {},            
            gameText: [],
            commandStyle: {
                paddingTop: "10px",
                paddingBottom: "10px"
            },
            contentStyle: {
                marginTop: "70px"
            },
            player: {
                room: { name: "" },                                 
                score: 0,
                moves: 0,
                items: [],
                flags: []         
            }
        };
    }
    componentDidMount() {
        let game = this.props.game;
        let player = this.state.player;
        let initPlayerAction = _.find(game.actions, { id: game.ids.initializePlayer });

        player = initPlayerAction.perform(player);

        let newGameText = this.state.gameText; 
        newGameText.push(this.state.player.room.text);        

        this.setState({
            game: game,
            room: this.getRoom(0),
            gameText: newGameText,
            player: player
        });
    }
    getRoom(roomID) {
        return _.find(this.state.game.story, { id: roomID });
    }
    getRoomExits(roomID) {
        return _.find(this.state.game.exits, { id: roomID });
    }
    getNewRoom(command) {
        let roomExits = this.getRoomExits(this.state.player.room.id);
        let newRoom = -1;

        switch(command.toLowerCase()) {
            case "n":
            case "north":
                if(roomExits.north !== undefined) {
                    newRoom = this.getRoom(roomExits.north);                    
                }
                break;
            case "w":
            case "west":
                if(roomExits.west !== undefined) {
                    newRoom = this.getRoom(roomExits.west);
                }
                break;
            case "s":
            case "south":
                if(roomExits.south !== undefined) {
                    newRoom = this.getRoom(roomExits.south);
                }
                break;
            case "e":
            case "east":
                if(roomExits.east !== undefined) {
                    newRoom = this.getRoom(roomExits.east);
                }
                break;                
        }

        return newRoom;
    }
    getAndExecuteTrigger(name, roomID) {
        let roomTriggers = _.find(this.state.game.triggers, { id: roomID }),
            triggerText = "";

        if(roomTriggers !== undefined) {
            let event = _.find(roomTriggers.events, { "name": name });

            if(event !== undefined) {                    
                triggerText = event.perform(this.state.player);
            }
        }

        return triggerText;
    }
    getAndExecuteAction(name, roomID) {
        let roomActions = _.find(this.state.game.actions, (ga) => {                 
                if(ga.id === undefined) {
                    return _.find(ga.commands, (c) => {
                        if(_.indexOf(c.synonyms, name) > -1) {
                            return c;
                        }    
                    });                                        
                } 
            }),
            actionText = "";

        if(roomActions === undefined) {
            roomActions = _.find(this.state.game.actions, { id: roomID })
        }

        if(roomActions !== undefined) {
            let command = _.find(roomActions.commands, function(ra) {
                if(_.indexOf(ra.synonyms, name) > -1) {
                    return ra;
                }
            });

            if(command !== undefined) {                    
                actionText = command.perform(this.state.player);
            }
        } 

        return actionText;
    }
    onCommandEntered(command) {
        let player = this.state.player,            
            newGameText = this.state.gameText;            

        if(_.indexOf(this.state.game.directions, command) > -1) {
            let newRoom = this.getNewRoom(command);

            if(newRoom === -1) {
                let movementTriggerText = this.getAndExecuteTrigger("movement", this.state.player.room.id),                 
                    roomText = (movementTriggerText === "") ? player.room.text : `${player.room.text} ${movementTriggerText}`;

                newGameText.push(<div style={this.state.commandStyle}><b>{command}</b></div>);
                
                if(movementTriggerText === "") {
                    newGameText.push(_.find(this.state.game.story, { id: this.state.game.ids.illegalDirection }).text);
                } else {
                    newGameText.push(movementTriggerText);
                }

                this.setState({                 
                    gameText: newGameText                  
                });
            } else {
                let newGameText = this.state.gameText;

                player.room = newRoom;            
                player.moves += 1;

                let enterTriggerText = this.getAndExecuteTrigger("enter", newRoom.id), 
                    roomText = (enterTriggerText === "") ? player.room.text : `${player.room.text} ${enterTriggerText}`;

                newGameText.push(<div style={this.state.commandStyle}><b>go: {command}</b></div>);
                newGameText.push(roomText);

                this.setState({                 
                    gameText: newGameText,
                    player: player   
                });
            }
        } else {
            let actionText = this.getAndExecuteAction(command, this.state.player.room.id),
                unknownCommand = _.find(this.state.game.actions, { "id" : this.state.game.ids.dontUnderstand }).perform();

            newGameText.push(<div style={this.state.commandStyle}><b>{command}</b></div>);

            if(actionText !== "" && actionText !== undefined) {
                newGameText.push(actionText);
            } else {                
                newGameText.push(unknownCommand);
            }

            this.setState({                 
                gameText: newGameText,
                player: player   
            });
        }

        $("html, body").animate({ scrollTop: $(document).height() }, 1000);
    }
    render() {          
        return (
            <div>
                <InfoBar title={this.props.title} room={this.state.player.room.name} score={this.state.player.score} moves={this.state.player.moves} />                                
                <div id="content" style={this.state.contentStyle}>
                {
                    this.state.gameText.map(function(gt, i) {
                        return <div key={i}>{gt}</div>;
                    })
                }</div>
                <br/>                
                <CommandInput onKeyEnter={this.onCommandEntered} />
            </div>
        );
    }
}

$(document).ready(function() {
  ReactDOM.render(<IFGameEngine title="Cloak of Darkness" game={CloakOfDarkness} />, document.getElementById("content"));
});