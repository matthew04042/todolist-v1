//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const fs = require('fs');

const date = require(__dirname+"/date.js");
const app = express();
const credentials = __dirname+'/mongodb-admin.cer';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://cluster0.0tx7fav.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority", {
  sslKey: credentials,
  sslCert: credentials
});

const itemSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  }
});
const Item = mongoose.model('item', itemSchema);

// const item1 = new Item({
//   name: 'Welcome to your todolist'
// });
// const item2 = new Item({
//   name: 'Hit the "+" button to add a new item.'
// });
// const item3 = new Item({
//   name: '<-- Hit this to delete an item'
// });

// const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  item: [itemSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", (req, res)=>{
  let day = date.getDate();
  Item.find({}, (err, callback)=>{res.render("list", {listTitle: day, newListItem: callback});});
  // Item.find({}, (err, results)=>{
  //   if(results.length === 0){
  //     Item.insertMany([item1, item2,item3], (err)=>{
  //       if(err){
  //         console.log(err);
  //       }else{
  //         console.log('Successfully saved the default documents.');
  //       }
  //     });
  //     res.redirect("/");
  //   }else{
      // res.render("list", {listTitle: day, newListItem: results});
    // }
  // });
});

app.post("/", async(req,res) =>{
  let day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItemName = new Item({
    name: itemName
  });
  console.log(listName);
  if(listName === day){
    await newItemName.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, (err, titleFounded)=>{
      titleFounded.item.push(newItemName);
      titleFounded.save();
      res.redirect("/"+listName);
    });
  }

});
app.post("/delete", (req,res)=>{
let day = date.getDate();
const checkedItemId = req.body.checkbox;
const listName = req.body.listName;
if (listName === day){
   Item.findByIdAndRemove(checkedItemId, (err)=>{
    if(err){
      console.log(err);
    }else{
      console.log('Document deleted Successfully!')
    }
  });
  res.redirect("/");
}else{
List.findOneAndUpdate({name: listName},{$pull: {item: {_id: checkedItemId}}}, (err, foundList)=>{
  if(!err){
    res.redirect("/"+listName);
  }
});
}
});
app.get("/:title", async(req,res)=>{
  const titleName = _.capitalize(req.params.title);
  let itemFounded = await List.findOne({name:titleName});
  if(!itemFounded){
    const list = new List({
      name: titleName,
  //     item: [item1,item2,item3]
    });
    await list.save();
    res.redirect("/"+titleName);
  }else{
    res.render("list", {listTitle: itemFounded.name, newListItem: itemFounded.item});
  }
  });
app.get("/about", (req,res) =>{
  res.render("about");
});
app.listen(process.env.PORT, ()=>{
  console.log("Server started");
});
