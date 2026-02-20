import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwner = {
    $$type: 'ChangeOwner';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwner(src: ChangeOwner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2174598809, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2174598809) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwner(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwner' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwner(source: ChangeOwner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwner(): DictionaryValue<ChangeOwner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwner(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwner(src.loadRef().beginParse());
        }
    }
}

export type ChangeOwnerOk = {
    $$type: 'ChangeOwnerOk';
    queryId: bigint;
    newOwner: Address;
}

export function storeChangeOwnerOk(src: ChangeOwnerOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(846932810, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.newOwner);
    };
}

export function loadChangeOwnerOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 846932810) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _newOwner = sc_0.loadAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function loadGetterTupleChangeOwnerOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _newOwner = source.readAddress();
    return { $$type: 'ChangeOwnerOk' as const, queryId: _queryId, newOwner: _newOwner };
}

export function storeTupleChangeOwnerOk(source: ChangeOwnerOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.newOwner);
    return builder.build();
}

export function dictValueParserChangeOwnerOk(): DictionaryValue<ChangeOwnerOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeChangeOwnerOk(src)).endCell());
        },
        parse: (src) => {
            return loadChangeOwnerOk(src.loadRef().beginParse());
        }
    }
}

export type CreateGame = {
    $$type: 'CreateGame';
    roomCode: bigint;
    betAmount: bigint;
    playerCount: bigint;
}

export function storeCreateGame(src: CreateGame) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1856838963, 32);
        b_0.storeUint(src.roomCode, 64);
        b_0.storeCoins(src.betAmount);
        b_0.storeUint(src.playerCount, 8);
    };
}

export function loadCreateGame(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1856838963) { throw Error('Invalid prefix'); }
    const _roomCode = sc_0.loadUintBig(64);
    const _betAmount = sc_0.loadCoins();
    const _playerCount = sc_0.loadUintBig(8);
    return { $$type: 'CreateGame' as const, roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}

export function loadTupleCreateGame(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    return { $$type: 'CreateGame' as const, roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}

export function loadGetterTupleCreateGame(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    const _betAmount = source.readBigNumber();
    const _playerCount = source.readBigNumber();
    return { $$type: 'CreateGame' as const, roomCode: _roomCode, betAmount: _betAmount, playerCount: _playerCount };
}

export function storeTupleCreateGame(source: CreateGame) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.roomCode);
    builder.writeNumber(source.betAmount);
    builder.writeNumber(source.playerCount);
    return builder.build();
}

export function dictValueParserCreateGame(): DictionaryValue<CreateGame> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateGame(src)).endCell());
        },
        parse: (src) => {
            return loadCreateGame(src.loadRef().beginParse());
        }
    }
}

export type Deposit = {
    $$type: 'Deposit';
    roomCode: bigint;
}

export function storeDeposit(src: Deposit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2966650534, 32);
        b_0.storeUint(src.roomCode, 64);
    };
}

export function loadDeposit(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2966650534) { throw Error('Invalid prefix'); }
    const _roomCode = sc_0.loadUintBig(64);
    return { $$type: 'Deposit' as const, roomCode: _roomCode };
}

export function loadTupleDeposit(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Deposit' as const, roomCode: _roomCode };
}

export function loadGetterTupleDeposit(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Deposit' as const, roomCode: _roomCode };
}

export function storeTupleDeposit(source: Deposit) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.roomCode);
    return builder.build();
}

export function dictValueParserDeposit(): DictionaryValue<Deposit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeposit(src)).endCell());
        },
        parse: (src) => {
            return loadDeposit(src.loadRef().beginParse());
        }
    }
}

export type SettlePayout = {
    $$type: 'SettlePayout';
    roomCode: bigint;
    winner1: Address;
    winner2: Address | null;
    winner3: Address | null;
    winner4: Address | null;
    winnerCount: bigint;
}

export function storeSettlePayout(src: SettlePayout) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(555890991, 32);
        b_0.storeUint(src.roomCode, 64);
        b_0.storeAddress(src.winner1);
        b_0.storeAddress(src.winner2);
        b_0.storeAddress(src.winner3);
        const b_1 = new Builder();
        b_1.storeAddress(src.winner4);
        b_1.storeUint(src.winnerCount, 8);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadSettlePayout(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 555890991) { throw Error('Invalid prefix'); }
    const _roomCode = sc_0.loadUintBig(64);
    const _winner1 = sc_0.loadAddress();
    const _winner2 = sc_0.loadMaybeAddress();
    const _winner3 = sc_0.loadMaybeAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _winner4 = sc_1.loadMaybeAddress();
    const _winnerCount = sc_1.loadUintBig(8);
    return { $$type: 'SettlePayout' as const, roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}

export function loadTupleSettlePayout(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    const _winner1 = source.readAddress();
    const _winner2 = source.readAddressOpt();
    const _winner3 = source.readAddressOpt();
    const _winner4 = source.readAddressOpt();
    const _winnerCount = source.readBigNumber();
    return { $$type: 'SettlePayout' as const, roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}

export function loadGetterTupleSettlePayout(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    const _winner1 = source.readAddress();
    const _winner2 = source.readAddressOpt();
    const _winner3 = source.readAddressOpt();
    const _winner4 = source.readAddressOpt();
    const _winnerCount = source.readBigNumber();
    return { $$type: 'SettlePayout' as const, roomCode: _roomCode, winner1: _winner1, winner2: _winner2, winner3: _winner3, winner4: _winner4, winnerCount: _winnerCount };
}

export function storeTupleSettlePayout(source: SettlePayout) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.roomCode);
    builder.writeAddress(source.winner1);
    builder.writeAddress(source.winner2);
    builder.writeAddress(source.winner3);
    builder.writeAddress(source.winner4);
    builder.writeNumber(source.winnerCount);
    return builder.build();
}

export function dictValueParserSettlePayout(): DictionaryValue<SettlePayout> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSettlePayout(src)).endCell());
        },
        parse: (src) => {
            return loadSettlePayout(src.loadRef().beginParse());
        }
    }
}

export type Refund = {
    $$type: 'Refund';
    roomCode: bigint;
}

export function storeRefund(src: Refund) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2787932169, 32);
        b_0.storeUint(src.roomCode, 64);
    };
}

export function loadRefund(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2787932169) { throw Error('Invalid prefix'); }
    const _roomCode = sc_0.loadUintBig(64);
    return { $$type: 'Refund' as const, roomCode: _roomCode };
}

export function loadTupleRefund(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Refund' as const, roomCode: _roomCode };
}

export function loadGetterTupleRefund(source: TupleReader) {
    const _roomCode = source.readBigNumber();
    return { $$type: 'Refund' as const, roomCode: _roomCode };
}

export function storeTupleRefund(source: Refund) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.roomCode);
    return builder.build();
}

export function dictValueParserRefund(): DictionaryValue<Refund> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefund(src)).endCell());
        },
        parse: (src) => {
            return loadRefund(src.loadRef().beginParse());
        }
    }
}

export type WithdrawFees = {
    $$type: 'WithdrawFees';
    amount: bigint;
}

export function storeWithdrawFees(src: WithdrawFees) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3947541004, 32);
        b_0.storeCoins(src.amount);
    };
}

export function loadWithdrawFees(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3947541004) { throw Error('Invalid prefix'); }
    const _amount = sc_0.loadCoins();
    return { $$type: 'WithdrawFees' as const, amount: _amount };
}

export function loadTupleWithdrawFees(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'WithdrawFees' as const, amount: _amount };
}

export function loadGetterTupleWithdrawFees(source: TupleReader) {
    const _amount = source.readBigNumber();
    return { $$type: 'WithdrawFees' as const, amount: _amount };
}

export function storeTupleWithdrawFees(source: WithdrawFees) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserWithdrawFees(): DictionaryValue<WithdrawFees> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdrawFees(src)).endCell());
        },
        parse: (src) => {
            return loadWithdrawFees(src.loadRef().beginParse());
        }
    }
}

export type GameData = {
    $$type: 'GameData';
    betAmount: bigint;
    playerCount: bigint;
    depositCount: bigint;
    gameActive: boolean;
    settled: boolean;
    createdAt: bigint;
    totalDeposited: bigint;
    player1: Address;
    player2: Address;
    player3: Address;
    player4: Address;
    deposit1: boolean;
    deposit2: boolean;
    deposit3: boolean;
    deposit4: boolean;
}

export function storeGameData(src: GameData) {
    return (builder: Builder) => {
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
        const b_1 = new Builder();
        b_1.storeAddress(src.player3);
        b_1.storeAddress(src.player4);
        b_1.storeBit(src.deposit1);
        b_1.storeBit(src.deposit2);
        b_1.storeBit(src.deposit3);
        b_1.storeBit(src.deposit4);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadGameData(slice: Slice) {
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
    return { $$type: 'GameData' as const, betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}

export function loadTupleGameData(source: TupleReader) {
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
    return { $$type: 'GameData' as const, betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}

export function loadGetterTupleGameData(source: TupleReader) {
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
    return { $$type: 'GameData' as const, betAmount: _betAmount, playerCount: _playerCount, depositCount: _depositCount, gameActive: _gameActive, settled: _settled, createdAt: _createdAt, totalDeposited: _totalDeposited, player1: _player1, player2: _player2, player3: _player3, player4: _player4, deposit1: _deposit1, deposit2: _deposit2, deposit3: _deposit3, deposit4: _deposit4 };
}

export function storeTupleGameData(source: GameData) {
    const builder = new TupleBuilder();
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

export function dictValueParserGameData(): DictionaryValue<GameData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGameData(src)).endCell());
        },
        parse: (src) => {
            return loadGameData(src.loadRef().beginParse());
        }
    }
}

export type YutEscrow$Data = {
    $$type: 'YutEscrow$Data';
    owner: Address;
    games: Dictionary<bigint, GameData>;
    platformFeeRate: bigint;
    version: bigint;
}

export function storeYutEscrow$Data(src: YutEscrow$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeDict(src.games, Dictionary.Keys.BigInt(257), dictValueParserGameData());
        b_0.storeUint(src.platformFeeRate, 16);
        b_0.storeUint(src.version, 32);
    };
}

export function loadYutEscrow$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _games = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserGameData(), sc_0);
    const _platformFeeRate = sc_0.loadUintBig(16);
    const _version = sc_0.loadUintBig(32);
    return { $$type: 'YutEscrow$Data' as const, owner: _owner, games: _games, platformFeeRate: _platformFeeRate, version: _version };
}

export function loadTupleYutEscrow$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _games = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserGameData(), source.readCellOpt());
    const _platformFeeRate = source.readBigNumber();
    const _version = source.readBigNumber();
    return { $$type: 'YutEscrow$Data' as const, owner: _owner, games: _games, platformFeeRate: _platformFeeRate, version: _version };
}

export function loadGetterTupleYutEscrow$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _games = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserGameData(), source.readCellOpt());
    const _platformFeeRate = source.readBigNumber();
    const _version = source.readBigNumber();
    return { $$type: 'YutEscrow$Data' as const, owner: _owner, games: _games, platformFeeRate: _platformFeeRate, version: _version };
}

export function storeTupleYutEscrow$Data(source: YutEscrow$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeCell(source.games.size > 0 ? beginCell().storeDictDirect(source.games, Dictionary.Keys.BigInt(257), dictValueParserGameData()).endCell() : null);
    builder.writeNumber(source.platformFeeRate);
    builder.writeNumber(source.version);
    return builder.build();
}

export function dictValueParserYutEscrow$Data(): DictionaryValue<YutEscrow$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeYutEscrow$Data(src)).endCell());
        },
        parse: (src) => {
            return loadYutEscrow$Data(src.loadRef().beginParse());
        }
    }
}

 type YutEscrow_init_args = {
    $$type: 'YutEscrow_init_args';
    owner: Address;
    version: bigint;
}

function initYutEscrow_init_args(src: YutEscrow_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeInt(src.version, 257);
    };
}

async function YutEscrow_init(owner: Address, version: bigint) {
    const __code = Cell.fromHex('b5ee9c7241022701000a46000114ff00f4a413f4bcf2c80b01020162021e04e0d001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019cfa40f404d30fd31f55306c148e10fa40810101d7005902d1016d8101f458e205925f05e003d70d1ff2e0822182106ead1d33bae302218210b0d37ea6bae3022182102122392fbae302218210a62c7809ba03050b1203fe31d33ffa00d3073010345e50db3c810f8f27c2019327c1059170e2f2f48200aafd26c200f2f4228101012659f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200c879016ef2f48d0860000000000000000000000000000000000000000000000000000000000000000004707f70f82323107b106c5504707070701c26040174534454145450440355d08101010fc855e0db3cc9413014206e953059f45a30944133f415e24003c87f01ca0055305034cef400cb0fcb1fc9ed541904f031d33f30218101012259f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f814c1b2cf2f48171e72bb3f2f4f842f8416f24135f038200a863015611bef2f47025b39353efb99170e2e30020b39224b39170e29353efb99170e2e30020b39223b39170e29353efb99170e22606070800d87025945392c7059170e292307fde24945382c7059170e292307fde23945372c7059170e292307fde8e418d086000000000000000000000000000000000000000000000000000000000000000000452a0c705917f945391c705e29f303437227f0da4519fa0090d50847fdedf00d870269453a2c7059170e292307fde24945382c7059170e292307fde23945372c7059170e292307fde8e418d08600000000000000000000000000000000000000000000000000000000000000000045290c705917f945381c705e29f303336217f0da4519fa0090d50737fdedf01fa8e6b70269453a2c7059170e292307fde25945392c7059170e292307fde23945372c7059170e292307fde8e408d08600000000000000000000000000000000000000000000000000000000000000000045280c705917f945371c705e29e303235207f0da4519fa0094d6d7fdedfde20b39222b39170e29353efb99170e20901fe8e6d70269453a2c7059170e292307fde25945392c7059170e292307fde24945382c7059170e292307fde91318e408d08600000000000000000000000000000000000000000000000000000000000000000045270c705917f945361c705e29c3031347f0ca4518ea0080c7f9131e2e29131e28200a9b001f2f455d08101010f0a0154c855e0db3cc912206e953059f45a30944133f415e24003c87f01ca0055305034cef400cb0fcb1fc9ed541903fe31d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201d430d0d72c01916d93fa4001e201d3073010374689db3c228101012759f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f814c1b500cf2f48116590ab31af2f48200ecef5617c200945617c1059170e2f2f410ac5e381c260c03fa7f700950878101012247184516441403011110010fc855e0db3cc945505280206e953059f45a30944133f415e25da8812710a90414a12aa90482084c4b405ca1718810395a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb002ac20119100d04d893286eb39170e28ebd5305a17188103b5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009138e229c20293266eb39170e29136e30d08c20393266eb39170e293363430e30d8101016dc8100e0f11017a5374a1718810395a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010017a5052a1718810375a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010001e000000005975744e6f72692057696e016e216e925b6d8e8a016f2f550e55e0db3cc9e2103512206e953059f45a30944133f415e25ac87f01ca0055305034cef400cb0fcb1fc9ed541902cce302218210eb4ab20cbae302018210946a98b6ba8e4ad33f30c8018210aff90f5758cb1fcb3fc9443012f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055305034cef400cb0fcb1fc9ed54e05f05f2c082131b04fa31d33f304134db3c228101012659f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe28200a2fb216eb3f2f46f2f3b8116590ab31af2f47f70810101c856100706111006105f10344cb0546aa0545a00561401561401561301561501111355e0db3cc94d5052f0206e953059f45a30944133f415e282084c4b40081c26191404988ebd5387a1718810345a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb009131e2059139e30d019130e30d18151617017a5365a17188103c5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001801765343a171885a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb001803da8ebc59a1718810365a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0092355be28101016dc8216e925b6d8e8a016f2f550e55e0db3cc9e210344160206e953059f45a30944133f415e2401318191a0024000000005975744e6f726920526566756e64005250fefa021ccb071acb0718ca0016ca0014cb1f58fa02cece01c8ce12ce12ca0012ca0013ca00ca00cd0026c87f01ca0055305034cef400cb0fcb1fc9ed5402f631fa00304134db3c820afaf080f8276f1001a1815a0121c200f2f425c000917f935350bce291359130e27188250347775a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb005502c87f01ca0055305034cef400cb0fcb1fc9ed541c1d0010f84224c705f2e0840034000000005975744e6f726920466565205769746864726177616c0201201f210159be28ef6a268690000ce7d207a026987e98faa98360a47087d20408080eb802c816880b6c080fa2c716d9e3620c2000022302016a22240159b031bb5134348000673e903d0134c3f4c7d54c1b0523843e9020404075c01640b4405b60407d1638b6cf1b106023000221017fb289fb5134348000673e903d0134c3f4c7d54c1b0523843e9020404075c01640b4405b60407d16389540f6cf1b10481ba48c1b651bcbdbc3f8881ba48c1b77a025013a810101240259f40d6fa192306ddf206e92306d8e87d0db3c6c1f6f0fe2260068fa00d307d307d200d200d31ffa00fa40fa40d401d0fa40fa40d200d200d200d20030106f106e106d106c106b106a106910681067ce0c540a');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initYutEscrow_init_args({ $$type: 'YutEscrow_init_args', owner, version })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const YutEscrow_errors = {
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
    23041: { message: "No fees to withdraw" },
    29159: { message: "Game already settled" },
    41723: { message: "Game not found" },
    43107: { message: "Insufficient deposit amount" },
    43440: { message: "Cannot deposit: slots full or already deposited" },
    43773: { message: "Bet amount must be positive" },
    51321: { message: "Game already exists" },
    60655: { message: "Invalid winner count" },
} as const

export const YutEscrow_errors_backward = {
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
    "No fees to withdraw": 23041,
    "Game already settled": 29159,
    "Game not found": 41723,
    "Insufficient deposit amount": 43107,
    "Cannot deposit: slots full or already deposited": 43440,
    "Bet amount must be positive": 43773,
    "Game already exists": 51321,
    "Invalid winner count": 60655,
} as const

const YutEscrow_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwner","header":2174598809,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ChangeOwnerOk","header":846932810,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"newOwner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"CreateGame","header":1856838963,"fields":[{"name":"roomCode","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"betAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"playerCount","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"Deposit","header":2966650534,"fields":[{"name":"roomCode","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"SettlePayout","header":555890991,"fields":[{"name":"roomCode","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"winner1","type":{"kind":"simple","type":"address","optional":false}},{"name":"winner2","type":{"kind":"simple","type":"address","optional":true}},{"name":"winner3","type":{"kind":"simple","type":"address","optional":true}},{"name":"winner4","type":{"kind":"simple","type":"address","optional":true}},{"name":"winnerCount","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"Refund","header":2787932169,"fields":[{"name":"roomCode","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"WithdrawFees","header":3947541004,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"GameData","header":null,"fields":[{"name":"betAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"playerCount","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"depositCount","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"gameActive","type":{"kind":"simple","type":"bool","optional":false}},{"name":"settled","type":{"kind":"simple","type":"bool","optional":false}},{"name":"createdAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalDeposited","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"player1","type":{"kind":"simple","type":"address","optional":false}},{"name":"player2","type":{"kind":"simple","type":"address","optional":false}},{"name":"player3","type":{"kind":"simple","type":"address","optional":false}},{"name":"player4","type":{"kind":"simple","type":"address","optional":false}},{"name":"deposit1","type":{"kind":"simple","type":"bool","optional":false}},{"name":"deposit2","type":{"kind":"simple","type":"bool","optional":false}},{"name":"deposit3","type":{"kind":"simple","type":"bool","optional":false}},{"name":"deposit4","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"YutEscrow$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"games","type":{"kind":"dict","key":"int","value":"GameData","valueFormat":"ref"}},{"name":"platformFeeRate","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"version","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
]

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
    "WithdrawFees": 3947541004,
}

const YutEscrow_getters: ABIGetter[] = [
    {"name":"gameData","methodId":121383,"arguments":[{"name":"roomCode","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"GameData","optional":true}},
    {"name":"platformFeeRate","methodId":114886,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const YutEscrow_getterMapping: { [key: string]: string } = {
    'gameData': 'getGameData',
    'platformFeeRate': 'getPlatformFeeRate',
    'owner': 'getOwner',
}

const YutEscrow_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"CreateGame"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deposit"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SettlePayout"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Refund"}},
    {"receiver":"internal","message":{"kind":"typed","type":"WithdrawFees"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class YutEscrow implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = YutEscrow_errors_backward;
    public static readonly opcodes = YutEscrow_opcodes;
    
    static async init(owner: Address, version: bigint) {
        return await YutEscrow_init(owner, version);
    }
    
    static async fromInit(owner: Address, version: bigint) {
        const __gen_init = await YutEscrow_init(owner, version);
        const address = contractAddress(0, __gen_init);
        return new YutEscrow(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new YutEscrow(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  YutEscrow_types,
        getters: YutEscrow_getters,
        receivers: YutEscrow_receivers,
        errors: YutEscrow_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: CreateGame | Deposit | SettlePayout | Refund | WithdrawFees | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CreateGame') {
            body = beginCell().store(storeCreateGame(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deposit') {
            body = beginCell().store(storeDeposit(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SettlePayout') {
            body = beginCell().store(storeSettlePayout(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Refund') {
            body = beginCell().store(storeRefund(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'WithdrawFees') {
            body = beginCell().store(storeWithdrawFees(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGameData(provider: ContractProvider, roomCode: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(roomCode);
        const source = (await provider.get('gameData', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleGameData(result_p) : null;
        return result;
    }
    
    async getPlatformFeeRate(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('platformFeeRate', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}