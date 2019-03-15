
declare global {

    interface Object {
        apply(to: Object): Object;
    }

}
Object.defineProperty(Object.prototype, 'apply',
    <PropertyDescriptor>{
        value: function (this: Object, def: Object = {}): Object {
            const to = {};
            Object.keys(def).forEach((key) => {
                (<any>to)[key] = (key in this) ? (<any>this)[key] : (<any>def)[key];
            });
            return to;
        },
        writable: false,
        enumerable: false
    }
);

function _() { };
export { _ };