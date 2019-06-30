# AutoForm file upload with ostrio:files and GridFS integration

This a working example of [ostrio:files](https://github.com/VeliovGroup/Meteor-Files) with easy integration for [AutoForm files](https://github.com/VeliovGroup/meteor-autoform-file) and moving the files to a custom GridFS bucket.

This example shows

* how you define your file upload input
* move the uploaded file to GridFS
* use Mongo's native GridFS integration

## About GridFS

The [MongoDB documentation on GridFS](https://docs.mongodb.com/manual/core/gridfs/) defines it as the following:

> GridFS is a specification for storing and retrieving files that exceed the BSON-document size limit of 16 MB.

> Instead of storing a file in a single document, GridFS divides the file into parts, or chunks [1], and stores each chunk as a separate document. By default, GridFS uses a default chunk size of 255 kB; that is, GridFS divides a file into chunks of 255 kB with the exception of the last chunk. The last chunk is only as large as necessary. Similarly, files that are no larger than the chunk size only have a final chunk, using only as much space as needed plus some additional metadata.

The Javascript Mongo driver (the one that Meteor uses under the hood) allows to define [so called "Buckets"](http://mongodb.github.io/node-mongodb-native/3.2/api/GridFSBucket.html).
The Buckets are basically named collections for storing the file's metadata and chunkdata.

This allows to horizontally scale your files the same way you do with your document collections:

```javascript
import { MongoInternals } from 'meteor/mongo'

export const createBucket = bucketName => {
  const options = bucketName ? {bucketName} : (void 0)
  return new MongoInternals.NpmModule.GridFSBucket(MongoInternals.defaultRemoteCollectionDriver().mongo.db, options)
}
```

Now you can create a bucket, say 'allImages', like so

```javascript
const imagesBucket = createBucket('allImages')
```

which can later be used as target when moving images to your grid.

Uploading and downloading is mainly realized by the methods [`bucket.openUploadStream`](http://mongodb.github.io/node-mongodb-native/3.2/api/GridFSBucket.html#openUploadStream) and [`bucket.openDownloadStream`](http://mongodb.github.io/node-mongodb-native/3.2/api/GridFSBucket.html#openDownloadStream).

## Install and run

Clone this repo and just run it as any other Meteor project:

```bash
$ git clone https://github.com/VeliovGroup/files-gridfs-autoform-example.git
cd files-gridfs-autoform-example
meteor npm install
meteor
```

then open your browser on `localhost:3000` **and upload some images**.

## Check your mongo shell

After you uploaded images for profile and background you can open your mongo shell and check the `fs.` collections:

```bash
$ meteor mongo
meteor:PRIMARY> db.Images.find().count()
2 # should be 2 after a profile image and background image has been uploaded
meteor:PRIMARY> db.fs.files.find().count() 
0 # should be 0 because our bucket is not "fs" but "allImages"
meteor:PRIMARY> db.allImages.files.find().count()
2 # our bucket has received two images
meteor:PRIMARY> db.allImages.chunks.find().count()
6 # and some more chunk docs
```

## Issues and contribution

If there is any issue with this example, please leave an issue **here**. 
If there is an issue with `ostrio:files` in general please leave an issue in it's **original repository**: https://github.com/VeliovGroup/Meteor-Files .

Contributiions to alle repositories are very welcomed.
