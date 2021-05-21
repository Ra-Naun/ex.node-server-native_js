const  getParams = (req)=>{
  let q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

const  getUrl = (req)=>{
  return req.url.indexOf('?') !== -1? req.url.split('?')[0]:req.url;
}

module.exports ={
  getParams,
  getUrl,
}