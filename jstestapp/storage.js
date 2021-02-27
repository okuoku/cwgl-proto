import fs from "./yfrmfs.js";

const ERRNO_CODES = {
    EPERM: 1,
    ENOENT: 2,
    ESRCH: 3,
    EINTR: 4,
    EIO: 5,
    ENXIO: 6,
    E2BIG: 7,
    ENOEXEC: 8,
    EBADF: 9,
    ECHILD: 10,
    EAGAIN: 11,
    EWOULDBLOCK: 11,
    ENOMEM: 12,
    EACCES: 13,
    EFAULT: 14,
    ENOTBLK: 15,
    EBUSY: 16,
    EEXIST: 17,
    EXDEV: 18,
    ENODEV: 19,
    ENOTDIR: 20,
    EISDIR: 21,
    EINVAL: 22,
    ENFILE: 23,
    EMFILE: 24,
    ENOTTY: 25,
    ETXTBSY: 26,
    EFBIG: 27,
    ENOSPC: 28,
    ESPIPE: 29,
    EROFS: 30,
    EMLINK: 31,
    EPIPE: 32,
    EDOM: 33,
    ERANGE: 34,
    ENOMSG: 42,
    EIDRM: 43,
    ECHRNG: 44,
    EL2NSYNC: 45,
    EL3HLT: 46,
    EL3RST: 47,
    ELNRNG: 48,
    EUNATCH: 49,
    ENOCSI: 50,
    EL2HLT: 51,
    EDEADLK: 35,
    ENOLCK: 37,
    EBADE: 52,
    EBADR: 53,
    EXFULL: 54,
    ENOANO: 55,
    EBADRQC: 56,
    EBADSLT: 57,
    EDEADLOCK: 35,
    EBFONT: 59,
    ENOSTR: 60,
    ENODATA: 61,
    ETIME: 62,
    ENOSR: 63,
    ENONET: 64,
    ENOPKG: 65,
    EREMOTE: 66,
    ENOLINK: 67,
    EADV: 68,
    ESRMNT: 69,
    ECOMM: 70,
    EPROTO: 71,
    EMULTIHOP: 72,
    EDOTDOT: 73,
    EBADMSG: 74,
    ENOTUNIQ: 76,
    EBADFD: 77,
    EREMCHG: 78,
    ELIBACC: 79,
    ELIBBAD: 80,
    ELIBSCN: 81,
    ELIBMAX: 82,
    ELIBEXEC: 83,
    ENOSYS: 38,
    ENOTEMPTY: 39,
    ENAMETOOLONG: 36,
    ELOOP: 40,
    EOPNOTSUPP: 95,
    EPFNOSUPPORT: 96,
    ECONNRESET: 104,
    ENOBUFS: 105,
    EAFNOSUPPORT: 97,
    EPROTOTYPE: 91,
    ENOTSOCK: 88,
    ENOPROTOOPT: 92,
    ESHUTDOWN: 108,
    ECONNREFUSED: 111,
    EADDRINUSE: 98,
    ECONNABORTED: 103,
    ENETUNREACH: 101,
    ENETDOWN: 100,
    ETIMEDOUT: 110,
    EHOSTDOWN: 112,
    EHOSTUNREACH: 113,
    EINPROGRESS: 115,
    EALREADY: 114,
    EDESTADDRREQ: 89,
    EMSGSIZE: 90,
    EPROTONOSUPPORT: 93,
    ESOCKTNOSUPPORT: 94,
    EADDRNOTAVAIL: 99,
    ENETRESET: 102,
    EISCONN: 106,
    ENOTCONN: 107,
    ETOOMANYREFS: 109,
    EUSERS: 87,
    EDQUOT: 122,
    ESTALE: 116,
    ENOTSUP: 95,
    ENOMEDIUM: 123,
    EILSEQ: 84,
    EOVERFLOW: 75,
    ECANCELED: 125,
    ENOTRECOVERABLE: 131,
    EOWNERDEAD: 130,
    ESTRPIPE: 86,
};

function do_genfs(FS, ROOT){
    function is_directory(path){
        try{
            const stats = fs.statSync(path);
            if(stats.isDirectory()){
                return true;
            }else{
                return false;
            }
        }catch(err){
            throw err;
        }
    }
    function pathexpand(node){
        const elements = [];
        while(node !== node.parent){
            elements.push(node.name);
            node = node.parent;
        }
        if(elements.length == 0){
            return ROOT;
        }else{
            elements.reverse();
            return ROOT + "/" + elements.reduce((acc, e) => acc + "/" + e);
        }
    }
    /* NODE OPS */
    /* getattr(dir, file) */
    function dir_getattr(node){
        console.log("Dir getattr", node.name);
        return {
            dev: 0,
            ino: 0,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: 0,
            blksize: 4096,
            /* Dummy */
            atime: new Date(),
            mtime: new Date(),
            ctime: new Date(),
            blocks: 999999
        };
    }
    function file_getattr(node){
        console.log("File getattr", node.name);
        const stats = fs.statSync(pathexpand(node));
        return {
            dev: 0,
            ino: 0,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: stats.size,
            blksize: 4096,
            /* Dummy */
            atime: new Date(),
            mtime: new Date(),
            ctime: new Date(),
            blocks: 999999
        };
    }
    /* setattr(dir, file) */
    function dir_setattr(node, attr){
        throw "ROFS";
    }
    function file_setattr(node, attr){
        throw "ROFS";
    }
    /* lookup(dir) */
    function dir_lookup(parent, name){ // => node
        console.log("Lookup", name);
        try {
            if(is_directory(pathexpand(parent) + "/" + name)){
                return newnode_dir(parent, name);
            }else{
                return newnode_file(parent, name);
            }
        } catch(e) {
            if(! e.code){
                throw e;
            }else{
                console.log("FSerr", e.code, name);
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        }
    }
    /* mknod(dir) */
    function dir_mknod(parent, name, mode, dev){ // => node
        const is_dir = mode & 16384 ? true : false;
        const node = is_dir ?
            newnode_dir(parent, name) :
            newnode_file(parent, name);
        const path = pathexpand(node);
        console.log("FS create", path);
        try {
            if(is_dir){
                fs.mkdirSync(path, node.mode);
            }else{
                fs.writeFileSync(path, "");
            }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* rename(dir) */
    function dir_rename(old_node, new_dir, new_name){
        const from = pathexpand(old_node);
        const to = pathexpand(new_dir) + "/" + new_name;
        console.log("FS Rename", from, to);
        try {
            fs.renameSync(from, to);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* unlink(dir) */
    function dir_unlink(parent, name){
        const path = pathexpand(parent);
        const target = path + "/" + name;
        console.log("FS unlink", target);
        try {
            fs.unlinkSync(target);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* rmdir(dir) */
    function dir_rmdir(parent, name){
        const path = pathexpand(parent);
        const target = path + "/" + name;
        console.log("FS rmdir", target);
        try {
            fs.rmdirSync(target);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* readdir(dir) */
    function dir_readdir(node){
        const path = pathexpand(node);
        console.log("Dir readdir", path);
        try {
          return fs.readdirSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* symlink(dir) */
    function dir_symlink(parent, newname, path){
        throw "ROFS";
    }

    /* STREAM OPS */
    /* open */
    function file_open(stream){ // => void
        console.log("File Open", stream.path);
        const node = stream.node;
        const path = pathexpand(node);
        console.log("Resolved as", path);
        const fd = fs.openSync(path);
        stream.NativeFD = fd;

    }
    /* close */
    function file_close(stream){ // => void
        console.log("File Close", stream.path);
        if(stream.NativeFD){
            fs.closeSync(stream.NativeFD);
            stream.NativeFD = false;
        }
    }
    /* llseek(dir, file) */
    function dir_llseek(stream, offset, whence){
        let pos = offset;
        console.log("Dir LLSEEK", stream.path, offset, whence);
        switch(whence){
            case 2: /* SEEK_END */
                throw "SEEK_END..?";
                break;
            case 1: /* SEEK_CUR */
                pos += stream.position;
                break;
            default:
                /* No adjustment */
                break;
        }
        return pos;
    }
    function file_llseek(stream, offset, whence){ // => adjusted position
        let pos = offset;
        console.log("File LLSEEK", stream.path, offset, whence);
        switch(whence){
            case 1: /* SEEK_CUR */
                pos += stream.position;
                break;
            case 2: /* SEEK_END */
                const stats = fs.fstatSync(stream.NativeFD);
                pos += stats.size;
                break;
            default:
                /* No adjustment */
                break;
        }
        return pos;

    }
    /* read(file) */
    function file_read(stream, buffer, offset, length, pos){ // => bytes read
        console.log("File read", stream.path, offset, length, pos);
        return fs.readSync(stream.NativeFD, buffer, offset, length, pos);
    }
    /* write(file) */
    function file_write(stream, buffer, length, pos, canOwn){
        try {
          return fs.writeSync(stream.NativeFD, buffer, offset, length, pos);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
    }
    /* allocate(file) */
    function file_allocate(stream, offset, length){
        throw "UNUSED";
    }
    /* mmap(file) */
    function file_mmap(stream, buffer, offset, length, position, prot, flags){
        throw "UNUSED";
    }
    /* msync(file) */
    function file_msync(stream, buffer, offset, length, mmapFlags){
        throw "UNUSED";
    }

    const dir_nodeops = {
        getattr: dir_getattr,
        lookup: dir_lookup,
        readdir: dir_readdir,
        /* Write OPs */
        //setattr: dir_setattr,
        mknod: dir_mknod,
        rename: dir_rename,
        unlink: dir_unlink,
        rmdir: dir_rmdir,
        //symlink: dir_symlink,
    };
    const file_nodeops = {
        getattr: file_getattr,
        /* Write OPs */
        //setattr: file_setattr,
    };
    const dir_streamops = {
        llseek: dir_llseek
    };
    const file_streamops = {
        open: file_open,
        close: file_close,
        llseek: file_llseek,
        read: file_read,
        /* Write OPs */
        write: file_write,
        //allocate: file_allocate,
        //mmap: file_mmap,
        //msync: file_msync
    };

    function newnode_dir(parent, name){
        const r = FS.createNode(parent, name,  16384 /* Dir */ | 511, 0);
        r.node_ops = dir_nodeops;
        r.stream_ops = dir_streamops;
        return r;
    }

    function newnode_file(parent, name){
        const r = FS.createNode(parent, name, 511 | 32768 /* IFREG */, 0);
        r.node_ops = file_nodeops;
        r.stream_ops = file_streamops;
        return r;
    }

    return {
        mount: function(mount){
            const me = newnode_dir(null, "/");
            me.mount = mount;
            me.parent = me;
            return me;
        },
    };
}

const Storage = {
    genfs: function(FS, ROOT){
        return do_genfs(FS, ROOT);
    }
};

export default Storage;
