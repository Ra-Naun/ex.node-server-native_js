const fetch = require('node-fetch');


const getParseImages = async ({category, order='', pagesCount=1}) => {
  for(let idx=0;idx<pagesCount;idx++){
    const block = await getPage({category, order, page: idx+1})
  }
}

const parseImagesBlock = (block) => {
  const images = [];



  return images;
}


const test = async (params) => {
  // document.querySelector
  const category = params?.category || 'Christmas';
  const order = params?.order || '';
  const page = params?.page || 1;
  // const block = result.querySelector
  return await getPage({category, order, page})
}

const getPage = async ({category, order, page}) => {
  console.log('~| 4freephotos!');

  const URI = categoriesURLs[category];
  const domen = 'https://www.4freephotos.com';

  const isPA = (URI === categoriesURLs.popular || URI === categoriesURLs.Abstract );
  const parOrder = `order=${order}`;
  const url = `${domen}/${URI}?page=${page}${isPA?'':parOrder}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.log('~| err: ', error);
  }
}

const categoriesURLs = {
  popular:'photos.php?order=popular',
  Abstract: 'photos.php?category=Abstract',
  food: 'photos.php?category=Food',
  Astronomy: '28a77e7798568ec5625984ac54dfa47f-lightbox.html',
  Blooming: '8c9b80e8c6481a34e1713c095b5d66d1-lightbox.html',
  Christmas: '702aadf90dd01693ae037cac67d58305-lightbox.html',
  'Travel destinations': '3d5c827ccc9d659b5020ae861a44ec56-lightbox.html',
  Easter: '0d32057e6e63e31b97118a417538522e-lightbox.html',
  Earth: '4d3da5c909dee127b51e1652e72a97d1-lightbox.html',
  Summer: '954f137def059868b25c5f5298d6978e-lightbox.html',
  'Spring images': '85dae13b40d074db5e0b9127d6dab208-lightbox.html',
  Wildlife: '0decdc82b33c108532359b47ed642b50-lightbox.html',
  Cars: '96533303f0d0f66df57af92925022904-lightbox.html',
}


module.exports = {
  test,
  getPage,
  categoriesURLs,
}
