/**
 *
 * We need to untar the downloaded tarball.
 *
 * Instead of packaging
 * the fu
 * To reduce the packaged footprint of the post install script, we
 * n
 * Which we masterfully copy from https://github.com/antimatter15/untar.js
 * to be inline! We are after all cleverer with our words than with our code.
 *
 */

/**
 * Allows you to peek and consume bytes as numbers and strings out of an ArrayBuffer.
 * In this buffer, everything must be byte-aligned.
 *
 * @param {ArrayBuffer} ab The ArrayBuffer object.
 * @param {number=} opt_offset The offset into the ArrayBuffer
 * @param {number=} opt_length The length of this BitStream
 * @constructor
 */
class ByteStream {
  ptr: number;
  bytes: Uint8Array;

  constructor(ab: ArrayBuffer, opt_offset?: number, opt_length?: number) {
    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;
    this.bytes = new Uint8Array(ab, offset, length);
    this.ptr = 0;
  }

  /**
   * Peeks at the next n bytes as an unsigned number but does not advance the
   * pointer
   * TODO: This apparently cannot read more than 4 bytes as a number?
   * @param {number} n The number of bytes to peek at.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  peekNumber(n: number) {
    // TODO: return error if n would go past the end of the stream?
    if (n <= 0 || typeof n != typeof 1) return -1;

    let result = 0;
    // read from last byte to first byte and roll them in
    let curByte = this.ptr + n - 1;
    while (curByte >= this.ptr) {
      result <<= 8;
      result |= this.bytes[curByte];
      --curByte;
    }
    return result;
  }

  /**
   * Returns the next n bytes as an unsigned number (or -1 on error)
   * and advances the stream pointer n bytes.
   * @param {number} n The number of bytes to read.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  readNumber(n: number): number {
    const num = this.peekNumber(n);
    this.ptr += n;
    return num;
  }

  /**
   * Returns the next n bytes as a signed number but does not advance the
   * pointer.
   * @param {number} n The number of bytes to read.
   * @return {number} The bytes interpreted as a signed number.
   */
  peekSignedNumber(n: number): number {
    let num = this.peekNumber(n);
    const HALF = Math.pow(2, n * 8 - 1);
    const FULL = HALF * 2;

    if (num >= HALF) num -= FULL;

    return num;
  }

  /**
   * Returns the next n bytes as a signed number and advances the stream pointer.
   * @param {number} n The number of bytes to read.
   * @return {number} The bytes interpreted as a signed number.
   */
  readSignedNumber(n: number): number {
    const num = this.peekSignedNumber(n);
    this.ptr += n;
    return num;
  }

  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.
   * @param {number} n The number of bytes to read.
   * @param {boolean} movePointers Whether to move the pointers.
   * @return {Uint8Array} The subarray.
   */
  peekBytes(n: number, movePointers: boolean): Uint8Array | null {
    if (n <= 0 || typeof n != typeof 1) {
      return null;
    }

    const result = this.bytes.subarray(this.ptr, this.ptr + n);

    if (movePointers) {
      this.ptr += n;
    }

    return result;
  }

  /**
   * Reads the next n bytes as a sub-array.
   * @param {number} n The number of bytes to read.
   * @return {Uint8Array} The subarray.
   */
  readBytes(n: number): Uint8Array | null {
    return this.peekBytes(n, true);
  }

  /**
   * Peeks at the next n bytes as a string but does not advance the pointer.
   * @param {number} n The number of bytes to peek at.
   * @return {string} The next n bytes as a string.
   */
  peekString(n: number): string {
    if (n <= 0 || typeof n != typeof 1) {
      return "";
    }

    let result = "";
    for (var p = this.ptr, end = this.ptr + n; p < end; ++p) {
      result += String.fromCharCode(this.bytes[p]);
    }
    return result;
  }

  /**
   * Returns the next n bytes as an ASCII string and advances the stream pointer
   * n bytes.
   * @param {number} n The number of bytes to read.
   * @return {string} The next n bytes as a string.
   */
  readString(n: number): string {
    let strToReturn = this.peekString(n);
    this.ptr += n;
    return strToReturn;
  }
}

// Removes all characters from the first zero-byte in the string onwards.
var readCleanString = function (bstr: ByteStream, numBytes: number) {
  var str = bstr.readString(numBytes);
  var zIndex = str.indexOf(String.fromCharCode(0));
  return zIndex != -1 ? str.substr(0, zIndex) : str;
};

// takes a ByteStream and parses out the local file information
function TarLocalFile(bStream: ByteStream) {
  const fileInfo: any = {};
  fileInfo.isValid = false;

  // Read in the header block
  fileInfo.name = readCleanString(bStream, 100);
  fileInfo.mode = readCleanString(bStream, 8);
  fileInfo.uid = readCleanString(bStream, 8);
  fileInfo.gid = readCleanString(bStream, 8);

  fileInfo.size = parseInt(readCleanString(bStream, 12), 8);
  fileInfo.mtime = readCleanString(bStream, 12);
  fileInfo.chksum = readCleanString(bStream, 8);
  fileInfo.typeflag = readCleanString(bStream, 1);
  fileInfo.linkname = readCleanString(bStream, 100);
  fileInfo.maybeMagic = readCleanString(bStream, 6);

  // 100+8+8+8+12+12+8+1+100+6 = 263 Bytes

  if (fileInfo.maybeMagic == "ustar") {
    fileInfo.version = readCleanString(bStream, 2);
    fileInfo.uname = readCleanString(bStream, 32);
    fileInfo.gname = readCleanString(bStream, 32);
    fileInfo.devmajor = readCleanString(bStream, 8);
    fileInfo.devminor = readCleanString(bStream, 8);
    fileInfo.prefix = readCleanString(bStream, 155);

    // 2+32+32+8+8+155 = 237 Bytes

    if (fileInfo.prefix.length) {
      fileInfo.name = fileInfo.prefix + fileInfo.name;
    }
    bStream.readBytes(12); // 512 - 263 - 237
  } else {
    bStream.readBytes(249); // 512 - 263
  }

  // Done header, now rest of blocks are the file contents.
  fileInfo.filename = fileInfo.name;
  fileInfo.fileData = null;

  // console.info("Untarring file '" + fileInfo.filename + "'");
  // console.info("  size = " + fileInfo.size);
  // console.info("  typeflag = " + fileInfo.typeflag);

  if (fileInfo.typeflag == 0) {
    // console.info("  This is a regular file.");
    // var sizeInBytes = parseInt(fileInfo.size);
    fileInfo.fileData = new Uint8Array(
      bStream.bytes.buffer,
      bStream.ptr,
      fileInfo.size
    );
    if (
      fileInfo.name.length > 0 &&
      fileInfo.size > 0 &&
      fileInfo.fileData &&
      fileInfo.fileData.buffer
    ) {
      fileInfo.isValid = true;
    }
  } else if (fileInfo.typeflag == 5) {
    // console.info("  This is a directory.")
  }

  bStream.ptr += fileInfo.size;
  // Round up to 512-byte blocks.
  var remaining = 512 - (bStream.ptr % 512);
  // console.log('remaining')
  if (remaining > 0 && remaining < 512) {
    bStream.readBytes(remaining);
  }
  return fileInfo;
}

const fs = require("fs");
const path = require("path");

exports.untar = function (arrayBuffer: ArrayBuffer, pkgRoot: string) {
  var bStream = new ByteStream(arrayBuffer);
  var localFiles = [];
  // While we don't encounter an empty block, keep making TarLocalFiles.
  while (bStream.peekNumber(4) != 0) {
    var oneLocalFile = TarLocalFile(bStream);
    if (oneLocalFile && oneLocalFile.isValid) {
      const fpath = writeFile(oneLocalFile, pkgRoot);
      localFiles.push(fpath);
      // totalUncompressedBytesInArchive += oneLocalFile.size;
    }
  }
  return localFiles;
};

function writeFile(uncompressedFile: any /* fileInfo */, pkgRoot: string) {
  const { filename, /*mtime,*/ mode, uid, gid, fileData } = uncompressedFile;
  const fPath = `${pkgRoot}/${filename}`;
  fs.mkdirSync(path.dirname(fPath), { recursive: true });
  fs.writeFileSync(fPath, fileData);
  // setting the times seems to mess up 'ls -l' on windows.
  // It's not the biggest problem, so we'll just skip for now.
  // But makes one wonder why this is really a problem.
  // const stats = fs.statSync(fPath);
  // fs.utimesSync(fPath, stats.atime, mtime)
  // WARNING: DO NOT set file permissions.
  // Messing with this seems to cause trouble on ubuntu
  // fs.chmodSync(fPath, 0o555); // parseInt(mode.trim()));
  return fPath;
}
