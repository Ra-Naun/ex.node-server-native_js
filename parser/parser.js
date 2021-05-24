const https = require('https');
const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


const start = async (params) => {
  const category = params?.category || categoriesUrls.popular;
  const countOfImages = params?.countOfImages || 0;
  const DATA = await getParseImages({category, countOfImages});
  // startDownloadImages(DATA.data);
  return DATA;
}


const getParseImages = async ({category, countOfImages}) => {

  const IMAGES_IN_PAGE = 21;
  const purelyDivide = Math.trunc(countOfImages  / IMAGES_IN_PAGE) === countOfImages  / IMAGES_IN_PAGE? 0:1;

  //проверить, чтоб в запросе кол-во картинок не запрашивалось больше, чем существует на сайте
  //результирующим кол-вом будет наименьшее из ЗАПРАШИВАЕМОЕ_КОЛ-ВО и КОЛ-ВО_НА_САЙТЕ
  const countOfPages = Math.min(
    (IMAGES_IN_PAGE>countOfImages?1:Math.trunc(countOfImages/IMAGES_IN_PAGE)+purelyDivide),
    (parseInt((new JSDOM(await getPageWithImages({category, page: 1})))?.window?.document?.querySelector('.menuspace')?.innerHTML?.split(' ')[3])||0)
  );

  let Images = [];
  for(let idx=0;idx<countOfPages;idx++){
    const page = await getPageWithImages({category, page: idx+1})
    const ImagesChunk = parseImagesChunk(page)
    Images = [...Images, ...ImagesChunk]
  }
  Images = Images.slice(0, Math.min(countOfImages, Images.length));

  const DATA ={
    length: Images.length,
    data: []
  }

  for (let index = 0; index < DATA.length; index++) {
    const mediumPageData = await parseMediumPage(Images[index].linkOnMedium);
    DATA.data.push({
      previewImage: {
        src: Images[index].src,
        alt: Images[index].title,
      },
      mediumImage: mediumPageData.mediumImage,
      fullSizeImage: mediumPageData.fullSizeImage,
      category,
      name: Images[index].name,
    })
  }

  return DATA;
}

const parseImagesChunk = (page) => {
  const dom = new JSDOM(page);
  const imagesBlock = dom.window.document.querySelectorAll('.search-thumb');

  const previewImages = [];
  imagesBlock.forEach((el) => {
    const src = el.querySelector('img').src;
    const srcSplit = src.split('/');
    const name = srcSplit[srcSplit.length-1];
    previewImages.push({
      src,
      title: el.querySelector('a').title,
      linkOnMedium: el.querySelector('a').href,
      name,
    })
  })

  return previewImages
}

const parseMediumPage = async (uri) => {
  const page = await getPage(uri);
  const dom = new JSDOM(page);
  const contentBox = dom.window.document.querySelector('.contentBox');
  const showimgthumb = contentBox.querySelector('.showimgthumb');
  const img = showimgthumb.querySelector('img');
  const description = contentBox.querySelector('h2').innerHTML;
  const buttonHTML = contentBox.querySelector('.loginBut').outerHTML.replace("&amp;", "&");
  const regex = /(?<=\"download\(')(.*?)(?=\'\)")/;
  const fullSizeImageSrc = buttonHTML.match(regex)[0];
  return {
    mediumImage: {
      src: img.src,
      alt: img.alt,
      description,
    },
    fullSizeImage: {
      src: fullSizeImageSrc,
    }
  };
}

const getPageWithImages = async ({category, page}) => {
  const categoryPath = categoriesUrls[category];
  const isPA = (categoryPath === categoriesUrls.popular || categoryPath === categoriesUrls.Abstract );
  const uri = `${categoryPath}${isPA?'&':'?'}page=${page}`;
  console.log('~| uri: ', uri);
  return await getPage(uri);
}

const getPage = async (uri) => {
  const url = `${domen}/${uri}`;
  try {
    const response = await fetch(url);
    const pageHtml = await response.text();
    return pageHtml;
  } catch (error) {
    console.log('~| error: ', error);
  }
}

const startDownloadImages = (images) => {
  let count = images.length * 3;
  const afterDownloadingFile = (message) => {
    console.log('~| downloaded: ', message);
    console.log('~| : left', --count);
  }

  try {
  const destPreviewImages = path.join(__dirname, PREVIEW_IMAGES_PATH);
  fs.mkdirSync(destPreviewImages, { recursive: true });
  const destMediumImages = path.join(__dirname, MEDIUM_IMAGES_PATH);
  fs.mkdirSync(destMediumImages, { recursive: true });
  const destFullSizeImages = path.join(__dirname, FULLSIZE_IMAGES_PATH);
  fs.mkdirSync(destFullSizeImages, { recursive: true });
  images.forEach(image => {
    const urlPreviewImage = domen+'/'+image.previewImage.src;
    const uriPreviewImage = destPreviewImages+image.name;
    download(urlPreviewImage, uriPreviewImage, afterDownloadingFile);
    const urlMediumImage = domen+'/'+image.mediumImage.src;
    const uriMediumImage = destMediumImages+image.name;
    download(urlMediumImage, uriMediumImage, afterDownloadingFile);
    const urlFullSizeImage = domen+'/'+image.fullSizeImage.src;
    const uriFullSizeImage = destFullSizeImages+image.name;
    download(urlFullSizeImage, uriFullSizeImage, afterDownloadingFile);
  });
  } catch (error) {
    console.log('~| error: ', error);
  }

}

const download = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  const request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(
        () => {
          cb(dest)
        }
      );  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};












const PREVIEW_IMAGES_PATH = '/images/previewImages/';
const MEDIUM_IMAGES_PATH = '/images/mediumImages/';
const FULLSIZE_IMAGES_PATH = '/images/fullSizeImages/';


const domen = 'https://www.4freephotos.com';
const categoriesUrls = {
  popular:'photos.php?order=popular', //! do not use! Its repeat other categories
  Abstract: 'photos.php?category=Abstract&order=popular',
  food: 'photos.php?category=Food&order=popular',
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
  start,
  categoriesURLs: categoriesUrls,
}
