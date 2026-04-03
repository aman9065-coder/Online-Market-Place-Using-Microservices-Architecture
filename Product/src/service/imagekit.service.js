const Imagekit = require('imagekit');

const {v4:uuidv4} = require('uuid')


const imagekit = new Imagekit({
    publicKey:process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint:process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage({buffer,folder='/products'}){
    const res = await imagekit.upload({
        file:buffer,
        fileName:uuidv4(),
        folder
    });

    return{
        url:res.url,
        thumbnail:res.thumbnailUrl,
        id:res.fileId
    }
}

module.exports = uploadImage;