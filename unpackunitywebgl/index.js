const fs = require("fs");
const ROOT = "./output";
const UNITY_DATA = "webgl.data";

function deploy(data) { 
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let pos = 0;
    let prefix = "UnityWebData1.0\0";
    pos += prefix.length;
    let headerSize = view.getUint32(pos, true);
    pos += 4;
    while (pos < headerSize) {
        let offset = view.getUint32(pos, true);
        pos += 4;
        let size = view.getUint32(pos, true);
        pos += 4;
        let pathLength = view.getUint32(pos, true);
        pos += 4;
        let path = String.fromCharCode.apply(null, data.subarray(pos, pos + pathLength));
        pos += pathLength;
        /* Mkdir -p */
        for(let folder = 0, folderNext = path.indexOf("/", folder) + 1 ;
             folderNext > 0;
             folder = folderNext, folderNext = path.indexOf("/", folder) + 1){
            const dirname =  ROOT + "/" + path.substring(0, folderNext - 1);
            console.log("Mkdir?", dirname);
            fs.mkdirSync(dirname);
        }
        /* Write file */
        const filename = ROOT + "/" + path;
        console.log("Put", filename);
        fs.writeFileSync(filename, data.subarray(offset, offset + size));
    }
}

const data = fs.readFileSync(UNITY_DATA);

fs.mkdirSync(ROOT);
deploy(data);
