declare module "msgpack-lite" {
    export function encode(data: any): any;
    export function decode(buffer: any): any;
}

declare var msgpack: {
    encode: (data: any) => any,
    decode: (buffer: any) => any
};
