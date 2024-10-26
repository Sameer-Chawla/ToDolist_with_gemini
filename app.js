//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const { generateDescription } = require('./text_generation.js');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/todolistDB',  { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false  });

const itemScheme = mongoose.Schema({
  name: String,
  description: String // Add description field
});

const Item = mongoose.model("Item",itemScheme);

const item1 = new Item({name: "Welcome to your todolist!"});

const defautItems = [item1];

const listSchema = {
  name: String,
  items: [itemScheme]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defautItems, function(error){
        if(error){
          console.log(error);
        }else{
          console.log("Succesfully saved default items to DB.");
        }
      });
      res.redirect('/');
    }else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }

  });

});

app.post("/", function(req, res){

  const day = date.getDate();
  const itemName = req.body.newItem;
  const itemDescription = req.body.description; // Capture description input
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
    description: itemDescription // Save description
  });

  if(listName === day){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
    });
    res.redirect("/"+listName);
  }
 
});

app.post('/delete', function(req, res){

  const day = date.getDate();
  const checkedItemId = req.body.checkboxId;
  const listName = req.body.listName;

  if(listName === day){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(!err){ 
        console.log("Succesfully deleted.");
        res.redirect('/');
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect('/'+listName);
      }
    });
  }
});

app.get('/:customListName', function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({name: customListName, items: defautItems});
        list.save();
        res.redirect('/'+customListName);
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post('/generate-description', async (req, res) => {
    const { itemName } = req.body;
    if (!itemName) {
        return res.status(400).send('Item name is required');
    }

    try {
        const description = await generateDescription(itemName);
        res.json({ description });
    } catch (error) {
        console.error('Error generating description:', error);
        res.status(500).send(`Error generating description: ${error.message}`);
    }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
