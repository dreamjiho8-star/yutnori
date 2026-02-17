"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YutEscrow = exports.YutEscrow_getterMapping = exports.YutEscrow_errors_backward = exports.YutEscrow_errors = void 0;
exports.storeDataSize = storeDataSize;
exports.loadDataSize = loadDataSize;
exports.loadTupleDataSize = loadTupleDataSize;
exports.loadGetterTupleDataSize = loadGetterTupleDataSize;
exports.storeTupleDataSize = storeTupleDataSize;
exports.dictValueParserDataSize = dictValueParserDataSize;
exports.storeSignedBundle = storeSignedBundle;
exports.loadSignedBundle = loadSignedBundle;
exports.loadTupleSignedBundle = loadTupleSignedBundle;
exports.loadGetterTupleSignedBundle = loadGetterTupleSignedBundle;
exports.storeTupleSignedBundle = storeTupleSignedBundle;
exports.dictValueParserSignedBundle = dictValueParserSignedBundle;
exports.storeStateInit = storeStateInit;
exports.loadStateInit = loadStateInit;
exports.loadTupleStateInit = loadTupleStateInit;
exports.loadGetterTupleStateInit = loadGetterTupleStateInit;
exports.storeTupleStateInit = storeTupleStateInit;
exports.dictValueParserStateInit = dictValueParserStateInit;
exports.storeContext = storeContext;
exports.loadContext = loadContext;
exports.loadTupleContext = loadTupleContext;
exports.loadGetterTupleContext = loadGetterTupleContext;
exports.storeTupleContext = storeTupleContext;
exports.dictValueParserContext = dictValueParserContext;
exports.storeSendParameters = storeSendParameters;
exports.loadSendParameters = loadSendParameters;
exports.loadTupleSendParameters = loadTupleSendParameters;
exports.loadGetterTupleSendParameters = loadGetterTupleSendParameters;
exports.storeTupleSendParameters = storeTupleSendParameters;
exports.dictValueParserSendParameters = dictValueParserSendParameters;
exports.storeMessageParameters = storeMessageParameters;
exports.loadMessageParameters = loadMessageParameters;
exports.loadTupleMessageParameters = loadTupleMessageParameters;
exports.loadGetterTupleMessageParameters = loadGetterTupleMessageParameters;
exports.storeTupleMessageParameters = storeTupleMessageParameters;
exports.dictValueParserMessageParameters = dictValueParserMessageParameters;
exports.storeDeployParameters = storeDeployParameters;
exports.loadDeployParameters = loadDeployParameters;
exports.loadTupleDeployParameters = loadTupleDeployParameters;
exports.loadGetterTupleDeployParameters = loadGetterTupleDeployParameters;
exports.storeTupleDeployParameters = storeTupleDeployParameters;
exports.dictValueParserDeployParameters = dictValueParserDeployParameters;
exports.storeStdAddress = storeStdAddress;
exports.loadStdAddress = loadStdAddress;
exports.loadTupleStdAddress = loadTupleStdAddress;
exports.loadGetterTupleStdAddress = loadGetterTupleStdAddress;
exports.storeTupleStdAddress = storeTupleStdAddress;
exports.dictValueParserStdAddress = dictValueParserStdAddress;
exports.storeVarAddress = storeVarAddress;
exports.loadVarAddress = loadVarAddress;
exports.loadTupleVarAddress = loadTupleVarAddress;
exports.loadGetterTupleVarAddress = loadGetterTupleVarAddress;
exports.storeTupleVarAddress = storeTupleVarAddress;
exports.dictValueParserVarAddress = dictValueParserVarAddress;
exports.storeBasechainAddress = storeBasechainAddress;
exports.loadBasechainAddress = loadBasechainAddress;
exports.loadTupleBasechainAddress = loadTupleBasechainAddress;
exports.loadGetterTupleBasechainAddress = loadGetterTupleBasechainAddress;
exports.storeTupleBasechainAddress = storeTupleBasechainAddress;
exports.dictValueParserBasechainAddress = dictValueParserBasechainAddress;
exports.storeDeploy = storeDeploy;
exports.loadDeploy = loadDeploy;
exports.loadTupleDeploy = loadTupleDeploy;
exports.loadGetterTupleDeploy = loadGetterTupleDeploy;
exports.storeTupleDeploy = storeTupleDeploy;
exports.dictValueParserDeploy = dictValueParserDeploy;
exports.storeDeployOk = storeDeployOk;
exports.loadDeployOk = loadDeployOk;
exports.loadTupleDeployOk = loadTupleDeployOk;
exports.loadGetterTupleDeployOk = loadGetterTupleDeployOk;
exports.storeTupleDeployOk = storeTupleDeployOk;
exports.dictValueParserDeployOk = dictValueParserDeployOk;
exports.storeFactoryDeploy = storeFactoryDeploy;
exports.loadFactoryDeploy = loadFactoryDeploy;
exports.loadTupleFactoryDeploy = loadTupleFactoryDeploy;
exports.loadGetterTupleFactoryDeploy = loadGetterTupleFactoryDeploy;
exports.storeTupleFactoryDeploy = storeTupleFactoryDeploy;
exports.dictValueParserFactoryDeploy = dictValueParserFactoryDeploy;
exports.storeChangeOwner = storeChangeOwner;
exports.loadChangeOwner = loadChangeOwner;
exports.loadTupleChangeOwner = loadTupleChangeOwner;
exports.loadGetterTupleChangeOwner = loadGetterTupleChangeOwner;
exports.storeTupleChangeOwner = storeTupleChangeOwner;
exports.dictValueParserChangeOwner = dictValueParserChangeOwner;
exports.storeChangeOwnerOk = storeChangeOwnerOk;
exports.loadChangeOwnerOk = loadChangeOwnerOk;
exports.loadTupleChangeOwnerOk = loadTupleChangeOwnerOk;
exports.loadGetterTupleChangeOwnerOk = loadGetterTupleChangeOwnerOk;
exports.storeTupleChangeOwnerOk = storeTupleChangeOwnerOk;
exports.dictValueParserChangeOwnerOk = dictValueParserChangeOwnerOk;
exports.storeCreateGame = storeCreateGame;
exports.loadCreateGame = loadCreateGame;
exports.loadTupleCreateGame = loadTupleCreateGame;
exports.loadGetterTupleCreateGame = loadGetterTupleCreateGame;
exports.storeTupleCreateGame = storeTupleCreateGame;
exports.dictValueParserCreateGame = dictValueParserCreateGame;
exports.storeDeposit = storeDeposit;
exports.loadDeposit = loadDeposit;
exports.loadTupleDeposit = loadTupleDeposit;
exports.loadGetterTupleDeposit = loadGetterTupleDeposit;
exports.storeTupleDeposit = storeTupleDeposit;
exports.dictValueParserDeposit = dictValueParserDeposit;
exports.storeSettlePayout = storeSettlePayout;
exports.loadSettlePayout = loadSettlePayout;
exports.loadTupleSettlePayout = loadTupleSettlePayout;
exports.loadGetterTupleSettlePayout = loadGetterTupleSettlePayout;
exports.storeTupleSettlePayout = storeTupleSettlePayout;
exports.dictValueParserSettlePayout = dictValueParserSettlePayout;
exports.storeRefund = storeRefund;
exports.loadRefund = loadRefund;
exports.loadTupleRefund = loadTupleRefund;
exports.loadGetterTupleRefund = loadGetterTupleRefund;
exports.storeTupleRefund = storeTupleRefund;
exports.dictValueParserRefund = dictValueParserRefund;
exports.storeGameData = storeGameData;
exports.loadGameData = loadGameData;
exports.loadTupleGameData = loadTupleGameData;
exports.loadGetterTupleGameData = loadGetterTupleGameData;
exports.storeTupleGameData = storeTupleGameData;
exports.dictValueParserGameData = dictValueParserGameData;
exports.storeYutEscrow$Data = storeYutEscrow$Data;
exports.loadYutEscrow$Data = loadYutEscrow$Data;
exports.loadTupleYutEscrow$Data = loadTupleYutEscrow$Data;
exports.loadGetterTupleYutEscrow$Data = loadGetterTupleYutEscrow$Data;
exports.storeTupleYutEscrow$Data = storeTupleYutEscrow$Data;
exports.dictValueParserYutEscrow$Data = dictValueParserYutEscrow$Data;
const core_1 = require("@ton/core");
function storeDataSize(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}
function loadDataSize(slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize', cells: _cells, bits: _bits, refs: _refs };
}
function loadTupleDataSize(source) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize', cells: _cells, bits: _bits, refs: _refs };
}
function loadGetterTupleDataSize(source) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize', cells: _cells, bits: _bits, refs: _refs };
}
function storeTupleDataSize(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}
function dictValueParserDataSize() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    };
}
function storeSignedBundle(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}
function loadSignedBundle(slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle', signature: _signature, signedData: _signedData };
}
function loadTupleSignedBundle(source) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle', signature: _signature, signedData: _signedData };
}
function loadGetterTupleSignedBundle(source) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle', signature: _signature, signedData: _signedData };
}
function storeTupleSignedBundle(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}
function dictValueParserSignedBundle() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    };
}
function storeStateInit(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}
function loadStateInit(slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit', code: _code, data: _data };
}
function loadTupleStateInit(source) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit', code: _code, data: _data };
}
function loadGetterTupleStateInit(source) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit', code: _code, data: _data };
}
function storeTupleStateInit(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}
function dictValueParserStateInit() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    };
}
function storeContext(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}
function loadContext(slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context', bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}
function loadTupleContext(source) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context', bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}
function loadGetterTupleContext(source) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context', bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}
function storeTupleContext(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}
function dictValueParserContext() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    };
}
function storeSendParameters(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) {
            b_0.storeBit(true).storeRef(src.body);
        }
        else {
            b_0.storeBit(false);
        }
        if (src.code !== null && src.code !== undefined) {
            b_0.storeBit(true).storeRef(src.code);
        }
        else {
            b_0.storeBit(false);
        }
        if (src.data !== null && src.data !== undefined) {
            b_0.storeBit(true).storeRef(src.data);
        }
        else {
            b_0.storeBit(false);
        }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}
function loadSendParameters(slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters', mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}
function loadTupleSendParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters', mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}
function loadGetterTupleSendParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters', mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}
function storeTupleSendParameters(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}
function dictValueParserSendParameters() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    };
}
function storeMessageParameters(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) {
            b_0.storeBit(true).storeRef(src.body);
        }
        else {
            b_0.storeBit(false);
        }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}
function loadMessageParameters(slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters', mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}
function loadTupleMessageParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters', mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}
function loadGetterTupleMessageParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters', mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}
function storeTupleMessageParameters(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}
function dictValueParserMessageParameters() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    };
}
function storeDeployParameters(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) {
            b_0.storeBit(true).storeRef(src.body);
        }
        else {
            b_0.storeBit(false);
        }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}
function loadDeployParameters(slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters', mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}
function loadTupleDeployParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters', mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}
function loadGetterTupleDeployParameters(source) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters', mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}
function storeTupleDeployParameters(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}
function dictValueParserDeployParameters() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    };
}
function storeStdAddress(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}
function loadStdAddress(slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress', workchain: _workchain, address: _address };
}
function loadTupleStdAddress(source) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress', workchain: _workchain, address: _address };
}
function loadGetterTupleStdAddress(source) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress', workchain: _workchain, address: _address };
}
function storeTupleStdAddress(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}
function dictValueParserStdAddress() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    };
}
function storeVarAddress(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}
function loadVarAddress(slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress', workchain: _workchain, address: _address };
}
function loadTupleVarAddress(source) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress', workchain: _workchain, address: _address };
}
function loadGetterTupleVarAddress(source) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress', workchain: _workchain, address: _address };
}
function storeTupleVarAddress(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}
function dictValueParserVarAddress() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    };
}
function storeBasechainAddress(src) {
    return (builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) {
            b_0.storeBit(true).storeInt(src.hash, 257);
        }
        else {
            b_0.storeBit(false);
        }
    };
}
function loadBasechainAddress(slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress', hash: _hash };
}
function loadTupleBasechainAddress(source) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress', hash: _hash };
}
function loadGetterTupleBasechainAddress(source) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress', hash: _hash };
}
function storeTupleBasechainAddress(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}
function dictValueParserBasechainAddress() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    };
}
function storeDeploy(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}
function loadDeploy(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) {
        throw Error('Invalid prefix');
    }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy', queryId: _queryId };
}
function loadTupleDeploy(source) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy', queryId: _queryId };
}
function loadGetterTupleDeploy(source) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy', queryId: _queryId };
}
function storeTupleDeploy(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}
function dictValueParserDeploy() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    };
}
function storeDeployOk(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}
function loadDeployOk(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) {
        throw Error('Invalid prefix');
    }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk', queryId: _queryId };
}
function loadTupleDeployOk(source) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk', queryId: _queryId };
}
function loadGetterTupleDeployOk(source) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk', queryId: _queryId };
}
function storeTupleDeployOk(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}
function dictValueParserDeployOk() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    };
}
function storeFactoryDeploy(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}
function loadFactoryDeploy(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) {
        throw Error('Invalid prefix');
    }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy', queryId: _queryId, cashback: _cashback };
}
function loadTupleFactoryDeploy(source) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy', queryId: _queryId, cashback: _cashback };
}
function loadGetterTupleFactoryDeploy(source) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy', queryId: _queryId, cashback: _cashback };
}
function storeTupleFactoryDeploy(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}
function dictValueParserFactoryDeploy() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    };
}
function storeChangeOwner(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}
function loadChangeOwner(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) {
        throw Error('Invalid prefix');
    }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner', queryId: _queryId, newOwner: _newOwner };
}
function loadTupleChangeOwner(source) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner', queryId: _queryId, newOwner: _newOwner };
}
function loadGetterTupleChangeOwner(source) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner', queryId: _queryId, newOwner: _newOwner };
}
function storeTupleChangeOwner(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}
function dictValueParserChangeOwner() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    };
}
function storeChangeOwnerOk(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}
function loadChangeOwnerOk(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) {
        throw Error('Invalid prefix');
    }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk', queryId: _queryId, newOwner: _newOwner };
}
function loadTupleChangeOwnerOk(source) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk', queryId: _queryId, newOwner: _newOwner };
}
function loadGetterTupleChangeOwnerOk(source) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk', queryId: _queryId, newOwner: _newOwner };
}
function storeTupleChangeOwnerOk(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}
function dictValueParserChangeOwnerOk() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    };
}
function storeCreateGame(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(1856838963, 32);
        b_0.storeUint(src.roomCode, 64);
        b_0.storeCoins(src.betAmount);
        b_0.storeUint(src.playerCount, 8);
    };
}
function loadCreateGame(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1856838963) {
        throw Error('Invalid prefix');
    }
    const _roomCode = sc_0.loadUintBig(64);
    const _betAmount = sc_0.loadCoins();
    const _playerCount = sc_0.loadUintBig(8);
    return { $$type: 'CreateGame', roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}
function loadTupleCreateGame(source) {
    const _roomCode = source.readBigNumber();
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    return { $$type: 'CreateGame', roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}
function loadGetterTupleCreateGame(source) {
    const _roomCode = source.readBigNumber();
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    return { $$type: 'CreateGame', roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}
function storeTupleCreateGame(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.roomCode);
    builder.writeNumber(source.betAmount);
    builder.writeNumber(source.playerCount);
    return builder.build();
}
function dictValueParserCreateGame() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeCreateGame(src)).endCell());
        },
        parse: (src) => {
            return loadCreateGame(src.loadRef().beginParse());
        }
    };
}
function storeDeposit(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(2966650534, 32);
        b_0.storeUint(src.roomCode, 64);
    };
}
function loadDeposit(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2966650534) {
        throw Error('Invalid prefix');
    }
    const _roomCode = sc_0.loadUintBig(64);
    return { $$type: 'Deposit', roomCode: _roomCode };
}
function loadTupleDeposit(source) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Deposit', roomCode: _roomCode };
}
function loadGetterTupleDeposit(source) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Deposit', roomCode: _roomCode };
}
function storeTupleDeposit(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.roomCode);
    return builder.build();
}
function dictValueParserDeposit() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeDeposit(src)).endCell());
        },
        parse: (src) => {
            return loadDeposit(src.loadRef().beginParse());
        }
    };
}
function storeSettlePayout(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(555890991, 32);
        b_0.storeUint(src.roomCode, 64);
        b_0.storeAddress(src.winner1);
        b_0.storeAddress(src.winner2);
        b_0.storeAddress(src.winner3);
        const b_1 = new core_1.Builder();
        b_1.storeAddress(src.winner4);
        b_1.storeUint(src.winnerCount, 8);
        b_0.storeRef(b_1.endCell());
    };
}
function loadSettlePayout(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 555890991) {
        throw Error('Invalid prefix');
    }
    const _roomCode = sc_0.loadUintBig(64);
    const _winner1 = sc_0.loadAddress();
    const _winner2 = sc_0.loadMaybeAddress();
    const _winner3 = sc_0.loadMaybeAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _winner4 = sc_1.loadMaybeAddress();
    const _winnerCount = sc_1.loadUintBig(8);
    return { $$type: 'SettlePayout', roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}
function loadTupleSettlePayout(source) {
    const _roomCode = source.readBigNumber();
    const _winner1 = source.readAddress();
    const _winner2 = source.readAddressOpt();
    const _winner3 = source.readAddressOpt();
    const _winner4 = source.readAddressOpt();
    const _winnerCount = source.readBigNumber();
    return { $$type: 'SettlePayout', roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}
function loadGetterTupleSettlePayout(source) {
    const _roomCode = source.readBigNumber();
    const _winner1 = source.readAddress();
    const _winner2 = source.readAddressOpt();
    const _winner3 = source.readAddressOpt();
    const _winner4 = source.readAddressOpt();
    const _winnerCount = source.readBigNumber();
    return { $$type: 'SettlePayout', roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}
function storeTupleSettlePayout(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.roomCode);
    builder.writeAddress(source.winner1);
    builder.writeAddress(source.winner2);
    builder.writeAddress(source.winner3);
    builder.writeAddress(source.winner4);
    builder.writeNumber(source.winnerCount);
    return builder.build();
}
function dictValueParserSettlePayout() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeSettlePayout(src)).endCell());
        },
        parse: (src) => {
            return loadSettlePayout(src.loadRef().beginParse());
        }
    };
}
function storeRefund(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeUint(2787932169, 32);
        b_0.storeUint(src.roomCode, 64);
    };
}
function loadRefund(slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2787932169) {
        throw Error('Invalid prefix');
    }
    const _roomCode = sc_0.loadUintBig(64);
    return { $$type: 'Refund', roomCode: _roomCode };
}
function loadTupleRefund(source) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Refund', roomCode: _roomCode };
}
function loadGetterTupleRefund(source) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Refund', roomCode: _roomCode };
}
function storeTupleRefund(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.roomCode);
    return builder.build();
}
function dictValueParserRefund() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeRefund(src)).endCell());
        },
        parse: (src) => {
            return loadRefund(src.loadRef().beginParse());
        }
    };
}
function storeGameData(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.betAmount);
        b_0.storeUint(src.playerCount, 8);
        b_0.storeUint(src.depositCount, 8);
        b_0.storeBit(src.gameActive);
        b_0.storeBit(src.settled);
        b_0.storeUint(src.createdAt, 32);
        b_0.storeCoins(src.totalDeposited);
        b_0.storeAddress(src.player1);
        b_0.storeAddress(src.player2);
        const b_1 = new core_1.Builder();
        b_1.storeAddress(src.player3);
        b_1.storeAddress(src.player4);
        b_1.storeBit(src.deposit1);
        b_1.storeBit(src.deposit2);
        b_1.storeBit(src.deposit3);
        b_1.storeBit(src.deposit4);
        b_0.storeRef(b_1.endCell());
    };
}
function loadGameData(slice) {
    const sc_0 = slice;
    const _betAmount = sc_0.loadCoins();
    const _playerCount = sc_0.loadUintBig(8);
    const _depositCount = sc_0.loadUintBig(8);
    const _gameActive = sc_0.loadBit();
    const _settled = sc_0.loadBit();
    const _createdAt = sc_0.loadUintBig(32);
    const _totalDeposited = sc_0.loadCoins();
    const _player1 = sc_0.loadAddress();
    const _player2 = sc_0.loadAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _player3 = sc_1.loadAddress();
    const _player4 = sc_1.loadAddress();
    const _deposit1 = sc_1.loadBit();
    const _deposit2 = sc_1.loadBit();
    const _deposit3 = sc_1.loadBit();
    const _deposit4 = sc_1.loadBit();
    return { $$type: 'GameData', betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}
function loadTupleGameData(source) {
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    const _depositCount = source.readBigNumber();
    const _gameActive = source.readBoolean();
    const _settled = source.readBoolean();
    const _createdAt = source.readBigNumber();
    const _totalDeposited = source.readBigNumber();
    const _player1 = source.readAddress();
    const _player2 = source.readAddress();
    const _player3 = source.readAddress();
    const _player4 = source.readAddress();
    const _deposit1 = source.readBoolean();
    const _deposit2 = source.readBoolean();
    const _deposit3 = source.readBoolean();
    const _deposit4 = source.readBoolean();
    return { $$type: 'GameData', betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}
function loadGetterTupleGameData(source) {
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    const _depositCount = source.readBigNumber();
    const _gameActive = source.readBoolean();
    const _settled = source.readBoolean();
    const _createdAt = source.readBigNumber();
    const _totalDeposited = source.readBigNumber();
    const _player1 = source.readAddress();
    const _player2 = source.readAddress();
    const _player3 = source.readAddress();
    const _player4 = source.readAddress();
    const _deposit1 = source.readBoolean();
    const _deposit2 = source.readBoolean();
    const _deposit3 = source.readBoolean();
    const _deposit4 = source.readBoolean();
    return { $$type: 'GameData', betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}
function storeTupleGameData(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeNumber(source.betAmount);
    builder.writeNumber(source.playerCount);
    builder.writeNumber(source.depositCount);
    builder.writeBoolean(source.gameActive);
    builder.writeBoolean(source.settled);
    builder.writeNumber(source.createdAt);
    builder.writeNumber(source.totalDeposited);
    builder.writeAddress(source.player1);
    builder.writeAddress(source.player2);
    builder.writeAddress(source.player3);
    builder.writeAddress(source.player4);
    builder.writeBoolean(source.deposit1);
    builder.writeBoolean(source.deposit2);
    builder.writeBoolean(source.deposit3);
    builder.writeBoolean(source.deposit4);
    return builder.build();
}
function dictValueParserGameData() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeGameData(src)).endCell());
        },
        parse: (src) => {
            return loadGameData(src.loadRef().beginParse());
        }
    };
}
function storeYutEscrow$Data(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeDict(src.games, core_1.Dictionary.Keys.BigInt(257), dictValueParserGameData());
        b_0.storeUint(src.platformFeeRate, 16);
    };
}
function loadYutEscrow$Data(slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _games = core_1.Dictionary.load(core_1.Dictionary.Keys.BigInt(257), dictValueParserGameData(), sc_0);
    const _platformFeeRate = sc_0.loadUintBig(16);
    return { $$type: 'YutEscrow$Data', owner: _owner, games: _games, platformFeeRate: _platformFeeRate };
}
function loadTupleYutEscrow$Data(source) {
    const _owner = source.readAddress();
    const _games = core_1.Dictionary.loadDirect(core_1.Dictionary.Keys.BigInt(257), dictValueParserGameData(), source.readCellOpt());
    const _platformFeeRate = source.readBigNumber();
    return { $$type: 'YutEscrow$Data', owner: _owner, games: _games, platformFeeRate: _platformFeeRate };
}
function loadGetterTupleYutEscrow$Data(source) {
    const _owner = source.readAddress();
    const _games = core_1.Dictionary.loadDirect(core_1.Dictionary.Keys.BigInt(257), dictValueParserGameData(), source.readCellOpt());
    const _platformFeeRate = source.readBigNumber();
    return { $$type: 'YutEscrow$Data', owner: _owner, games: _games, platformFeeRate: _platformFeeRate };
}
function storeTupleYutEscrow$Data(source) {
    const builder = new core_1.TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeCell(source.games.size > 0 ? (0, core_1.beginCell)().storeDictDirect(source.games, core_1.Dictionary.Keys.BigInt(257), dictValueParserGameData()).endCell() : null);
    builder.writeNumber(source.platformFeeRate);
    return builder.build();
}
function dictValueParserYutEscrow$Data() {
    return {
        serialize: (src, builder) => {
            builder.storeRef((0, core_1.beginCell)().store(storeYutEscrow$Data(src)).endCell());
        },
        parse: (src) => {
            return loadYutEscrow$Data(src.loadRef().beginParse());
        }
    };
}
function initYutEscrow_init_args(src) {
    return (builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
    };
}
async function YutEscrow_init(owner) {
    const __code = core_1.Cell.fromHex('b5ee9c7241022501000916000114ff00f4a413f4bcf2c80b01020162021c04ccd001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa40f404d30f55206c1399fa400101d16d8101f4e204925f04e002d70d1ff2e0822182106ead1d33bae302218210b0d37ea6bae3022182102122392fbae302218210a62c7809ba03050d1303fe31d33ffa00d307305e40db3c810f8f26c2019326c1059170e2f2f48200aafd25c200f2f4218101012559f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200c879016ef2f48d0860000000000000000000000000000000000000000000000000000000000000000004707f70f82323107a106b5504707070705344152404016c54145450440355d08101010fc855e0db3cc910344140206e953059f45a30944133f415e258c87f01ca0055205023cef400cb0fc9ed541604f631d33f30228101012259f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f814c1b2cf2f48171e72bb3f2f4f842f8416f24135f038200a863215612bef2f47026b3942f5611b99170e2e30020b39225b39170e2942f5611b99170e2e30020b39224b39170e2942f5611b99170e22406070800d870269453a3c7059170e292307fde25945393c7059170e292307fde24945383c7059170e292307fde8e418d086000000000000000000000000000000000000000000000000000000000000000000452b0c705917f9453a2c705e29f303538277f0ea451a5a00a0e50957fdedf00d870279453b3c7059170e292307fde25945393c7059170e292307fde24945383c7059170e292307fde8e418d086000000000000000000000000000000000000000000000000000000000000000000452a0c705917f945392c705e29f303437267f0ea451a4a00a0e50847fdedf04fa8e6c70279453b3c7059170e292307fde269453a3c7059170e292307fde24945383c7059170e292307fde8e418d08600000000000000000000000000000000000000000000000000000000000000000045290c705917f945382c705e29f303336257f0ea451a3a00a0e50737fdedfde20b39223b39170e29170e30de30f090a0b0c00082f5611b900de70279453b3c7059170e292307fde269453a3c7059170e292307fde25945393c7059170e292307fde926c218e418d08600000000000000000000000000000000000000000000000000000000000000000045280c705917f945372c705e29c3032357f0da45099a0080c7f926c21e2e200046c21016c8200a9b001f2f455d08101010fc855e0db3cc9103412206e953059f45a30944133f415e258c87f01ca0055205023cef400cb0fc9ed541603fe31d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201d430d0d72c01916d93fa4001e201d307304678db3c218101012759f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f814c1b500cf2f48116590ab31af2f48200ecef5616c200945616c1059170e2f2f410ac5e387f7015240e03f60950878101012247184516441403011110010fc855e0db3cc9103418206e953059f45a30944133f415e25351a8812710a90416a128a9048209c9c3805ca1718810385a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0028c20116120f03ee93236eb39170e28ebd5304a1718810365a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009133e227c20293256eb39170e29135e30d06c20393246eb39170e2925b32e30dc87f01ca0055205023cef400cb0fc9ed54121011017a5323a1718810385a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0012017801a1718810355a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0012001e000000005975744e6f72692057696e01b0e302018210946a98b6ba8e46d33f30c8018210aff90f5758cb1fcb3fc913f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055205023cef400cb0fc9ed54e05f04f2c0821404fa31d33f305023db3c218101012559f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f3b8116590ab31af2f47f70810101c856100706111006105f10344cb0546aa0545a00561401561401561301561501111355e0db3cc9103c45e0206e953059f45a30944133f415e28209c9c38007152416170010f84223c705f2e084005250fefa021ccb071acb0718ca0016ca0014cb1f58fa02cece01c8ce12ce12ca0012ca0013ca00ca00cd04988ebd5376a17188103c5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009139e2049130e30d9137e30d061b18191a01765354a171885a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001b01785da17188103a5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001b01a68ebba1718810365a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00925b33e258c87f01ca0055205023cef400cb0fc9ed541b0024000000005975744e6f726920526566756e640201201d1f0145be28ef6a268690000cd7d207a026987aa903609ccfd200080e8b6c080fa716d9e3618c1e00022202016a20220145b031bb513434800066be903d0134c3d5481b04e67e900040745b60407d38b6cf1b0c6021000220016bb289fb513434800066be903d0134c3d5481b04e67e900040745b60407d389540b6cf1b0c481ba48c1b651bcbdbc3f8881ba48c1b77a023013a810101230259f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2240068fa00d307d307d200d200d31ffa00fa40fa40d401d0fa40fa40d200d200d200d20030106f106e106d106c106b106a106910681067ac5b175a');
    const builder = (0, core_1.beginCell)();
    builder.storeUint(0, 1);
    initYutEscrow_init_args({ $$type: 'YutEscrow_init_args', owner })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}
exports.YutEscrow_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    3983: { message: "Invalid player count" },
    5721: { message: "Already settled" },
    19483: { message: "Game not active" },
    29159: { message: "Game already settled" },
    41723: { message: "Game not found" },
    43107: { message: "Insufficient deposit amount" },
    43440: { message: "Cannot deposit: slots full or already deposited" },
    43773: { message: "Bet amount must be positive" },
    51321: { message: "Game already exists" },
    60655: { message: "Invalid winner count" },
};
exports.YutEscrow_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Invalid player count": 3983,
    "Already settled": 5721,
    "Game not active": 19483,
    "Game already settled": 29159,
    "Game not found": 41723,
    "Insufficient deposit amount": 43107,
    "Cannot deposit: slots full or already deposited": 43440,
    "Bet amount must be positive": 43773,
    "Game already exists": 51321,
    "Invalid winner count": 60655,
};
const YutEscrow_types = [
    { "name": "DataSize", "header": null, "fields": [{ "name": "cells", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "bits", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "refs", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }] },
    { "name": "SignedBundle", "header": null, "fields": [{ "name": "signature", "type": { "kind": "simple", "type": "fixed-bytes", "optional": false, "format": 64 } }, { "name": "signedData", "type": { "kind": "simple", "type": "slice", "optional": false, "format": "remainder" } }] },
    { "name": "StateInit", "header": null, "fields": [{ "name": "code", "type": { "kind": "simple", "type": "cell", "optional": false } }, { "name": "data", "type": { "kind": "simple", "type": "cell", "optional": false } }] },
    { "name": "Context", "header": null, "fields": [{ "name": "bounceable", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "sender", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "raw", "type": { "kind": "simple", "type": "slice", "optional": false } }] },
    { "name": "SendParameters", "header": null, "fields": [{ "name": "mode", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "body", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "code", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "data", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "to", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "bounce", "type": { "kind": "simple", "type": "bool", "optional": false } }] },
    { "name": "MessageParameters", "header": null, "fields": [{ "name": "mode", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "body", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "to", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "bounce", "type": { "kind": "simple", "type": "bool", "optional": false } }] },
    { "name": "DeployParameters", "header": null, "fields": [{ "name": "mode", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "body", "type": { "kind": "simple", "type": "cell", "optional": true } }, { "name": "value", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }, { "name": "bounce", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "init", "type": { "kind": "simple", "type": "StateInit", "optional": false } }] },
    { "name": "StdAddress", "header": null, "fields": [{ "name": "workchain", "type": { "kind": "simple", "type": "int", "optional": false, "format": 8 } }, { "name": "address", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 256 } }] },
    { "name": "VarAddress", "header": null, "fields": [{ "name": "workchain", "type": { "kind": "simple", "type": "int", "optional": false, "format": 32 } }, { "name": "address", "type": { "kind": "simple", "type": "slice", "optional": false } }] },
    { "name": "BasechainAddress", "header": null, "fields": [{ "name": "hash", "type": { "kind": "simple", "type": "int", "optional": true, "format": 257 } }] },
    { "name": "Deploy", "header": 2490013878, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "DeployOk", "header": 2952335191, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "FactoryDeploy", "header": 1829761339, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "cashback", "type": { "kind": "simple", "type": "address", "optional": false } }] },
    { "name": "ChangeOwner", "header": 2174598809, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "newOwner", "type": { "kind": "simple", "type": "address", "optional": false } }] },
    { "name": "ChangeOwnerOk", "header": 846932810, "fields": [{ "name": "queryId", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "newOwner", "type": { "kind": "simple", "type": "address", "optional": false } }] },
    { "name": "CreateGame", "header": 1856838963, "fields": [{ "name": "roomCode", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "betAmount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": "coins" } }, { "name": "playerCount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 8 } }] },
    { "name": "Deposit", "header": 2966650534, "fields": [{ "name": "roomCode", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "SettlePayout", "header": 555890991, "fields": [{ "name": "roomCode", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }, { "name": "winner1", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "winner2", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "winner3", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "winner4", "type": { "kind": "simple", "type": "address", "optional": true } }, { "name": "winnerCount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 8 } }] },
    { "name": "Refund", "header": 2787932169, "fields": [{ "name": "roomCode", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 64 } }] },
    { "name": "GameData", "header": null, "fields": [{ "name": "betAmount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": "coins" } }, { "name": "playerCount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 8 } }, { "name": "depositCount", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 8 } }, { "name": "gameActive", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "settled", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "createdAt", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 32 } }, { "name": "totalDeposited", "type": { "kind": "simple", "type": "uint", "optional": false, "format": "coins" } }, { "name": "player1", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "player2", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "player3", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "player4", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "deposit1", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "deposit2", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "deposit3", "type": { "kind": "simple", "type": "bool", "optional": false } }, { "name": "deposit4", "type": { "kind": "simple", "type": "bool", "optional": false } }] },
    { "name": "YutEscrow$Data", "header": null, "fields": [{ "name": "owner", "type": { "kind": "simple", "type": "address", "optional": false } }, { "name": "games", "type": { "kind": "dict", "key": "int", "value": "GameData", "valueFormat": "ref" } }, { "name": "platformFeeRate", "type": { "kind": "simple", "type": "uint", "optional": false, "format": 16 } }] },
];
const YutEscrow_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "ChangeOwner": 2174598809,
    "ChangeOwnerOk": 846932810,
    "CreateGame": 1856838963,
    "Deposit": 2966650534,
    "SettlePayout": 555890991,
    "Refund": 2787932169,
};
const YutEscrow_getters = [
    { "name": "gameData", "methodId": 121383, "arguments": [{ "name": "roomCode", "type": { "kind": "simple", "type": "int", "optional": false, "format": 257 } }], "returnType": { "kind": "simple", "type": "GameData", "optional": true } },
    { "name": "platformFeeRate", "methodId": 114886, "arguments": [], "returnType": { "kind": "simple", "type": "int", "optional": false, "format": 257 } },
    { "name": "owner", "methodId": 83229, "arguments": [], "returnType": { "kind": "simple", "type": "address", "optional": false } },
];
exports.YutEscrow_getterMapping = {
    'gameData': 'getGameData',
    'platformFeeRate': 'getPlatformFeeRate',
    'owner': 'getOwner',
};
const YutEscrow_receivers = [
    { "receiver": "internal", "message": { "kind": "typed", "type": "CreateGame" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "Deposit" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "SettlePayout" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "Refund" } },
    { "receiver": "internal", "message": { "kind": "typed", "type": "Deploy" } },
];
class YutEscrow {
    static async init(owner) {
        return await YutEscrow_init(owner);
    }
    static async fromInit(owner) {
        const __gen_init = await YutEscrow_init(owner);
        const address = (0, core_1.contractAddress)(0, __gen_init);
        return new YutEscrow(address, __gen_init);
    }
    static fromAddress(address) {
        return new YutEscrow(address);
    }
    constructor(address, init) {
        this.abi = {
            types: YutEscrow_types,
            getters: YutEscrow_getters,
            receivers: YutEscrow_receivers,
            errors: exports.YutEscrow_errors,
        };
        this.address = address;
        this.init = init;
    }
    async send(provider, via, args, message) {
        let body = null;
        if (message && typeof message === 'object' && !(message instanceof core_1.Slice) && message.$$type === 'CreateGame') {
            body = (0, core_1.beginCell)().store(storeCreateGame(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof core_1.Slice) && message.$$type === 'Deposit') {
            body = (0, core_1.beginCell)().store(storeDeposit(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof core_1.Slice) && message.$$type === 'SettlePayout') {
            body = (0, core_1.beginCell)().store(storeSettlePayout(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof core_1.Slice) && message.$$type === 'Refund') {
            body = (0, core_1.beginCell)().store(storeRefund(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof core_1.Slice) && message.$$type === 'Deploy') {
            body = (0, core_1.beginCell)().store(storeDeploy(message)).endCell();
        }
        if (body === null) {
            throw new Error('Invalid message type');
        }
        await provider.internal(via, { ...args, body: body });
    }
    async getGameData(provider, roomCode) {
        const builder = new core_1.TupleBuilder();
        builder.writeNumber(roomCode);
        const source = (await provider.get('gameData', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleGameData(result_p) : null;
        return result;
    }
    async getPlatformFeeRate(provider) {
        const builder = new core_1.TupleBuilder();
        const source = (await provider.get('platformFeeRate', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    async getOwner(provider) {
        const builder = new core_1.TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
}
exports.YutEscrow = YutEscrow;
YutEscrow.storageReserve = 0n;
YutEscrow.errors = exports.YutEscrow_errors_backward;
YutEscrow.opcodes = YutEscrow_opcodes;
