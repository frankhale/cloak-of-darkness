# cloak-of-darkness

Cloak of Darkness is a reprise of the de facto "Hello, World" of interactive
fiction by the same name.

Here is a source for a definition / requirements for a Cloak Of Darkness like clone:

http://www.firthworks.com/roger/cloak/

##Status

**This is the overhaul branch and is not complete yet. The game is not yet
working in this branch.**

##Screenshot

![Game user interface screenshot](screenshots/game.png)

##How can I run this?

Requirements: <b>node.js</b> - https://nodejs.org

```
npm install -g bower
```

Clone the code, open a terminal to the code and use npm and bower to install dependencies.

Use npm to install the node module dependencies:

```
npm install
```

Use bower to download the rest of the dependencies.

```
bower install
```

Install live-server to run the code.

```
npm install -g live-server
```

Run live-server from a terminal opened to the location of the source code and
the index.html page will open in your browser.

```
live-server
```

##Walkthrough

You only need to make 5 moves to win the game.

Here are the moves:

```
west
```

```
hang cloak
```

```
east
```

```
south
```

```
read message
```

###Author(s):

Frank Hale &lt;frankhale@gmail.com&gt;  
8 November 2015
