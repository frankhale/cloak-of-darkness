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
          name: g.group.shift()
        };

        const groupNames = ["synonyms", "text", "rooms"];

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
          synonyms: s.text.split(",").map((x) => { return x.trim(); })
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

      return getStructuredObject(data);
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

      return getStructuredObject(data);
    }

    let readTriggers = (data) => {
      // Example:
      //
      // triggers
      // 1 movement
      // 1 rooms: 3

      return getStructuredObject(data);
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
        if(gName === "wearable") {
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
      var result = readNumberedLines(data).map((e) => {
        return {
          id: e.id,
          exits: e.text.split(" ").map((n) => { return Number(n); })
        }
      });

      return result;
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
    } else {
      result.data = [];
    }

    return result;
  }
}

//let dl = new DataLoader();
//
// dl.load("/assets/data/cloak-of-darkness-data.txt",
//   (status) => { console.log(status); },
//   (data) => {
//     const dataParts = data.split("\n\r");
//     console.log(`Total chunks = ${dataParts.length}`);
//
//     let gdata = {};
//
//     _.forEach(dataParts, (dp) => {
//       const result = dl.read(dp);
//       gdata[result.name] = result.data;
//     });
//
//     console.log(gdata);
//   });
