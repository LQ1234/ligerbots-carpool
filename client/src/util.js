
function getTextOrReject(response){
    if(!response.ok) {
        return Promise.reject("Could not contact server");
    }
    return response.text();
}
function deepClone(obj){//quick hack
    return(unflatten(flatten(obj)));
}
function objectFilter(obj,fn){
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
