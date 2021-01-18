const FFI = require("ffi-napi");
const lib = require("../out/build/x64-Debug/node-nccc");
const DLLPATH = "../out/build/x64-Debug/testlib.dll";

const testdll = FFI.DynamicLibrary(DLLPATH, FFI.DynamicLibrary.FLAGS.RTLD_NOW);

const addr_test_echo = testdll.get("test_echo").address();
const addr_test_callback_echo = testdll.get("test_callback_echo").address();

const plusone = function(i){return i+1;}

const test_cb_i_i = lib.make_nccc_cb(plusone, "i", "i");

const testcb_1 = lib.make_nccc_call("testcb_1", addr_test_callback_echo,
                                    "illi", "i");

function check1(){
    const test_i_i = lib.make_nccc_call("test_i_i", addr_test_echo,
                                        "ii", "i");
    const test_d_d = lib.make_nccc_call("test_d_d", addr_test_echo,
                                        "id", "d");

    const test_id_id = lib.make_nccc_call("test_id_id", addr_test_echo,
                                          "iid", "id");

    const test_id_none = lib.make_nccc_call("test_id_id", addr_test_echo,
                                            "iid", "");

    const test_none_none = lib.make_nccc_call("test_none_none", addr_test_echo,
                                              "", ""); // Can't call
    const out_i = test_i_i(1,123);
    console.log("123 = ",out_i);

    const out_d = test_d_d(1, 123.4);
    console.log("123.4 = ", out_d);

    const out_a = test_id_id(2, 123, 123.4);
    console.log("a = ",out_a);

    test_id_none(0, 123, 123.4);
}

function check2(){
    console.log(test_cb_i_i);
    const r = testcb_1(1,test_cb_i_i[0], test_cb_i_i[1],
                       123);
    console.log("123+1 = ",r)
}

//check1();
check2();
