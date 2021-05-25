const https = require('https');
const fs = require('fs');
const path = require('path');

const shortid = require('shortid');
const fetch = require('node-fetch');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const BDClient = require("./BDClient").init();


const start = async (params) => {
  initAllSavedImageNamesArray();
  const defaultCategory = Object.keys(categoriesUrls).find((key) => categoriesUrls[key] === categoriesUrls.Abstract)
  const category =  Object.keys(categoriesUrls).find((key) => key === params?.category ) || defaultCategory;
  const countOfImages = params?.countOfImages || 0;
  const DATA = await getParseImages({category, countOfImages});
  await new Promise((resolve, reject) => {
    downloadImages(DATA, resolve);
  });

  try {
    saveInBD(DATA);
  } catch (error) {
    console.log('~| saveInBD error: ', error);
  }
  return {
    length: DATA.length,
    DATA,
  };
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

  const DATA = []

  for (let index = 0; index < Images.length; index++) {
    const mediumPageData = await parseMediumPage(Images[index].linkOnMedium);
    const name = Images[index].name;
    const isExist = checkExist(name);
    !isExist && DATA.push({
      previewImage: {
        src: Images[index].src,
        alt: Images[index].title,
      },
      mediumImage: mediumPageData.mediumImage,
      fullSizeImage: mediumPageData.fullSizeImage,
      category,
      name,
      hashname: `${shortid.generate()}${Date.now().toString().replace(/\s/g, '')}.${name.split('.')[1]}`,
    })
  }

  return DATA;
}

let AllSavedImageNames = [];
const initAllSavedImageNamesArray = () => {
  try {
    const dir = path.join(__dirname, PREVIEW_IMAGES_PATH);
    const files = fs.readdirSync(dir);
    AllSavedImageNames = files;
  } catch (error) {
    AllSavedImageNames = [];
    error.message.includes('ENOENT: no such file or directory') || console.log('~| init error: ', error);
  }
}

const checkExist = (name) => {
  return AllSavedImageNames.includes(name);
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
  const PAF = [categoriesUrls.popular, categoriesUrls.Abstract, categoriesUrls.food]
  const isPAF = PAF.includes(categoryPath);
  const uri = `${categoryPath}${isPAF?'&':'?'}page=${page}`;
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

const downloadImages = (images, resolve) => {
  let count = images.length * 3;
  console.log('~| Download start | left: ', count);
  const afterDownloadingFile = (message) => {
    console.log('downloaded: ', message);
    if(--count > 0) console.log('~| Downloading | left: ', count);
    else {
      console.log('Download done!');
      resolve();
    }
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
    const uriPreviewImage = destPreviewImages+image.hashname;
    download(urlPreviewImage, uriPreviewImage, afterDownloadingFile);
    const urlMediumImage = domen+'/'+image.mediumImage.src;
    const uriMediumImage = destMediumImages+image.hashname;
    download(urlMediumImage, uriMediumImage, afterDownloadingFile);
    const urlFullSizeImage = domen+'/'+image.fullSizeImage.src;
    const uriFullSizeImage = destFullSizeImages+image.hashname;
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


const saveInBD = (images) => {
  images.forEach((img) => {
    console.log('~| saveInBD: ', img);
    BDClient.add(img)
  })
}







const DB_CONFIG = {
  POSTGRES_PASSWORD: 'root',
  POSTGRES_USER: 'root',
  POSTGRES_DB: 'allconv',
}

const PREVIEW_IMAGES_PATH = '/images/preview/';
const MEDIUM_IMAGES_PATH = '/images/medium/';
const FULLSIZE_IMAGES_PATH = '/images/large/';

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
