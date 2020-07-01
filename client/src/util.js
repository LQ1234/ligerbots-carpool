
export function getTextOrReject(response){
    if(!response.ok) {
        return Promise.reject("Could not contact server");
    }
    return response.text();
}
export function deepClone(obj){//quick hack
    return(unflatten(flatten(obj)));
}
export function objectFilter(obj,fn){
    let res={};
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            if(fn(prop,obj[prop])){
                res[prop]=obj[prop];
            }
        }
    }
    return(res);
}
//https://stackoverflow.com/a/20087506/5771000
export function shouldOpenInNewTab(e){
    return(e.ctrlKey||e.shiftKey||e.metaKey||(e.button&&e.button==1));
}

export function unflatten(flat_obj){
    let unflattened={};
    Object.keys(flat_obj).forEach((item, i) => {
        let keys=item.split("_");
        let layer=unflattened;
        for (var i = 0; i < keys.length-1; i++) {
            if(!(keys[i] in layer)){
                layer[keys[i]]={};
            }
            layer=layer[keys[i]];
        }
        layer[keys[keys.length-1]]=flat_obj[item];
    });
    return(unflattened);
}

export function flatten(obj){
    let flattened={};
    Object.keys(obj).forEach((key, i) => {
        if(typeof obj[key]=="object"&&!(obj[key] instanceof Date)){
            let flat_nest=flatten(obj[key]);
            Object.keys(flat_nest).forEach((nested_key, i) => {
                flattened[key+"_"+nested_key]=flat_nest[nested_key]
            });
        }else{
            flattened[key]=obj[key];
        }
    });
    return(flattened);
}

export function eventWithRealDate(carpool){
    return({...carpool,date:new Date(carpool.date)});
}
export function eventWithStringDate(carpool){
    return({...carpool,date:carpool.date.toISOString()});
}
