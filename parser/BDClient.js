// const bd = require("./bd.json");
const { JsonDB }  = require( 'node-json-db');
const { Config }  = require( 'node-json-db/dist/lib/JsonDBConfig');


const  init = ()=>{
  const db = new JsonDB(new Config("bd", true, false, '/'));

  const  add = (elementObj)=>{
    db.push('/', elementObj);
  }
  const  removeByName = (name)=>{
    const img = getByName(name);
    removeByID(img.uid);
  }
  const  removeByID = (id)=>{
    db.delete(`/${id}`);
  }
  const  getByName = (name)=>{

  }
  const  getByID = (id)=>{
    try {
      return db.getData(`/${id}`)
    } catch (error) {
      console.error(error);
      return;
    }
  }
  const  getAllNames = ()=>{
    try {
      const data = db.getData('/');
      console.log('~| AllNames: ', data);
      return data;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  return {
    add,
    removeByName,
    removeByID,
    getByName,
    getByID,
    getAllNames,
  }
}



module.exports ={
  init,
}