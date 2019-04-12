var express = require('express');
var router  = module.exports = express();
var http    = require("http");
var server  = http.createServer(router);
var fs      = require('fs');
const path  = require("path");
const parser = require("csvtojson");
const _ = require("lodash");

router.use(express.static('./public'))
router.use(express.json());     

server.listen(process.env.PORT || 51051, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("e-offers server listening at", addr.address + ":" + addr.port);
});

router.get('/', function(req, res, next) {
  res.send("offers");
});

router.get('/offers/:offerId', async function(req, res, next) {
  let result = "Can't find offer with ID " + req.params.offerId;
  if(fs.existsSync(path.join("./public/offers", req.params.offerId))) {
    result = fs.readFileSync("index.html", "UTF-8");
  }
  res.send(result);
});

router.get('/offers/:offerId/:param', async function(req, res, next) {
  var result = [];
  var data = [];
  var map = {};
  const offerId = req.query.offerId;
  switch (req.params.param) {
    case "folders":
      fileName = path.join("./public", "offers", offerId, "folders.csv");
      if(fs.existsSync(fileName)) {
        data = await parser({ delimiter: "|" }).fromFile(fileName);
        map = { id: "id", parentId: "parentId", title: "value" }
        result = makeHierarchical(data, "parentId", "data", map);
      }
      result = {
        id: "all-items",
        value: "Все",
        data: result
      };
      result = { data: result };
      break;
    case "items":
      fileName = path.join("./public", "offers", offerId, "items.csv");
      if(fs.existsSync(fileName)) {
        result = await parser({ delimiter: "|" }).fromFile(fileName);
      }
      result = { data: result };
      break;
    case "images":
      fileName = path.join("./public", "offers", offerId, "items.csv");
      if(fs.existsSync(fileName)) {
        result = await parser({ delimiter: "|" }).fromFile(path.join("./public", "offers", offerId, "images.csv"));
      }
      result = _.filter(result, { 'itemId': req.query.itemId });
      result = { data: result};
      break;
      default:
        if(fs.existsSync(path.join("./public/offers", req.params.offerId))) {
          result = fs.readFileSync("index.html", "UTF-8");
        } else {
          result = "offers";
        }
  }
  res.send(result);
});

function makeHierarchical(arr, parent, child, map) {
  var tree = [],
    mappedArr = {},
    arrElem,
    mappedElem;

  // First map the nodes of the array to an object -> create a hash table.
  for (var i = 0, len = arr.length; i < len; i++) {
    arrElem = arr[i];
    mappedArr[arrElem.id] = arrElem;
    mappedArr[arrElem.id][child] = [];
  }

  for (var id in mappedArr) {
    if (mappedArr.hasOwnProperty(id)) {
      mappedElem = mappedArr[id];
      if(map) {
        const data = {};
        for(let key in mappedElem) {
          if(map[key]) {
            const newKey = map[key];
            data[newKey] = mappedElem[key];
          } else {
            data[key] = mappedElem[key];
          }
        }
        mappedElem = data;
      }
      // If the element is not at the root level, add it to its parent array of children.
      if (mappedElem[parent] && parent != "id") {
        mappedArr[mappedElem[parent]][child].push(mappedElem);
      }
      // If the element is at the root level, add it to first level elements array.
      else {
        tree.push(mappedElem);
      }
    }
  }
  return tree;
}