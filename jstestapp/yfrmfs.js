const ncccutil = require("./ncccutil.js");
const CWGL = require("./cwgl.js");
module.exports = {
    statSync: function(path){
        // FIXME: Endian
        // FIXME: 4Gig over
        const bufflags = new Uint32Array(2);
        const bufsize = new Uint32Array(2);
        const bufcreate = new Uint32Array(2);
        const bufmod = new Uint32Array(2);
        const r = CWGL.yfrm_file_pathinfo(path, 
                                          bufflags,
                                          bufsize,
                                          bufcreate,
                                          bufmod);
        if(r == 0){
            if(bufsize[1]){
                throw "too large";
            }
            const isdir = bufflags[0] & 1 ? true : false;

            return {
                isDirectory: function(){
                    return isdir;
                },
                size: bufsize[0]
            };
        }else{
            throw {code: "ENOENT"};
        }
    },
    fstatSync: function(p){
        // FIXME: Endian
        // FIXME: 4Gig over
        const bufflags = new Uint32Array(2);
        const bufsize = new Uint32Array(2);
        const bufcreate = new Uint32Array(2);
        const bufmod = new Uint32Array(2);
        const r = CWGL.yfrm_file_info(p, 
                                      bufflags,
                                      bufsize,
                                      bufcreate,
                                      bufmod);
        if(r == 0){
            if(bufsize[1]){
                throw "too large";
            }
            const isdir = bufflags[0] & 1 ? true : false;

            return {
                isDirectory: function(){
                    return isdir;
                },
                size: bufsize[0]
            };
        }else{
            throw {code: "ENOENT"};
        }
    },
    mkdirSync: function(path, mode){
        const r = CWGL.yfrm_file_mkdir(path);
        if(r == 0){
            return 0;
        }else{
            throw {code: "EPERM"};
        }
    },
    writeFileSync: function(path, content){
        if(content === ""){
            // Touch
            const ptrbuf = ncccutil.ptrbuf();
            const r = CWGL.yfrm_file_open_create(path, ptrbuf);
            if(r == 0){
                const r2 = CWGL.yfrm_file_close(fetchptrbuf(ptrbuf));
                return 0;
            }else{
                throw {code: "ENOENT"};
            }
        }else{
            throw "unimpl";
        }
    },
    renameSync: function(oldname, newname){
        const r = CWGL.yfrm_file_rename(oldname, newname);
        if(r == 0){
            return 0;
        }else{
            throw {code: "EPERM"};
        }
    },
    unlinkSync: function(path){
        const r = CWGL.yfrm_file_unlink(path);
        if(r == 0){
            return 0;
        }else{
            throw {code: "ENOENT"};
        }
    },
    rmdirSync: function(path){
        const r = CWGL.yfrm_file_rmdir(path);
        if(r == 0){
            return 0;
        }else{
            throw {code: "ENOENT"};
        }
    },
    readdirSync: function(path){
        const out = [];
        const pathbuf = new Uint8Array(4096);
        const pathbuflen = 4096;
        const ptrbuf = ncccutil.ptrbuf();
        const lenbuf = new Uint32Array(1);
        const r0 = CWGL.yfrm_file_readdir_begin(path, ptrbuf);
        if(r0 != 0){
            throw {code: "ENOENT"};
        }
        let dostep = 0;
        const ctx = ncccutil.fetchptrbuf(ptrbuf);
        for(;;){
            const r1 = CWGL.yfrm_file_readdir_step(ctx, dostep,
                                                   pathbuf, pathbuflen,
                                                   lenbuf);
            if(r1 != 0){
                throw "something wrong";
            }
            if(lenbuf[0] > pathbuflen){
                throw "pathname too long";
            }
            if(lenbuf[0] == 0){
                break;
            }
            dostep = 1;
            out.push(ncccutil.fetchcstring(ncccutil.ptraddr(pathbuf)));
        }
        CWGL.yfrm_file_readdir_end(ctx);
        return out;
    },
    openSync: function(path){
        const ptrbuf = ncccutil.ptrbuf();
        const r = CWGL.yfrm_file_open_rw(path, ptrbuf);
        if(r != 0){
            const r2 = CWGL.yfrm_file_open_ro(path, ptrbuf);
            if(r2 != 0){
                const r3 = 999;
                //const r3 = CWGL.yfrm_open_create(path, ptrbuf);
                if(r3 != 0){
                    throw {code: "EPERM"};
                }
            }
        }
        const p = ncccutil.fetchptrbuf(ptrbuf);
        return p;
    },
    closeSync: function(p){
        CWGL.yfrm_file_close(p);
    },
    readSync: function(p, buf, offset, len, pos){
        const bufptr = ncccutil.ptraddr(buf);
        const outcount = new Int32Array(2);
        const r = CWGL.yfrm_file_read(p, pos, bufptr + offset, len,
                                      outcount);
        if(r == 0){
            return ncccutil.peek_u64(outcount);
        }else{
            throw {code: "EIO"};
        }
    },
    writeSync: function(p, buf, offset, len, pos){
        const bufptr = ncccutil.ptraddr(buf);
        const r = CWGL.yfrm_file_write(p, pos, bufptr + offset, 
                                       len);
        if(r == 0){
            return len;
        }else{
            throw {code: "EIO"};
        }
    }
};
