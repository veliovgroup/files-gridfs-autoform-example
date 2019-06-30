import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './grid/createBucket';
import { createObjectId } from './grid/createObjectId';
import fs from 'fs';

let imagesBucket;
if (Meteor.isServer) {
  imagesBucket = createBucket('allImages');
}

const Images = new FilesCollection({
  collectionName: 'Images',
  allowClientCode: true,
  debug: Meteor.isServer && process.env.NODE_ENV === 'development',
  onBeforeUpload (file) {
    if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    }
    return 'Please upload image, with size equal or less than 10MB';
  },
  onAfterUpload (file) {
    const self = this;

    // here you could manipulate your file
    // and create a new version, for example a scaled 'thumbnail'
    // ...

    // then we read all versions we have got so far
    Object.keys(file.versions).forEach(versionName => {
      const metadata = { ...file.meta, versionName, fileId: file._id };
      fs.createReadStream(file.versions[ versionName ].path)

      // this is where we upload the binary to the bucket
        .pipe(imagesBucket.openUploadStream(
          file.name,
          {
            contentType: file.type || 'binary/octet-stream',
            metadata
          }
        ))

        // and we unlink the file from the fs on any error
        // that occurred during the upload to prevent zombie files
        .on('error', err => {
          console.error(err);
          self.unlink(this.collection.findOne(file._id), versionName); // Unlink files from FS
        })

        // once we are finished, we attach the gridFS Object id on the
        // FilesCollection document's meta section and finally unlink the
        // upload file from the filesystem
        .on('finish', Meteor.bindEnvironment(ver => {
          const property = `versions.${versionName}.meta.gridFsFileId`;
          self.collection.update(file._id, {
            $set: {
              [ property ]: ver._id.toHexString()
            }
          });
          self.unlink(this.collection.findOne(file._id), versionName); // Unlink files from FS
        }))
    })
  },
  interceptDownload (http, file, versionName) {
    const { gridFsFileId } = file.versions[ versionName ].meta || {};
    if (gridFsFileId) {
      const gfsId = createObjectId({ gridFsFileId });
      const readStream = imagesBucket.openDownloadStream(gfsId);
      readStream.on('data', (data) => {
        http.response.write(data);
      })

      readStream.on('end', () => {
        http.response.end('end');
      })

      readStream.on('error', () => {
        // not found probably
        // eslint-disable-next-line no-param-reassign
        http.response.statusCode = 404;
        http.response.end('not found');
      })

      http.response.setHeader('Cache-Control', this.cacheControl);
      http.response.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    }
    return Boolean(gridFsFileId) // Serve file from either GridFS or FS if it wasn't uploaded yet
  },
  onAfterRemove (files) {
    files.forEach(file => {
      Object.keys(file.versions).forEach(versionName => {
        const gridFsFileId = (file.versions[ versionName ].meta || {}).gridFsFileId;
        if (gridFsFileId) {
          const gfsId = createObjectId({ gridFsFileId });
          imagesBucket.delete(gfsId, err => { if (err) console.error(err); })
        }
      })
    })
  }
})

if (Meteor.isClient) {
  Meteor.subscribe('files.images.all');
}

if (Meteor.isServer) {
  Meteor.publish('files.images.all', () => Images.collection.find({}));
}

export { Images }
