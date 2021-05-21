const getPage = async () => {
  try {
    const url = 'http://localhost:3000/4freephotos/save-images?page=1&category=Blooming';
    // const url = 'http://localhost:3000/4freephotos/save-images'
    const params = {
      page: 1,
      category:'Blooming',
    }
    const response = await fetch(url, {params});
    const responseText = await response.text();
    console.log('~| responseText: ', responseText);
  } catch (error) {
    console.log('~| err: ', error);
  }
}