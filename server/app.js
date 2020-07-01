let settings = {
    dbName: "ligerbotscarpool",
    maxStrLen: 1000
}

let mysql = require("mysql");


let con = mysql.createConnection({
    host: "127.0.0.1",
    user: "ligerbots-carpool",
    password: "PASSWORD",
    charset : 'utf8mb4',
    database: settings.dbName
});

con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
});


function cleanUserInput(usrinp, fields) { //-> null or obj with fields
    let res = {};
    for (let i = 0; i < fields.length; i++) {
        let prop=fields[i];
        if (usrinp.hasOwnProperty(prop)) {
            let value=usrinp[prop];
            if(typeof value == "string" || typeof value == "number" || typeof value == "boolean"){
                res[prop] = value;
            }else{
                return(null);
            }
        }else{
            return (null);
        }
    }
    return (res);
}
function fixDateUserInput(obj,fields){//mutating!!
    for (let i = 0; i < fields.length; i++) {
        let prop=fields[i];
        if (!obj.hasOwnProperty(prop)) {
            return(false);
        }
        if(!(typeof obj[prop]=="string")){
            return(false);
        }
        let date=new Date(obj[prop]);
        if(isNaN(date.getTime())){
            return(false);
        }
        obj[prop]=date;
    }
    return(true);
}

function fixDateForEvent(event){
    return({...event,date:event.date.toISOString()});
}
function ensureInboundStrings(obj,fields){
    for (let i = 0; i < fields.length; i++) {
        let prop=fields[i];
        if (!obj.hasOwnProperty(prop)) {
            return(false);
        }
        if(!(typeof obj[prop]=="string")){
            return(false);
        }
        if(obj[prop].length>settings.maxStrLen){
            return(false);
        }
    }
    return(true);
}

function ensureInboundNumbers(obj,fields,min,max){
    for (let i = 0; i < fields.length; i++) {
        let prop=fields[i];
        if (!obj.hasOwnProperty(prop)) {
            return(false);
        }
        if(!(typeof obj[prop]=="number")){
            return(false);
        }
        if((min!=undefined)&&obj[prop]<min){
            return(false);
        }
        if((max!=undefined)&&obj[prop]>max){
            return(false);
        }
    }
    return(true);
}
function query(qry,args){
    return new Promise((resolve, reject) => {
        con.query(qry,args, (err, res) => {
            if(err)reject(err);
            else resolve(res);
        });
    });
}

function unflatten(flat_obj){
    if(flat_obj==null||flat_obj==undefined)return flat_obj;

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

function flatten(obj){
    if(obj==null||obj==undefined)return obj;
    let flattened={};
    Object.keys(obj).forEach((key, i) => {
        if(typeof obj[key]=="object"&&!(obj[key] instanceof Date)&&!(obj[key]==undefined || obj[key]==null)){
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

function countPeopleInCarpool(carpoolId,isDepartingTrip){
    return query(isDepartingTrip?
        "SELECT * FROM participants WHERE (carpool_departing_type = 3 AND carpool_departing_carpoolId = ?)":
        "SELECT * FROM participants WHERE (carpool_returning_type = 3 AND carpool_returning_carpoolId = ?)",[carpoolId])
    .then(res=>res.length);
}
async function carpoolCanAcceptMoreParticipants(carpoolIdentifier,isDepartingTrip){
    if(carpoolIdentifier.type!=3) return(true);

    let carpools = await query("SELECT * FROM carpools WHERE id = ?",[carpoolIdentifier.carpoolId]);
    console.log("!!!!",carpoolIdentifier.type, carpoolIdentifier.carpoolId);

    if(carpools.length!=1) return(false);
    let carpool=carpools[0];

    let drivers=await query("SELECT * FROM participants WHERE id = ?",[carpool.driverId]);
    if(drivers.length!=1)return(false);
    let driver=drivers[0];

    if(isDepartingTrip){
        if(driver.carpool_departing_type==3&&driver.carpool_departing_carpoolId==carpoolIdentifier.carpoolId){
            return((await countPeopleInCarpool(carpoolIdentifier.carpoolId,isDepartingTrip))<carpool.seats);
        }else{
            return(false);
        }
    }else{
        if(driver.carpool_returning_type==3&&driver.carpool_returning_carpoolId==carpoolIdentifier.carpoolId){
            return((await countPeopleInCarpool(carpoolIdentifier.carpoolId,isDepartingTrip))<carpool.seats);
        }else{
            return(false);
        }
    }
}

async function getCarpoolWithDriver(driverId){
    let carpools=await query("SELECT * FROM carpools WHERE driverId = ?",[driverId])
    if(carpools.length==0){
        return(null);
    }
    return(carpools[0]);
}
function databaseError(res,err){
    res.send(JSON.stringify({"result":"failure","error":"Database error"}));
    console.log("database error",err);
}


let express = require("express");
var app = express();
app.use(express.json());

app.get("/api/events", async (req, response) => {
    try {
        let events=await query("SELECT * FROM events");
        response.send(JSON.stringify({"result":"success","events":events.map(fixDateForEvent)}));
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/add-event", async (req, response) => {
    try {
        let cleanReq=cleanUserInput(req.body,["title","note","date","defaultDepartingTime","defaultReturningTime"]);

        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundStrings(cleanReq,["title","note","defaultDepartingTime","defaultReturningTime"])){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!fixDateUserInput(cleanReq,["date"])){//mutating
            let errRes={"result":"failure","error":"Bad Request (date)"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let result=await query("INSERT INTO events SET ?",[cleanReq]);

        response.send(JSON.stringify({result:"success"}));
        emitEvent("put-event",{id:result.insertId,...cleanReq});
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/edit-event", async (req, response) => {
    try {
        let cleanReq=cleanUserInput(req.body,["id","title","note","date","defaultDepartingTime","defaultReturningTime"]);
        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundStrings(cleanReq,["title","note","defaultDepartingTime","defaultReturningTime"])||!ensureInboundNumbers(cleanReq,["id"])){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!fixDateUserInput(cleanReq,["date"])){//mutating
            let errRes={"result":"failure","error":"Bad Request (date)"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id, ...change}=cleanReq;

        let result=await query("UPDATE events SET ? WHERE id = ?",[change,id])
        response.send(JSON.stringify({result:"success"}));
        emitEvent("put-event",{...cleanReq});
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/delete-event", async (req, response) => {
    try {
        let cleanReq=cleanUserInput(req.body,["id"]);
        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundNumbers(cleanReq,["id"])){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id}=cleanReq;
        await query("DELETE FROM events WHERE id = ?",[id])
        await query("DELETE FROM carpools WHERE eventId = ?",[id]);
        await query("DELETE FROM participants WHERE eventId = ?",[id])

        response.send(JSON.stringify({result:"success"}));
        emitEvent("delete-event",cleanReq);
    } catch (e) {
        databaseError(response,e);
    }
});

app.get("/api/carpools", async (req, response) => {
    try {
        let carpools=await query("SELECT * FROM carpools");
        console.log("!!!",carpools);
        response.send(JSON.stringify({"result":"success","carpools":carpools}));
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/add-carpool-or-participant",async (req, response) => {
    try {
        let carpoolReq=cleanUserInput(req.body,["eventId","name","origin","departingTime","returningTime","seats","note","trip"]);
        let participantReq=cleanUserInput(req.body,["eventId","carpool_departing_type","carpool_departing_carpoolId","carpool_returning_type","carpool_returning_carpoolId","carpool_isDriver","personalInformation_name","personalInformation_email","personalInformation_number","personalInformation_note"]);
        if(participantReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundStrings(participantReq,["personalInformation_name","personalInformation_email","personalInformation_number","personalInformation_note"])||!ensureInboundNumbers(participantReq,["eventId","carpool_departing_carpoolId","carpool_returning_carpoolId"])||!ensureInboundNumbers(participantReq,["carpool_departing_type","carpool_returning_type"],0,4)){
            let errRes={"result":"failure","error":"Bad Request (strings)"}
            response.send(JSON.stringify(errRes));
            return;
        }
        //add the participant first
        //0 for waitlist, 1 for parent, 2 for new carpool, 3 for existing carpool.
        let {carpool_isDriver,...processedParticipantReq}=participantReq;
        if(carpool_isDriver){
            processedParticipantReq.carpool_drivingCarpool=-1;
        }else{
            processedParticipantReq.carpool_drivingCarpool=null;
        }
        console.log("!!!!",processedParticipantReq);

        if(carpool_isDriver){
            if(carpoolReq==null){//new carpool but carpool not supplied
                let errRes={"result":"failure","error":"Bad Request (carpool)"}
                response.send(JSON.stringify(errRes));
                return;
            }
            if(!ensureInboundStrings(carpoolReq,["name","origin","departingTime","returningTime","note"])||!ensureInboundNumbers(carpoolReq,["eventId"])||!ensureInboundNumbers(carpoolReq,["seats"],1,200)||!ensureInboundNumbers(carpoolReq,["trip"],0,2)){
                let errRes={"result":"failure","error":"Bad Request (carpool, strings)"}
                response.send(JSON.stringify(errRes));
                return;
            }


        }else{
            //check if carpool has space
            if(!(await carpoolCanAcceptMoreParticipants({carpoolId:participantReq.carpool_departing_carpoolId,type:participantReq.carpool_departing_type},true))){
                let errRes={"result":"failure","error":"No Space"}
                response.send(JSON.stringify(errRes));
                return;
            }

            if(!(await carpoolCanAcceptMoreParticipants({carpoolId:participantReq.carpool_returning_carpoolId,type:participantReq.carpool_returning_type},false))){
                let errRes={"result":"failure","error":"No Space"}
                response.send(JSON.stringify(errRes));
                return;
            }
        }

        let {insertId:participantId}=await query("INSERT INTO participants SET ?", {...processedParticipantReq,});

        if(participantReq.carpool_isDriver){//add the carpool
            let {insertId:carpoolId}=await query("INSERT INTO carpools SET ?",{...carpoolReq,driverId:participantId});
            //update the participant"s carpools id to match the new one
            let updates={}
            if(carpoolReq.trip==0||carpoolReq.trip==2){
                updates["carpool_departing_type"]=3;
                updates["carpool_departing_carpoolId"]=carpoolId;
            }else{
                updates["carpool_departing_type"]=4;
                updates["carpool_departing_carpoolId"]=-1;
            }
            if(carpoolReq.trip==1||carpoolReq.trip==2){
                updates["carpool_returning_type"]=3;
                updates["carpool_returning_carpoolId"]=carpoolId;
            }else{
                updates["carpool_returning_type"]=4;
                updates["carpool_returning_carpoolId"]=-1;
            }
            updates["carpool_drivingCarpool"]=carpoolId

            await query("UPDATE participants SET ? WHERE id = ?",[updates,participantId]);

            response.send(JSON.stringify({result:"success"}));
            emitEvent("put-carpool",{...carpoolReq,driverId:participantId,id:carpoolId});
            emitEvent("put-participant",{...participantReq,...updates,id:participantId});
        }else{//no need to add new carpools!
            response.send(JSON.stringify({result:"success"}));
            emitEvent("put-participant",{...participantReq,id:participantId});
        }
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/edit-carpool", async (req, response) => {
    try{
        let cleanReq=cleanUserInput(req.body,["id","name","origin","departingTime","returningTime","seats","note"]);
        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundStrings(cleanReq,["name","origin","departingTime","returningTime","note"])||!ensureInboundNumbers(cleanReq,["id"])||!ensureInboundNumbers(cleanReq,["seats"],1,200)){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id, ...change}=cleanReq;

        await query("UPDATE carpools SET ? WHERE id = ?",[change,id]);
        response.send(JSON.stringify({result:"success"}));

        let result=await query("SELECT * FROM carpools WHERE id = ?",[id]);
        emitEvent("put-carpool",{...result[0],...cleanReq});
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/delete-carpool", async (req, response) => {
    try{

        let cleanReq=cleanUserInput(req.body,["id"]);
        //move all the ppl on this carpool

        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundNumbers(cleanReq,["id"])){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id}=cleanReq;

        //move all the ppl on this carpool
        await query("UPDATE participants SET carpool_departing_type = 0 WHERE (carpool_departing_type = 3 AND carpool_departing_carpoolId=?)",[id])

        await query("UPDATE participants SET carpool_returning_type = 0 WHERE (carpool_returning_type = 3 AND carpool_returning_carpoolId=?)",[id]);

        //delete driver
        await query("DELETE FROM participants WHERE id IN (SELECT driverId FROM carpools WHERE id = ?)",[id]);

        //a lot of changes, force refresh
        emitEvent("refresh-participants");

        //delete carpool
        await query("DELETE FROM carpools WHERE id = ?",[id]);

        response.send(JSON.stringify({result:"success"}));
        emitEvent("delete-carpool",cleanReq);
    } catch (e) {
        databaseError(response,e);
    }
});

app.get("/api/participants", async (req, response) => {
    try {
        let participants=await query("SELECT * FROM participants");
        response.send(JSON.stringify({"result":"success","participants":participants}));
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/edit-participant", async (req, response) => {
    try {
        let cleanReq=cleanUserInput(req.body,["id","carpool_departing_type","carpool_departing_carpoolId","carpool_returning_type","carpool_returning_carpoolId","personalInformation_name","personalInformation_email","personalInformation_number","personalInformation_note"]);
        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        if(!ensureInboundStrings(cleanReq,["personalInformation_name","personalInformation_email","personalInformation_number","personalInformation_note"])||!ensureInboundNumbers(cleanReq,["id","carpool_departing_carpoolId","carpool_returning_carpoolId"])||!ensureInboundNumbers(cleanReq,["carpool_departing_type","carpool_returning_type"],0,4)){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id, ...change}=cleanReq;
        let participants=await query("SELECT * FROM participants WHERE id = ?",[id]);
        if (participants.length!=1){
            let errRes={"result":"failure","error":"Database error"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let previousState=participants[0];

        let carpool=await getCarpoolWithDriver(id);

        if(!(previousState.carpool_departing_carpoolId==cleanReq.carpool_departing_carpoolId&&previousState.carpool_departing_type==cleanReq.carpool_departing_type)){
            if(cleanReq.carpool_departing_type==3){
                if(!await carpoolCanAcceptMoreParticipants({carpoolId:cleanReq.carpool_departing_carpoolId,type:3},true)){
                    let errRes={"result":"failure","error":"No Space"}
                    response.send(JSON.stringify(errRes));
                    return;
                }
            }
            if(carpool){
                let errRes={"result":"failure","error":"Cannot move driver"}
                response.send(JSON.stringify(errRes));
                return;
            }
        }
        if(!(previousState.carpool_returning_carpoolId==cleanReq.carpool_returning_carpoolId&&previousState.carpool_returning_type==cleanReq.carpool_returning_type)){
            if(cleanReq.carpool_returning_type==3){
                if(!await carpoolCanAcceptMoreParticipants({carpoolId:cleanReq.carpool_returning_carpoolId,type:3},false)){
                    let errRes={"result":"failure","error":"No Space"}
                    response.send(JSON.stringify(errRes));
                    return;
                }
            }
            if(carpool){
                let errRes={"result":"failure","error":"Cannot move driver"}
                response.send(JSON.stringify(errRes));
                return;
            }
        }
        await query("UPDATE participants SET ? WHERE id = ?",[change,id]);

        response.send(JSON.stringify({result:"success"}));
        emitEvent("put-participant",{...previousState,...cleanReq});
    } catch (e) {
        databaseError(response,e);
    }
});

app.post("/api/delete-participant", async (req, response) => {
    try {
        let cleanReq=cleanUserInput(req.body,["id"]);
        if(cleanReq==null){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
        }
        if(!ensureInboundNumbers(cleanReq,["id"])){
            let errRes={"result":"failure","error":"Bad Request"}
            response.send(JSON.stringify(errRes));
            return;
        }
        let {id}=cleanReq;
        let thisIsDriver=await query("SELECT * FROM participants WHERE (id IN (SELECT driverId FROM carpools) AND id = ?)",[id]);

        if(thisIsDriver.length>=1){
            let errRes={"result":"failure","error":"Cannot delete driver (delete carpool to remove driver)"}
            response.send(JSON.stringify(errRes));
            return;
        }

        await query("DELETE FROM participants WHERE id = ?",[id]);

        response.send(JSON.stringify({result:"success"}));
        emitEvent("delete-participant",cleanReq);
    } catch (e) {
        databaseError(response,e);
    }
});

let connectedClients=[];
let messageId=0;
app.get("/api/update-stream",(req, response) => {
    response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    response.write("\n");

    connectedClients.push(response);
    req.on('close', () => {
        connectedClients=connectedClients.filter(res=>res!=response);
    });
});

setInterval(()=>{
    connectedClients.forEach((item, i) => {
        item.write(`:keep-alive\n`);
    });
},1000);

function emitEvent(name, json){
    connectedClients.forEach((item, i) => {
        item.write(`id: ${messageId}\n`);
        item.write(`event: ${name}\n`);
        item.write(`data: ${JSON.stringify(json)}\n\n`);
    });
    messageId++;
}


var server = app.listen(3010);


/*
CREATE USER "ligerbots-carpool"@"%" IDENTIFIED BY "PASSWORD";
GRANT ALL ON *.* TO "ligerbots-carpool"@"%"
*/
